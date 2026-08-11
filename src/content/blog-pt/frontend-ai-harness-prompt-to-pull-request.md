---
title: "Meu harness de IA para frontend: do prompt ao pull request"
description: "O sistema que uso para transformar uma ideia em frontend verificável: specs, skills, escolha de modelo, Ralph Starter, worktrees, browser, screenshots, testes, GitHub e telemetria. O modelo escreve código. O harness decide em que acreditar."
date: 2026-08-11
readTime: "11 min"
tags: ["ai", "agents", "frontend", "harness", "ralph-starter"]
cover: "/art/blog/frontend-ai-harness-prompt-to-pull-request.png"
---

O build do meu portfólio estava verde. Em 390px, o endereço de email saía do próprio card. Depois do primeiro fix, ele cabia, mas quebrava um único "m" para a linha seguinte. Foram três ciclos de screenshot até uma string ficar certa.

Esse é o detalhe que separa um agente que escreve frontend de um sistema que entrega frontend. O TypeScript não sabia que a página de contato tinha falhado na tarefa mais básica da página. O browser sabia. A imagem sabia. O harness precisava olhar para os três.

Uso Claude, Codex, Amp, Kimi e GLM conforme disponibilidade e tipo de trabalho. Nenhum deles é o harness. Modelos são workers dentro de um circuito maior, junto de specs, skills, git, browser, testes, críticos e condições de parada.

Este é o circuito completo que uso hoje, do pedido ao pull request.

## Primeiro: o que chamo de harness

Harness é o ambiente de execução e medição de um agente.

O prompt diz o que fazer agora. O harness decide quais arquivos o agente lê, quais ferramentas pode usar, onde escreve, o que precisa medir, como recebe uma falha e qual evidência permite encerrar o trabalho.

No meu caso, o fluxo cabe neste mapa:

```text
ideia, issue ou bug
→ pesquisa e spec
→ seleção de papel, modelo e skills
→ worktree isolada
→ implementação
→ test, lint e build
→ browser, screenshots e evals
→ crítico adversarial
→ pull request
→ telemetria e novas issues
```

Nem toda tarefa atravessa todas as etapas. Uma troca de copy não precisa de swarm. Uma nova experiência de navegação precisa do browser. Um experimento de shader precisa de screenshots e medição de GPU. O harness roteia pelo risco, não pelo entusiasmo.

## 1. A entrada precisa ser melhor que "faça uma tela"

O primeiro artefato é uma spec curta. Ela descreve comportamento, restrições e prova de conclusão.

Para uma feature de frontend, quero pelo menos:

- rota ou superfície afetada;
- estados normal, loading, vazio, erro e sucesso;
- breakpoints relevantes;
- origem e forma dos dados;
- interações de teclado e foco;
- orçamento de performance quando importa;
- comandos de validação;
- screenshots ou referências visuais;
- o que está explicitamente fora do escopo.

Uma spec não precisa prever cada classe Tailwind. Ela precisa impedir que o agente invente a definição de pronto.

O caso mais claro veio do Ralph Starter. Uma issue chamada "Improve performance" atravessou três loops sem progresso verificável. A cada rodada o agente escolhia uma otimização diferente, porque ninguém tinha escrito rota, dispositivo, métrica inicial ou meta. O circuit breaker encerrou o trabalho corretamente.

Depois disso, "melhorar performance" deixou de ser uma tarefa. "Reduzir o LCP da rota `/catalog` no mobile de 3,1s para menos de 2,5s no cenário de teste X" é uma tarefa.

## 2. Skills carregam método, a spec carrega intenção

Eu separo conhecimento reutilizável do pedido atual.

A spec diz: implemente este filtro no catálogo. Uma skill diz: ao trabalhar com frontend deste projeto, inspecione os componentes existentes, preserve tokens, verifique 390px e desktop, teste teclado, capture screenshots e rode os gates.

Sem essa separação, cada issue repete um manual de operação. Pior: duas issues acabam com versões diferentes do manual.

Skills úteis num projeto frontend incluem:

- padrões de React, Next.js ou Svelte usados no repo;
- sistema visual e convenções de Tailwind;
- acessibilidade e navegação por teclado;
- captura e comparação de screenshots;
- escrita e tradução de conteúdo;
- política de dependências;
- observabilidade e eventos de produto;
- release e rollback.

Neste portfólio, a voz editorial já era uma skill. Agora o fluxo bilíngue e o sistema visual das capas também são skills versionadas no repo. O próximo agente não precisa reconstruir essas decisões a partir de uma conversa antiga.

## 3. Eu não uso um router mágico entre modelos

Roteamento de modelo funciona melhor como uma tabela de papéis do que como uma eleição abstrata de "melhor IA".

Minha tabela muda com o projeto e a disponibilidade, mas os critérios são estáveis:

| Papel | O que procuro |
|---|---|
| scout de pesquisa | contexto longo, busca, boa síntese e links verificáveis |
| spec writer | decomposição, restrições e casos de borda |
| builder | uso confiável de ferramentas e edição precisa do repo |
| crítico visual | leitura de screenshots e capacidade de apontar defeitos concretos |
| regression hunter | paciência para comparar antes e depois sem inventar achados |
| reviewer | análise de diff, risco e cobertura de testes |

Claude pode ocupar spec e build numa tarefa. Codex pode revisar e corrigir issues em sequência. Kimi pode pesquisar referências. GLM pode executar trabalho bem delimitado em volume. Isso não é uma lei sobre os modelos. É uma decisão operacional que posso trocar sem redesenhar o pipeline.

Em trabalhos caros, o roteamento também considera limite de contexto, rate limit, custo e disponibilidade. O [harness que construí para o ECDSA.fail](/pt/blog/roteando-papeis-de-agente-entre-providers-com-openrouter) faz isso de forma explícita com tabelas de papel para modelo e adapters fail-closed. Para um frontend pequeno, uma tabela no arquivo de instruções já resolve.

## 4. Ralph Starter executa o loop mecânico

O [Ralph Starter](https://github.com/rubenmarcus/ralph-starter) é a peça que transforma uma spec numa execução repetível.

Um comando mínimo é:

```bash
ralph-starter run "add an accessible search field to /catalog" --commit --pr
```

Ele pode buscar a tarefa no GitHub, Linear, Notion, arquivo local ou URL. Depois:

1. cria uma branch;
2. executa o agente escolhido;
3. roda test, lint e build;
4. injeta a saída bruta da falha na próxima iteração;
5. repete até passar ou atingir uma condição de parada;
6. faz commit, push e abre o PR quando autorizado.

Para várias issues, cada execução pode usar uma worktree própria:

```bash
ralph-starter auto \
  --source github \
  --project owner/repo \
  --label auto-ready \
  --parallel \
  --concurrency 3
```

Ralph não substitui o harness inteiro. Ele é o executor do loop de implementação. Não decide se a feature merece existir, não sabe sozinho se o layout ficou bom e não deve promover uma mudança apenas porque o build passou.

A razão para citá-lo aqui é prática: muita gente tenta construir agentic engineering começando por um swarm. Um loop com uma spec, um agente e três gates já resolve uma grande parte do trabalho. Paralelismo vem depois que a execução individual é confiável.

## 5. Worktrees impedem que velocidade vire contaminação

Quando dois agentes editam o mesmo checkout, o resultado pode parecer colaboração. Na prática, um altera o chão enquanto o outro mede.

Uso uma git worktree por frente de trabalho. Cada agente recebe branch, diretório e diff próprios. Isso permite:

- atribuir cada resultado a uma tentativa;
- matar uma rota sem desfazer outra;
- comparar abordagens lado a lado;
- rodar validações sem arquivos não commitados de outro worker;
- escolher um vencedor antes do merge.

No modo swarm do Ralph Starter, as estratégias `race`, `consensus` e `pipeline` usam esse isolamento de formas diferentes. `race` aceita o primeiro loop bem-sucedido. `consensus` espera todos e compara execuções válidas. `pipeline` passa o mesmo trabalho por estágios sequenciais.

Para frontend, uso `race` com cuidado. O primeiro build verde não é necessariamente a melhor interface. Quando gosto visual importa, prefiro terminar os candidatos, capturar as mesmas rotas e comparar as imagens sob a mesma rubrica.

## 6. Framework muda o gate, não a arquitetura do loop

React, Next.js, Svelte e Tailwind pedem verificações diferentes.

Em React, olho para estado duplicado, efeitos que deveriam ser derivados e componentes que renderizam mais do que precisam. Em Next.js, entram limites entre server e client components, cache, serialização, rotas dinâmicas e o risco de colocar segredo no bundle. Em Svelte, verifico o modelo de reatividade usado pelo projeto e se o agente misturou convenções de versões diferentes. Em Tailwind, procuro duplicação de classes, valores mágicos e componentes que ignoram os tokens existentes.

O build encontra parte disso. Testes encontram outra parte. O browser encontra o restante.

Por isso uma skill de frontend deve começar lendo o repo. Pedir "use best practices de Next.js" pode fazer o agente aplicar a prática certa para uma versão, router ou arquitetura que o projeto não usa. Instrução genérica perde para evidência local.

## 7. O browser é uma ferramenta de teste

Depois de três versões do portfólio chegarem a produção sem ninguém renderizar todas as páginas, criei um gauntlet visual.

O comando captura cada rota em 1600x1000 e 390x844. Uma rubrica escrita dá de 0 a 2 pontos em 15 critérios, máximo de 30 por screenshot. O ciclo é:

```text
build
→ abrir com browser real
→ capturar desktop e mobile
→ avaliar com rubrica
→ corrigir
→ capturar novamente
```

O próprio rig precisou ser corrigido. Chrome headless com renderização por software destruía WebGL e produzia falsos bugs. Animações do compositor eram capturadas com `opacity: 0`. A toolbar do Astro aparecia nas imagens. Antes de o gauntlet avaliar o site, eu precisei calibrar a câmera.

Os ciclos chegaram a médias de 29,4, 29,75 e 29,83 de 30. O último defeito real era o endereço de email. Build verde, página quebrada. É por isso que screenshot não é decoração de PR. É saída de teste.

## 8. Um crítico precisa ter permissão para reprovar

Builder e reviewer não deveriam compartilhar o mesmo objetivo.

O builder quer terminar a feature. O crítico quer encontrar a razão concreta pela qual ela ainda não deveria entrar. Dou ao crítico o diff, os screenshots, a spec e os logs de validação. Não dou a conclusão do builder como verdade.

Um relatório útil precisa responder:

```text
DECISION:
WHY:
EVIDENCE:
MISSING:
NEXT COMMAND:
STOP RULE:
```

Também separo o que foi confirmado, inferido e não verificado. "O teste passou" e "o teste deveria passar" não podem ocupar a mesma categoria.

No frontend, o crítico procura regressão visual, foco perdido, overflow, estado ausente, console error, request duplicada, conteúdo que salta e caminhos que só funcionam com mouse. Se não encontrar nada, pode dizer que não encontrou. Crítico obrigado a descobrir um bug começa a fabricar bugs.

## 9. GitHub é a fila, não a memória inteira

Erros reportados por jogadores do CS Brasil já podem virar issues no GitHub automaticamente. O passo seguinte é classificar, reproduzir e preparar correções por agente. Essa automação só funciona se a issue carregar evidência suficiente: rota ou mapa, versão, mensagem, stack, estado relevante e passos conhecidos.

O GitHub organiza trabalho e revisão. A memória operacional continua no repo: instruções, skills, specs, decisões, invariantes e resultados de eval. Uma conversa privada com um modelo é um lugar ruim para guardar por que uma regra existe.

No caminho inverso, o agente pode buscar uma issue pronta e entregá-la ao Ralph Starter. Isso fecha um circuito útil:

```text
telemetria ou erro
→ issue estruturada
→ triagem
→ spec aprovada
→ loop de implementação
→ PR
→ deploy
→ nova telemetria
```

Eu ainda mantenho aprovação humana entre triagem e execução para mudanças que afetam produto, segurança, custo ou arquitetura. Automação deve reduzir relay mecânico, não esconder decisões.

## 10. Telemetria fecha o loop que o PR não fecha

Testes dizem se a mudança respeita um contrato conhecido. Telemetria mostra o que aconteceu com pessoas reais.

Para um jogo, observo tempo por mapa, personagem, duração de round, score e abandono. Para um produto web, seriam eventos de funil, erros por rota, Core Web Vitals, uso por breakpoint e falhas de rede. Os sinais dependem do produto. A regra é a mesma: uma feature sem observação pós-deploy termina no merge, não no aprendizado.

Telemetria também cria novas specs. Se uma rota tem erro concentrado em mobile, a próxima issue já nasce com cenário e medida. O harness melhora porque o produto devolve casos reais.

## A versão mínima que eu montaria hoje

Para alguém começando, eu não recomendaria cinco modelos nem um swarm.

Montaria isto:

1. `AGENTS.md` com arquitetura, comandos e limites.
2. Uma skill de frontend específica do repo.
3. Issues com critérios de aceite observáveis.
4. Um agente de código confiável.
5. Ralph Starter ou um loop equivalente.
6. Test, lint e build obrigatórios.
7. Dois screenshots por rota crítica: desktop e mobile.
8. Um reviewer separado olhando diff e imagens.
9. Uma condição de parada e um limite de iterações.

Depois adicionaria worktrees paralelas, roteamento entre modelos, mutation testing, telemetria automática e bots de triagem conforme os modos de falha aparecessem.

O modelo mais novo pode melhorar a primeira tentativa. Ele não resolve uma spec vaga, uma câmera mentirosa ou uma régua que premia a coisa errada.

A lição é operacional: comece pelo feedback que consegue reprovar o agente. Depois escolha quem escreve o código.

Se os termos ainda parecem misturados, leia antes [Do prompt ao produto: cinco formas de desenvolver com IA](/pt/blog/do-prompt-ao-produto-cinco-formas-de-desenvolver-com-ia).
