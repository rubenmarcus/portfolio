---
title: "Reescrevi meu loop de agente em Mastra. Eis o que meu runtime acerta."
description: "Rodei loops de agente feitos à mão em produção numa plataforma de agentes web3 (2,85M+ de mensagens) e no ralph-starter. Passei uma semana reconstruindo o mesmo loop em Mastra para ver o que um framework compra. Notas head-to-head: o que Mastra facilita, o que meu runtime faz que ele não consegue, e quem deve escolher qual."
date: 2026-07-18
readTime: "9 min"
cover: "/art/blog/mastra-field-notes.png"
tags: ["ai", "agents", "mastra", "typescript"]
---

Sou o cliente errado para frameworks de agentes e eu sei disso. Fui o committer humano no topo de um runtime de agentes em produção numa plataforma web3, um loop de agente com streaming feito à mão que processou 2,85M+ de mensagens. ralph-starter é meu harness de loop open-source. Autoresearcher é meu loop para pesquisa autônoma. Quando um framework aparece prometendo tratar agentes, tools, workflows e memória por mim, minha primeira reação é listar o que ele vai errar.

Essa reação também é o motivo pelo qual a avaliação tem de ser justa. Então passei uma semana reconstruindo uma versão do meu loop de produção em Mastra e rodei head-to-head contra meu próprio código. Mesmas tools, mesmo modelo, mesma classe de carga de trabalho. Estas são as notas.

## O setup: meu loop vs. o deles

Meu loop de runtime é um while loop com uma chamada de modelo dentro. Ao redor dele: conversão de OpenAPI para tool, logging de passo, política de retry, encanamento de abort, contabilidade de tokens e um teto rígido de passos. Semanas de trabalho, tudo meu, tudo debuggable num arquivo só.

A versão da Mastra da mesma coisa é blocos de construção tipados. Agentes, tools, workflows, memória, cada um um objeto TypeScript simples com um schema Zod na fronteira. A menor versão funcional do meu agente em Mastra:

```ts
import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const searchDocs = createTool({
  id: "search-docs",
  description: "Search internal documentation by keyword",
  inputSchema: z.object({
    query: z.string(),
    limit: z.number().default(5),
  }),
  outputSchema: z.object({
    hits: z.array(z.object({ title: z.string(), url: z.string(), snippet: z.string() })),
  }),
  execute: async ({ query, limit }) => {
    const hits = await docsIndex.search(query, limit);
    return { hits };
  },
});

export const researcher = new Agent({
  name: "researcher",
  instructions: "Answer using search-docs first. Cite URLs. Say when you don't know.",
  model: "anthropic/claude-sonnet-4-5",
  tools: { searchDocs },
});
```

Primeiro ponto honesto para a Mastra. Meu runtime carrega a mesma informação que esse bloco, mas espalhada por três arquivos e duas camadas de config. A deles é dado. Consigo fazer diff, revisar num PR, snapshotar por experimento. E o `execute` da tool é totalmente tipado a partir dos schemas, então o compilador pega um formato de retorno errado antes que o modelo alucine um. Meu conversor valida saídas de tools em runtime no lugar dela. O jeito deles falha mais cedo. Falhar mais cedo é melhor.

Chamar é chato do bom jeito:

```ts
const result = await researcher.generate("How does our retry policy handle 429s?");
console.log(result.text);
```

## O que a Mastra facilita que meu loop não facilita

**Workflows com suspend e resume.** Meu loop de produção era model-directed: o modelo escolhe a próxima tool até parar. Esse formato resiste a frameworks, e eu disse isso logo no início. Mas no momento em que um produto precisa de "pause aqui para aprovação humana", um loop feito à mão é um pesadelo de estado persistido e tokens de resume. Workflows da Mastra tratam isso como primitiva:

```ts
import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";

const planStep = createStep({
  id: "plan",
  inputSchema: z.object({ question: z.string() }),
  outputSchema: z.object({ subquestions: z.array(z.string()) }),
  execute: async ({ inputData }) => {
    const res = await planner.generate(inputData.question, {
      structuredOutput: { schema: z.object({ subquestions: z.array(z.string()) }) },
    });
    return res.object;
  },
});

const answerStep = createStep({
  id: "answer",
  inputSchema: z.object({ subquestions: z.array(z.string()) }),
  outputSchema: z.object({ answer: z.string() }),
  execute: async ({ inputData }) => {
    const notes = await Promise.all(inputData.subquestions.map(lookup));
    return { answer: await synthesize(notes) };
  },
});

export const researchFlow = createWorkflow({
  id: "research-flow",
  inputSchema: z.object({ question: z.string() }),
  outputSchema: z.object({ answer: z.string() }),
})
  .then(planStep)
  .then(answerStep)
  .commit();
```

Retries por passo com política por passo, fronteiras tipadas, e todo passo é um trace span natural. Eu construí a parte de tracing disso à mão. Demorou mais do que eu gostaria de admitir.

**Memória com schema.** A memória do meu runtime é armazenamento com escopo de thread que eu gerencio eu mesmo. A da Mastra é a mesma ideia, mais working memory onde você declara o formato do que o agente deve lembrar e o framework mantém esse blob estruturado no contexto. Construí isso à mão. É trabalhoso. Memória com schema declarado é estritamente melhor que minha abordagem para agentes de produto.

**Evals na mesma superfície.** A Mastra deixa você anexar scorers a um agente e rodá-los contra um dataset sem uma toolchain separada. Metade das evals que vi no mundo real não chega a existir porque exigiam infraestrutura separada. Integração chata vence uma ferramenta melhor que ninguém ligou.

## O que meu loop faz que a Mastra não consegue

Agora a outra coluna, e não é curta.

**O gate é o produto.** No Autoresearcher, o gate de avaliação decide manter ou rejeitar com testes estatísticos em dados held-out. Naquele runtime de produção, o teto de passos, a semântica de abort em torno de transações assinadas e o logging por passo são corretude load-bearing. Nenhum framework entrega seu gate por você, e eu quero zero abstração sobre o meu. Quando a verificação não consegue rodar, nada é entregue. Essa frase é mais fácil de impor num loop que você possui ponta a ponta.

**Fluxo de controle model-directed.** Quando o modelo lê resultados e escolhe sua própria próxima ação, o loop é um while loop. Forçar isso num grafo estático adiciona uma camada de tradução entre você e o comportamento real. A Mastra suporta fluxos dirigidos por agente, mas no momento em que eu quis uma condição de parada customizada checada duas vezes por stream, eu estava lendo o código fonte deles para descobrir qual hook dispara quando. No meu runtime isso é cinco linhas num arquivo que eu escrevi.

**Entranhas de streaming.** Os keepalive frames, os error frames tipados e os reconnects baseados em offset do meu runtime [sobre os quais escrevi separadamente](/blog/vercel-ai-sdk-streaming) existem porque 2,85M de mensagens encontraram cada brecha. Defaults de framework não teriam sobrevivido a esse tráfego inalterados. As costuras existem na Mastra, mas você troca "eu controlo tudo" por "preciso aprender onde a costura está".

## O que pareceu cru, honestamente

Uma semana é suficiente para bater nas bordas. Docs e tipos publicados discordaram duas vezes. OK para um framework jovem, irritante no meio de uma avaliação. O peso do bundle é perceptível se você está fazendo deploy para serverless. E o imposto de abstração é real: tudo que eu queria fora do happy path custou tempo de leitura de fonte. Nada disso é disqualifying. Tudo isso é o preço de alugar decisões em vez de tomá-las.

## O veredito, para alguém escolhendo hoje

Adote a Mastra se você é um time TypeScript construindo agentes de produto: tools tipadas, workflows duráveis, pausas human-in-the-loop, memória com schema, evals na mesma superfície. Você vai entregar em dias o que me levou semanas, e a maioria dos times não tem um obsessivo por loop de agente residente. Os 80% chatos estão prontos e testados por outra pessoa. Esse é o caso real de qualquer framework, e a Mastra o faz bem.

Mantenha seu próprio loop se o loop em si é o produto. Gates de avaliação, semântica de abort adjacente a dinheiro, fluxo de controle que o modelo decide em pleno voo. Se essas frases descrevem seu sistema, os 20% restantes de um framework vão te custar mais do que seus 80% economizam. Roube os idiomas no lugar: schemas de tool tipados, fronteiras de passo como trace spans, memória como objeto declarado. Eles portam para um loop feito à mão numa tarde.

A reescrita bateu meu runtime? Não. Bateu o que a maioria dos times escreveria no lugar do meu runtime? Claramente. Essa é a barra honesta para um framework, e a Mastra a clears.

*Se você está escolhendo entre um framework e um loop feito à mão e quer comparar cicatrizes, minha caixa de entrada está aberta.*
