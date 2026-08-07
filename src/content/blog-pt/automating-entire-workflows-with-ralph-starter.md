---
title: "Automatizando fluxos de trabalho inteiros com o ralph-starter"
description: "O ralph-starter roda loops no estilo Ralph Wiggum — busca uma spec, executa o agente de IA, checa testes/lint/build, devolve os erros, repete. Como funciona e por que eu construí."
date: 2026-02-19
readTime: "9 min"
tags: ["ai", "automation", "ralph-wiggum", "open-source"]
cover: "/art/blog/automating-entire-workflows-with-ralph-starter.png"
---

## O que é o ralph-starter

O [ralph-starter](https://github.com/rubenmarcus/ralph-starter) é uma CLI que roda agentes de codificação com IA em loops autônomos. Você dá uma tarefa a ele (ou uma issue do GitHub, um ticket do Linear, uma página do Notion), ele executa o agente e em seguida checa testes, lint e build. Se algo falhar, ele devolve o erro e faz o loop de novo. Quando tudo passa, ele faz commit, push e abre um PR.

Ele funciona com os agentes que você já tem instalados: Claude Code, Cursor, Codex CLI, OpenCode, OpenClaw e Amp, além de dois agentes baseados em SDK (Anthropic SDK e OpenCode SDK). Ele detecta automaticamente o que está na sua máquina com probes de `--version` e usa o primeiro que responder.

É open source, licenciado sob MIT. Eu construí porque estava cansado de ser o intermediário entre o meu terminal e a minha janela de chat com a IA.

## Por que eu construí

Eu usava assistentes de codificação com IA todos os dias e o fluxo de trabalho era sempre o mesmo: ler um ticket, codar, travar, colar contexto no chat, adaptar a sugestão, colar de volta, rodar os testes, colar o erro, receber um fix, colar de volta. O lint reclama. Mais uma viagem de ida e volta. Aí commit, push, abrir um PR.

São umas 12 etapas, de 5 a 8 vezes por dia. A IA estava fazendo a parte difícil (escrever o código) e eu era o relay movendo texto entre janelas. Uma área de transferência humana.

Então eu escrevi um script que faz esse relay. Ele pega uma spec, envia para o agente, roda minha suíte de testes e manda a saída de erro de volta quando algo falha. Esse script virou o ralph-starter.

## Onde é mais útil

O ralph-starter funciona melhor quando você tem:

1. **Uma spec clara.** "Adicionar um endpoint `/health` que retorna 200 com o body JSON `{ status: 'ok' }`" termina em 1 loop. "Melhorar o app" ainda vai rodar, o agente vai analisar o seu codebase e escolher algo para melhorar, mas pode levar 4 loops e o resultado pode não ser o que você queria.
2. **Testes.** O loop precisa de algo para validar. Se você não tem testes, o agente não sabe quando terminou.
3. **Trabalho de implementação rotineiro.** Endpoints, correção de bugs, atualização de componentes, mudanças de configuração. Aquele tipo de coisa que enche um backlog de sprint.

Specs vagas não quebram o ralph-starter, elas só custam mais. "Refatorar o sistema de auth" faz o agente tentar uma abordagem diferente a cada loop até o circuito breaker disparar. "Adicionar middleware JWT em `src/middleware/auth.ts` usando bcrypt, cookies httpOnly, com testes para login com sucesso e com falha" termina em 2 loops porque o agente sabe exatamente como é o "pronto". Eu faço o raciocínio e a escrita da spec. O ralph-starter cuida da tradução de spec para código.

## Como começar

Você pode começar a partir de uma ideia e o ralph-starter gera a spec para você, ou apontá-lo para uma issue existente do GitHub ou um ticket do Linear e ele busca a spec automaticamente:

<img src="https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fead0j2uzung6rfeybl55.png" alt="Getting Started" />

```bash
# Install and initialize
npx ralph-starter init
```

O `ralph-starter init` configura os arquivos do Ralph Playbook: `AGENTS.md` (instruções do agente e comandos de validação), `PROMPT_plan.md`, `PROMPT_build.md`, `IMPLEMENTATION_PLAN.md` e uma pasta `specs/`. Se esses arquivos já existirem, o wizard os detecta e oferece continuar o loop de build em vez disso:

<img src="https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F8k3mcx3537el9afyendf.png" alt="ralph-starter terminal" />

Rode sua primeira tarefa com uma spec inline:

```bash
ralph-starter run "add a /ping endpoint that returns pong" --commit
```

Ou aponte para uma issue do GitHub ou um conjunto filtrado de tickets do Linear. Note que `--issue` é exclusivo do GitHub; para o Linear você filtra por projeto e label:

```bash
# From GitHub
ralph-starter run --from github --project rubenmarcus/ralph-starter --issue 2

# From Linear
ralph-starter run --from linear --project "Mobile App" --label "sprint-1" --commit --pr
```

<img src="https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fx4a0e5xnan1d1b17ky3n.png" alt="ralph-starter terminal" />

Para conectar GitHub, Linear, Notion ou Figma como fontes de spec, use os comandos de configuração. As credenciais ficam em `~/.ralph-starter/sources.json`; as variáveis de ambiente (`GITHUB_TOKEN`, `LINEAR_API_KEY`, `NOTION_API_KEY`, `FIGMA_TOKEN`) têm precedência:

```bash
ralph-starter config set github.token ghp_xxx
ralph-starter config set linear.apiKey lin_api_xxx
ralph-starter config set notion.token secret_xxx
```

`ralph-starter setup` configura as preferências de agente, e `ralph-starter integrations test github` verifica a conectividade antes de você torrar tokens em uma execução.

## Como o loop funciona

O executor do loop (`runLoop` em `src/loop/executor.ts`) segue esta sequência:

```
1. Fetch spec (GitHub issue, Linear ticket, Notion page, inline text, file, URL)
2. Create branch (auto/github-145)
3. Run agent with the spec as prompt
4. Run validations: test → lint → build
5. If any validation fails → feed error output back to agent → go to step 3
6. If all pass → commit, push, open PR
```

Não há arquivo de configuração para os comandos de validação. O ralph-starter os detecta. Ele faz parse do seu `AGENTS.md` procurando comandos entre crases após os itens de test/lint/build, e faz fallback para os scripts do `package.json`:

```md
<!-- AGENTS.md -->
- **Test**: `pnpm test`
- **Lint**: `pnpm lint`
- **Build**: `pnpm build`
```

Quando uma validação falha, o stderr/stdout bruto vira `lastValidationFeedback` e é injetado no prompt da próxima iteração pelo construtor de contexto, junto com o resumo da spec, a tarefa atual do plano e os últimos registros do log de iteração. O agente vê `TypeError: Cannot read property 'id' of undefined at src/routes/user.ts:42` e sabe exatamente o que corrigir. Ele não recebe um resumo da falha. Ele recebe a falha.

Um detalhe que a maioria das pessoas perde: no modo auto em lote, o loop pula comandos de teste e roda só build e lint. Isso é deliberado, para que um teste preexistente que esteja falhando não prenda toda tarefa num loop de correção por um bug que ela não introduziu.

O loop tem sete motivos de saída: `completed`, `file_signal` (um marcador `RALPH_COMPLETE` ou `.ralph-done`, ou todas as caixas marcadas em `IMPLEMENTATION_PLAN.md`), `circuit_breaker`, `rate_limit`, `cost_ceiling`, `blocked` e `max_iterations`. Você sempre sabe por que uma execução terminou.

## Exemplo real: construindo uma landing page a partir de uma issue do GitHub

Aqui está uma execução real. Apontei o ralph-starter para uma issue do GitHub pedindo uma landing page para uma pet shop em Londres. A spec tinha 8 tarefas (header, hero, serviços, galeria, depoimentos, formulário de contato, footer, polishing).

<img src="https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fq3dicjcio7ym0qfrvh78.png" alt="ralph-starter terminal" />

O ralph-starter detectou 28 skills instaladas (frontend-design, tailwind, responsive-web-design, etc.) e injetou as relevantes no prompt, limitadas a 5 ativas por iteração para que o prompt não se afogasse em instruções:

<img src="https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fbwp2f2guebyrsywzazc0.png" alt="ralph-starter terminal" />

O loop rodou por 2 iterações. A primeira completou 5 de 8 tarefas, a segunda pegou o restante (Depoimentos, Formulário de Contato, Footer, Polishing). A detecção de stall fica de olho em iterações sem mudanças de arquivos, sem progresso de tarefas e sem atividade de validação, e para depois de 3 dessas seguidas (4 para planos com mais de 5 tarefas).

Resultado final:

```
Cost Summary:
  Tokens: 47.0K (764 in / 46.2K out)
  Cost: $0.606 ($0.348/iteration avg)

Loop completed!
  Exit reason: completed
  Iterations: 2
  Total duration: 8m 19s
  Total cost: $0.696 (47.0K tokens)
```

8 minutos. 69 centavos. Uma landing page completa com componentes React, estilização em Tailwind e layout responsivo. Eu não cheguei a abrir o editor.

## Custos de token e como mantê-los baixos

Aqui estão meus números reais. Rastreei meu janeiro inteiro. 187 tarefas concluídas. $22,41 no total. Média de **$0,12 por tarefa**.

O motivo de ser barato é o prompt caching. Com o Claude Code, o primeiro loop envia o contexto completo a $3,00 por milhão de tokens de entrada. Os loops 2, 3, 4 reutilizam os tokens em cache a $0,30 por milhão. Isso é 90% a menos.

Antes de cada execução, o ralph-starter mostra uma estimativa para você saber o que esperar:

<img src="https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fij14c51g2co4dp4g13c4.png" alt="ralph-starter terminal" />

Depois de cada execução ele mostra o breakdown real: tokens de entrada, tokens de saída, custo por iteração. Para um limite duro, `--max-cost 2` mata o loop em $2 e `--rate-limit 50` limita as chamadas de API por hora. A maioria das tarefas termina em 2 a 3 loops, e depois do primeiro a maior parte da entrada está em cache. Breakdown detalhado com números exatos [aqui](https://ralphstarter.ai/blog/prompt-caching-saved-me-47-dollars).

O que mantém os custos baixos: specs boas (menos loops), prompt caching (90% de desconto nos tokens de entrada depois do loop 1), o circuit breaker (nenhum dinheiro torrado em tarefas insolúveis) e skills (o agente acerta em menos iterações).

## Modo batch: 10 issues, 8 PRs

Durante o sprint grooming eu etiqueto os tickets bem definidos como "auto-ready". Aí eu rodo um único comando e vou almoçar:

<img src="https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fjtrqvmw3aeklyovjvrzy.png" alt="ralph-starter terminal" />

O ralph-starter pega todas as issues correspondentes e inicia o loop em cada uma:

```bash
# From GitHub
ralph-starter auto --source github --project multivmlabs/ralph-starter --label "auto-ready" --limit 10

# From Linear
ralph-starter auto --source linear --project ENG --label "auto-ready" --limit 10

# Preview without executing, or run tasks in parallel worktrees
ralph-starter auto --source github --project multivmlabs/ralph-starter --dry-run
ralph-starter auto --source github --project multivmlabs/ralph-starter --parallel --concurrency 3
```

Cada issue recebe sua própria branch, seu próprio loop, seu próprio PR. As branches seguem uma convenção única, `auto/<source>-<id>`:

```
[1/10] Issue #145: Add health check endpoint
  > Branch: auto/github-145
  > 2 loops > Validation: passed
  > PR #151 created

[2/10] Issue #147: Add rate limit headers
  > Branch: auto/github-147
  > 1 loop > Validation: passed
  > PR #152 created

[3/10] Issue #150: Improve performance
  > 3 loops > Circuit breaker tripped. Skipping.

...

Completed: 8/10 | Failed: 2/10
Total cost: $1.84
```

8 de 10. As 2 falhas foram tickets vagos. "Improve performance" não tinha métricas nem metas, então o agente tentava otimizações diferentes a cada loop sem nada para validar contra, e o circuit breaker disparou após 3 loops. A outra era um ticket de refatoração que referenciava uma discussão de reunião de time que o agente nunca viu.

O circuit breaker dispara após 3 falhas consecutivas ou 5 repetições do mesmo erro. "Mesmo erro" não é uma comparação de string: a mensagem é normalizada (números de linha, timestamps, endereços hex, stack frames removidos) e hasheada, então `foo.ts:12:4` e `foo.ts:87:21` contam como uma única falha. Após um disparo há um cooldown de 30 segundos com uma retry permitida, e então o loop para. Ajuste ambos com `--circuit-breaker-failures` e `--circuit-breaker-errors`.

## Modo swarm: mesma tarefa, três agentes

Um loop é uma aposta. O modo swarm faz várias:

```bash
ralph-starter run "rewrite the date parser" --swarm --strategy race
ralph-starter run "rewrite the date parser" --swarm --strategy consensus
ralph-starter run "migrate to ESM" --swarm --strategy pipeline
```

Cada agente roda o loop completo em seu próprio git worktree sob `.ralph/worktrees/`, então ninguém sobrescreve ninguém. Em `race`, o primeiro loop bem-sucedido vence. Em `consensus`, todos os agentes terminam e o vencedor é a execução bem-sucedida com menos iterações. Em `pipeline`, os agentes rodam sequencialmente em um worktree compartilhado, o trabalho vai sendo commitado entre estágios, e o último agente revisa e faz o polishing. A branch vencedora vira um PR com uma tabela de custo e iterações por agente no corpo. Escrevi um post completo sobre os internals de [como o swarm funciona](/blog/dag-agent-orchestration).

## Escolhendo um agente

Você pode ser explícito sobre qual agente usar:

```bash
ralph-starter run "your task" --agent claude-code
ralph-starter run "your task" --agent codex
ralph-starter run "your task" --agent cursor
```

Eu uso o Claude Code diariamente porque o prompt caching deixa os loops mais baratos e a saída stream-json permite ao ralph-starter acompanhar o progresso em tempo real. Mas o executor do loop e o pipeline de validação são idênticos para todos os agentes. Rodei a mesma tarefa de auth JWT em [4 agentes diferentes](https://ralphstarter.ai/blog/five-ai-coding-agents) e todos chegaram lá, só que com contagens de loop e custos diferentes.

## Por que eu continuo construindo

Fiz uma [comparação lado a lado](https://ralphstarter.ai/blog/ralph-starter-vs-manual) de 12 tarefas da mesma sprint. 6 manuais, 6 com o ralph-starter. As tarefas com ralph-starter tiveram em média 12 minutos da minha atenção contra 45 minutos codando manualmente. A qualidade do código foi comparável.

Agora eu gasto meu tempo em três coisas: escrever specs claras (a entrada), revisar PRs (a saída) e decisões de arquitetura (a parte que a IA não consegue fazer). O ralph-starter cuida de tudo que está entre elas. Todo PR que ele produz passa em testes, lint e build. Quando eu codo manualmente, às vezes eu pulo testes para mudanças pequenas. O loop não deixa o agente pular nada, e sinceramente essa disciplina é melhor que a minha.

## Sobre o nome

O nome vem da [técnica Ralph Wiggum](https://ghuntley.com/ralph/). Você dá uma tarefa à IA e a deixa seguir até terminar. Sem microgerenciamento. [Explicação completa aqui](https://ralphstarter.ai/blog/ralph-wiggum-technique).

## Links

O ralph-starter é open source, licenciado sob MIT.

- [GitHub](https://github.com/rubenmarcus/ralph-starter)
- [Docs](https://ralphstarter.ai)
- [npm](https://www.npmjs.com/package/ralph-starter)

Posts relacionados:

- [The Ralph Wiggum technique](https://ralphstarter.ai/blog/ralph-wiggum-technique)
- [Specs are the new code](https://ralphstarter.ai/blog/specs-are-the-new-code)
- [I tried 5 AI coding agents on the same task](https://ralphstarter.ai/blog/five-ai-coding-agents)
- [Prompt caching saved me $47](https://ralphstarter.ai/blog/prompt-caching-saved-me-47-dollars)
- [ralph-starter vs doing it manually](https://ralphstarter.ai/blog/ralph-starter-vs-manual)
- [Figma to code in one command](https://ralphstarter.ai/blog/figma-to-code-one-command)
- [ralph-starter with Linear](https://ralphstarter.ai/blog/ralph-starter-with-linear)

Se você testar, abra uma issue ou deixe uma star. Todo feedback é bem-vindo.
