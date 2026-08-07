---
title: "Como o RAG funciona dentro do Mirofi.sh"
description: "Mirofi.sh é uma plataforma hospedada de simulação social multi-agente construída sobre um motor open-source, GraphRAG e Zep. Esta é a história da recuperação: o que a memória do agente armazena, como ela alimenta cada turno e onde o grafo justificou sua complexidade."
date: 2026-05-28
readTime: "9 min"
tags: ["ai", "rag", "llm", "production"]
cover: "/art/blog/rag-in-production.png"
---

## O que é o Mirofi.sh

Mirofi.sh é uma plataforma hospedada para simulação social multi-agente. Ele transforma em SaaS um motor de simulação open-source, o OASIS: você define um cenário, nós subimos centenas de agentes LLM com personas, os colocamos em uma rede social simulada e deixamos que publiquem, respondam, discutam e formem opiniões ao longo de milhares de ticks. Pesquisadores o usam para estudar como narrativas se espalham. Times o usam para stress-testar mensagens antes de torná-las públicas.

O motor entrega os agentes e o mundo. O que ele não entrega, out of the box, é memória que sobreviva ao contato com a escala. Um agente que esquece tudo a cada turno não é uma pessoa simulada. É uma cadeia de Markov com vocabulário. Então o núcleo do que construí por cima é um sistema de retrieval: GraphRAG com Zep por baixo, mais muito encanamento pouco glamoroso. Este post é sobre como esse retrieval funciona, o que quebrou e o que eu refaria.

## O que a memória realmente armazena

Existem três tipos de memória no sistema, e confundi-los foi meu primeiro erro.

- **Episódios.** Eventos brutos. "O agente 14 respondeu ao post do agente 7 sobre a tarifa de água no tick 1.203." Pequenos, imutáveis, com timestamp. Este é o write-ahead log da simulação.
- **Fatos destilados.** O que o sistema acredita ser verdade sobre o mundo e suas pessoas. "O agente 7 é contra a tarifa." "O agente 14 e o agente 7 interagem com frequência e discordam." Eles vivem no grafo como nós e arestas, extraídos dos episódios.
- **Estado da persona.** Um resumo curto por agente de humor, objetivos e posicionamento atuais. Algumas centenas de tokens, regenerado periodicamente. Este é o texto de maior valor em todo o sistema por token.

Episódios são a fonte da verdade. Fatos são derivados e podem estar errados. O estado da persona é derivado duas vezes e está definitivamente errado em pequenos detalhes o tempo todo. Manter essa hierarquia clara me salvou depois, porque quando o retrieval devolvia algo suspeito eu sempre conseguia rastrear até os episódios brutos.

## Como um turno funciona

Cada turno de agente é um problema de montagem de contexto. O agente recebe seu estado de persona, os eventos recentes no seu feed e a memória retrieved relevante ao que está prestes a fazer. Essa última parte é o RAG. A query de retrieval não é a pergunta do usuário, porque não há usuário. A query é a situação: o post ao qual o agente está prestes a responder, mais a própria identidade do agente.

O caminho de retrieval em `packages/memory/graph.ts` é híbrido por necessidade:

```typescript
// packages/memory/graph.ts
export async function retrieveForTurn(input: TurnInput): Promise<MemoryBlock> {
  const { agentId, situation, tick } = input;

  const [episodes, relations] = await Promise.all([
    // vector search sobre resumos de episódios, com escopo e ponderação por tempo
    searchEpisodes({
      query: situation.text,
      filter: { simulationId: input.simulationId },
      limit: 8,
      timeDecay: { halfLifeTicks: 500, now: tick },
    }),
    // traversal do grafo: quem está envolvido e o que eu sei sobre eles
    graph.neighborhood({
      entities: extractEntities(situation.text).concat(agentId),
      maxHops: 2,
      asOfTick: tick,
    }),
  ]);

  return {
    relations: relations.edges.map(formatRelation),   // "agent 7 opposes the tariff"
    episodes: episodes.map(formatEpisode),            // "at tick 1,203 you replied..."
    tokenBudget: MEMORY_TOKEN_BUDGET,                 // hard cap, enforced downstream
  };
}
```

Duas coisas valem destacar. Primeiro, `timeDecay`: em uma simulação, um evento recente é quase sempre mais relevante do que um antigo com um embedding score ligeiramente melhor. A similaridade vetorial sozinha ficava exibindo história antiga porque episódios velhos sobre o mesmo tópico eram semanticamente mais próximos. A ponderação por recência corrigiu o que embeddings melhores não corrigiram. Segundo, a query do grafo e a query vetorial rodam em paralelo e respondem perguntas diferentes. Mais sobre isso abaixo.

## Decisões de indexação para uma simulação

O conselho padrão de RAG diz para fatiar a cada 500 tokens com sobreposição. Esse conselho assume documentos. Uma simulação não produz documentos. Ela produz eventos, e eventos já são pequenos. Fatiá-los ainda mais despedaçaria o único contexto que eles têm.

Então a unidade de indexação é o episódio, e o trabalho vai para metadados e para o que recebe embed. O ingester em `packages/memory/ingest.ts`:

```typescript
// packages/memory/ingest.ts
export async function indexEpisode(event: SimEvent): Promise<void> {
  const episode: Episode = {
    id: event.id,
    simulationId: event.simulationId,
    tick: event.tick,
    actorIds: event.participants,
    type: event.type, // post | reply | repost | follow | reaction
    // embeda uma renderização em linguagem natural, nunca o JSON bruto do evento
    summary: renderEpisode(event),
  };

  await episodes.insert(episode, { embed: "summary" });

  // a extração de entidades é em batch, não por evento; veja abaixo
  extractionQueue.push(episode);
}
```

A decisão que importou: dar embed numa frase renderizada, não o payload do evento. No início eu dava embed no evento JSON bruto e o retrieval era lixo, porque embeddings de `{"type":"reply","parent_id":"p_8812"}` se agrupam por nomes de campos, não por significado. Renderizar "O agente 14 discordou do post do agente 7 sobre a tarifa de água" antes de dar embed tornou o índice vetorial de fato útil. Isso parece óbvio agora. Foi uma semana de retrievals ruins na época.

A outra decisão: a extração de entidades e relacionamentos não roda por evento. Ela roda em batches a cada N ticks sobre a fila de extração. Rodar uma chamada de extração por LLM em cada um dos dezenas de milhares de eventos de uma simulação teria tornado a plataforma deficitária por execução. O batching cortou o custo de extração em cerca de 80 por cento e a diferença de qualidade foi imperceptível.

## Onde vetores bastaram e onde o grafo se pagou

A busca vetorial pura sobre resumos de episódios cobre a maior parte das necessidades de retrieval: "o que eu vi sobre o tópico X". Para um único agente recordando seu próprio feed, vetores mais recência é genuinamente tudo o que você precisa, e para o primeiro protótipo era só isso.

O modo de falha apareceu quando agentes precisaram de conhecimento social. "O que o agente 14 acha do agente 7" não é respondido por nenhum episódio. É respondido agregando trinta interações. "Quem influenciou o debate da tarifa" é pior: multi-hop, percorrendo respostas de respostas. O retrieval plano devolvia qualquer episódio único com embedding mais próximo, e os agentes formavam opiniões uns sobre os outros com base em um argumento escolhido aleatoriamente.

É para isso que serve o grafo. Relacionamentos são arestas de primeira classe com sentimento e timestamps, então `neighborhood()` devolve "o agente 14 discorda do agente 7 sobre a tarifa, repetidamente, recentemente" em vez de uma pilha de eventos brutos que o agente teria de rederivar a cada turno. Verifiquei a divisão com um pequeno conjunto de eval: 40 queries de situação, metade tópicas, metade relacionais, julgadas por whether o retrieval continha o material certo. Vetores puros passaram na maioria das queries tópicas e falharam na maioria das relacionais. Esse eval, não um post de blog de vendor, é o motivo pelo qual o grafo ficou.

## Freshness quando centenas de agentes nunca param de escrever

Uma simulação com 300 agentes produz novas memórias continuamente, e opiniões mudam. O agente 7 pode apoiar a tarifa no tick 200 e se opor a ela no tick 1.500. Se ambos os fatos vivem no grafo com o mesmo peso, o retrieval devolve uma contradição e o agente faz o que LLMs fazem com contradições: escolhe uma, com confiança, aleatoriamente.

A correção foi tratar fatos como substituintes, não acumulativos. Uma nova aresta de relacionamento sobre o mesmo par e tópico marca a antiga como substituída em vez de excluí-la, e o retrieval lê `asOfTick`. Isso é apenas event sourcing aplicado a opiniões. O bug que me ensinou isso: um agente "reverteu" publicamente uma posição no meio da simulação sem nenhum motivo narrativo, e um pesquisador marcou a execução como irrealista. A causa foi o retrieval devolvendo uma aresta de posicionamento defasada com o mesmo rank da atual. Exclusão também teria funcionado, mas manter arestas substituídas nos permite explicar toda crença do agente depois do fato, o que acabou sendo a feature mais pedida pelos pesquisadores.

## O que eu refaria

Duas coisas. Primeiro, eu não começaria com o grafo. Eu entregaria vetores mais recência, construiria o conjunto de eval no dia um e adicionaria GraphRAG exatamente quando a taxa de falha relacional o justificasse. O grafo custa chamadas de extração, latência de ingestão e uma experiência de debugging estritamente pior do que ler uma lista. Ele se paga no Mirofi.sh porque o raciocínio social é o produto. Não se pagaria em um chatbot de docs.

Segundo, eu orçaria tokens por tipo de memória desde o início. Estado de persona, relacionamentos e episódios agora têm tetos rígidos e disputam um orçamento de memória fixo por turno. Adicionar isso depois do fato significou reajustar prompts que tinham se tornado silenciosamente dependentes de contexto ilimitado. O retrieval não é a parte difícil do RAG em um sistema desses. Decidir o que não fazer retrieve é.
