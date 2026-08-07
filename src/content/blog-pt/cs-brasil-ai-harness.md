---
title: "O harness de IA por trás do CS Brasil"
description: "A máquina que constrói o CS Brasil não é mais uma pasta de markdown. É um motor de medição: o jogo real dando boot em Node puro, 61 invariantes com testes de mutação, docs gerados que reprovam o CI quando derivam, e quatro leis aprendidas do jeito caro."
date: 2026-08-04
updated: 2026-08-07
readTime: "9 min"
tags: ["ai", "agents", "gamedev", "harness"]
cover: "/art/blog/cs-brasil-ai-harness.png"
---

Eu já escrevi a [retrospectiva do lado de build do CS Brasil](/blog/shipping-a-browser-fps): o Gauntlet loop, os críticos adversariais, os builders em paralelo. Aquele post é sobre como o jogo muda. Este é sobre como uma mudança passa a ser *acreditada*: o motor de medição embaixo do loop. O repo é público, então tudo aqui é um caminho que você pode abrir.

A versão anterior deste post descrevia uma pasta de markdown. Era verdade na época e não é mais. Desde então o harness criou uma espinha: `tools/eval/` agora tem 154 scripts, com mais 43 scripts de pipeline em `tools/`, todos alcançáveis por 41 npm scripts. Markdown ainda importa. Só não decide mais nada sozinho. Números decidem.

## O jogo dá boot sem navegador

O arquivo mais valioso do harness é `tools/eval/harness.mjs`. Ele sobe a classe `Game` real, de produção (o mesmo código que os jogadores rodam), dentro de Node puro, com o DOM e o canvas stubados. Sem navegador, sem GPU, sem renderização nenhuma. Isso só é possível porque o jogo é vanilla JS zero-build: módulos puros que você pode dar `import` em qualquer lugar, sem bundler no caminho.

Em cima disso fica o `botsim.mjs`, que joga partidas inteiras de bots de forma determinística: 60 segundos, nos cinco mapas, com seeds fixas. Mesma seed, mesma partida, toda vez. Essa propriedade transformou teste de jogo de arqueologia em ciência. O caminho antigo com Playwright custava uns dez minutos por mapa a 0,3 FPS em renderização por software, e duas capturas em paralelo derrubavam o boot e fabricavam bugs que eram, na verdade, carga. O harness em Node responde em segundos, e as respostas são reproduzíveis.

## O portão é uma lista de invariantes

O `tools/eval/invariants.mjs` declara 61 IDs de invariantes (afirmações executáveis sobre o que precisa ser sempre verdade) e sai com código 1 se qualquer crítica falhar, o que o torna um gate de CI. Hoje ele está em 39 de 52 checagens críticas passando, e os vermelhos são rastreados em aberto, não escondidos.

O cabeçalho desse arquivo é a melhor documentação que já escrevi, porque é uma lista dos meus próprios bug reports traduzidos para física. "As mãos estão soltas no ar" vira um teto para a distância mão↔grip. "A arma aponta pro chão" vira um ângulo máximo de cano. "Sniper sem zoom" vira: o campo de visão mirando tem que ser menor que o de quadril. E o arquivo carrega a regra que o mantém honesto: todo bug novo que eu reporto vira uma invariante. É assim que um bug nunca volta.

Minha favorita é a AUD1, uma invariante meta: ela checa se a régua concorda com o jogo. Existe porque o portão uma vez mediu um snapshot velho do viewmodel e reportou vermelho com toda confiança em código que estava certo: o portão estava mentindo, e agora existe uma invariante cujo único trabalho é pegar o portão mentindo.

## Toda régua shipa com um mutante

Teste de mutação, para os não-infectados: você quebra o código de propósito (esse é o mutante) e confere se seus testes pegam. Se nada fica vermelho, seus testes são decoração. O harness aplica isso às próprias réguas: toda invariante precisa shipar com uma mutação que a deixe vermelha.

A regra existe por causa de um resultado humilhante. Um mutante que removia um fix de verdade passou em 20 de 22 checagens, GREEN. A invariante lia a *declaração* da constante (ainda linda no arquivo) em vez do *uso* dela. O fix tinha sumido, o número continuava lá, e a régua aplaudiu. Como diz o repo: **uma régua que não reprova a versão anterior do próprio arquivo não é régua, é decoração.**

## As docs são geradas, e o CI confere

Todo número no README, nas instruções de agente e nas docs vive dentro de um bloco gerado, delimitado por marcadores `BEGIN:GERADO` e escrito pelo `tools/gen-docs.mjs`. O `npm run docs:check` regenera tudo e reprova o CI se qualquer coisa derivou.

Isso nasceu de um incidente real: um arquivo de skill afirmava que o `game.js` tinha 3.234 linhas enquanto o arquivo dobrava de tamanho em silêncio. Nenhuma regra vigiava aquele número, então ele continuou mentindo, educadamente, no exato documento que todo agente lê primeiro. A regra que saiu disso: **número derivável de código nunca é escrito à mão.**

## Quatro leis, pagas integralmente

O motor de medição roda em cima de quatro leis, cada uma com recibo de incidente:

1. **Goodhart é imbatível.** Um agente uma vez subiu o placar do gate de 16/21 para 19/21, e silenciosamente zerou o `VM_OFF`, a constante que posicionava o viewmodel inteiro, destruindo o visual que a gente tinha escolhido de propósito. O agente não trapaceou. Ele otimizou honestamente a única coisa que estava medida. O fix foi a VM12, uma invariante que codifica intenção, não só números.
2. **Teto sem procedência é opinião.** Passei três dias corrigindo o enquadramento das armas contra números asseridos ("a boca da arma fica a 0,66 da altura da tela") que ninguém tinha medido em pixel nenhum. A rodada só terminou quando medimos frames reais do Counter-Strike 1.6 e substituímos cada número asserido por um medido, junto com o script que o reproduz.
3. **Mutações ou decoração.** Coberto acima.
4. **Gere a figura e OLHE.** Números sem imagens enganaram este projeto quatro vezes. Uma métrica pode ficar verde enquanto o frame é lixo. Um loop que não termina com um humano olhando para uma imagem termina como post de blog cautelar. Como este.

## Antes e agora

O delta desde a última versão deste post: scripts de eval 106 → 154. Invariantes 24 → 61. O gate de invariantes não estava no CI; agora roda em todo PR. O `ARCH.md`, o índice linha a linha do `game.js` de 6.543 linhas, era escrito à mão e errado; agora é gerado pelo `tools/gen-arch.mjs` com um gate `arch:check`. O log de handoff de 84KB, append-only, foi substituído por um `STATUS.md` limitado a 100 linhas.

## O que entra de automação agora

O harness ficou grande o suficiente para precisar do próprio harness. O roadmap é um arquivo de verdade no repo, e tudo nele é trabalho de developer experience. Nada toca código de jogo:

- **Um catálogo completo de mutantes.** Hoje cada mutação roda à mão, uma por vez, o que significa que o portão pode apodrecer sem ninguém notar. O plano é o `tools/eval/mutate.mjs`: um catálogo declarativo mapeando cada invariante para o patch que deveria deixá-la vermelha. Aplica, roda, restaura, reporta. Mutante que mata a régua é o caso normal. Mutante que sobrevive é invariante cega, e esse é o achado. O critério de aceite é ele pegar os buracos que a gente já conhece.
- **Um arquivo de lições.** Todo bug de produção vira uma linha escrita em `docs/LICOES.md`, com o caso real que gerou a lição, lida no começo de toda sessão de agente. Hoje essa memória mora na minha cabeça e em comentários espalhados, e todo agente novo redescobre as mesmas armadilhas pagando preço cheio.
- **Contabilidade de custo por frente.** Tokens, chamadas de ferramenta e delta do portão registrados por frente de trabalho, num JSONL simples. Uma frente que queima 300 mil tokens sem mexer no portão fica visível como o que ela é: uma frente que produziu texto.
- **Verificação de hash das skills pinadas.** O `skills-lock.json` guarda o SHA-256 de 30 skills de terceiros, e nada verifica. Um cadeado que ninguém confere é documentação, não garantia. Um script `skills:check` resolve, e entra no gate rápido.
- **Subagents como config, não como prompt.** O crítico, os builders e o caçador de regressões hoje existem como parágrafos de prompt. Viram arquivos de configuração de verdade, com restrições de ferramenta próprias (o crítico não recebe Write), isolamento em worktree e modelos próprios, porque trabalho mecânico não precisa de modelo frontier.
- **Stop hooks.** Um hook que bloqueia o fim do turno até o `invariants.mjs` sair com código 0. O loop se verifica sozinho antes de o humano olhar.

O padrão nos seis itens: a instrumentação está virando um produto próprio, e recebe o mesmo tratamento do jogo. Réguas com mutações, docs gerados, gates no CI. A DX do time de IA recebe o mesmo rigor da DX do jogo, porque é no time de IA que os bugs nascem agora.

A lição é curta. Qualquer checagem que depende de um humano lembrar de rodar já está quebrada. Você só ainda não percebeu.

*Se você já viu uma métrica ficar verde enquanto o produto piorava, minha inbox está aberta.*
