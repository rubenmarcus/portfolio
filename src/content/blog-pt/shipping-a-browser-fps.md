---
title: "Construindo um FPS de navegador com Agentes de IA"
description: "CS Brasil é um FPS de navegador satírico — 5 facções, 44 personagens, 26 armas, 5 mapas, Three.js zero-build — construído quase inteiramente por agentes de IA rodando um loop adversarial com nome: o Gauntlet. Críticos dão nota, builders editam o mesmo arquivo de 6.543 linhas em paralelo, e o loop nunca termina sozinho."
date: 2026-07-24
updated: 2026-08-07
readTime: "10 min"
cover: "/art/blog/shipping-a-browser-fps.png"
tags: ["gamedev", "ai-agents", "webgl", "javascript", "threejs"]
---

CS Brasil é um FPS de navegador satírico construído em torno de política brasileira ficcional. Você abre uma URL e está numa partida: sem launcher, sem install, sem account wall. Está em `v2.0.0-alpha.29`, e ficou maior que a piada que o originou: **5 facções, 44 personagens, 26 armas, 5 mapas, 526 clips de animação versionados**, mais um ranking em Supabase que já registrou partidas de 474 cidades em 27 países.

A stack é agressivamente sem graça: vanilla JS mais um Three.js vendored, zero build step, tudo servido como módulos puros. E aqui vai a parte que ainda parece estranha de digitar: eu não escrevi a maior parte disso. Agentes de IA escreveram, e continuam escrevendo, dentro de um sistema que construí para mantê-los honestos. Este post é sobre esse sistema. O motor de medição embaixo dele ganhou [seu próprio post](/blog/cs-brasil-ai-harness).

## O loop tem nome

A orquestração é um sistema nomeado: o **Gauntlet Loop**, versionado no repo em `.claude/skills/gauntlet-fps/SKILL.md`. É uma das 32 skills que o projeto carrega: 2 escritas por mim, 30 de terceiros pinnadas por SHA-256 no `skills-lock.json`, porque higiene de supply chain vale para prompts também.

O Gauntlet não é um swarm nem um DAG. É um loop adversarial baseado em papéis, e existe por causa de uma observação, guardada no arquivo da skill: *"Um agente sozinho produz um resultado decente e para. Ele para porque ele mesmo é quem julga."* E conhece toda a razão por trás de cada decisão que tomou, o que o torna excelente em explicar por que o próprio trabalho é aceitável.

## Como funciona uma rodada

Uma rodada do Gauntlet tem seis movimentos, e a ordem é o design.

**1. A régua existe antes de qualquer edição.** O `tools/eval/BAR.md` é uma rubrica visual com 25 critérios, cada um mensurável num único frame: iluminação, silhuetas, contraste do HUD, enquadramento de arma. Nenhuma edição começa antes de existir um jeito de perder.

**2. Um baseline medido.** O `tools/eval/gl-shots.mjs` captura screenshots headless de todos os mapas, em dois aspect ratios, de quatro ângulos, mais as telas de menu. Sem baseline não existe A/B, e sem A/B o loop vira opinião.

**3. Críticos adversariais, em paralelo, com contexto limpo.** Um por frente: gráficos, mapas, armas-visual, armas-feel, UI-menu, UI-HUD, jogabilidade. Cada crítico recebe os screenshots e o código, e *nunca* vê o relatório do builder, só o pixel. Cada um precisa devolver nota de 0 a 10 mais os gaps ordenados por impacto dividido por custo, cada gap com um `arquivo:linha` e uma correção com números. A skill diz literalmente: "melhorar a iluminação" é resposta inválida. "22,7% dos pixels deste frame estão quase pretos e a causa é `bloom.js:18`, `power=1.25`" é resposta válida.

**4. Builders em paralelo, editando o mesmo arquivo.** Aqui vem a parte assustadora: o `game.js` tem 6.543 linhas, cerca de 26% do codebase, e todas as frentes precisam dele. Então os builders o editam simultaneamente, particionados por símbolo através de uma tabela de conflito gerada: o `tools/gen-arch.mjs` produz o `tools/eval/ARCH.md`, um índice de quem pode mexer em quais ranges de linha. `constructor()`, `update()` e `_dom()` são zonas vermelhas append-only. O resultado medido: três agentes editando ranges disjuntos do mesmo arquivo ao mesmo tempo, zero conflitos de conteúdo.

**5. Exatamente um agente roda navegador.** Duas capturas headless pesadas em paralelo derrubam o boot do jogo e produzem bugs falsos: um "countdown travado" que é, na verdade, só carga. Um navegador, um agente, toda vez.

**6. Verificação A/B mais um caçador de regressões.** Dois críticos novos, contexto limpo: um roda a rubrica de novo nos frames antes/depois e diz quais critérios saíram de FAIL para PASS; o outro tem uma missão única: achar o que *piorou*. Ele recebe uma instrução explícita: se não houver regressão, diga isso. Um agente a quem se pede para achar problemas vai achar problemas; você precisa dar a ele permissão de não achar nenhum.

Aí um humano lê os vereditos, coloca as regressões em primeiro lugar na rodada seguinte (regressão não pode dormir) e o loop roda de novo. O loop nunca termina sozinho. O humano é quem para.

## Três leis

Tudo isso descansa em três regras que valem mais que qualquer guia de estilo: **a régua não é negociável**; **quem constrói nunca dá a nota**; **o loop nunca termina a si mesmo**. E a frase que resume, direto do arquivo da skill: *"O que faz a diferença não é o número de agentes, é que cada afirmação carregue um número e um arquivo:linha."*

## Histórias de guerra

**A rodada das 13 regressões.** Uma vez paralelizei o sistema de arma + mão + ADS (aim-down-sights, a arma levantada na altura do olho). Uma rodada depois: treze regressões. Os três sistemas compartilham estado demais para serem particionados com segurança, então essa frente agora é um agente só, sequencial. Paralelismo tem raio de explosão, e alguns sistemas são um cérebro só.

**A parede que dava para sentir.** A régua de colisão ficou verde num mapa, mas jogando eu vivia batendo numa parede invisível. A caixa de colisão estava 0,68 metros fora do lugar. Meio passo se sente. A régua mediu que a colisão existia; não mediu onde. Arquivado em: o jogador também é um instrumento.

**O gate que mentiu.** O portão de verificação uma vez mediu o viewmodel de ontem e reportou vermelho com toda confiança: a captura tinha rodado em cima de um build velho. Um gate pode mentir, e agora existe uma meta-invariante cujo único trabalho é pegá-lo.

## O que eu guardei para mim

A divisão de trabalho da primeira versão do jogo continua valendo. Agentes ficam com o volume: código, mapas, armas, retargeting de animação, as rodadas infinitas de polish. Eu fico com gosto e gates: os guardrails da sátira (arquétipos ficcionais exagerados, nunca pessoas reais, sem gore), os renames, os deploys, e o botão de parar, porque o loop não tem um.

O resultado é um jogo que eu não conseguiria construir sozinho, num ritmo que eu não acreditaria, com um rastro de papel de números atrás de cada afirmação de "melhorou". 26 armas que se sentem distintas, 5 mapas que cada um ganhou sua própria frente de crítica, um HUD que sobreviveu à rubrica, e um alpha que continua absorvendo jogadores enquanto o loop roda.

*Se você está rodando loops adversariais nos seus próprios projetos, ou acha que nota de 0 a 10 de um language model é astrologia com etapas extras, minha inbox está aberta.*
