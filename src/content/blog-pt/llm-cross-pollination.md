---
title: "Polinização cruzada de LLMs: revisão por pares para máquinas"
description: "Construí um pipeline de pesquisa em que modelos de fronteira de provedores diferentes geram, revisam adversarialmente e fazem merge do trabalho uns dos outros. A única coisa compartilhada entre eles é o texto da fase anterior. Revisão por pares compila em coreografia de prompts surpreendentemente bem."
date: 2026-07-11
readTime: "9 min"
tags: ["ai", "llm", "agents", "research", "openrouter"]
cover: "/art/blog/llm-cross-pollination.png"
---

Eu rodo um pipeline de pesquisa em que vários modelos de fronteira, de provedores *diferentes*, roteados pelo OpenRouter, geram, criticam e fazem merge do trabalho uns dos outros iterativamente. Ninguém compartilha vector store. Ninguém compartilha memória. A única coisa que atravessa a fronteira entre os modelos é o texto da fase anterior, colado no próximo prompt.

Essa restrição parece uma limitação. É o design. O que eu construí sem querer foi revisão por pares, compilada em coreografia de prompts. Este post é sobre como funciona e por que as escolhas específicas importam.

## Por que um modelo só não bastava

Pesquisa com um único modelo tem um modo de falha de que ninguém gosta de falar: o modelo corrige a própria prova. Peça para pesquisar um tema e depois "conferir o trabalho", e ele confere do jeito que você confere o próprio e-mail atrás de erros de digitação: ele vê o que pretendia ter escrito. Pior, o modelo de cada provedor carrega os mesmos pontos cegos em toda execução, porque os pontos cegos estão gravados nos pesos. Pergunte duas vezes ao mesmo modelo e você recebe a mesma omissão confiante duas vezes, o que parece corroboração e não é.

A correção é a que a ciência já descobriu: trabalhadores independentes, revisão adversarial e uma etapa de síntese que ninguém envolvido na escrita controla. Eu só precisei implementar isso com chamadas de API.

## Fase -1: o prompt passa por revisão por pares primeiro

Antes de qualquer pesquisa, o pipeline otimiza o próprio prompt de pesquisa. O modelo A rascunha uma versão melhorada do prompt. O modelo B critica esse rascunho e faz merge da crítica de volta. O modelo C congela a versão final.

Essa fase existe porque eu vivia notando que a qualidade do output acompanhava a qualidade do prompt mais do que a qualidade do modelo, e o prompt era o único artefato do sistema que recebia zero escrutínio. Três modelos discutindo sobre o prompt custa alguns centavos e, anedoticamente, pega critérios de sucesso vagos que envenenariam todas as fases seguintes. Lixo entra, evangelho sai.

## Fase 0: pesquisa independente, diversidade de provedores como decorrelação

Três a quatro modelos, cada um de um provedor diferente, pesquisam o prompt congelado independentemente. Cada um roda com seu próprio timeout e contabilidade de custo por token, então um modelo lento ou verboso degrada com elegância em vez de bloquear o pipeline ou comer o orçamento.

A diversidade de provedores não é proteção contra uma API cair. É decorrelação. Modelos do mesmo provedor compartilham dados de treino, receitas de alinhamento e tiques estilísticos, então os erros deles são correlacionados e a concordância entre eles significa pouco. Modelos de provedores diferentes erram em direções diferentes, o que torna a *concordância* informativa e a *discordância* diagnóstica. É a mesma razão pela qual você não roda um ensaio clínico com quatro cópias do mesmo pesquisador.

## Fase 1: revisão adversarial recíproca

Esta é a fase que justifica o título do post. Os modelos são emparelhados, e cada um revisa a pesquisa do parceiro com instruções de ser adversarial, literalmente "ranqueie cada seção de 1 a 10" e justifique a nota. Depois, cada modelo faz merge de três documentos: a própria pesquisa original, a própria crítica ao parceiro e a crítica do parceiro a ele.

A etapa de merge é onde a auto-revisão é estruturalmente excluída. Um modelo não pode simplesmente dispensar a crítica com um aceno, porque a crítica já está escrita e o prompt de merge exige que ele responda a cada ponto. Ele pode rebater, mas tem que rebater em registro.

Aí um juiz, de um *terceiro* provedor, ao qual nenhum dos dois autores pertence, pontua o resultado do merge como JSON estruturado em completude, acurácia, equilíbrio e acionabilidade. O juiz não tem cavalo na corrida. Não escreveu uma palavra da pesquisa, então não tem nada a defender. Isso acaba importando tanto para máquinas quanto para comitês de titulação.

## Fase 2: o super-merge, com embaralhamento de ordem

Até três modelos novos fazem merge, cada um independentemente, de todos os documentos da fase 1 numa única síntese. Aqui está o detalhe de que mais me orgulho, porque é barato e estranho: cada modelo de merge recebe os documentos numa *ordem diferente*.

Language models têm viés de primazia. O documento que leem primeiro ancora o merge. Se todo merger vê os documentos na mesma ordem, o "consenso" dos mergers é em parte um artefato do documento um. Embaralhe a ordem e o que sobrevive nos três merges tem muito mais chance de ser sinal do que sequência.

Além disso, um cálculo de consenso explícito vai escrito nos prompts:

- **Concordância 4/4** entre os documentos-fonte = alta confiança.
- **3/4** = posição majoritária, registrada como tal.
- **Cobertura única** (um ponto que só um documento levanta) é sinalizada como valiosa, não suspeita.

Essa última regra é a cláusula anti-groupthink. A versão ingênua de síntese multi-modelo trata dissenso como ruído e o apaga na média. Mas um ponto que só um modelo levantou é frequentemente a coisa mais interessante da pilha: ou uma alucinação para matar, ou um achado genuíno que os outros perderam. O trabalho do pipeline é trazê-lo à superfície para julgamento, não lavá-lo até virar a mediana.

## Fase 3: o árbitro, e a bandeira honesta

Um árbitro final pega os três super-merges e produz o entregável por síntese de voto majoritário. Seções em que os mergers discordam fundamentalmente (não em estilo, mas em substância) não são resolvidas pelo árbitro passando um pano. Elas são sinalizadas como **NEEDS HUMAN REVIEW** no output.

Esta é minha feature favorita e custou uma linha de prompt. Um sistema que sempre produz uma resposta com tom confiante é um passivo. Um sistema que diz "as máquinas empataram aqui, uma pessoa deveria olhar este parágrafo específico" é uma ferramenta.

## Por que funciona

O conjunto inteiro é epistemologia estruturada com uma conta de API:

- **Diversidade de provedores** decorrelaciona os erros, então a concordância carrega informação.
- **Revisão recíproca** substitui a auto-revisão, porque nenhum modelo corrige a própria prova.
- **Embaralhamento de ordem** combate o viés de primazia na etapa de merge.
- **Regras explícitas de consenso** impedem que o dissenso seja silenciosamente apagado na média.
- **Uma bandeira de revisão humana** mantém o pipeline honesto na fronteira da própria competência.

Nada disso exigiu fine-tuning, infraestrutura de RAG ou memória compartilhada. É texto entrando, texto saindo, com a coreografia fazendo o trabalho. A revisão por pares levou alguns séculos para a academia formalizar. Eu levei um fim de semana para compilá-la em prompts. As máquinas parecem achar o processo justo, ou pelo menos nenhuma reclamou de um jeito que tenha sobrevivido ao merge.
