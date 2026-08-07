---
title: "Como construi esse portfolio com AI Agents"
description: "O making-of deste site: modelos 3D gerados por IA que viviam saíam como bustos, um pipeline de shaders que me transforma em wireframe e ASCII, um gauntlet visual que avalia cada pixel, e o que aprendi sobre art-directing de máquinas."
date: 2026-07-30
updated: 2026-08-07
readTime: "9 min"
cover: "/art/blog/i-built-my-portfolio-with-a-fleet-of-ai-agents.png"
tags: ["ai", "agents", "threejs", "webgl", "making-of"]
---

Na terceira rodada do gauntlet visual que eu rodo contra este site, a média em 12 screenshots foi 29,83 de 30. A fração que faltava era um único endereço de email que se recusava a caber dentro do próprio card num viewport de 390px. Uma página de contato que não consegue exibir o contato é um tipo especial de quebrado, e nenhum check verde no CI ia pegar isso.

## O brief que eu dei a mim mesmo

Meu portfólio antigo era uma página em Next.js de 2021 com um "posts novos em breve" que mentia fazia quatro anos. Eu construo AI tooling pra viver, e meu próprio canto na internet parecia abandonado no meio da sprint. Todo recrutador, cliente e colaborador caía ali primeiro. Então me dei um brief: um portfólio que cumpre três papéis: provar que eu sei fazer ship de produto, provar que eu sei orquestrar agentes de IA e ser estranho o suficiente pra as pessoas tirarem screenshot.

Então, claro, construí com agentes. O que eu não esperava: a parte mais difícil não era o código. Era o **gosto**. Agentes fazem ship de trabalho medíocre com confiança total. Essa é a história de rejeitá-los até acertarem, com recibos: arquivos, comandos e scores.

## Ato 1: O problema do busto

O conceito do hero: um eu 3D estilizado, sentado numa mesa, programando, renderizado como linhas de contorno verdes brilhantes que se dissolvem em wireframe e ASCII conforme você rola. O modelo viria de um gerador 3D de IA (Tripo, via um pipeline MCP).

Toda geração voltava como um busto. Uma cabeça gigante flutuante. Tenho a cabeça raspada coberta de tattoos, e o gerador viu a foto de referência e decidiu que a cabeça ERA o produto. Três gerações, três cabeças, créditos queimando. A correção não foi um prompt melhor sobre meu rosto; foi remover o rosto inteiramente. Um prompt só de texto ("engenheiro sentado numa mesa digitando, personagem ocupa no máximo 60% do frame") produziu a cena completa na primeira tentativa.

**Lição 1: quando uma IA ancora na coisa errada, tire a âncora em vez de discutir com ela.**

## Ato 2: "Isso parece amador"

Primeiro hero montado: camadas sobre camadas. Um vídeo de fundo, um campo de glifos ASCII, snippets de código flutuando, a figura 3D. Tecnicamente impressionante, visualmente uma bagunça. Olhei pro screenshot e respondi pro agente: "isso é um Frankenstein, mate tudo exceto a figura."

Essa instrução (um stage limpo, um sujeito, iluminação cinematográfica) foi o que virou a chave. O agente reescreveu o hero em torno de uma única figura com shading de contorno num stage preto, com névoa pra profundidade e um brilho de contato embaixo da mesa. Design AAA é quase tudo deletar.

**Lição 2: agentes adicionam; direção de arte subtrai. Você é a camada de gosto.**

## Ato 3: O problema da digitação

Eu queria que o personagem realmente digitasse. O modelo gerado era uma mesh única fundida, sem ossos, sem rig. A resposta: gerar um personagem separado, fazer auto-rig nele (41 joints) e retargetar uma animação de stock. Não existe preset de "digitação" na biblioteca, mas tem `play_video_game`, que é mãos pra frente com dedos mexendo, perto o bastante pra ler como digitação na distância do hero.

Aí o bug real: meus shaders customizados (isolinhas de contorno, brilho de wireframe, dissolve em point-cloud) não suportavam skinned meshes. O personagem atravessava a animação em T-pose como um manequim assombrado. A correção foi reescrever o pipeline de shaders pra injetar os chunks de skinning: o personagem agora recebe seu próprio tratamento verde com suporte a skinning enquanto a mesa morfa pelo state machine completo.

**Lição 3: "isso não suporta X" é onde a engenharia de verdade começa. Agentes são ótimos no caminho feliz; os edge cases são seus.**

## Ato 4: O gauntlet

Três iterações foram pra produção "cegas" antes de eu aprender a lição: agentes reportando "pronto" em trabalho que ninguém tinha renderizado. Então construí um gauntlet. `node scripts/visual-gauntlet.mjs --cycle N` tira screenshot de toda página em 1600x1000 e 390x844 com Chrome headless, e uma rubrica escrita (`qa/VISUAL_RUBRIC.md`, 15 itens com nota de 0 a 2, máximo 30 por shot) avalia cada pixel. Toda mudança passa por capture → score → fix → re-capture, e só fica o que não regride.

O harness em si precisou de calibração antes de poder julgar qualquer coisa. Chrome headless com `--disable-gpu` cai no SwiftShader, e o SwiftShader não renderiza este site: os contextos WebGL falhavam de cara (`BindToCurrentSequence failed`), as derivadas de shader saíam destruídas (minhas bandas de contorno viravam uma malha densa) e as camadas de texto do DOM sumiam. A correção foi `--use-angle=metal`, que manda os shots pelo caminho da GPU real. Depois veio uma race mais sutil: animações CSS dirigidas pelo compositor rodam num clock diferente do `virtual-time-budget 10000`, então animações de entrada (`heroRise`, os reveals de GSAP) às vezes eram capturadas com opacity 0. `--force-prefers-reduced-motion` faz todo shot ser um frame assentado e determinístico. O vórtice de entrada, que só existe com motion ligado, é verificado em shots dedicados sem o flag.

Mesmo assim, as primeiras rodadas mentiam. A pill da dev toolbar do Astro photobombava todos os screenshots até eu desabilitá-la no `astro.config.mjs`. Um "overflow" marcado na página About era na verdade um artefato de 490px do harness, não um bug do site. Um rig de QA que grita lobo te ensina a ignorá-lo, então falsos positivos foram corrigidos com a mesma agressividade que defeitos reais.

Os números de verdade: ciclo 1 com média 29,4, ciclo 2 com 29,75, ciclo 3 com 29,83. O resto teimoso era meu próprio endereço de email. Ele cruzava a borda do card no desktop e era cortado no meio da string ("@gmai…") no mobile. Primeiro fix: `clamp(1.5rem,3vw,2.1rem)` pra `clamp(1.15rem,2.6vw,1.75rem)` mais `overflow-wrap: anywhere`. Ciclo 2: contido, mas quebrando um "m" órfão pra sua própria linha. Segundo fix: o piso pra `1rem`. Ciclo 3: uma linha, dentro do card, 30 de 30. Uma string, três ciclos.

Os únicos pontos ainda em aberto são ambientais. Rodadas repetidas do gauntlet torram o rate limit não-autenticado da API do GitHub, as requests voltam 403, e o card de telemetria do HUD degrada pra placeholders de traço, exatamente como foi desenhado. O item de console-error da rubrica pega isso todo ciclo. Degradação graceful, verificada por acidente, doze vezes por ciclo.

**Lição 4: "o build passa" não é "está parecendo certo". Automatize o olhar, e calibre a câmera antes de confiar na foto.**

## Ato 5: Lintando a prosa da IA

O gauntlet cobre pixels. As palavras precisavam de um gate também, porque agentes escrevem prosa do mesmo jeito que escrevem CSS: fluente, confiante, cheia de tells. O `scripts/text-gate.mjs` escaneia 50 arquivos (as duas coleções de blog, mais as páginas about, ai e agents em EN e PT) procurando os padrões que fazem um texto soar gerado por máquina. A lista de banidos é um array de regex chamado RULES, e eu não posso citar a maior parte dela aqui, porque citar dispara o gate (o linter não tem conceito de ironia). A versão curta: travessão e meia-risca em qualquer lugar da prosa ou do frontmatter, o tell de IA mais reconhecível que existe; as transições clichê que todo LLM alcança; verbos de hype que prometem sem dizer o que muda; anunciar a própria honestidade; ponto de exclamação em prosa técnica. Qualquer violação dá exit 1 com arquivo:linha. As mensagens de erro são em português, porque quem lê sou eu.

Este post passa no gate, e o gêmeo em inglês também. Escrever sobre trabalho gerado por IA enquanto um linter de tells de IA vigia seu rascunho é uma boa aproximação de pair programming com um colega muito literal.

**Lição 5: se um tell pode virar regex, pode virar gate. Style guide que mora em doc é ignorado; style guide que dá exit 1 é obedecido.**

## Ato 6: O site fala com agentes diretamente

Se agentes vão pesquisar sobre mim a pedido de recrutadores, o site pode muito bem falar o protocolo deles. O `src/pages/api/mcp.ts` é um endpoint de Model Context Protocol feito na mão numa Vercel function: JSON-RPC 2.0 sobre streamable HTTP, sem SDK, sem dependências. Implementa `initialize`, `ping`, `tools/list` e `tools/call`, com error codes de verdade (-32700 pra parse error, -32601 pra método desconhecido). Quatro tools: `get_resume`, `get_services`, `check_availability` e `book_intro`.

O `book_intro` é o interessante. Ele deixa o assistente de IA de alguém agendar um papo de projeto em nome da pessoa, retransmitindo o brief pro meu email via um POST no formsubmit. Todo campo tem cap no servidor (nome 120 chars, contato 160, brief 4000) porque um agente vai feliz colar uma RFC inteira num campo de formulário. Qualquer cliente MCP (Claude, ChatGPT, Cursor, Kimi) pode adicionar rubenmarcus.dev como connector e entrevistar o site diretamente.

Tem um easter egg mais quieto no `src/middleware.ts`, 17 linhas: se o seu user agent bate com curl, wget, httpie ou libcurl e você acessa uma rota de página, o middleware te reescreve pra `/api/resume.txt`. Browsers ganham o site. Terminais ganham o currículo.

**Lição 6: agentes são usuários agora. Dê uma API a eles em vez de fazê-los raspar seu DOM.**

## Ato 7: O player que morria em silêncio

O site tem um deck de áudio no canto inferior direito: um player da YouTube IFrame API com uma playlist fixa, estilizado de terminal, persistido entre transições de página com o `transition:persist` do Astro. Só que persistência tem uma armadilha. O Astro move os elementos persistidos pro documento novo na navegação, e mover um `<iframe>` no DOM o recarrega. O player morria a cada troca de página, e morria em silêncio: sem erro, sem warning no console, a UI ainda dizia "playing", mas o som tinha ido embora.

O fix mora no `src/components/AudioPlayer.svelte`: escutar o `astro:after-swap`, reconstruir o player do zero e restaurar track, posição e estado de playing, pra música retomar no meio da faixa como se nada tivesse acontecido. Esse bug nunca lançou exceção, o que significa que nenhuma suite de testes ou watcher de console teria pego. Só ouvindo mesmo.

**Lição 7: "persistido" é uma promessa que o DOM não cumpre. Assuma que tudo recarrega, e faça o rebuild ser barato.**

## Ato 8: Um padrão de hover pro site inteiro

Toda capa do site (cards de blog, cards de projeto, o retrato da página About) obedece a uma regra: em repouso é uma renderização em dither ordenado tingido de verde-terminal, e no hover o dither some pra revelar a imagem em cor cheia. A implementação é o `DitherCover.svelte`: uma matriz de threshold Bayer 8x8 aplicada num canvas, DPR limitado a 2, renderizado uma vez, sem animation loop.

Minha parte favorita é o fallback. Se um post não tem capa, ou se a imagem remota não pode ser amostrada porque CORS contamina o canvas, o componente sintetiza um padrão geométrico determinístico a partir do hash do título do post (mulberry32 sobre FNV, pros curiosos). Mesmo título, mesmo padrão, pra sempre. Sem cards quebrados, sem stock photos, sem exceções ao padrão.

**Lição 8: um detalhe esquisito, aplicado sem exceções, lê como design system.**

## Ato 9: O modelo pinta, nunca digita

Toda página e todo post ganha uma OG image 1200x630, mais banners de LinkedIn (1584x396) e X (1500x500), tudo saindo do `scripts/gen-og-images.mjs`. Os backgrounds são arte de partículas gerada por IA, com prompt duro contra tipografia ("STRICTLY no text, no letters, no logos"). Os títulos são compostos localmente com sharp sobre SVG, em Menlo, estilo terminal.

A divisão é deliberada. Modelos de difusão são ótimos em enxames de partículas verde-fósforo e confiavelmente péssimos em ortografia. Uma OG image com typo no título é pior que nenhuma OG image, então o modelo faz a textura e código determinístico faz as palavras. Os títulos saem sem typo toda vez, porque nunca foram gerados.

**Lição 9: dê ao modelo o trabalho em que ele é bom. Retome o trabalho em que ele falha quieto.**

## A correção das métricas honestas

Versões antigas do meu endpoint de currículo diziam "16.703 agents deployed". O número era real: vinha do runtime de IA do Bitte Protocol em produção (2,85 mi+ de mensagens, 24.164 usuários). Mas eram agents deployed por todos os usuários da plataforma, não por mim. Verdadeiro e enganoso ao mesmo tempo, o que é pior que falso, porque sobrevive a fact-checking.

A claim atual é 26 agents que eu construí: 13 agents de produção no Bitte, os papéis de command center por trás do ECDSA.fail e os papéis do loop de gauntlet que iteram no meu FPS de browser. Estão enumerados um a um em `src/lib/data/aiAgents.ts`, então o número é auditável. O número 16.703 ainda existe, citado com seu contexto de plataforma inteira, em `src/pages/api/mcp.ts`. Quando seu pitch é "eu orquestro agentes", precisão sobre quais agentes você orquestrou de fato é o jogo inteiro.

## O que eu realmente faço o dia todo

As pessoas perguntam o que "orquestrar agentes" significa na prática. Este site é a resposta honesta: eu escrevo o brief, defino a arquitetura e as restrições, rejeito trabalho que está abaixo do nível e sou dono dos 10% que os agentes não conseguem fazer: gosto, decisões de julgamento e os edge cases esquisitos. Os agentes escreveram a maior parte do código, geraram os modelos e rodaram seus próprios loops de QA. O nível que eles tinham que atingir era meu.

O resultado é este site: um eu verde-terminal, digitando, se dissolvendo em wireframe e ASCII conforme você rola, avaliado por um gauntlet que não deixa 0,17 pontos escaparem, lintado por um gate que não deixa um travessão escapar, e consultável por qualquer agente que fale MCP. Construído em dias, por um time de um humano e um fleet.

Se você está contratando alguém pra construir produto powered-by-IA de ponta a ponta, ou só quer discutir pipelines de shader, estou por aí.

*P.S. A rubrica do gauntlet e o text gate estão os dois no repo. Roube eles.*
