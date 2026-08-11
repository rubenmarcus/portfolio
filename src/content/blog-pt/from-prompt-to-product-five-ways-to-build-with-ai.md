---
title: "Do prompt ao produto: cinco formas de desenvolver com IA"
description: "Prompt engineering, vibe coding, agentic engineering, product engineering e research engineering parecem nomes para a mesma coisa. Não são. A diferença está no que você controla, no tipo de feedback e em quem decide que o trabalho acabou."
date: 2026-08-11
readTime: "10 min"
tags: ["ai", "agents", "product-engineering", "research"]
cover: "/art/blog/from-prompt-to-product-five-ways-to-build-with-ai.png"
---

Uma issue do GitHub virou uma landing page em 8 minutos e 19 segundos. Foram duas iterações, 47 mil tokens e US$ 0,696. O agente escreveu os componentes React, aplicou Tailwind, rodou as validações e terminou com o build verde. Eu não abri o editor.

Eu contei esse caso quando escrevi sobre o [Ralph Starter](/pt/blog/automatizando-fluxos-de-trabalho-com-ralph-starter), a CLI que construí para executar agentes de código em loops. A reação mais comum foi chamar aquilo de vibe coding.

Não estava completamente errado. Também não descrevia o que aconteceu.

Um prompt sozinho não buscou a issue, criou uma branch, escolheu um agente, acompanhou oito tarefas, rodou build e lint, devolveu o erro da primeira tentativa e decidiu parar na segunda. O modelo escreveu o código. O sistema ao redor transformou a resposta em uma entrega.

Hoje usamos a mesma expressão para cinco atividades diferentes: prompt engineering, vibe coding, agentic engineering, product engineering e research engineering. Elas podem acontecer na mesma tarde e até no mesmo terminal. A diferença está no objeto que você controla e na prova que aceita como conclusão.

## 1. Prompt engineering controla uma interação

Prompt engineering é o trabalho de melhorar uma instrução para obter uma resposta mais útil de um modelo.

O escopo normal é uma conversa ou uma chamada de API. Você fornece contexto, define formato, adiciona exemplos, impõe restrições e observa a saída. Se a resposta veio errada, você muda a instrução.

É a ferramenta certa para tarefas delimitadas:

- explicar um trecho de código;
- gerar casos de teste para uma função;
- transformar um componente React em Svelte;
- propor nomes para uma API;
- revisar uma query;
- criar a primeira versão de um componente Tailwind.

O humano continua segurando o loop. Ele copia o contexto, lê a resposta, decide o próximo passo e leva o resultado para o ambiente real.

Um bom prompt reduz ambiguidade. Ele não cria, sozinho, memória persistente, acesso ao repositório, isolamento de branch, browser, validação ou condição de parada. Colocar mais 2 mil palavras no prompt não transforma uma conversa em sistema.

Eu ainda uso prompt engineering todos os dias. Só não espero que ele resolva um problema que pertence à infraestrutura.

## 2. Vibe coding controla a direção

Vibe coding funciona melhor quando ainda não sei exatamente qual é o produto.

Quero sentir uma animação. Comparar três composições. Descobrir se um dashboard deveria ser denso ou silencioso. Testar uma navegação antes de investir na arquitetura. Nessas situações, especificar tudo cedo demais apenas congela uma ideia que ainda precisa mudar.

O loop é rápido:

```text
descrever uma intenção
→ gerar algo visível
→ reagir ao resultado
→ manter, apagar ou mudar a direção
```

Foi assim que cheguei ao hero 3D deste portfólio. As primeiras gerações tentavam colocar vídeo, glifos, snippets flutuantes e uma figura 3D no mesmo palco. Tecnicamente havia bastante coisa acontecendo. Visualmente parecia um Frankenstein. A instrução que resolveu foi apagar quase tudo e manter um sujeito numa cena limpa.

Aquilo não era uma spec esperando execução. Eu estava descobrindo o brief por meio do resultado.

Vibe coding é ótimo para exploração porque o feedback é barato e humano. A tela aparece e eu consigo dizer se a direção tem futuro. Ele fica perigoso quando essa reação visual vira a única definição de pronto para autenticação, pagamentos, acessibilidade, migração de dados ou qualquer coisa que continuará existindo depois da demo.

Uma página que parece boa ainda pode falhar no viewport de 390px, perder estado no refresh ou mandar dados privados para o cliente. O vibe encontrou a direção. Agora outro modo de trabalho precisa transformar a direção em software.

## 3. Agentic engineering controla o ambiente

Agentic engineering começa quando eu paro de perguntar apenas "qual prompt devo escrever?" e começo a desenhar o mundo no qual o agente trabalha.

Esse mundo inclui:

- arquivos de instrução;
- skills especializadas;
- ferramentas permitidas;
- contexto recuperável;
- worktrees ou branches isoladas;
- testes, lint, build e evals;
- limites de custo e iteração;
- um sinal verificável de conclusão.

O [Ralph Starter](https://github.com/rubenmarcus/ralph-starter) é uma implementação pequena dessa ideia. Ele recebe uma spec inline, uma issue do GitHub, um ticket do Linear ou uma página do Notion. Depois executa este circuito:

```text
buscar a spec
→ criar uma branch
→ executar o agente
→ rodar test, lint e build
→ devolver a falha ao agente
→ repetir ou abrir o pull request
```

O agente pode ser Claude Code, Codex, Cursor, OpenCode, OpenClaw ou Amp. O loop não depende da personalidade do modelo. A validação é o contrato.

O incidente que melhor explica isso foi uma issue chamada apenas "Improve performance". Sem métrica, cenário ou orçamento, o agente tentou uma otimização diferente a cada rodada. Depois de três loops sem uma prova de progresso, o circuit breaker encerrou a execução. O problema não era falta de inteligência. O sistema não tinha uma definição mensurável de melhoria.

Agentic engineering não elimina prompt engineering. Ele coloca prompts dentro de um circuito com estado, ferramentas e feedback externo. Também não elimina vibe coding. Posso explorar a interface por vibe e, quando a direção estabiliza, entregar a implementação a um loop agentic com screenshots, testes e gates.

## 4. Product engineering controla a decisão

Um agente pode entregar exatamente a feature errada.

Product engineering decide qual problema merece ser resolvido, para quem, com qual prioridade e com quais trade-offs. O código é uma parte dessa decisão. Nem sempre é a parte mais cara.

Quando construo frontend com IA, há perguntas que nenhum build responde:

- O usuário entende o próximo passo?
- Esta informação merece ocupar o primeiro viewport?
- A feature reduz abandono ou apenas adiciona superfície?
- O custo de manutenção combina com o valor esperado?
- Devemos construir, comprar, simplificar ou não fazer nada?

No CS Brasil, agentes conseguem criar personagens, mapas, armas e painéis. Isso não significa que o jogo melhora a cada item novo. A telemetria precisa mostrar onde jogadores ficam, quanto tempo passam em cada mapa, quando abandonam uma partida e quais sistemas quase ninguém usa. O produto começa depois do deploy, quando comportamento real contradiz a intenção do prompt.

Existe ainda o problema de Goodhart: quando uma medida vira meta, o sistema aprende a melhorar o número, inclusive de formas que pioram o produto. Um agente do CS Brasil já aumentou o placar de um gate de 16/21 para 19/21 zerando uma constante que posicionava o viewmodel. A régua subiu. O enquadramento escolhido de propósito foi destruído.

A correção não foi pedir mais cuidado. Foi criar uma nova invariante que codificava a intenção visual. Product engineering escolheu o que precisava ser preservado. Agentic engineering transformou essa escolha em gate.

## 5. Research engineering controla a evidência

Em pesquisa, muitas vezes nem existe uma feature conhecida esperando implementação. Existe uma hipótese.

Research engineering organiza a busca por uma resposta que pode ser negativa. Isso muda o loop:

```text
formular hipótese
→ implementar o menor experimento
→ medir contra um benchmark
→ tentar falsificar o resultado
→ manter, matar ou refinar a hipótese
```

Usei esse modo em desafios de circuitos quânticos e otimização de decoders. Vários agentes exploravam rotas em worktrees separadas. Cada candidato precisava sobreviver a validação independente. Rotas mortas entravam num cemitério com o motivo da rejeição, porque três modelos redescobrindo o mesmo beco sem saída é uma forma cara de paralelismo.

A diferença para product engineering é o tipo de verdade procurada. Produto pergunta se algo cria valor sob restrições reais. Pesquisa pergunta se uma afirmação sobre o mundo ou sobre um sistema sobrevive ao experimento.

Um protótipo quebrado pode ser um ótimo resultado de pesquisa se matar uma hipótese cedo. O mesmo protótipo seria uma entrega ruim de produto. A condição de parada muda tudo.

## O mesmo frontend em cinco modos

Imagine uma tarefa: criar uma busca para um catálogo em Next.js.

**Prompt engineering:** você pede uma função de debounce ou um componente de input acessível.

**Vibe coding:** você gera três experiências de busca, testa filtros, animações e densidade até encontrar a interação certa.

**Agentic engineering:** a spec entra numa branch isolada. O agente implementa, abre o browser, roda testes, mede performance e prepara o PR.

**Product engineering:** você decide se busca é mesmo o gargalo, quais eventos medir e se o usuário precisa de texto livre, filtros ou recomendações.

**Research engineering:** você compara ranking lexical, semântico e híbrido num conjunto de consultas com relevância rotulada.

React, Next.js, Svelte e Tailwind não determinam o modo. Eles mudam as restrições técnicas. O trabalho continua sendo definido pelo feedback que encerra o loop.

## Como escolher

Eu uso esta tabela mental:

| Se a incerteza principal é... | Comece por... | A prova de progresso é... |
|---|---|---|
| como pedir | prompt engineering | uma resposta utilizável |
| o que quero construir | vibe coding | uma direção que vale manter |
| como executar com segurança | agentic engineering | gates externos passando |
| o que cria valor | product engineering | comportamento e resultado do usuário |
| o que é verdade | research engineering | evidência reproduzível |

Na prática, um produto passa pelos cinco. Eu posso pesquisar uma tecnologia, explorar a experiência por vibe, usar prompts para tarefas locais, executar a implementação com agentes e tomar decisões com telemetria de produto.

O erro é usar a condição de parada de um modo em outro. "Parece bom" não encerra engenharia de produção. "O build passou" não prova valor de produto. "O agente concordou" não é evidência de pesquisa.

A lição que aplico hoje é simples: antes de escolher o modelo ou escrever o prompt, escreva qual observação faria você parar. A resposta revela que tipo de trabalho você está realmente fazendo.

No próximo artigo, abro a implementação: [meu harness de IA para frontend, do prompt ao pull request](/pt/blog/meu-harness-de-ia-para-frontend-do-prompt-ao-pull-request).
