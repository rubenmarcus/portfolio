---
title: "Como cheguei ao #1 num desafio de correção de erros quânticos usando IA"
description: "Topei o leaderboard da QEC Decoder Optimization Arena a 2.642 erros por milhão — não com credenciais em física, mas com um loop experimental enxuto: validação em dados reservados, gating estatístico e um swarm de agentes em git worktrees isolados."
date: 2026-04-16
readTime: "7 min"
cover: "/art/blog/how-i-hit-1-qec-using-ai.png"
tags: ["quantum-computing", "ai", "agents", "benchmarks", "optimization"]
---

Hoje submeti minha última tentativa no leaderboard da [QEC Decoder Optimization Arena](https://www.optimizationarena.com/qec) e [minha submissão](https://www.optimizationarena.com/qec/submissions/ab2806d6-792c-40a8-b1c3-e4078748a50d) estava no rank 1.

Score: 2.642 erros por milhão. As entradas abaixo da minha tinham nomes como "My QEC Decoder" e "quant", de gente que de fato trabalha na área. Eu construo apps em React pra viver.

Essa não é uma história de física. É uma de engenharia.

## O que o benchmark realmente é

Computadores quânticos dependem de qubits, que são extremamente frágeis. Eles flipam e derivam o tempo todo.

Correção de erros usa muitos qubits físicos pra codificar um qubit lógico estável, e o trabalho de um decoder é olhar pra sinais de medição chamados syndromes e adivinhar o que deu errado, pra que o sistema possa desfazer. Bons decoders são o que tornam a computação quântica viável em escala. Grupos de pesquisa passam anos neles.

A QEC Decoder Optimization Arena é um benchmark público. Você submete um único arquivo Python e ele é pontuado em 24 cenários de ruído diferentes. Menos erros por milhão vence.

## As restrições

A arena deliberadamente elimina todo atalho.

Um arquivo, 200KB no máximo. Só numpy, scipy, pymatching e stim. Sem PyTorch, sem JAX, sem extensões em C. Toda decode termina em 2,5 segundos ou você é desclassificado. Há um cooldown de dez minutos entre submissões. O sandbox bloqueia os, subprocess, socket, open, exec, eval. Sem pesos baixados, sem chamadas externas, sem truques.

Qualquer que seja a matemática que você entrega, tem que caber dentro dessa caixa.

## A abordagem

Tratei como um problema de otimização puro. Erros por milhão é um escalar único. Todo o resto é disciplina de engenharia.

A ferramenta na qual me apoiei é uma que de fato construo no meu trabalho: o [autoresearcher](https://autoresearcher.org/), um loop de pesquisa autônomo orientado por benchmark. Claude Opus 4.6 foi o coding agent. Eu era o humano no loop, aprovando mudanças de direção e vetando nulos.

Cada experimento passou por cinco passos.

Escrever a hipótese em inglês simples. Enviar o menor script de teste possível. Medir numa seed reservada, nunca na de treino. Rodar um Z-score num teste binomial e exigir pelo menos 2.0 pra ir pra produção. Matar ou manter, e se matássemos, documentar o porquê pra não retestar.

Rodei cerca de quarenta submissões ao longo de uma semana.

## O swarm

Uma peça que vale destacar. Eu não estava rodando um agente de cada vez. Estava rodando vários em paralelo, cada um no seu próprio git worktree isolado, pra que não pisassem nos arquivos uns dos outros.

No pico tinha 15 rodando. Cada branch testando sua própria variação de decoder ou seu próprio nulo.

O swarm fazia duas coisas. Escalava o loop, permitindo testar 15 ideias no tempo que leva pra testar uma, o que importa quando há um cooldown de dez minutos entre submissões. E revelava contradições, porque quando dois agentes trabalhando independentemente chegavam a conclusões incompatíveis a partir do mesmo diagnóstico, isso geralmente era o sinal de que o diagnóstico em si estava falho.

A maior parte da saída do swarm ainda era nulos. Mas permitiu queimá-los mais rápido, e os sobreviventes eram validados em isolamento antes de serem mergeados de volta à main.

## A parte que realmente importa

Cerca de 80% dos experimentos foram resultados nulos. Becos sem saída. Ideias que pareciam espertas e não faziam nada. A pesquisa envolveu ler 11 papers a fundo e investigar 18 repositórios open source antes de concluir que ninguém tinha uma bala de prata que estivéssemos perdendo.

O cemitério inclui Bayes lookup tables, ensembles de minimum-weight matching, votação HMM forward+reverse (0% de discordância, matematicamente redundante, deveria ter pego isso em dez minutos), HMMs de bloco de 2 linhas, decoders column-scan votando com decoders row-scan (99,85% de concordância, ensemble inútil) e acoplamentos within-row next-nearest-neighbor que se recusavam a melhorar qualquer coisa.

Tentei Belief Propagation com ordered statistics decoding, que ficou 4,3 vezes pior do que o minimum-weight matching puro porque códigos de superfície têm ciclos curtos que fazem o BP oscilar. Tentei um decoder MLP neural em numpy puro, que no máximo empatou com o HMM e não generalizou.

Mais de 25 abordagens implementadas e testadas. Quatro ideias foram pra produção. Essa proporção é a história real.

## O que chegou à produção

A submissão final faz quatro coisas.

Um Hidden Markov Model de row-scan por ponto de parâmetro, modelando ruído correlacionado como um sistema de Ising pairwise. O HMM usa bond dimension 32 pra L=5 e 128 pra L=7, o que o torna equivalente ao decoder de maximum likelihood em rede tensorial de Bravyi-Sucheta-Vargo. Tuning CMA-ES dos seus quatro parâmetros de acoplamento por ponto, uma otimização black-box sem gradiente fazendo o que minha intuição não conseguia.

Syndrome-hash patch mining que encontra empiricamente todo padrão que o HMM erra sistematicamente ao longo de milhões de shots e hardcodeia um override, só aceito se também vencer em trinta milhões de shots reservados com Z de pelo menos 1,65.

Calibração de runtime dos pesos de boundary edge no momento da decode.

Nada disso era óbvio no início. É o resíduo depois de queimar pelos nulos.

## O insight que de fato venceu

Por volta do experimento trinta, depois de uma longa sequência de nulos, rodei um diagnóstico em vez de uma ideia nova.

Medi, por syndrome hash, com que frequência a predição do HMM batia com a verdade empírica ao longo de cinquenta milhões de shots. Batia quase sempre. Um agente separado minerando 500 milhões de amostras confirmou que 95,6% do gap restante entre nosso decoder e o piso Bayes-optimal vive em syndromes que aparecem menos de 10 vezes em 100 milhões de shots. Fundamentalmente unpatchable.

Tradução: o HMM já era near-optimal dadas suas suposições estruturais. Todo ajuste arquitetural que eu tentava estava condenado desde o início, porque o teto não era a arquitetura do decoder. Era a cauda longa de syndromes raros onde o decoder apostava errado sistematicamente.

Esse pivot produziu os últimos trinta erros-por-milhão de melhora. Não de uma ideia melhor, mas de aceitar que minha ideia atual tinha um teto e me adaptar a ele.

Essa é a skill de engenharia mais subestimada na era dos agentes de IA. Não ter ideias brilhantes. Saber quando a sua atual está acabada, e ler diagnósticos que te dizem isso.

## A lição pra engenheiros

Muitos engenheiros de software olham pra benchmarks de especialista e assumem que não conseguem competir. O leaderboard que eu topei tem pesquisadores quânticos de verdade nele. Mas os coding agents de IA modernos já estão competentes o suficiente em implementar conhecimento de especialista que o bottleneck mudou.

O novo bottleneck é se você consegue rodar um loop experimental enxuto.

Hipóteses escritas antes dos testes. Validação em dados reservados sempre, seed de treino nunca. Nulos mortos rápido e documentados. Não se apaixonar por uma ideia porque era difícil de implementar. Ler diagnósticos em vez de rodar mais experimentos, quando você claramente saturou um design.

Nada disso exige um PhD. Exige disciplina de engenharia e um nariz razoável pra estatística.

## O stack

Claude Opus 4.6 como coding agent.

[autoresearcher](https://autoresearcher.org/) como orquestrador. numpy, scipy, pymatching, stim num sandbox Linux.

CMA-ES via pacote cmaes pra tuning de hiperparâmetros.

Um engenheiro, um laptop, zero GPUs, umas quarenta submissões ao longo de uma semana.

*Ruben Marcus. Senior AI Fullstack Engineer na MultiVm Labs. Construtor do autoresearcher, ralph-starter, AEO.js.*
