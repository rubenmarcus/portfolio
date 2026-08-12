---
title: "Este portfólio é agent-first. Provavelmente o primeiro."
description: "Meu site fala MCP, tem AGENTS.md, API de hire e currículo de terminal. Seu agent lê meu CV, checa disponibilidade e agenda um intro sem você tocar em formulário. Veja como funciona."
date: 2026-08-06
readTime: "7 min"
tags: ["ai", "agents", "mcp", "portfolio"]
cover: "/art/blog/agents-welcome-portfolio.png"
---

Seu agent chegou aqui primeiro.

A maioria dos portfólios é construída para humanos e acidentalmente legível por máquinas. Este é desenhado ao contrário: o agent é o visitante de primeira classe, o humano vem depois. Aponte o Claude, ChatGPT, Kimi, Cursor ou seu próprio harness pra cá: ele lê meu currículo, lista o que eu vendo, checa se tô pegando projeto e agenda um intro call, sem ninguém tocar num formulário. Eu acho que este é o primeiro portfólio agent-first. Se não for, é pelo menos o primeiro que documenta isso.

## O que seu agent consegue fazer aqui

O site fala MCP. Um endpoint, quatro tools:

```ts
// POST https://www.rubenmarcus.dev/api/mcp  (JSON-RPC 2.0)
const tools = [
  "get_resume",          // quem eu sou, proof points, links
  "get_services",        // as seis ofertas de escopo fixo
  "check_availability",  // status atual de engajamento
  "book_intro",          // posta um brief para minha inbox
];
```

No Claude: settings, connectors, add custom connector, cole a URL. No ChatGPT: developer mode, create app, mesma URL. A partir daí "olhe o Ruben Marcus para o rebuild do nosso landing" é uma instrução real com outcome real.

O servidor é um handler JSON-RPC feito à mão. Sem SDK, sem framework, uns 150 linhas. MCP sobre streamable HTTP é só `initialize`, `tools/list`, `tools/call`. O ponto do protocolo é que você não precisa de quase nada para entrar nele.

## AGENTS.md: a descoberta que os agents já leem

A peça de discovery. Todo coding agent sabe o que é um AGENTS.md hoje, então o site ships um como brief de copy-paste na home e na contact page. Diz quem eu sou, qual é a cara da API e o que eu vendo. Cole em qualquer chat e o agent tem tudo que precisa para agir como seu proxy.

Isso importa mais que o endpoint. Endpoints sem uma convenção de discovery são invisíveis. AGENTS.md é a convenção que os agents já leem por instinto, custo zero.

## curl rubenmarcus.dev: currículo de terminal

Um easter egg agent-friendly. Se seu user agent é um terminal, a homepage não retorna HTML:

```
$ curl rubenmarcus.dev

rubenmarcus.dev // terminal resume

Ruben Marcus — Senior AI Fullstack Engineer
Lisbon, Portugal · remote worldwide · 14 years shipping

proof
  #1 ECDSA.fail ............ multi-agent research harness
  #1 QEC decoder ........... Optimization Arena, 2,642 EPM
  ...
```

O middleware checa o UA e reescreve para `/api/resume.txt`. Browsers pegam o site, terminais pegam o currículo. Há também `/api/resume.json` para qualquer coisa que prefira estrutura sem o handshake do MCP.

## A hiring API, para quem não quer configurar connector

Nem todo agent quer configurar um connector. Então há um endpoint plain também:

```bash
curl -X POST https://www.rubenmarcus.dev/api/hire \
  -H 'content-type: application/json' \
  -d '{"name":"Ada","contact":"ada@corp.com","brief":"AEO sprint for our docs site","agent":"chatgpt"}'
```

Validação, um campo honeypot para spam bots, e relay para minha inbox. É isso. O brief chega com o agent chamador nomeado no subject line, então eu sei qual modelo fez as compras.

## O servidor MCP é um switch statement

As pessoas superestimam o que é um servidor MCP. O meu é uma única function da Vercel que responde a quatro métodos JSON-RPC. Este é o dispatcher inteiro, trimado:

```ts
// src/pages/api/mcp.ts
export const POST: APIRoute = async ({ request }) => {
  const { id, method, params } = await request.json();

  switch (method) {
    case "initialize":
      return json({
        jsonrpc: "2.0", id,
        result: {
          protocolVersion: params?.protocolVersion ?? "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "rubenmarcus-portfolio", version: "1.0.0" },
        },
      });
    case "tools/list":
      return json({ jsonrpc: "2.0", id, result: { tools: TOOLS } });
    case "tools/call":
      return dispatch(params?.name, params?.arguments, id);
    default:
      return json({ jsonrpc: "2.0", id,
        error: { code: -32601, message: `method not found: ${method}` } });
  }
};
```

Cada tool é uma descrição estática mais um handler. `get_resume` retorna um documento JSON. `check_availability` retorna um parágrafo. A única com side effects é `book_intro`, que valida três campos e faz relay para minha inbox através do formsubmit. Sem database, sem sessions, sem auth. O handshake de `initialize` do protocolo carrega um campo `instructions` que diz ao modelo chamador como se comportar, e essa única string faz mais trabalho que o resto do arquivo.

Um detalhe que vale copiar: responda GET com um documento que se descreve. Quando alguém aponta um navegador ou um agent confuso para a URL, ele pega a lista de tools e os métodos esperados em vez de um 405.

## A hiring API tem uma trapdoor

`POST /api/hire` recebe `{name, contact, brief, budget?, agent?}`. As partes interessantes são defensivas:

```ts
// honeypot: agentes que preenchem um campo "website" oculto recebem um success falso
if (data.website) return json({ ok: true });

if (!name || !contact || !brief) {
  return json({ ok: false, error: "name, contact and brief are required" }, 400);
}
for (const [k, v] of Object.entries({ name, contact, brief, budget, agent })) {
  if (v.length > MAX[k]) return json({ ok: false, error: `${k} too long` }, 400);
}
```

O campo honeypot é invisível para humanos e irresistível para form-scraping bots. Eles recebem um 200 e um sorriso, eu não recebo nada. Limits de comprimento impedem que um agent descontrolado me envie o context window inteiro dele. O campo `agent` existe para que o subject line me diga qual modelo fez a chamada: `[agent hire] Ada via claude`.

## Discovery vence endpoints

Um endpoint que ninguém consegue achar é um boato. Três camadas de discovery, mais baratas primeiro:

`AGENTS.md` como brief de copy-paste nas páginas home e contact. Coding agents já leem AGENTS.md por instinto, então o custo da convenção é zero.

`llms.txt` na raiz, que eu gero com meu próprio aeo.js em build time. O mesmo arquivo que eu digo aos clientes para fazerem deploy, apontado para mim.

`/api/resume.json`, um CV legível por máquina para qualquer agent que queira estrutura sem o handshake do MCP.

O middleware para o easter egg do curl são dez linhas: match de `curl|wget|httpie` no user agent em page routes, rewrite para o currículo em texto. Uma ressalva honesta de ter construído isso: no Astro estático o middleware só vê headers reais quando roda no edge, então ele faz deploy como Vercel edge middleware (`edgeMiddleware: true`) e foi verificado contra o site deployado, não localhost.

## O que custa e o que quebra

Custo de operação é zero. Três funções pequenas no free tier da Vercel por trás de um site estático. Os failure modes que eu de fato hit: bots martelando o endpoint com junk (o honeypot pega a maioria), agents que fazem POST form-encoded em vez de JSON (retorna um 400 com erro legível, eles retryam corretamente), e modelos que inventam uma sexta tool. A resposta de `tools/list` é o contrato, e clientes bem-comportados o leem.

O que eu adicionaria a seguir: request signing se o volume algum dia justificar, um rate limit de `book_intro` por endereço de contato, e um contador de analytics de quais agents chamam quais tools. Não antes que haja tráfego para medir.

## Por que fazer isso

Duas razões. A honesta primeiro: eu construo sistemas de agents para viver. Um portfólio que agents não conseguem operar seria um pouco como um chef com cozinha suja. O site é minha proof of work, então ele deveria se comportar como meu trabalho.

A segunda é uma aposta. Uma fatia crescente de "vá olhar essa pessoa" será delegada a agents. Quando alguém pede ao seu agent para encontrar um engenheiro para um AEO sprint, os sites que respondem de formas estruturadas e agent-readable são encontrados. Todo o resto é uma parede de HTML. Eu escrevi sobre o lado de medição disso em [o que AEO realmente move](/blog/aeo-what-it-moves). Este post é a mesma ideia apontada para mim mesmo.

O stack inteiro é um site Astro estático mais três funções serverless pequenas. A parte divertida nunca foi o encanamento. É decidir o que seu site deveria dizer quando o visitante não é uma pessoa e, cada vez mais, quando o visitante é um agent.
