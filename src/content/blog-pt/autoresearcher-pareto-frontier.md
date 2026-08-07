---
title: "Mantendo um agente de pesquisa autônomo honesto"
description: "O Autoresearcher roda loops de pesquisa orientados por benchmark: um passo do agente, um comando de benchmark, um número, manter ou rejeitar. O que faz isso funcionar não é o agente. É o fato de o loop ser deliberadamente simples, fail-closed e deixar uma trilha de auditoria completa em git e JSONL."
date: 2026-07-08
readTime: "13 min"
cover: "/art/blog/autoresearcher-pareto-frontier.png"
tags: ["ai", "agents", "evaluation", "benchmarks", "open-source"]
---

[Autoresearcher](https://autoresearcher.org) é uma CLI open source que construí para um único trabalho: apontar um coding agent para um benchmark e deixá-lo trabalhar. Propor, implementar, medir, manter ou matar, pelo tempo que o loop continuar honesto. É o harness por trás de dois resultados que me orgulham: **#1 na QEC Decoder Optimization Arena** (um decoder de correção de erros quânticos a 2.642 erros por milhão) e **#1 no ECDSA.fail** (o circuito mais barato de adição de pontos secp256k1, sobre o qual [escrevi separadamente](/blog/the-agent-swarm-that-took-1-on-ecdsa-fail)).

Nenhum dos dois resultados veio de um modelo mais inteligente. Vieram de um loop desenhado para desconfiar da própria saída. Este post é sobre esse design, e começa com uma confissão: as pessoas assumem que existe um algoritmo de seleção esperto dentro do Autoresearcher. Não existe. A lógica de seleção tem seis linhas. Esse é o ponto.

## O loop, de forma concreta

A CLI inteira são três comandos: `autoresearcher init`, `autoresearcher wizard` e `autoresearcher run --iterations 20`. A config vive em `.autoresearcher/config.json`. Uma iteração do `run` faz o seguinte, em `src/run-loop.js`:

1. Registra o commit atual do git.
2. Roda um passo do agente.
3. Roda o seu comando de benchmark.
4. Extrai um número da saída com a sua regex.
5. Mantém a iteração só se o número melhorou.

A decisão de manter/rejeitar, aparada mas real:

```js
// src/run-loop.js
const benchmarkResult = await runCommand(merged.benchmarkCommand, { cwd });
const benchmarkOutput = `${benchmarkResult.stdout}\n${benchmarkResult.stderr}`;
const metric = parseMetric(benchmarkOutput, merged.metricRegex);

if (benchmarkResult.code !== 0 || metric == null) {
  // status: benchmark_failed. O feedback diz ao agente para consertar
  // o harness antes de otimizar qualquer outra coisa.
  continue;
}

const improved = isBetter(metric, bestMetric, direction);

if (improved) {
  bestMetric = metric;
  bestIteration = i;
  console.log('Result: improved -> keep');
  if (merged.autoCommit === true && (await hasGitChanges(cwd))) {
    await runCommand('git add -A', { cwd });
    await runCommand(`git commit -m "${commitMessage}"`, { cwd });
  }
  if (merged.onKeepCommand) {
    await runCommand(merged.onKeepCommand, { cwd, stream: true });
  }
} else {
  console.log('Result: not improved -> reject');
  if (merged.onRejectCommand) {
    await runCommand(merged.onRejectCommand, { cwd, stream: true });
  }
}
```

E aqui está o algoritmo de seleção inteiro, literalmente:

```js
// src/run-loop.js
function parseMetric(output, metricRegex) {
  const regex = new RegExp(metricRegex, 'm');
  const match = output.match(regex);
  if (!match || !match[1]) return null;
  const metric = Number(match[1]);
  return Number.isFinite(metric) ? metric : null;
}

function isBetter(metric, best, direction) {
  if (best == null) return true;
  return direction === 'min' ? metric < best : metric > best;
}
```

Isso não é uma simplificação para o post. É o código que está em produção. Comparação estrita contra a melhor métrica vista até então, direção `min` ou `max`, resultado binário. Nenhuma mistura de scores, nenhum ranking, nenhuma pilha de "talvez".

## O benchmark é o oráculo

A linha de design atravessa a config: o Autoresearcher nunca interpreta o seu domínio. Ele roda um comando de shell que você escreveu e acredita em um capture group:

```json
{
  "agentMode": "internal",
  "agentPromptFile": "program.md",
  "benchmarkCommand": "./scripts/benchmark.sh",
  "metricRegex": "score=([0-9.]+)",
  "direction": "min",
  "iterations": 40,
  "autoCommit": true,
  "onRejectCommand": "git checkout -- .",
  "commitMessageTemplate": "research: improved metric to {metric} (iter {iteration})"
}
```

Tudo o que torna uma medição confiável vive do seu lado desse contrato. Seeds reservadas, limites de runtime, limites de tamanho de arquivo, significância estatística, sandboxing. Tudo isso pertence ao `benchmark.sh`, onde é versionado, revisável e roda de forma idêntica para cada iteração. A arena QEC tem um limite de runtime de 2,5 segundos e suas próprias regras de scoring. O loop não precisa saber disso. O script de benchmark impõe isso, imprime um número, e um candidato desclassificado simplesmente produz um número pior ou nenhum número.

Essa é a parte que as pessoas fazem ao contrário quando constroem ferramentas de pesquisa. Elas colocam a lógica de avaliação no orquestrador, onde ela apodrece numa pilha de flags. O Autoresearcher vai no caminho oposto: o orquestrador é burro e pequeno, o benchmark é soberano. Quando a métrica mente, você conserta um script, não um framework.

## Falhe fechado, depois diga ao agente por quê

Dois comportamentos de falha importam mais do que o caminho feliz.

**Falha do agente para o run.** Com `stopOnAgentFailure: true` (o padrão), uma saída non-zero do passo do agente encerra o loop em vez de rodar benchmark numa árvore meio mutada e chamar o resultado de dado. Um número produzido por uma iteração quebrada é pior do que nenhum número, porque entra no log parecendo evidência.

**Falha de benchmark é um outcome de primeira classe.** Se o benchmark sai com non-zero ou a regex não acha nada, a iteração é logada como `benchmark_failed`, e o loop compõe feedback para o próximo passo do agente. O mecanismo de feedback é real e simples: o resultado da iteração N é prependado ao prompt da iteração N+1.

```js
// src/run-loop.js
const iterationAgentPrompt = benchmarkFeedback
  ? `${resolvedPrompt.prompt}\n\n## Benchmark Feedback From Previous Iteration\n${benchmarkFeedback}`
  : resolvedPrompt.prompt;
```

O texto do feedback é direto. Em falha: "Antes de otimizar mais, garanta que a execução do benchmark e a extração da métrica estão estáveis." Num reject: "Tente uma abordagem diferente e evite repetir o mesmo padrão de mudança." Num keep: "Continue na mesma direção com outra otimização focada." O agente sempre sabe quanto o último tento pontuou e qual direção é melhor. Nada mais carrega.

## Git é a memória

Não existe banco de dados de candidatos. A trilha de auditoria é git mais logs append-only.

Cada iteração registra `beforeCommit` e `afterCommit` (de `git rev-parse --short HEAD`) num log JSONL em `.autoresearcher/runs/<run_id>.jsonl`. Com `autoCommit: true`, todo keep vira um commit com a métrica na mensagem, então `git log` é a linhagem da pesquisa. Rejects são sua escolha: conecte `onRejectCommand` a `git checkout -- .` e a árvore reseta pro último estado mantido, ou deixe vazio e deixe as mudanças acumular se você prefere que o agente construa sobre o próprio detrito.

Uma consequência honesta: o agente trabalha na sua working tree, não numa sandbox que ele gerencia pra você. Isolamento é sua responsabilidade, do mesmo jeito que avaliação. Rode num clone dedicado. O trabalho da ferramenta é tornar cada transição de estado explícita e replayable, não esconder a machinery.

Quando o run termina, você recebe três artefatos: o log JSONL, um relatório final (`final-report-<run_id>.md`) com contagens de keep e reject, delta da métrica em relação ao baseline e se a tendência foi monotônica, e um `RESEARCH.md` sintetizado que termina numa decisão legível por máquina como `improved_with_stable_execution` ou `no_material_improvement`. O relatório não opina. Ele conta.

## O passo do agente é um shot headless

No modo `internal` padrão, cada iteração invoca um coding agent headless via [ralph-starter](https://www.npmjs.com/package/ralph-starter): um prompt, um shot, `backendMaxIterations: 1`. O wizard permite escolher o backend (amp, claude-code, codex, cursor, opencode, openclaw) e fixar um modelo, e o objetivo vem do `program.md`, um arquivo markdown simples que você edita como uma spec. Se você prefere dirigir sua própria ferramentagem, `agentMode: "command"` troca o backend interno por qualquer script shell `agentCommand`. O loop não se importa com o que produziu o diff. Só se importa com o que o benchmark disse sobre ele.

Essa indiferença é uma feature. Modelos são intercambiáveis e melhoram mensalmente. No tempo em que o Autoresearcher existe, troquei backends sem tocar no loop, porque a única interface do loop com a inteligência é um prompt que entra e uma working tree que sai.

## O que o loop te rende

Os números do run QEC: cerca de 40 submissões passaram pelo loop, e cerca de 80% das iterações foram resultados nulos. Essa proporção não é uma falha do agente. É o formato esperado da pesquisa, e é exatamente por isso que o loop é construído do jeito que é. Quando quatro de cada cinco tentativas não chegam a lugar nenhum, a estrutura de custo que importa é: cada nulo precisa ser barato, final e informativo. Barato, porque um reject é uma rodada de benchmark e um git revert. Final, porque `isBetter` não tem ramo "talvez". Informativo, porque o motivo da rejeição volta pro próximo prompt e o nulo fica no log JSONL para sempre.

O resultado de 2.642 erros por milhão que chegou ao #1 sobreviveu à versão mais estrita desse arranjo: o benchmark decidiu, o loop manteve só melhorias estritas, e cada passo mantido é um commit que você pode checkar e remensurar hoje.

## O que eu diria pra qualquer um construindo isso

1. **A avaliação é o produto, e ela vive no benchmark.** Escreva o benchmark mais duro que conseguir, com dados reservados e restrições rígidas, e então deixe o loop ter seis linhas. Esperteza no orquestrador é onde bugs sutis e gradientes de Goodhart se proliferam.
2. **Rejeite alto, rejeite barato.** Keep/reject binário, logado, por iteração. Um loop que tolera candidatos marginais se afoga nos próprios "talvez".
3. **Falhe fechado nos dois lados.** Um agente que crasha e um benchmark que crasha são ambos non-events, não data points. O run para ou a iteração é marcada como failed, mas nada silenciosamente vira um keep.
4. **Torne a trilha replayable.** Se você não consegue checkar o commit por trás de qualquer métrica mantida e reproduzir o número, seu log de pesquisa é ficção. Git mais JSONL é infraestrutura chata. Chata é o elogio.

O Autoresearcher é open source em [autoresearcher.org](https://autoresearcher.org). Os agentes vão continuar ficando mais inteligentes por conta própria. A engenharia interessante está em tudo ao redor deles que os mantém honestos, e a maior parte dessa engenharia é decidir o que não construir.

*Se você está construindo infraestrutura de avaliação ou orquestração de agentes e quer comparar cicatrizes, minha caixa de entrada está aberta.*
