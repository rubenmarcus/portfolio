---
title: "Um centro de comando para swarms de agentes, em markdown"
description: "Eu rodo um swarm de agentes de codificação — Codex, Claude, Amp, Kimi — mais humanos, coordenados inteiramente por arquivos markdown. Sem banco de dados, sem dashboard como fonte da verdade, histórico de chat explicitamente banido. Aqui está o cérebro compartilhado: sala de controle, fila de tarefas, cemitério de candidatos e automação fail-closed."
date: 2026-08-02
readTime: "10 min"
tags: ["ai", "agents", "orchestration", "tooling"]
cover: "/art/blog/agent-command-center.png"
---

Há um tempo venho rodando um desafio competitivo de otimização (o tipo em que você joga computação e engenhosidade contra um alvo difícil e o leaderboard marca os pontos) usando um swarm de agentes de codificação. Codex, Claude, Amp, Kimi, mais um ou outro humano que apareceu. Os agentes vêm e vão, batem no rate limit, estouram a janela de contexto e esquecem tudo entre sessões.

Então a camada de coordenação não pode viver em nenhum deles. Ela vive em arquivos. Markdown é o banco de dados, e o histórico de chat é explícita e deliberadamente *não* a fonte da verdade. Se um agente descobriu algo e não escreveu, isso não aconteceu. Este post é a anatomia desse cérebro compartilhado.

## Por que não um banco de dados

Porque agentes já leem e escrevem markdown nativamente, git diffs são o log de auditoria de graça, e eu consigo inspecionar o estado inteiro do sistema com `cat`. Qualquer opção mais sofisticada (um SQLite, uma API de tarefas, um dashboard web) adiciona uma camada que os agentes precisam ser ensinados a usar e que eu tenho que manter. Um diretório de arquivos markdown tem custo zero de onboarding: aponte qualquer agente para ele e ele já conhece a interface.

## control-room/: o cérebro compartilhado

O diretório `control-room/` é o estado de toda a operação:

- **CURRENT_CONTEXT.md**: o que está acontecendo agora, reescrito sempre que muda. Qualquer agente ou humano lê isso primeiro e está orientado em trinta segundos.
- **ROUTES.md**: a fila de rotas de ataque ativas, cada uma com um veredito. Este é o quadro de trabalho.
- **LEDGER.md**: append-only. Cada execução, cada resultado, cada custo, uma linha cada, nunca editado. O ledger é a memória que sobrevive a todo wipe de contexto.
- **CONTROL.md**: o portão de submissão. Nada sai sem passar por ele.
- **Um digest compacto de aprendizados**: gerado automaticamente a partir do ledger, para que um agente novo não gaste tokens pagos redescobrindo rotas mortas da forma difícil. Esse arquivo se paga diariamente: sem ele, toda sessão nova é um peixe dourado com um cartão de crédito.

## swarm/: a fila de tarefas

O diretório `swarm/` é a maquinaria: JSONs de tarefa ficam em `queue/`, snapshots de prompt em `outbox/`, e resultados aterrissam em `results/`. Um dispatcher em Python com um adaptador de CLI por agente (cada uma dessas ferramentas tem uma personalidade e uma sintaxe de flags diferente; os adaptadores absorvem isso) retira tarefas da fila e as executa. Um scheduler no launchd enfileira exatamente uma tarefa limitada por ciclo de 30 minutos.

Uma tarefa por ciclo é um regulador deliberado, não uma limitação. Ele limita o raio de explosão de qualquer agente confuso, distribui o custo de forma previsível e me dá um checkpoint natural para ler resultados. Uma fila sem limite com agentes autônomos é só um jeito muito eficiente de converter dinheiro em regressões.

Toda tarefa é delimitada antes de começar: um falsificador (que resultado provaria que esta rota está errada), um comando validador, um custo máximo, um limite de wall-clock e uma condição de kill. Se uma tarefa não consegue declarar seu falsificador, ela não é uma tarefa, é uma vibe, e vibes não entram na fila.

## agents/: prompts de papel

Agentes recebem prompts de papel do mesmo jeito que funcionários recebem descrições de cargo. Há um **dissector** (desmonta o problema e as tentativas existentes), um **engineer** (implementa a rota), um **analyst** (lê resultados e extrai lições), um **scout** (explora alavancas não testadas) e um **orchestrator** (decide o que entra na fila a seguir). Mesmos modelos por baixo, trabalhos diferentes. Um prompt generalista produz divagação generalista; um prompt de papel produz um entregável.

## skills/: a polícia do formato de output

Um arquivo de skills impõe um formato rígido de output em todo relatório de agente:

```
DECISION:
WHY:
EVIDENCE:
MISSING:
NEXT COMMAND:
STOP RULE:
```

A evidência precisa ser rotulada como CONFIRMED, INFERRED ou UNKNOWN. Este é o arquivo de maior alavancagem do sistema inteiro. Antes dele, relatórios de agente eram prosa confiante onde "o teste passou" e "imagino que o teste passaria" pareciam idênticos. Depois dele, o agente precisa se comprometer, por escrito, com o que ele realmente observou. Alucinações não desaparecem, mas fica bem mais difícil lavá-las para CONFIRMED.

## intelligence/: o mapa do labirinto

O diretório `intelligence/` guarda a biblioteca de branches e a taxonomia de alavancas, toda forma conhecida de atacar o problema, cada uma em um de três estados: `untested`, `pending` ou `killed`. Killed é um estado de primeira classe, e esse é o ponto: uma rota morta registrada vale mais que uma viva, porque o resultado mais caro num sistema multi-agente é três agentes diferentes redescobrindo o mesmo beco sem saída em três sessões diferentes.

O que me traz ao meu diretório favorito: o **cemitério de candidatos**. Todo candidato morto ganha uma lápide: o que era, o veredito que o matou e as condições exatas sob as quais pode ser reaberto. O cemitério é o que impede o swarm de re-litigar história encerrada. É um cemitério como otimização.

## Worktrees e automação fail-closed

Higiene de execução: um git worktree por rota, então rotas nunca contaminam umas às outras e todo resultado é atribuível a um diff.

E a automação é fail-closed. A automação pode *preparar* (enfileirar tarefas, rascunhar prompts, agregar resultados), mas nunca pode improvisar gastos. Há hard stops ligados no circuito: um portão `GPU_APPROVAL_NEEDED` para qualquer coisa que custe computação de verdade, e um simples arquivo `STOP` que mata o scheduler na hora. O arquivo STOP é deliberadamente burro: sem condicionais, sem parsing, se ele existe nada roda. Quando a coisa que supervisiona seus agentes também é software, o freio de emergência deve ser o objeto mais burro possível no repositório.

## O dashboard observa, não decide

Existe um dashboard interno de observabilidade: um proxy de pressão de contexto (quão perto cada agente está do topo da janela), histórico de prompts e um log de achados de death-loops e alucinações que o sistema pegou. Mas o dashboard é uma visão read-only sobre o markdown. Os arquivos são a verdade; o dashboard é o painel de instrumentos. No momento em que um dashboard vira a fonte da verdade, você está debugando seu dashboard.

## O que eu realmente aprendi

Sistemas multi-agente não falham porque os agentes são burros. Falham porque a coordenação é vibes. Agentes esquecem, alucinam, duplicam trabalho e relatam com confiança coisas que não verificaram, e cada um desses modos de falha é sobrevivível se o estado do mundo vive em arquivos chatos, inspecionáveis e append-only que nenhum agente individual possui.

O centro de comando inteiro é um diretório de markdown, um dispatcher em Python, um scheduler e um cemitério. Ele sobreviveu a toda troca de modelo que eu joguei nele, porque não depende de modelo nenhum. Markdown sobrevive a janelas de contexto. Esse é o truque inteiro.
