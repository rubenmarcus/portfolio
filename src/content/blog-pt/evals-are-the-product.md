---
title: "Evals são o produto"
description: "O que é um eval de verdade, aprendido do jeito caro: um FPS de navegador travado por 61 invariantes que precisam shipar com uma mutação que as reprova, e um benchmark de decoder quântico vencido com um escalar e um loop de cinco passos. O modelo muda a cada poucos meses. A régua sobrevive."
date: 2026-07-02
readTime: "10 min"
tags: ["ai", "evals", "agents", "testing", "llm"]
cover: "/art/blog/evals-are-the-product.png"
---

No dia 16 de abril eu mandei minha última submissão no QEC Decoder Optimization Arena, um benchmark público de correção de erros quânticos, e meu decoder estava em primeiro lugar: 2.642 erros por milhão, à frente de entries de gente que trabalha com isso. Eu entrego apps em React. O que ganhou não foi um modelo melhor, e nem uma ideia melhor. Foi uma régua melhor.

Essa régua tem nome no trabalho com IA: eval. Este post é o que eu aprendi sobre evals em dois projetos que não têm nada em comum além do método: o decoder quântico, e um FPS de navegador construído quase inteiramente por agentes de IA.

## O que é um eval, na versão simples

Se você já sabe o que é um eval, pode pular essa seção. Para o resto, a versão do jeito que eu entendi.

Um eval é uma régua que responde uma pergunta: melhorou? Com um número, não com uma opinião. "O código ficou mais limpo" é opinião. "Erros por milhão caiu de 2.688 para 2.642" é régua. "O agente parece mais esperto com esse prompt" é opinião. "O portão foi de 16/21 para 19/21" é régua.

Parece óbvio. Não é o default. O jeito default de trabalhar com IA é no vibe: você muda o prompt, olha três outputs e declara melhora. Vibes têm um modo de falha conhecido, que é você ver o que quer ver. Um eval é a coisa que você constrói para a opinião do modelo sobre si mesmo parar de importar. Inclusive a sua.

## O portão do jogo: 61 réguas, cada uma com uma prova

Meu FPS de navegador, o CS Brasil, é construído majoritariamente por agentes. O portão que decide se uma mudança shipa é o `tools/eval/invariants.mjs`: 61 invariantes, afirmações executáveis sobre o que precisa ser sempre verdade no jogo. "As mãos estão soltas no ar" virou um teto para a distância mão-grip. "Sniper sem zoom" virou: o campo de visão mirando tem que ser menor que o de quadril. Qualquer falha crítica sai com código 1, o que faz disso um gate de CI.

A regra que mantém o arquivo honesto: toda invariante precisa shipar com uma mutação que a deixe vermelha. Teste de mutação, para os não-infectados, é quebrar o código de propósito e conferir se seus testes pegam. Se nada fica vermelho, seus testes são decoração.

A regra existe por causa de um resultado humilhante. Um mutante que removia um fix inteiro passou em 20 de 22 checagens, GREEN. A invariante lia a declaração da constante, ainda linda no arquivo, em vez do uso. O fix tinha sumido, o número continuava lá, e a régua aplaudiu. Como diz o repo: uma régua que não reprova a versão anterior do próprio arquivo não é régua, é decoração.

Depois, o incidente Goodhart. Um agente subiu o portão de 16/21 para 19/21 e, no mesmo diff, zerou em silêncio o `VM_OFF`, a constante que posicionava o viewmodel inteiro da arma, destruindo o visual que a gente tinha escolhido de propósito. O agente não trapaceou. Ele otimizou honestamente a única coisa que estava medida. É a lei de Goodhart com recibo: no momento em que uma medida vira alvo, um otimizador acerta o alvo e erra o ponto. O fix foi uma invariante que codifica a intenção, não só o número.

E o terceiro estado que ninguém te avisa. Uma invariante pode estar verde, vermelha ou SKIPPED: a checagem nunca rodou porque a fonte de dados não existia. Invariantes cegas ficaram SKIPPED no meu portão por meses, verdes por ausência de dados. Um portão que pula checagens em silêncio é pior que portão nenhum, porque imprime uma confiança que não conquistou. Hoje um skip é reportado tão alto quanto uma falha.

## A arena do decoder: um escalar, cinco passos

O benchmark quântico reduzia tudo a um único escalar: erros por milhão, em 24 cenários de ruído. Menor vence. Um arquivo, 200KB no máximo, só numpy e scipy, cada decode em menos de 2,5 segundos.

Todo experimento passava pelos mesmos cinco passos. Hipótese escrita em linguagem comum. O menor test script possível. Medição numa held-out seed, nunca a training seed. Um Z-score num binomial test que precisava passar de 2,0 para shippar. E então kill ou keep, e se matasse, documentava o porquê, para a ideia nunca ser retestada uma semana depois por um agente que não estava lá.

Rodei umas 40 submissions numa semana. Mais de 25 abordagens foram implementadas e testadas. Quatro entraram. Esse ratio é a história de verdade. O trabalho do eval não era achar as quatro vencedoras. Era matar as 21 perdedoras rápido, barato e para sempre. Matar uma ideia numa tarde em vez de numa semana é para isso que a régua serve.

## Por que isso vence correr atrás de modelo melhor

O modelo muda a cada poucos meses. A régua sobrevive. Meu decoder, meu portão do jogo, minhas held-out seeds: nada disso se importa com qual modelo produziu o trabalho. Quando eu troco de modelo, os evals são a única coisa que me diz se o novo é de fato melhor no meu trabalho ou só mais novo.

Evals também são o jeito de um engenheiro solo juntar juros compostos. Todo bug que eu reporto no jogo vira uma invariante, então ele nunca volta. Todo resultado nulo na arena virou um kill documentado, então nunca é retestado. O conhecimento sai da minha cabeça e passa a morar no repo, onde a próxima sessão de agente lê de graça. Perguntam qual modelo escreveu o jogo. A parte durável da resposta é o sistema de medição, porque é a única que sobrevive ao próximo modelo.

## A receita

Se você levar uma coisa deste post, leve a ordem das operações:

1. Escolha um escalar. Um. Erros por milhão, placar do portão, latência p95. Se sua régua tem doze números, você não tem régua.
2. Escreva a régua antes do conserto. Se escrever depois, você vai escrever uma régua que passa.
3. Prove a régua com uma mutação. Quebre o código de propósito e veja ela ficar vermelha. Régua que não reprova a versão anterior do arquivo é decoração.
4. Ligue no CI. Régua que roda quando você lembra é régua que apodrece.
5. Registre custo contra delta do portão. Uma mudança que queima 300 mil tokens sem mexer no número produziu texto, não progresso.

A lição é a que eu paguei duas vezes: escreva a régua primeiro, e prove que ela consegue reprovar. Todo o resto, os modelos, os prompts, os agentes, é substituível. A régua é o produto.
