---
title: "Por dentro do Gauntlet loop"
description: "As técnicas dentro do loop adversarial de agentes que constrói o CS Brasil: uma régua visual de 25 critérios escrita para um modelo de linguagem conseguir dar nota a um PNG, prompts de crítico que banem resposta vaga pelo nome, uma tabela de conflito gerada no nível do símbolo para um arquivo de 6.543 linhas, e um caçador de regressões com permissão para não achar nada."
date: 2026-08-07
readTime: "11 min"
cover: "/art/blog/inside-the-gauntlet-loop.png"
tags: ["ai", "agents", "gamedev", "orchestration"]
---

Uma rodada do Gauntlet transformou o mapa mais claro do CS Brasil no mais escuro. Um agente de captura recebeu a tarefa de normalizar a exposição entre os cinco mapas e ancorou no frame mais escuro do conjunto. O Piscinão, mapa de praia no Rio de Janeiro, saiu mais escuro que as cenas noturnas. A correção hoje é uma linha no skill file: calibre pela média dos 8 frames, nunca pelo mais escuro.

Eu já escrevi sobre esse loop duas vezes. [O primeiro post](/blog/shipping-a-browser-fps) cobre o formato de uma rodada: seis movimentos, críticos adversariais, builders em paralelo, as três leis. [O segundo](/blog/cs-brasil-ai-harness) cobre o motor de medição embaixo: o harness em Node, as 61 invariantes, os testes de mutação. A spec do loop em si é pública em [somethingbig.ai/gauntlet-loop](https://somethingbig.ai/gauntlet-loop). Este aqui é a camada do meio, a parte sobre a qual as pessoas realmente me perguntam: as técnicas exatas. O texto da régua, os contratos de prompt, a tabela de conflito gerada, a bateria de capturas. Tudo abaixo é um arquivo que você pode abrir no repo.

## Uma régua que um modelo de linguagem consegue aplicar

O `tools/eval/BAR.md` tem 905 linhas para 25 critérios, rotulados de A1 a D4, cada um PASS/FAIL contra um único PNG. O tamanho é proposital: um critério só é critério quando um modelo consegue decidí-lo sem gosto.

Olha a anatomia de um. A1, ambient occlusion na junção parede-chão: amostre um perfil perpendicular à junção, PASS se a luminância cair de forma monotônica em ΔL* ≥ 8 nos últimos ~15 cm antes da quina, FAIL se a luminância ficar constante até a aresta. Ou A3, sem clipping estrutural: menos de 1,0% dos pixels com L* abaixo de 3, menos de 0,5% com L* acima de 97, céu e emissivos excluídos. Ou C2, cenário dessaturado: saturação HSV média do cenário entre 0,10 e 0,30, no máximo 5% dos pixels acima de S 0,55, e esses pixels saturados precisam pertencer a algo funcional ou a um landmark de orientação. Nada de vermelho decorativo competindo com um vermelho funcional.

Duas decisões estruturais fazem isso funcionar. Primeiro, o preâmbulo de exclusão: antes de qualquer medida, converta o frame para CIE L*a*b*, remova HUD, crosshair e viewmodel, e remova o céu, com o próprio céu definido numericamente (acima da linha do horizonte, luminância acima de 80, saturação abaixo de 0,25). Sem isso, cada crítico mede uma imagem diferente. Segundo, a régua se divide em dois eixos independentes: o eixo A pergunta "isso parece um FPS moderno" contra referências de CS2 e Valorant, o eixo B pergunta "isso parece o Brasil de verdade" contra o lugar real que o mapa cita. Um mapa pode passar em A e falhar em B (bonito e genérico) ou o contrário (reconhecível e feio). Fundir os dois numa nota só esconderia os dois modos de falha.

O protocolo de relatório bane veredito de gosto. O crítico reporta uma contagem, tipo 18/25 PASS, e lista cada FAIL com a medida obtida contra o alvo. O arquivo diz isso literalmente: a régua já é o veredito.

## O prompt do crítico é um contrato

Os esqueletos de prompt moram em `.claude/skills/gauntlet-fps/references/prompts.md`. Todo agente do loop, crítico ou builder, abre com o mesmo bloco de regras duras: leia BAR.md e ARCH.md antes de tudo, nunca abra Chrome ou Playwright (um agente dedicado é dono do browser), npm install bloqueado, no `game.js` use só a ferramenta Edit porque outros agentes estão editando o arquivo agora, toda mudança arriscada leva um kill-switch por querystring, e `node --check` em cada arquivo editado antes de retornar.

A entrega do crítico é especificada como resposta de API: nota de 0 a 10 com justificativa de três linhas, depois os N gaps decisivos ordenados por impacto dividido por custo, cada gap com três campos. O que se vê no frame que denuncia, citando o arquivo do screenshot. A causa provável em arquivo:linha, localizada via ARCH.md. A correção concreta com valores numéricos. Aí o prompt bane o próprio modo de falha mais provável com um par de exemplos literal. "Melhorar a iluminação" é resposta inválida. "SSAO half-res de 8 amostras no composite do bloom.js, raio 0,6m, e chão 8 pontos de L* mais escuro que as paredes" é resposta válida.

Duas decisões menores importam tanto quanto. Os críticos podem escrever scripts em Python (PIL está instalado) para medir L*, saturação, contraste e porcentagem de blocos chapados, porque medir é barato e transforma a crítica em algo que a próxima rodada consegue conferir. E o builder recebe o texto do crítico truncado em 7k a 11k caracteres: o suficiente para a direção, sem afogar o contexto. Design de prompt é design de API, até no limite de tamanho do payload.

## A tabela de conflito é resolvida, não escrita

O `game.js` tem 6.543 linhas e todas as frentes precisam dele, então os builders em paralelo o particionam através do `tools/eval/ARCH.md`, que é gerado pelo `tools/gen-arch.mjs` e protegido no CI pelo `npm run arch:check`.

O cabeçalho de comentários do gerador explica a única ideia que faz isso funcionar. O ARCH.md escrito à mão declarava frente para linha, misturando duas coisas com prazos de validade muito diferentes. Frente para símbolo é conhecimento humano e estável: a frente de armas é dona de `_buildViewModels`, `_switchWeapon`, `_fireHitscan` e mais quinze irmãos. Símbolo para linha é volátil: muda a cada commit, então o script resolve isso de novo a cada execução com três regexes. Método de classe é exatamente dois espaços de indentação com a chave na mesma linha. Métodos-arrow atribuídos em runtime (`this._vmFrame = (force) => {`) precisaram de um padrão próprio: a versão 1 do script não os via, e o `_vmFrame`, com umas 100 linhas, ficava invisível no índice. Const, let, function e class de topo completam o índice.

A saída não é só uma tabela. Ela funde faixas contíguas (gap de 12 linhas ou menos) para a tabela continuar legível. Marca as zonas vermelhas, `update()`, `_dom()`, `constructor()`, como append-only, porque qualquer frente pode legitimamente precisar delas e editar o miolo é o jeito mais rápido de dois agentes se atropelarem. Monta um mapa de linha para frentes e emite uma seção "frentes que reivindicam as MESMAS linhas" quando a posse se sobrepõe, porque uma tabela de conflito que se contradiz é pior que nenhuma. Imprime a cobertura: quantas das 6.543 linhas têm dono declarado, com o resto rotulado de território neutro. E ainda valida a prosa escrita à mão fora do bloco gerado, sinalizando qualquer ponteiro arquivo:linha que aponte para além do fim do arquivo real. Símbolos declarados no mapa de frentes que sumiram do código geram um aviso alto, porque um rename que ninguém propagou é exatamente como partições apodrecem em silêncio.

O resultado medido, já citado no primeiro post: três agentes editando faixas disjuntas do mesmo arquivo ao mesmo tempo, zero conflito de conteúdo. O que eu não disse lá é por que isso continua funcionando: a partição é re-derivada do código antes de cada rodada, então ela não consegue derivar. Uma tabela gerada é um contrato que se renova sozinho.

## O caçador de regressões tem permissão para não achar nada

O caçador de regressões é o agente mais valioso do loop, e o prompt dele é o mais estranho. Ele recebe dois diretórios de screenshots e um diff (`git diff --stat`, depois `git diff -- public/js public/style.css src | head -3000`), um checklist do que "piorou" significa, e uma instrução explícita: se não houver regressão, diga isso, não invente. Um agente ao qual se pede para achar problemas vai achar problemas. Permitir um relatório vazio é o que torna um relatório cheio acreditável.

O checklist é específico: cena escura demais ou estourada, z-fighting, textura faltando, geometria sumida, arma invisível ou fora do quadro, HUD quebrado, mira sem contraste, e qualquer mudança que multiplique draw calls ou adicione um passe caro sem gate de qualidade ou kill-switch. Parece um bug tracker porque é um, comprimido num prompt.

O melhor truque do loop inteiro mora aqui também. Isolar o viewmodel da arma num screenshot normalmente exige uma máscara manual. O caçador faz isso com zero anotação: pegue os pixels invariantes entre os 4 ângulos de yaw do mesmo mapa e aspecto. O cenário gira, a arma não. Dessa máscara saem a borda esquerda, a borda direita e a área de tela do viewmodel com precisão de subpixel, e é assim que uma afirmação tipo "a arma andou 3% para a esquerda" vira algo mensurável em vez de discutível.

Os vereditos do caçador entram primeiro na rodada seguinte. Regressão não pode dormir.

## Captura é lenta, stateful e fácil de falsificar

O `tools/eval/gl-shots.mjs` é a bateria: 5 mapas vezes 2 aspectos vezes 4 ângulos, mais as telas de menu navegadas via DOM. Os aspectos são 1600x900 e 1500x1000, e o segundo existe porque eu jogo em 3:2. Validar framing de arma só em 16:9 já custou uma rodada inteira.

Cada captura espera por `window.__game.state === 'live'` com timeout de 900 segundos, depois espera 30 segundos de jogo antes de ler as métricas: `renderer.info` (calls, triangles, textures, programs, geometries) e `usedJSHeapSize`. Com SwiftShader (renderização por software) o jogo roda a uns 0,3 FPS, então um mapa e aspecto leva de 4 a 6 minutos e a bateria completa leva de 40 a 60. O prompt de captura diz ao agente duas coisas que parecem piada e não são: não desista antes de 3600 segundos, e lentidão não é bug.

O estado é onde os bugs falsos se reproduzem. Chrome zumbi de runs falhas come 200% de CPU, então o prompt começa com `pkill -f chrome`. Duas sessões headless pesadas em paralelo derrubam o boot e fabricam um countdown travado que é só carga, e é por isso que exatamente um agente no loop inteiro tem permissão de rodar browser. E heap acima de ~350MB é alarme: o projeto já teve seu crash de OOM (o "Aw Snap" de dar preload em todas as viewmodels de uma vez, hoje é lazy-load), e contagem de texturas subindo rápido é o precursor. A tabela de métricas existe para que "o jogo ficou mais pesado nessa rodada" tenha um número anexado antes de alguém começar a discutir.

## Prompts também são dependências

O loop carrega 32 skills: 2 escritas por mim, 30 de terceiros pinadas no `skills-lock.json`. O formato do arquivo é um package-lock para prompts: cada entrada carrega o repo de origem, o caminho do SKILL.md dentro dele e um `computedHash` SHA-256 do conteúdo.

O modelo de ameaça é o mesmo do npm. Uma skill é um conjunto de instruções executadas por um agente com ferramentas, e uma edição upstream muda em silêncio o comportamento de todos os agentes do loop. Uma frase reescrita numa skill de crítico e os seus relatórios de gap mudam de formato sem um único commit no seu repo. Pinar o hash é como um prompt vira uma dependência revisada em vez de um fio desencapado ligado na main branch de outra pessoa.

## As armadilhas caras, para você pular

O skill file termina com uma tabela de armadilhas que custaram tempo de verdade. Quatro valem roubar direto:

- **Calibre pela média, nunca pelo extremo.** O incidente do Piscinão, da abertura. Uma rodada calibrou exposição pelo frame mais escuro e inverteu a ordem de brilho dos mapas.
- **Bumpe o `?v=` quando mexer num `.js`.** O import map do `index.astro` serve o módulo do cache caso contrário. Essa custou dias de correções que "nunca chegavam" porque o browser rodava o código de ontem.
- **`//` não é comentário em CSS.** O parser engole o bloco seguinte. Matou um `@keyframes` inteiro antes de alguém pensar em olhar a stylesheet.
- **Função acima de identidade, com número.** Um builder girou o modelo da arma para "expor a identidade" dela na tela e produziu o bug clássico em que a mira aponta para um lugar e a arma para outro. A decisão, validada por mim jogando: funcional ganha de identidade, yaw de no máximo 0,09 radianos.

## A lição

Todo prompt desse loop contém o próprio modo de falha mais provável, rejeitado por escrito e antecipadamente. A régua nomeia o veredito que ela recusa. O caçador é avisado de que "sem regressão" é um relatório completo. O agente de captura é avisado de que 0,3 FPS é normal. Os builders são avisados de qual ferramenta de edição é proibida e quais regiões do arquivo são zonas vermelhas.

Essa é a técnica que vale copiar, e custa nada: quando você escrever um prompt para um agente, adicione a resposta errada e a proíba. Não num style guide que o agente nunca lê, mas inline, do lado da entrega, com um exemplo literal. Agentes não leem a sua mente. Eles leem o seu prompt. Torne a resposta errada ilegal no texto que eles realmente veem.

*Se os seus agentes corrigem a própria lição de casa e você desconfia das notas, minha caixa de entrada está aberta.*
