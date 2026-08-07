---
title: "Streaming 2.85M messages: the plumbing of a production agent chat"
description: "I was the second most active committer on the open-source chat package of a production agent platform, the streaming front of an AI runtime that turned OpenAPI specs into tools and drove on-chain agents across NEAR and EVM. Real code from BitteProtocol/chat: the useChat loop, tool-call states, the OpenAPI operationId contract, and how history gets rebuilt."
date: 2026-07-21
readTime: "10 min"
cover: "/art/blog/vercel-ai-sdk-streaming.png"
tags: ["ai", "vercel", "streaming", "nextjs"]
---

The runtime I worked on ran streaming agent loops that turned OpenAPI specs into tools and drove agents that act on-chain across NEAR and EVM. By the time I left in October 2025 it had served 2.85M+ messages across 344K chats. I was the second most active committer on its open-source chat package, `@bitte-ai/chat` (github.com/BitteProtocol/chat), with 115 commits. That package is the streaming front of the system, and it is built on the Vercel AI SDK, `ai@4.1.2`.

This post is the plumbing I can actually show. Every snippet below is real code from that repo, with the path it lives at. The server side of the runtime is closed source, so I will not quote it. What is open is the part that decided whether users trusted the thing: the stream loop, the tool-call states, and the moment money moves.

## The whole loop is one hook

The chat is a React component. The entire agent loop, streaming, tool calls, retries, sits inside one `useChat` call in `src/components/chat/ChatContent.tsx`:

```tsx
const {
  messages,
  input,
  handleInputChange,
  isLoading: isInProgress,
  handleSubmit,
  reload,
  addToolResult,
  append,
  error,
} = useChat({
  maxSteps: 7,
  id: chatId,
  api: apiUrl,
  onToolCall: async ({ toolCall }): Promise<BitteToolResult | undefined> => {
    const localAgent = options?.localAgent;
    if (!localAgent) return undefined;

    try {
      return await executeLocalToolCall({
        localAgent,
        toolCall,
        metadata: { accountId, evmAddress, chainId },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Error executing tool call:", errorMessage);
      return { error: errorMessage };
    }
  },
  sendExtraMessageFields: true,
  initialMessages,
  headers: { Authorization: `Bearer ${apiKey}` },
  body: {
    id: chatId,
    config: { mode: AssistantsMode.DEBUG, agentId },
    accountId: accountId || "",
    evmAddress: evmAddress as Hex,
    chainId,
    localAgent: options?.localAgent,
  } satisfies ChatRequestBody,
});
```

Three decisions in this block carried the product.

First, `maxSteps: 7`. The agent loop is server-authoritative, the model calls a tool, reads the result, decides the next call, but the client caps the whole chain at seven steps. An agent with write access to a user's wallet, looping without a bound, is a bill generator with side effects. Seven was enough for "check balances, build the swap, review the transaction" and small enough that a confused model ran out of road before it ran out of the user's patience.

Second, the wallet rides every request. `accountId`, `evmAddress`, and `chainId` go in the body of every call, so the model never has to ask "what is your address". The context travels with the stream instead of occupying it.

Third, `onToolCall` intercepts specific tools and runs them in the browser. A `localAgent` is an OpenAPI spec plus a base URL, and its tools execute client-side, against localhost if that is where the agent runs. The same message stream drives both server-side tools and local ones, and the model cannot tell the difference.

## Tool names are OpenAPI operationIds

The runtime's core trick was that tools were not functions someone registered by hand. They were OpenAPI operations. The tool name the model emits is the `operationId` from the agent's spec, and execution is a lookup back into that spec. Here is the real resolver from `src/lib/local-agent.ts`:

```ts
export const findToolPathAndMethod = (
  localAgent: LocalAgent,
  toolName: string
): { toolPath?: string; httpMethod?: string } => {
  let toolPath: string | undefined;
  let httpMethod: string | undefined;

  Object.entries(localAgent.spec.paths).forEach(
    ([path, pathObj]: [string, any]) => {
      Object.entries(pathObj).forEach(([method, methodObj]: [string, any]) => {
        if (methodObj.operationId === toolName) {
          toolPath = path;
          httpMethod = method.toUpperCase();
        }
      });
    }
  );

  return { toolPath, httpMethod };
};
```

Once the path is found, `buildUrlWithParams` substitutes path parameters and refuses to proceed if one is missing:

```ts
url = url.replace(/\{(\w+)\}/g, (_, key) => {
  if (remainingArgs[key] === undefined) {
    throw new Error(`Missing required path parameter: ${key}`);
  }
  const value = remainingArgs[key];
  delete remainingArgs[key];
  return encodeURIComponent(String(value));
});
```

Then `buildRequestOptions` attaches the wallet context as an `mb-metadata` header, and GET requests get their remaining args serialized as query params by `handleQueryParams`, which silently drops null and undefined values. The model's arguments go straight onto the wire.

This design has a property I only appreciated later: the failure mode is legible. When a call breaks, you are debugging a plain HTTP request to a documented endpoint, not a framework abstraction. The spec is the contract, the tool call is the spec resolving itself, and every agent in the registry spoke the same contract.

## Tool states are the product

The AI SDK v4 models an in-flight tool call as a `ToolInvocation` with a `state` that moves from `call` to `result`. That one field drove the entire transaction UI. From `src/components/chat/MessageGroup.tsx`:

```tsx
for (const invocation of message.toolInvocations) {
  const { toolName, toolCallId, state, args } = invocation;
  const result = state === "result" ? invocation.result : null;

  if (state !== "result") {
    if (toolName === BittePrimitiveName.SIGN_MESSAGE) {
      const { message, nonce, recipient, callbackUrl } = args;
      return (
        <ReviewSignMessage
          key={`${toolCallId}-${index}`}
          chatId={chatId}
          message={message}
          nonce={nonce}
          recipient={recipient}
          callbackUrl={callbackUrl}
          toolCallId={toolCallId}
          addToolResult={(result) =>
            addToolResult({ toolCallId: toolCallId, result })
          }
          // ...
        />
      );
    }
    return null;
  }

  if (
    toolName === BittePrimitiveName.GENERATE_TRANSACTION ||
    toolName === BittePrimitiveName.TRANSFER_FT ||
    toolName === BittePrimitiveName.GENERATE_EVM_TX
  ) {
    const transactions = result?.data?.transactions || [];
    const evmSignRequest = result?.data?.evmSignRequest;
    // renders <EvmTxCard> or <ReviewTransaction> with warnings
  }
}
```

Read the control flow, because it is the security model. A `sign-message` tool call that has not produced a result yet does not render a spinner. It renders an approval card with the exact message, nonce, and recipient, and the loop stays paused until the user signs or declines. Their decision goes back into the stream through `addToolResult`, which is how the model learns what the human decided. Completed transaction tools render `EvmTxCard` or `ReviewTransaction` with the payloads and any `warnings` the tool returned.

The primitives were an enum, not magic strings, in `src/lib/constants.ts`: `generate-transaction`, `generate-evm-tx`, `sign-message`, `generate-image`, `render-chart`, `create-drop`, `transfer-ft`. Each one had a dedicated component. The rule we settled on: if the UI renders it as a component, it never travels as text. A transaction plan is data, and the user approves data, not prose that claims to be data.

Errors took the same path. `BitteToolResult` is a discriminated union, `{ data }` or `{ error: string }`, and a failed tool rendered its error string in a `CodeBlock` instead of pretending to succeed. When the stream itself failed, `useChat`'s `error` state rendered a Retry button wired to `reload()`. Not elegant. Debuggable at 2am, which is the metric that matters.

## History is rebuilt, not replayed

Chats persisted server-side as `CoreMessage` arrays, the AI SDK's wire format. Loading one back was a two-step rehydration in `src/components/BitteAiChat.tsx`: `fetchChatHistory(chatId, historyApiUrl)` pulled the stored messages, and `convertToUIMessages` from `src/lib/chat.ts` rebuilt the UI state, including tool invocations:

```ts
function addToolMessageToChat({
  toolMessage,
  messages,
}: {
  toolMessage: CoreToolMessage;
  messages: Array<Message & { agentId?: string }>;
}): Array<Message> {
  return messages.map((message) => {
    if (message.toolInvocations) {
      return {
        ...message,
        toolInvocations: message.toolInvocations.map((toolInvocation) => {
          const toolResult = toolMessage.content.find(
            (tool) => tool.toolCallId === toolInvocation.toolCallId
          );

          if (toolResult) {
            return {
              ...toolInvocation,
              state: "result",
              result: toolResult.result,
            };
          }
          return toolInvocation;
        }),
      };
    }
    return message;
  });
}
```

Stored history separates the assistant's `tool-call` content from the later `tool` role message that carries the result. The rebuild matches them by `toolCallId` and flips the invocation to `state: "result"`, so a reloaded chat shows finished transactions as finished, with their cards intact, instead of a wall of raw JSON. `sendExtraMessageFields: true` on the hook meant the full annotated history, not a stripped version, went back to the server on every turn, which is what let a reconnected client continue a conversation as if the tab never closed.

One small function paid rent every day: `getAgentIdFromMessage` read the agent out of the message's `annotations`, and `formatAgentId` stripped the `.vercel.app` suffix for display. Multi-agent chats rendered who said what without a join against the registry.

## What the scale actually taught me

The lessons are less glamorous than the architecture.

**Seven steps is a product decision, not a technical one.** Every raise of `maxSteps` was argued over, because each step is another chance for the model to do something expensive. The cap is where UX and safety meet.

**The stream is a state machine, not text.** Text was the fallback. Everything structured, transactions, images, charts, sign requests, arrived as a typed tool invocation with a state, and the UI keyed off the state. The first version let the UI parse intent out of streamed text. It lasted until the first malformed blob rendered as a broken code block in production.

**Approval is a stream event.** The pause before `addToolResult` fires is the most important moment in the product, the user reading exactly what will happen with their money. Streaming the arguments into a review card turned out to be a trust feature, not decoration.

**Boring contracts beat clever plumbing.** OperationId equals tool name, `mb-metadata` carries the wallet, errors are strings in a union. I never once had to explain those rules to a new agent author twice.

None of this required inventing a streaming protocol. The Vercel AI SDK gave us the loop, the states, and the continuation primitives. The work was deciding what rides the stream, what waits for a human, and what the UI does while the model thinks. That is the difference between a demo and a runtime, and most of it lives in a switch statement over `toolInvocation.state`.

*If you run streaming agents in production and have your own list of boring failures, I'd like to read it. My inbox is open.*
