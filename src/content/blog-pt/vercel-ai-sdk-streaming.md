---
title: "Streaming de 2,85M de mensagens: o encanamento de um chat de agente em produção"
description: "Fui o segundo committer mais ativo no pacote de chat open-source de uma plataforma de agentes em produção, a frente de streaming de um runtime de IA que transformava specs OpenAPI em ferramentas e conduzia agentes on-chain entre NEAR e EVM. Código real do BitteProtocol/chat: o loop do useChat, os estados de tool-call, o contrato de operationId do OpenAPI, e como o histórico é reconstruído."
date: 2026-07-21
readTime: "10 min"
cover: "/art/blog/vercel-ai-sdk-streaming.png"
tags: ["ai", "vercel", "streaming", "nextjs"]
---

O runtime em que trabalhei rodava loops de streaming de agentes que transformavam specs OpenAPI em ferramentas e conduziam agentes que agem on-chain entre NEAR e EVM. Quando saí, em outubro de 2025, ele tinha servido mais de 2,85M de mensagens em 344K chats. Fui o segundo committer mais ativo no pacote de chat open-source dele, `@bitte-ai/chat` (github.com/BitteProtocol/chat), com 115 commits. Esse pacote é a frente de streaming do sistema, e é construído sobre o Vercel AI SDK, `ai@4.1.2`.

Este post é o encanamento que eu realmente posso mostrar. Cada snippet abaixo é código real desse repo, com o caminho onde ele vive. O lado do servidor do runtime é fechado, então não vou citá-lo. O que é aberto é a parte que decidia se os usuários confiavam na coisa: o loop de stream, os estados de tool-call, e o momento em que o dinheiro se move.

## O loop inteiro é um hook

O chat é um componente React. O loop inteiro de agente, streaming, tool calls, retries, mora dentro de uma chamada de `useChat` em `src/components/chat/ChatContent.tsx`:

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

Três decisões nesse bloco carregaram o produto.

Primeiro, `maxSteps: 7`. O loop do agente é server-authoritative, o modelo chama uma tool, lê o resultado, decide a próxima chamada, mas o cliente limita a cadeia inteira a sete passos. Um agente com acesso de escrita à carteira de um usuário, rodando em loop sem bound, é um gerador de conta com side effects. Sete foi suficiente para "checar saldos, montar o swap, revisar a transação" e pequeno o suficiente para que um modelo confuso ficasse sem estrada antes de esgotar a paciência do usuário.

Segundo, a carteira viaja em toda requisição. `accountId`, `evmAddress` e `chainId` vão no body de toda chamada, então o modelo nunca precisa perguntar "qual é o seu endereço". O contexto viaja com o stream em vez de ocupá-lo.

Terceiro, `onToolCall` intercepta ferramentas específicas e as roda no navegador. Um `localAgent` é uma spec OpenAPI mais uma base URL, e suas ferramentas executam client-side, contra localhost se for lá que o agente roda. O mesmo stream de mensagens comanda tanto as ferramentas server-side quanto as locais, e o modelo não consegue notar a diferença.

## Os nomes das ferramentas são operationIds do OpenAPI

O truque central do runtime era que as ferramentas não eram funções que alguém registrava à mão. Eram operações OpenAPI. O nome da ferramenta que o modelo emite é o `operationId` da spec do agente, e a execução é uma busca de volta nessa spec. Aqui está o resolver real de `src/lib/local-agent.ts`:

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

Depois que o path é encontrado, `buildUrlWithParams` substitui os path parameters e se recusa a seguir se algum estiver faltando:

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

Depois `buildRequestOptions` anexa o contexto da carteira como um header `mb-metadata`, e requisições GET têm seus args restantes serializados como query params por `handleQueryParams`, que descarta silenciosamente valores null e undefined. Os argumentos do modelo vão direto para o wire.

Esse design tem uma propriedade que só passei a valorizar depois: o failure mode é legível. Quando uma chamada quebra, você está depurando uma requisição HTTP comum para um endpoint documentado, não uma abstração de framework. A spec é o contrato, a tool call é a spec se resolvendo, e todo agente no registry falava o mesmo contrato.

## Os estados das ferramentas são o produto

O AI SDK v4 modela uma tool call em andamento como um `ToolInvocation` com um `state` que migra de `call` para `result`. Esse único campo guiou toda a UI de transação. De `src/components/chat/MessageGroup.tsx`:

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

Leia o control flow, porque ele é o security model. Uma tool call de `sign-message` que ainda não produziu um resultado não renderiza um spinner. Ela renderiza um card de aprovação com a mensagem exata, o nonce e o recipient, e o loop fica pausado até o usuário assinar ou recusar. A decisão dele volta para o stream através do `addToolResult`, que é como o modelo descobre o que o humano decidiu. Ferramentas de transação concluídas renderizam `EvmTxCard` ou `ReviewTransaction` com os payloads e quaisquer `warnings` que a ferramenta retornou.

Os primitivos eram um enum, não magic strings, em `src/lib/constants.ts`: `generate-transaction`, `generate-evm-tx`, `sign-message`, `generate-image`, `render-chart`, `create-drop`, `transfer-ft`. Cada um tinha um componente dedicado. A regra em que chegamos: se a UI renderiza algo como componente, isso nunca viaja como texto. Um plano de transação é dado, e o usuário aprova dado, não prosa que se afirma ser dado.

Erros seguiam o mesmo caminho. `BitteToolResult` é uma discriminated union, `{ data }` ou `{ error: string }`, e uma ferramenta que falhava renderizava sua string de erro em um `CodeBlock` em vez de fingir sucesso. Quando o próprio stream falhava, o estado de `error` do `useChat` renderizava um botão de Retry ligado ao `reload()`. Não elegante. Debugável às 2 da manhã, que é a métrica que importa.

## O histórico é reconstruído, não replayed

Chats eram persistidos server-side como arrays de `CoreMessage`, o formato de wire do AI SDK. Carregar um de volta era uma rehydration em dois passos em `src/components/BitteAiChat.tsx`: `fetchChatHistory(chatId, historyApiUrl)` puxava as mensagens armazenadas, e `convertToUIMessages` de `src/lib/chat.ts` reconstruía o estado da UI, incluindo as tool invocations:

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

O histórico armazenado separa o conteúdo `tool-call` do assistente da mensagem posterior com role `tool`, que carrega o resultado. A reconstrução casa os dois pelo `toolCallId` e troca o invocation para `state: "result"`, então um chat recarregado mostra transações finalizadas como finalizadas, com seus cards intactos, em vez de uma parede de JSON cru. `sendExtraMessageFields: true` no hook significava que o histórico anotado completo, e não uma versão reduzida, voltava para o servidor a cada turno, e foi isso que permitiu a um cliente reconectado continuar uma conversa como se a aba nunca tivesse sido fechada.

Uma função pequena pagava aluguel todo dia: `getAgentIdFromMessage` lia o agente das `annotations` da mensagem, e `formatAgentId` removia o sufixo `.vercel.app` para exibição. Chats multi-agent renderizavam quem disse o quê sem um join contra o registry.

## O que a escala realmente me ensinou

As lições são menos glamorosas que a arquitetura.

**Sete passos é uma decisão de produto, não técnica.** Cada aumento de `maxSteps` era debatido, porque cada passo é mais uma chance de o modelo fazer algo caro. O cap é onde UX e safety se encontram.

**O stream é uma state machine, não texto.** Texto era o fallback. Tudo que era estruturado, transações, imagens, charts, sign requests, chegava como uma tool invocation tipada com um state, e a UI reagia a partir do state. A primeira versão deixava a UI parsear intent do texto em stream. Ela durou até o primeiro blob malformado renderizar como um code block quebrado em produção.

**Aprovação é um stream event.** A pausa antes de `addToolResult` disparar é o momento mais importante do produto, o usuário lendo exatamente o que vai acontecer com o dinheiro dele. Streamar os argumentos em um card de revisão acabou sendo uma feature de confiança, não decoração.

**Contratos chatos vencem encanamento esperto.** OperationId igual a nome da ferramenta, `mb-metadata` carrega a carteira, erros são strings em uma union. Nunca precisei explicar essas regras duas vezes para um novo autor de agente.

Nada disso exigiu inventar um protocolo de streaming. O Vercel AI SDK nos deu o loop, os states e os primitives de continuação. O trabalho foi decidir o que viaja no stream, o que espera por um humano, e o que a UI faz enquanto o modelo pensa. Essa é a diferença entre uma demo e um runtime, e a maior parte disso mora em um switch statement sobre `toolInvocation.state`.

*Se você roda agentes em streaming em produção e tem sua própria lista de falhas chatas, eu gostaria de lê-la. Minha inbox está aberta.*
