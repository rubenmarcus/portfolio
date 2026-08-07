---
title: "O swarm que chegou ao #1 no ECDSA.fail"
description: "Como construí um harness de pesquisa autônomo multi-agente — 9 papéis especializados de LLM entre 7+ provedores, adaptadores fail-closed, dispatch isolado por lane e uma fila de falsificação — que produziu o circuito quântico melhor ranqueado no ECDSA.fail."
date: 2026-06-18
readTime: "12 min"
cover: "/art/blog/the-agent-swarm-that-took-1-on-ecdsa-fail.png"
tags: ["ai", "agents", "orchestration", "benchmarks", "quantum-computing"]
---

## O problema de deixar agentes soltos

ECDSA.fail é um desafio público de otimização: construa o circuito quântico reversível mais barato para uma adição de pontos na curva elíptica secp256k1, a primitiva que domina as estimativas de recursos do algoritmo de Shor contra a curva do Bitcoin e do Ethereum. Score = contagem de Toffoli × pico de qubits, com uma porta estatística de corretude que você não consegue burlar.

Esse é um problema perfeito para agentes LLM: espaço de busca enorme, scoring objetivo, validação rápida. Também é uma armadilha perfeita. Dê a um coding agent uma tarefa de otimização aberta e ele vai felizmente alucinar uma "melhora de 2x" que não sobrevive ao contato com o avaliador. Um agente, um prompt, sem disciplina: é assim que você produz lixo plausível.

Então construí um harness que trata a saída do agente como adversária até prova em contrário. Ele chegou ao #1. É assim que funciona.

## Papéis, não prompts

O fleet é nove papéis especializados, cada um com um contrato escrito (`agents/*.md`): o que você pode fazer, o que você está proibido de fazer e um formato obrigatório de saída (`DECISION / WHY / EVIDENCE`). O circuit-engineer propõe otimizações. O research-scout caça papers e trabalhos anteriores. O density-analyst faz profiling de contagens de portas. O orchestrator-reviewer audita o trabalho de todo mundo. O falsifier tem como único trabalho matar candidatos.

Especialização de papel importa mais do que escolha de modelo. Um modelo que é um circuit-engineer brilhante costuma ser um falsifier terrível: otimismo é uma feature num papel e um bug no outro.

## A camada de adaptadores: fail-closed ou nada

Cada papel mapeia para uma lista ordenada de preferências de adaptadores: agents em CLI (Codex, Amp, Claude Code, Kimi) e adaptadores HTTP crus (OpenRouter como gateway, API direta do Kimi). Um router faz health-probe dos adaptadores e percorre a cadeia de fallback quando um está fora do ar, rate-limited ou degradado.

A regra que nunca quebrei: **fail-closed**. Sem credenciais ou adaptador não saudável → relatório de falha tipado, nunca uma requisição quebrada que silenciosamente produz nonsense. O mesmo princípio se aplica no portão de submissão: se a validação não consegue rodar, a submissão não acontece. Todo modo de falha por padrão é "parar", nunca "tentar mesmo assim".

## Dispatch sem colisões

Nove agentes autônomos compartilhando um sistema de arquivos é um gerador de race-condition. O dispatch é baseado em arquivos: uma fila de tarefas com locks de PID por papel e **lane classes**: `exclusive` (só este papel pode escrever nesses caminhos), `readonly`, `control`. Antes e depois de cada tarefa, o dispatcher tira snapshot do git status. Se um agente tocou arquivos fora da sua lane, o resultado é descartado. Detecção de adulteração vence confiança.

Todo worker devolve um envelope JSON estrito que é validado por schema. Envelope malformado → rejeitado, não "parseado de forma loose". O parser também detecta respostas de template, aquele formato genérico de "analisei o circuito e recomendo mais pesquisa" que significa que o agente não fez nada.

## Memória sem RAG

Sem vector store, sem embeddings. A memória cross-agent é um digest de conhecimento curado e comprimido (`AUTO_LEARNING_STATE.md`) mais um grafo de circuitos que os agentes precisam consultar antes de propor qualquer coisa. Compressão deliberada de contexto venceu retrieval para este workload: o estado é pequeno, todo agente lê tudo, e nada importante fica fora de contexto.

## O motor de falsificação

A métrica do leaderboard é pública, mas a vantagem veio da camada do meio: todo candidato passa por uma fila de falsifiers antes de chegar à fronteira. Propor, depois tentar matar. Um candidato só avança se sobreviver a um agente cujo incentivo é destruí-lo. O dashboard público acompanhou tudo em tempo quase real: gasto de token por provedor, a fronteira multiobjetivo, a fila de falsifiers, atividade agente por agente, sanitizado por um schema antes de qualquer coisa sair do harness, porque as rotas dos candidatos eram o ativo competitivo.

Um loop de launchd de 30 minutos rodava a fábrica inteira: discover → validate → submit, com portões humanos rígidos sobre gasto de GPU e um teto de orçamento de US$ 200 no control plane.

## O que eu diria pra qualquer um construindo fleets de agentes

1. **Verificação primeiro vence qualidade de geração.** Os modelos eram intercambiáveis; os portões não. Zero erros em todos os casos do benchmark veio da validação fail-closed, não de escolher o modelo perfeito.
2. **Papéis são prompts com dentes.** Ações permitidas/proibidas mais um formato de saída validado por schema vão fazer mais por você do que qualquer truque de prompt-engineering.
3. **Faça agentes matarem o trabalho uns dos outros.** A fila de falsifiers achou mais melhorias reais do que os propositores, porque forçou os propositores a pré-defender suas afirmações.
4. **Orçamentos e portões são features.** O portão de aprovação de GPU e o teto de gasto não atrasaram o trabalho. Forçaram o fleet a ser seletivo sobre quais experimentos mereciam rodar.

O resultado: #1 no ECDSA.fail, e uma publicação de pesquisa em que sou contribuidor. O harness é a parte da qual me orgulho. A matemática do circuito pertence a uma longa linhagem de pesquisadores; a disciplina que a produziu de forma confiável é minha.

*Se você está trabalhando com orquestração de agentes, infraestrutura de avaliação, ou só quer discutir design fail-closed, minha caixa de entrada está aberta.*
