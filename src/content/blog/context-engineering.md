---
title: "Context engineering inside a runtime with 344K chats"
description: "A production AI-agent runtime I helped build served 2.85M messages across 344K chats with streaming agent loops and OpenAPI to tool conversion. The context was the spec: system prompts lived in x-mb, tools were operationIds, and wallet state rode every request. Real code from BitteProtocol/chat, make-agent, and agent-sdk."
date: 2026-06-05
readTime: "10 min"
tags: ["ai", "agents", "context", "llm"]
cover: "/art/blog/context-engineering.png"
---

## The runtime in numbers

The runtime ran streaming agent loops: a user sent a message, the runtime assembled a context, called the model, executed whatever tool calls came back, streamed the result, and looped until the agent was done. Tools came from OpenAPI specs converted into function definitions, which is how agents ended up able to call real services and build on-chain transactions. When I left in October 2025 it had served 2.85M messages across 344K chats. I was the second most active committer on its open-source chat package, `@bitte-ai/chat`.

At that scale, context is a pipeline with a budget, a failure mode, and a bill. But the biggest lesson was architectural: in this system, most of the context engineering did not happen in the runtime at all. It happened in the spec. Every snippet below is real code, with the repo and path it lives at.

## The system prompt lives in the spec

An agent in this system was an OpenAPI document with an `x-mb` extension. The assistant's identity and its entire behavioral prompt were fields in that document. Here is the real thing from the agent boilerplate, `src/app/api/ai-plugin/route.ts` in BitteProtocol/agent-next-boilerplate:

```ts
"x-mb": {
    "account-id": ACCOUNT_ID,
    email: "youremail@gmail.com",
    assistant: {
        name: "Blockchain Assistant",
        description: "An assistant that answers with blockchain information, tells the user's account id, interacts with twitter, creates transaction payloads for NEAR and EVM blockchains, and flips coins.",
        instructions: "You create near and evm transactions, give blockchain information, tell the user's account id, interact with twitter and flip coins. For blockchain transactions, first generate a transaction payload using the appropriate endpoint (/api/tools/create-near-transaction or /api/tools/create-evm-transaction), then explicitly use the 'generate-transaction' tool for NEAR or 'generate-evm-tx' tool for EVM to actually send the transaction on the client side. For EVM transactions, make sure to provide the 'to' address (recipient) and 'amount' (in ETH) parameters when calling /api/tools/create-evm-transaction. Simply getting the payload from the endpoints is not enough - the corresponding tool must be used to execute the transaction.",
        tools: [{ type: "generate-transaction" }, { type: "generate-evm-tx" }, { type: "sign-message" }],
        categories: ["DeFi", "DAO", "Social"],
        chainIds: [1, 8453]
    },
},
```

Read that `instructions` string the way a context engineer would. It does not describe the agent. It sequences tools: first call the endpoint that builds the payload, then call the primitive that executes it, and here are the exact parameter names you will need. "Simply getting the payload from the endpoints is not enough" is a production bug written into a prompt, because some agent author watched the model fetch a transaction and declare victory without ever executing it.

The `tools` array next to it is tool selection as a declaration. This agent gets `generate-transaction`, `generate-evm-tx`, and `sign-message`, the primitives the runtime provides, and nothing else. Whatever the model does, it does inside that fence.

## Spec validation is context validation

Because the spec was the context, validating the spec was the first quality gate. The make-agent CLI did it in one pass in `src/utils/openapi.ts` (BitteProtocol/make-agent), fetching the document once and reusing it:

```ts
export async function validateAndParseOpenApiSpec(
  url: string | URL,
): Promise<XMbSpec | undefined> {
  const specUrl = url.toString();
  const specContent = await fetchWithRetry(specUrl);

  const apiResponse = JSON.parse(specContent);

  await SwaggerParser.validate(apiResponse);

  const xMbSpec = apiResponse["x-mb"];
  if (isXMbSpec(xMbSpec)) {
    return xMbSpec;
  }
  // ...
}
```

And the `x-mb` check in `src/config/types.ts` enforced exactly the fields the model would read:

```ts
const requiredStringFields = ["name", "description", "instructions"] as const;
for (const field of requiredStringFields) {
  if (!assistant[field] || typeof assistant[field] !== "string") {
    return {
      valid: false,
      error: `assistant must contain ${field} as string`,
    };
  }
}
```

An agent with empty instructions failed registration, loudly, at deploy time. That is the right place for the failure. The bad version of this system lets the spec through and the model improvises a personality per request.

## Descriptions are prompt engineering

The tools themselves came from the spec's `paths`. The contract was one line long: the tool name the model emits is the operation's `operationId`. Everything else the model knew about a tool came from the operation's `summary`, `description`, and parameter schemas, which meant writing those fields was prompt engineering with extra steps.

The shared parameter library in `@bitte-ai/agent-sdk` shows what careful looks like. From `packages/agent-sdk/src/openai/params.ts` in BitteProtocol/core:

```ts
export const addressOrSymbolParam = {
  name: "address",
  in: "query",
  required: true,
  description:
    "The ERC-20 token symbol or address to be sold, if provided with the symbol do not try to infer the address.",
  schema: { type: "string" },
  example: "0x6810e776880c02933d47db1b9fc05908e5386b96",
};

export const amountParam = {
  name: "amount",
  in: "query",
  required: true,
  description: "Amount in human-readable units (not wei)",
  schema: { type: "number" },
  example: 0.123,
};
```

Both descriptions exist because a model got it wrong in production. "Do not try to infer the address" is there because models happily hallucinated token contract addresses from symbols, and a wrong address in this system is a real loss, not a wrong fact. "(not wei)" is there because models default to wei and the endpoint expected human units. Every one of these clauses is a scar. Nobody writes "not wei" for fun.

The `example` fields did quiet work too. A concrete address in the schema anchors the model's output format better than any type declaration.

## Wallet context rides every request

The thing the model most often needs in a wallet product is the wallet. Naive agents ask the user for their address, which is a terrible experience when the UI already knows it. So the chat client attached identity to every single request. The real body type from `src/types/types.ts` in `@bitte-ai/chat`:

```ts
export interface ChatRequestBody {
  id?: string;
  config?: {
    mode?: string;
    agentId?: string;
    model?: string;
  };
  accountId?: string;
  network?: string;
  evmAddress?: Hex;
  chainId?: number;
  localAgent?: {
    pluginId: string;
    accountId: string;
    spec: BitteOpenAPISpec;
  };
}
```

`accountId`, `evmAddress`, and `chainId` went out with every message, so the answer to "what is my balance" never required a round trip of clarifying questions. This is the cheapest context win I know: put in the body what the user would otherwise have to type.

The same context followed the tool call to its destination. When a tool executed against a local agent, `buildRequestOptions` in `src/lib/local-agent.ts` attached it as a header:

```ts
const headers: HeadersInit = {
  "Content-Type": "application/json",
  ...(metadata ? { "mb-metadata": JSON.stringify(metadata) } : {}),
};
```

The endpoint building your transaction knew whose transaction it was, without the model ever serializing an address into its arguments.

## Tool results are typed and small

What comes back from a tool matters as much as what goes out. The result contract was a discriminated union, from the same types file:

```ts
export type BitteToolResult<TResult = unknown> =
  | { data: TResult; error?: never }
  | { data?: never; error: string };
```

A tool either produced data or produced a readable error string, never both, never neither. The error string went straight into the context, which meant the model could read "HTTP error during tool execution: 500" and recover or report, instead of pattern-matching on an empty body.

Two more disciplines fell out of the execution path. Responses were parsed by content type in `parseResponse`, JSON, text, or blob, so the model read the actual response rather than a schema's promise of one. And the client loop capped the agent at `maxSteps: 7` in the `useChat` configuration, which bounded context growth per request: seven tool calls of results, worst case, then the loop stops whether the model feels done or not.

## History is the client's problem too

Server-side, chats persisted as `CoreMessage` arrays, the AI SDK's wire format, extended with an agent id:

```ts
export type SmartActionMessage = CoreMessage & {
  id?: string;
  agentId?: string;
};
```

The client opted into sending full annotated history on every turn with `sendExtraMessageFields: true`, and rebuilt UI state on load by matching tool results to their calls by `toolCallId`, flipping invocations from `state: "call"` to `state: "result"`. A reloaded chat showed finished work as finished.

Here I have to be honest about the boundary of what I can show. How the closed server trimmed, compacted, or summarized that history is not in the open repos, so I will not perform certainty about it. What is open, and what I worked on, is the contract: full history out, typed messages back, wallet context on every request. The client side of context engineering turned out to be half the job, and it is the half nobody blogs about.

## What the job actually is

The pattern at this scale is hard to unsee. Agent quality tracked the spec, not the cleverness of any single prompt. The agents that behaved were the ones with sequenced instructions, paranoid parameter descriptions, and a tight `tools` array. The agents that hallucinated endpoints and invented addresses were the ones with lazy specs, and no system prompt patch at the runtime layer could fully fix them, because the runtime faithfully served whatever context the spec defined.

So the job was never "write a better prompt". It was: make the spec the prompt, validate it like code, put the wallet in the body, type the tool results, cap the loop, and treat every description field as a line of prompt engineering that will be read two million times. The prompt was never the product. The spec was.
