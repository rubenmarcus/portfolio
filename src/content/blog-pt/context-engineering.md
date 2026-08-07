---
title: "Context engineering dentro de um runtime com 344K chats"
description: "Um runtime de agentes de IA em produção que ajudei a construir atendeu 2,85M de mensagens em 344K chats com loops de agentes em streaming e conversão de OpenAPI para tools. O contexto era a spec: system prompts viviam no x-mb, tools eram operationIds, e o estado da carteira acompanhava cada request. Código real do BitteProtocol/chat, make-agent e agent-sdk."
date: 2026-06-05
readTime: "10 min"
tags: ["ai", "agents", "context", "llm"]
cover: "/art/blog/context-engineering.png"
---

## O runtime em números

O runtime rodava loops de agentes em streaming: um usuário enviava uma mensagem, o runtime montava um contexto, chamava o modelo, executava quaisquer tool calls que voltassem, fazia streaming do resultado e repetia até o agente terminar. As tools vinham de specs OpenAPI convertidas em definições de função, que é como os agentes acabaram capazes de chamar serviços reais e montar transações on-chain. Quando saí em outubro de 2025, tinha atendido 2,85M de mensagens em 344K chats. Eu era o segundo committer mais ativo do seu pacote open-source de chat, `@bitte-ai/chat`.

Nessa escala, o contexto é um pipeline com um orçamento, um modo de falha e uma conta. Mas a maior lição foi arquitetural: nesse sistema, a maior parte do context engineering não acontecia no runtime. Acontecia na spec. Todo snippet abaixo é código real, com o repo e o caminho onde ele vive.

## O system prompt vive na spec

Um agente neste sistema era um documento OpenAPI com uma extensão `x-mb`. A identidade do assistente e todo o seu prompt comportamental eram campos nesse documento. Aqui está a coisa real, do boilerplate do agente, `src/app/api/ai-plugin/route.ts` em BitteProtocol/agent-next-boilerplate:

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

Leia essa string `instructions` como um context engineer leria. Ela não descreve o agente. Ela sequencia tools: primeiro chame o endpoint que constrói o payload, depois chame a primitiva que o executa, e aqui estão os nomes exatos dos parâmetros que você vai precisar. "Simply getting the payload from the endpoints is not enough" é um bug de produção escrito dentro de um prompt, porque algum autor de agente assistiu o modelo buscar uma transação e declarar vitória sem nunca executá-la.

O array `tools` ao lado é seleção de tools como declaração. Esse agente recebe `generate-transaction`, `generate-evm-tx` e `sign-message`, as primitivas que o runtime oferece, e nada mais. O que quer que o modelo faça, ele faz dentro dessa cerca.

## Validação da spec é validação de contexto

Como a spec era o contexto, validar a spec era o primeiro portão de qualidade. A CLI make-agent fazia isso em uma passada em `src/utils/openapi.ts` (BitteProtocol/make-agent), buscando o documento uma vez e reusando-o:

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

E a checagem do `x-mb` em `src/config/types.ts` impunha exatamente os campos que o modelo leria:

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

Um agente com instruções vazias falhava o registro, com escândalo, no deploy. Esse é o lugar certo para a falha. A versão ruim desse sistema deixa a spec passar e o modelo improvisa uma personalidade por request.

## Descrições são prompt engineering

As tools em si vinham dos `paths` da spec. O contrato tinha uma linha: o nome de tool que o modelo emite é o `operationId` da operação. Todo o resto que o modelo sabia sobre uma tool vinha do `summary`, `description` e dos schemas de parâmetros da operação, o que significava que escrever esses campos era prompt engineering com passos extras.

A biblioteca compartilhada de parâmetros em `@bitte-ai/agent-sdk` mostra o que cuidado parece. De `packages/agent-sdk/src/openai/params.ts` em BitteProtocol/core:

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

Ambas as descrições existem porque um modelo errou em produção. "Do not try to infer the address" está aí porque modelos alucinavam felizes endereços de contrato de token a partir de símbolos, e um endereço errado nesse sistema é um prejuízo real, não um fato errado. "(not wei)" está aí porque modelos usam wei por padrão e o endpoint esperava unidades humanas. Cada uma dessas cláusulas é uma cicatriz. Ninguém escreve "not wei" por diversão.

Os campos `example` também faziam trabalho silencioso. Um endereço concreto no schema ancora o formato de saída do modelo melhor do que qualquer declaração de tipo.

## O contexto da carteira acompanha cada request

A coisa que o modelo mais frequentemente precisa em um produto de carteira é a carteira. Agentes ingênuos pedem o endereço ao usuário, o que é uma experiência terrível quando a UI já o conhece. Então o cliente de chat anexava identidade a cada request. O tipo real do body em `src/types/types.ts` em `@bitte-ai/chat`:

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

`accountId`, `evmAddress` e `chainId` saíam com cada mensagem, então a resposta para "qual é meu saldo" nunca exigiu uma viagem de perguntas de esclarecimento. Essa é a vitória de contexto mais barata que eu conheço: coloque no body o que o usuário de outro modo teria de digitar.

O mesmo contexto seguia a tool call até seu destino. Quando uma tool executava contra um agente local, `buildRequestOptions` em `src/lib/local-agent.ts` o anexava como header:

```ts
const headers: HeadersInit = {
  "Content-Type": "application/json",
  ...(metadata ? { "mb-metadata": JSON.stringify(metadata) } : {}),
};
```

O endpoint construindo sua transação sabia de quem era a transação, sem que o modelo jamais serializasse um endereço em seus argumentos.

## Resultados de tools são tipados e pequenos

O que volta de uma tool importa tanto quanto o que sai. O contrato de resultado era uma discriminated union, do mesmo arquivo de tipos:

```ts
export type BitteToolResult<TResult = unknown> =
  | { data: TResult; error?: never }
  | { data?: never; error: string };
```

Uma tool ou produzia dados ou produzia uma string de erro legível, nunca ambos, nunca nenhum. A string de erro ia direto para o contexto, o que significava que o modelo podia ler "HTTP error during tool execution: 500" e se recuperar ou reportar, em vez de fazer pattern matching num body vazio.

Duas disciplinas a mais caíram do caminho de execução. Respostas eram parseadas por content type em `parseResponse`, JSON, texto ou blob, então o modelo lia a resposta real em vez da promessa de uma num schema. E o loop do cliente limitava o agente a `maxSteps: 7` na configuração do `useChat`, o que limitava o crescimento de contexto por request: sete tool calls de resultados, no pior caso, e aí o loop para, quer o modelo se sinta pronto ou não.

## Histórico é problema do cliente também

Do lado do servidor, chats eram persistidos como arrays de `CoreMessage`, o wire format do AI SDK, estendidos com um id de agente:

```ts
export type SmartActionMessage = CoreMessage & {
  id?: string;
  agentId?: string;
};
```

O cliente optava por enviar histórico completo anotado a cada turno com `sendExtraMessageFields: true`, e reconstruía o estado da UI no load casando resultados de tools com suas chamadas por `toolCallId`, virando invocações de `state: "call"` para `state: "result"`. Um chat recarregado mostrava trabalho terminado como terminado.

Aqui preciso ser honesto sobre o limite do que posso mostrar. Como o servidor fechado fazia trim, compactação ou resumo desse histórico não está nos repos abertos, então não vou encenar certeza sobre isso. O que é aberto, e no que trabalhei, é o contrato: histórico completo para fora, mensagens tipadas de volta, contexto de carteira em cada request. O lado do cliente do context engineering acabou sendo metade do trabalho, e é a metade sobre a qual ninguém escreve.

## O que o trabalho realmente é

O padrão nessa escala é difícil de desfazer. A qualidade dos agentes acompanhou a spec, não a esperteza de qualquer prompt único. Os agentes que se comportavam eram os com instruções sequenciadas, descrições de parâmetros paranóicas e um array de `tools` enxuto. Os agentes que alucinavam endpoints e inventavam endereços eram os de specs preguiçosas, e nenhum patch de system prompt na camada de runtime conseguia corrigi-los totalmente, porque o runtime servia fielmente qualquer contexto que a spec definisse.

Então o trabalho nunca foi "escrever um prompt melhor". Era: fazer a spec virar o prompt, validá-la como código, colocar a carteira no body, tipar os resultados de tools, limitar o loop e tratar cada campo de descrição como uma linha de prompt engineering que será lida dois milhões de vezes. O prompt nunca foi o produto. A spec era.
