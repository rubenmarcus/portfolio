---
title: "Git worktrees são meu orquestrador de agentes"
description: "O ralph-starter roda agentes de código em loops Ralph Wiggum, e o swarm mode coordena tudo com git worktrees, Promise.allSettled e um switch de estratégia. Três estratégias com tradeoffs reais, e por que um executor de DAG rejeitaria esse design no startup."
date: 2026-06-25
readTime: "9 min"
cover: "/art/blog/dag-agent-orchestration.png"
tags: ["ai", "agents", "orchestration", "typescript"]
---

No começo deste ano eu apontei o [ralph-starter](https://github.com/rubenmarcus/ralph-starter) para 10 issues etiquetadas do GitHub e recebi de volta 8 pull requests por US$ 1,84. Um side-by-side em 12 tarefas de sprint colocou meu custo de atenção em 12 minutos por tarefa, contra 45 minutos codando na mão. A parte que surpreende as pessoas: não tinha nenhum framework de orquestração envolvido. A camada de coordenação era o git, a camada de isolamento era `git worktree add`, e o swarm inteiro cabia num arquivo de 480 linhas.

ralph-starter é minha CLI open-source de npm. Ela implementa o loop Ralph Wiggum: busque uma spec, rode um agente de código contra ela, rode tests/lint/build, alimente os erros brutos de volta no próximo prompt, repita até ficar verde, e então commit, push e PR. As specs vêm de issues do GitHub, tickets do Linear, páginas do Notion, Figma, uma URL ou um arquivo. Os agentes são os que você já tem instalados: Claude Code, Codex, Cursor, Amp, OpenCode. Eu construo apps React para viver. Escrevi isso porque estava cansado de ser o clipboard humano entre meu terminal e minha janela de chat.

Este post é sobre as entranhas: como o swarm mode coordena vários agentes, e por que a primitiva de coordenação é uma feature do git de 20 anos atrás.

## O loop é a unidade, não o nó

Orquestradores de grafo modelam trabalho como nós tipados com arestas de dependência: planner alimenta coder, coder alimenta reviewer. Esse modelo quebra em loops de codificação por um motivo estrutural. Dentro do loop, as dependências são cíclicas. O reviewer do código da iteração 3 é a iteração 4 do mesmo agente lendo a saída dos testes. Desenhe isso como grafo e você tem um ciclo, e qualquer executor de DAG com detecção de ciclo rejeita seu design no startup.

Então a unidade de orquestração aqui é o loop inteiro. O `runLoop`, cerca de 1.800 linhas em `src/loop/executor.ts`, é o único executor do codebase. O swarm mode nunca orquestra passos. Ele roda loops completos, um por agente, e coordena os resultados. Toda estratégia em `src/loop/swarm.ts` é uma resposta diferente para duas perguntas: quantos worktrees, e como você escolhe o vencedor.

## Isolamento é `git worktree add`

Agentes que dividem um filesystem produzem resultados que você não consegue atribuir a ninguém. Todo agente em paralelo ganha seu próprio worktree em `.ralph/worktrees/` dentro do repo:

```ts
// src/automation/worktree.ts
export async function createWorktree(
  repoDir: string,
  branchName: string,
  baseBranch?: string
): Promise<string> {
  const worktreeDir = join(repoDir, '.ralph', 'worktrees', branchName);
  await execa('git', ['worktree', 'add', '-b', branchName, worktreeDir, baseBranch], {
    cwd: repoDir,
  });
  return worktreeDir;
}
```

Um agente, um branch, um diff. Toda execução começa com `cleanupAllWorktrees`, que se recupera de crashes que deixaram worktrees velhos para trás. Quando o swarm termina, todo worktree perdedor é deletado. O do vencedor sobrevive apenas se um PR foi aberto a partir dele, porque é para esse branch que o PR aponta. O body do PR é uma tabela markdown gerada listando cada agente, seu status, sua contagem de iterações e seu custo. O recibo é parte da feature.

É por isso que eu chamo o git de orquestrador. Branches dão isolamento. Commits dão estado. O diff dá a trilha de auditoria. A maioria dos frameworks de agente reconstrói as três coisas, mal, em cima de um banco de dados.

## Race: o primeiro sucesso vence, os perdedores continuam rodando

O race espalha a mesma tarefa para todo agente detectado, cada um no seu worktree, e espera com `Promise.allSettled`. O vencedor é o primeiro loop que resolve com sucesso.

Dois tradeoffs, ditos com clareza. O vencedor é o primeiro resultado bem-sucedido, não o melhor. E os perdedores deliberadamente não são cancelados. Cancelar um agente de código no meio de uma escrita deixa um worktree corrompido e uma janela de rate limit meio gasta, então o `allSettled` espera todo mundo e um race custa a soma de todos os agentes, não o mais rápido. Escolhi custo previsível em vez de custo ótimo. O que o race compra é seleção entre modelos na mesma tarefa, não velocidade de relógio.

## Consensus: menos iterações vence

O consensus roda todo agente até o fim no seu próprio worktree, e depois escolhe o resultado bem-sucedido com menos iterações de loop. Não existe LLM judge.

O raciocínio: iterações são o único sinal em que eu já confio. Cada iteração significa que o agente falhou na validação, recebeu os erros brutos de volta e tentou de novo. Menos iterações significa que o gauntlet de validação passou mais cedo, com menos thrash. É uma métrica proxy e eu conheço o modo de falha dela: um agente ruim que para cedo e um agente genuinamente bom terminam rápido do mesmo jeito. Mas um LLM judge adiciona custo e mais um componente que pode falhar, e até agora o proxy não errou feio o bastante para valer o preço de um.

## Pipeline: o git é a state machine

Pipeline é a estratégia sequencial. Os agentes rodam um depois do outro num único worktree compartilhado, e o handoff entre estágios é um commit de git mais um prompt rescrito. Antes de cada estágio começar, o trabalho não commitado do estágio anterior vira um `chore: pipeline stage N`, então todo estágio começa de uma árvore limpa. O primeiro agente é avisado de que é o FIRST agent de um pipeline e deve implementar a tarefa. Os do meio são instruídos a continuar a implementação do agente anterior. O último revisa e da polish. O orçamento de iterações é dividido igualmente: 3 agentes com orçamento de 15 ficam com 5 cada.

Não há entradas e saídas tipadas entre estágios. A mensagem de commit mais o diff tem sido contexto suficiente até agora. Pipeline é a única estratégia onde um DAG de verdade pagaria o próprio custo, porque os estágios têm dependências de dados genuínas. No dia em que o diff deixar de ser contexto suficiente é o dia em que eu escrevo um.

## A maquinaria que mantém os loops baratos

As estratégias ficam finas porque o loop por baixo é grosso. A peça que vale roubar é o circuit breaker. Defaults: 3 falhas consecutivas, ou 5 repetições do mesmo erro, disparam e cortam o gasto. "Mesmo erro" sobrevive ao ruído de log porque a mensagem é normalizada antes do hash:

```ts
// src/loop/circuit-breaker.ts
private hashError(error: string): string {
  const normalized = error
    .replace(/0x[a-fA-F0-9]+/g, 'HEX') // endereços hex
    .replace(/at\s+\S+\s+\(\S+:\d+:\d+\)/g, 'STACK') // stack frames
    .replace(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/g, 'TIMESTAMP') // antes de :linha:col
    .replace(/:\d+:\d+/g, ':N:N') // arquivo:linha:col
    .toLowerCase()
    .trim()
    .slice(0, 500);
  return crypto.createHash('md5').update(normalized).digest('hex').slice(0, 8);
}
```

A ordem importa: timestamps são normalizados antes de `arquivo:linha:col`, senão o `14:07:39` dentro de um timestamp casa com a regra errada e é mutilado primeiro. Depois de um disparo há um cooldown de 30 segundos que permite exatamente um retry antes de o loop desistir de vez.

Em volta do breaker ficam um rate limiter, que dá backoff em vez de queimar a janela do provedor, e um teto de custo, que mata o loop num valor em dólar que você define. A lista completa de motivos de saída lê como vocabulário de postmortem: `completed`, `file_signal`, `circuit_breaker`, `rate_limit`, `cost_ceiling`, `blocked`, `max_iterations`.

Mais um detalhe que eu não pularia. A falha não volta por uma aresta de grafo. Ela volta por uma string. A saída bruta de test, lint e build entra no próximo prompt como veio. O agente não recebe um resumo da falha. Ele recebe a falha.

## O que levar daqui

Se você está orquestrando agentes de código, confira o que o git já te dá antes de instalar um framework: isolamento (worktrees), estado (commits), trilha de auditoria (diffs) e recuperação de crash (reflog). Adicione o grafo quando um estágio genuinamente precisar de saídas tipadas de outro estágio, e não antes. Um `for` loop e `git worktree add` vêm entregando mais que meus designs de grafo há um ano, e eu ainda consigo ler meu orquestrador inteiro numa sentada só.

*ralph-starter é open source, licenciado sob MIT. Se você acha que a heurística do vencedor do consensus é ingênua demais, você provavelmente está certo, e o issue tracker está aberto.*
