---
title: "Roteando 9 papéis de agente entre 7 providers: o harness do ECDSA.fail"
description: "Liderei engenharia de IA no harness de pesquisa multi-agente que ficou em #1 no ECDSA.fail. A camada de roteamento é a parte que vale roubar: tabelas de papel para modelo, adapters fail-closed, e um spend gate que aborta a execução antes da conta."
date: 2026-07-15
readTime: "9 min"
cover: "/art/blog/openrouter-routing.png"
tags: ["ai", "llm", "openrouter", "tooling"]
---

## O projeto

ECDSA.fail é um desafio público de otimização: construa o circuito quântico reversível mais barato para uma adição de ponto secp256k1, pontuado por contagem de Toffoli vezes qubits de pico, com um portão estatístico de corretude que você não consegue ludibriar. Liderei a engenharia de IA no harness de pesquisa multi-agente que alcançou o primeiro lugar. [Escrevi sobre o design da avaliação separadamente](/blog/the-agent-swarm-that-took-1-on-ecdsa-fail). Este post é sobre uma camada diferente: como 9 papéis especializados de LLM foram roteados entre 7+ providers sem que a frota falisse ou degradasse silenciosamente.

O OpenRouter era o substrato. Uma API key, um formato de request, algumas centenas de modelos. Essa parte leva uma tarde. O sujeito deste post é a política por cima, porque é aí que produção realmente vive.

Um esboço rápido da frota para que o roteamento faça sentido. Nove papéis, cada um com um contrato escrito (`agents/*.md`): ações permitidas, ações proibidas e um formato de saída obrigatório (`DECISION / WHY / EVIDENCE`). Circuit-engineer propõe otimizações. Research-scout caça papers e trabalhos anteriores. Density-analyst perfila contagens de portas. O único trabalho do falsifier é matar candidatos. O orchestrator-reviewer audita todo mundo. Todo worker devolve um envelope JSON validado por schema, e envelopes malformados são rejeitados, não parseados de forma frouxa. Especialização de papel importou mais do que escolha de modelo o tempo todo. Um modelo que é um engenheiro brilhante é frequentemente um falsifier terrível. Otimismo é uma feature num papel e um bug no outro.

## Papéis são donos de modelos, não o contrário

A primeira versão do router escolhia um modelo por chamada com base numa vaga noção de "tarefa difícil, modelo forte". Isso não sobrevive ao contato com uma carga real. O que funcionou foi atribuir modelos a papéis, numa tabela, no versionamento:

```ts
type Role =
  | "research-scout" | "circuit-engineer" | "density-analyst"
  | "falsifier" | "orchestrator-reviewer";

const ROUTES: Record<Role, string[]> = {
  // Queima mais tokens na frota. Barato e rápido vence aqui.
  "research-scout":       ["google/gemini-2.5-flash", "deepseek/deepseek-chat-v3.1"],
  // Propõe otimizações de circuito. Modelo forte, volume moderado.
  "circuit-engineer":     ["anthropic/claude-sonnet-4.5", "openai/gpt-5.1"],
  // Perfilagem de contagem de portas. Trabalho mecânico, mid-tier basta.
  "density-analyst":      ["deepseek/deepseek-chat-v3.1", "google/gemini-2.5-flash"],
  // Mata candidatos. Vendor diferente do engineer, de propósito.
  "falsifier":            ["openai/o4-mini", "deepseek/deepseek-r1"],
  // Audita todo mundo. Modelo mais forte, sem otimização de custo aqui.
  "orchestrator-reviewer": ["anthropic/claude-opus-4.5"],
};
```

Três decisões nessa tabela carregam o peso.

**O caminho quente recebe o modelo barato.** O scout e o analyst rodam o tempo todo e seu trabalho é pattern matching sobre papers e contagens de portas. Roteear esse tráfego para um modelo frontier multiplicaria a conta sem ganho de qualidade mensurável. Aprendi a mesma lição no ralph-starter: 187 tarefas num mês, $22,41 no total, cerca de $0,12 por tarefa, porque o loop de validação rodou em chamadas baratas e cacheadas. Pague preços de pattern-matching por trabalho de pattern-matching.

**Papéis adversariais recebem um vendor diferente.** O único trabalho do falsifier é matar os candidatos do engineer. Se ambos rodam a mesma família de modelos, eles compartilham pontos cegos. Discordância cross-vendor é sinal. Quando o falsifier e o engineer discutem, a discussão é o produto.

**O artefato final recebe o modelo mais forte.** O orchestrator-reviewer audita toda decisão antes de algo avançar. Há exatamente um lugar no sistema onde qualidade domina custo, e é esse.

A tabela também documenta intenção. Daqui a seis meses eu não vou lembrar por que o falsifier é de um vendor diferente. A tabela lembra. Mudanças nela são revistas como código, porque elas são código.

## A camada de adapter é fail-closed

O harness tem duas classes de adapter: agentes de CLI (Codex, Amp, Claude Code, Kimi) e HTTP bruto pelo OpenRouter como gateway, mais uma API direta de provider. Todo papel tem uma cadeia ordenada de fallback entre ambas as classes. Um router faz health-probes nos adapters e percorre a cadeia quando um está fora, com rate limit ou degradado.

A regra que nunca quebrei: fail-closed. Retentar erros transitórios, percorrer a cadeia e, se a cadeia se esgotar, lançar uma falha tipada. Nunca degradar silenciosamente abaixo do que o papel permite. Nunca inventar uma resposta.

```ts
async function callRole(role: Role, req: ChatRequest): Promise<ChatResult> {
  let lastErr: unknown;

  for (const model of ROUTES[role]) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await openrouter.chat({ ...req, model });
        spend.record(role, model, res.usage);
        return res;
      } catch (err) {
        lastErr = err;
        if (!isRetryable(err)) break; // 4xx que não 429 falha imediatamente
        await sleep(2 ** attempt * 1000 + jitter());
      }
    }
    console.warn(`[router] ${model} exhausted for ${role}, falling back`);
  }

  throw new FailClosedError(role, ROUTES[role], lastErr);
}
```

`isRetryable` é uma lista curta: 429, 500, 502, 503, timeouts. Todo o resto para a cadeia na hora. Um 400 significa que meu request está errado, e retentar um request errado contra mais três modelos gera três vezes o lixo.

No meio do loop é o pior lugar para descobrir o rate limit de um provider. O agente tem estado, a execução está na geração 4 de 6, e um 429 não é uma página de erro. É um evento de roteamento. Uma coisa que errei no início: eu deixava a cadeia de fallback mudar o contrato do papel. O engineer caía para um modelo mais fraco e ninguém notava até a qualidade da saída descer silenciosamente. Agora a cadeia é parte da definição do papel, e uma cadeia esgotada é uma parada brusca com uma linha de log que eu de fato leio.

## O spend gate

Toda chamada devolve usage e custo. Tudo isso vai para um ledger, por papel, por modelo, por execução. O dashboard público acompanhava o gasto de tokens por provider em tempo quase real, sanitizado por um schema, porque as rotas dos candidatos eram o ativo competitivo.

O padrão que mais importa é o gate. Antes de um dispatch caro, projete o custo. Depois de toda chamada, registre o real. Cruzar o cap e a execução aborta, sem exceções:

```ts
class SpendGate {
  private spent = 0;

  constructor(private capUsd: number) {}

  record(role: Role, model: string, u: Usage) {
    this.spent += u.costUsd;
    ledger.append({ ts: Date.now(), role, model, ...u });
    if (this.spent > this.capUsd) {
      throw new SpendCapError(
        `cap hit: $${this.spent.toFixed(2)} > $${this.capUsd}. aborting run.`,
      );
    }
  }

  canAfford(role: Role, estTokens: number): boolean {
    return this.spent + estimateCost(role, estTokens) <= this.capUsd;
  }
}
```

Dois detalhes que valem roubar.

**Cheque antes e depois.** `canAfford` roda antes de despachar qualquer coisa que se ramifica. `record` roda depois de cada chamada. A checagem anterior usa uma estimativa e pode errar. A checagem posterior usa o número real e nunca pode errar.

A estimativa é crua de propósito. Média de tokens do papel vezes o preço atual do modelo, puxada do próprio ledger. Um preditor chique estaria errado de formas mais interessantes. Cru e conservador é o que você quer de um gate: ele ocasionalmente bloqueia uma execução que teria cabido, e nunca libera uma que não vai caber.

**Aborte, não avise.** Um aviso num log é como você gasta $60 numa noite num loop travado. O harness rodava num agendamento launchd de 30 minutos com um teto de orçamento de $200 no plano de controle, ao lado do portão de aprovação de GPU. O cap não desacelerou o trabalho. Forçou a frota a ser seletiva sobre quais experimentos mereciam rodar. Orçamentos são uma feature.

O ledger também se paga em discussões. Quando uma execução parece cara, eu não adivinho qual papel otimizar. Ordeno o ledger por custo e a resposta está na primeira linha.

## Peculiaridades sob uma API

Por trás de uma API, os modelos ainda são produtos diferentes. O que de fato me mordeu:

- **Rate limits são por provider, não por API.** O OpenRouter roteia um model id para qualquer provider que o sirva, a menos que você faça pin. Faça pin do provider no caminho quente, ou seu "um modelo" tem três rate limits diferentes dependendo do clima.
- **Tamanhos de contexto mentem por omissão.** O catálogo diz 200k. O provider servindo seu request hoje pode limitar a 128k. Confira o limite real antes de estufar um prompt, não depois do erro de truncagem.
- **Tool calling não é portável.** Alguns modelos emitem JSON estrito. Alguns emitem quase-JSON. O harness já validava por schema todo envelope de worker e rejeitava saídas malformadas, o que transformou isso de um bug de corrupção silenciosa em uma falha alta e retryable.
- **Latência é uma entrada de roteamento.** Modelos baratos são 2 a 5x mais rápidos em chamadas curtas, o que compõe dentro de um loop de dispatch de 30 minutos.

## O que o roteamento nos deu

O harness ficou em #1 no ECDSA.fail com zero erros em todos os casos do benchmark. Isso veio dos gates, não de escolher o modelo perfeito. Os modelos eram intercambiáveis. A camada de roteamento é o que tornou a intercambialidade segura: qualquer papel podia perder um provider no meio da execução e a frota mantinha seus contratos, seu orçamento e sua honestidade.

Nota de rodapé honesta: a maioria dos projetos não precisa disso. Se você tem uma carga de trabalho e um modelo em que confia, um SDK direto de provider com um loop de retry tem 40 linhas e menos partes móveis. A camada de roteamento ganha sua complexidade quando você tem papéis com necessidades diferentes de custo e qualidade, loops autônomos que precisam sobreviver a perrengues de provider, ou um teto de gasto com consequências. O harness tinha os três.

*Se você está montando roteamento multi-provider e quer comparar cicatrizes, minha caixa de entrada está aberta.*
