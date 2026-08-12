---
title: "Como AEO pode fazer seu negócio crescer"
description: "AEO permite ao ChatGPT, Perplexity e afins lerem e citarem seu negócio. Meu scanner gratuito já rodou 4.569 scans em 2.259 sites únicos; as mesmas falhas aparecem em todo lugar."
date: 2026-07-27
readTime: "11 min"
tags: ["aeo", "seo", "llm", "web"]
cover: "/art/blog/aeo-what-it-moves.png"
---

Há um tempo eu fiz deploy do aeo.js, um framework open-source para Answer Engine Optimization, e do check.aeojs.org, um scanner gratuito que avalia o quão legível seu site é para AI crawlers e answer engines.

Definição rápida, porque a sigla sozinha não trabalha por você: AEO é o conjunto de coisas que torna seu site legível para answer engines: ChatGPT, Perplexity, Claude, Gemini, Copilot, as ferramentas que seus clientes cada vez mais consultam em vez do Google. SEO te coloca no ranking de uma página de resultados. AEO te faz ser citado dentro da resposta. Quando alguém pergunta "quem faz um bom X para pequenas empresas" e o modelo responde com três nomes e uma frase para cada, ser um desses três nomes é a nova primeira página do Google. Esse é o caso de negócio inteiro: answer engines são um canal de descoberta, e a barreira de entrada é principalmente encanamento.

O scanner já rodou **4.569 scans no total, em 2.259 sites únicos**. Esse é um dataset real. Suficiente para parar de escrever sobre o que AEO deveria fazer na teoria e começar a escrever sobre o que de fato move na prática.

Este é esse post.

## O que 2.259 sites têm em comum

As falhas são chatas. Essa é a descoberta. O scanner avalia cinco categorias que valem 20 pontos cada: AI Access, Content Structure, Schema Presence, Meta Quality e Citability. A maioria dos sites não falha de formas exóticas. Eles falham nos mesmos 3 a 4 checks, de novo e de novo:

1. **A política de robots bloqueia AI crawlers.** Às vezes deliberadamente, normalmente não. A versão mais comum é um `Disallow: /` copiado de um config de staging, ou um default da plataforma de hosting que nunca foi revisado. O dono do site não tem opinião sobre o GPTBot. O template dele tem.
2. **Sem llms.txt.** Ainda a exceção, não a norma. Mesmo em sites cujos donos escrevem posts sobre IA.
3. **Sem structured data.** Sem JSON-LD, sem markup de schema.org. O scanner verifica especificamente por blocos de Organization, Article ou WebPage, e FAQPage ou HowTo. As answer engines precisam adivinhar o que a página é em vez de serem informadas.
4. **Conteúdo raso ou não estruturado.** A categoria Citability pontua se um modelo consegue extrair uma resposta autocontida da sua página: parágrafos de resposta direta, números reais, estrutura de headings. A maioria das páginas não tem nenhum dos três.

Nenhum disso é difícil de consertar. Esse é o ponto todo. O site médio não está perdendo o jogo de AEO por qualidade de conteúdo. Está perdendo por encanamento que esqueceu que tinha.

## O problema do robots.txt é geralmente um acidente

Aqui está o que vejo constantemente. Um site com ótimo conteúdo, SEO razoável, e isso no robots.txt:

```txt
User-agent: *
Disallow: /

# or the more modern version nobody reviewed:
User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: PerplexityBot
Disallow: /
```

Pergunte ao dono por que ele bloqueia o GPTBot e você recebe uma cara em branco. Ele nunca decidiu isso. Um boilerplate decidiu por ele, ou um plugin adicionou durante o ciclo de notícias de "bloquear scraping de IA" e ninguém revisou.

O scanner dá peso real a isso. Um disallow geral custa 4 pontos, bloquear a maioria dos 4 bots principais (GPTBot, ClaudeBot, Google-Extended, PerplexityBot) custa mais 4, e permitir menos de 70% dos 23 crawlers custa outros 3. São 11 pontos de 100 decididos por um arquivo de texto.

Existem razões legítimas para bloquear AI crawlers. Se você tem uma, tudo bem, bloqueie-os e pule este post. Mas se você quer que answer engines te citem, a primeira verificação é se você mandou os crawlers delas embora. O conserto é apagar linhas. É a edição de maior alavancagem em todo o AEO e leva cinco minutos.

## O que llms.txt e ai-index.json realmente mudam

Dois arquivos, dois trabalhos diferentes. As pessoas os confundem, e o segundo não é o que a maioria pensa.

`llms.txt` é um mapa curado para um language model que pousa no seu site no inference time. Não é um ranking signal. Ninguém te impulsiona por ter um. O que ele faz: quando uma answer engine faz fetch do seu site, ela recebe um index limpo do seu conteúdo em vez da sua nav bar e dos links do footer. Aqui está a forma real que o aeo.js gera, de `src/core/llms-txt.ts`:

```txt
# Ruben Marcus

> Senior AI fullstack engineer. Builds browser games, agent
> harnesses, and open-source tooling.

## Pages

- [Blog](https://www.rubenmarcus.dev/blog)
- [About](https://www.rubenmarcus.dev/about)

## Quick Links

- Full Documentation: https://www.rubenmarcus.dev/llms-full.txt
- Documentation Manifest: https://www.rubenmarcus.dev/docs.json
- AI-Optimized Index: https://www.rubenmarcus.dev/ai-index.json
- Sitemap: https://www.rubenmarcus.dev/sitemap.xml
```

`ai-index.json` parece a mesma ideia em JSON. Não é. É um retrieval index pré-dividido em chunks. O gerador (`src/core/ai-index.ts`) divide cada página em chunks de `maxChunkLength` caracteres (2.000 por padrão), extrai keywords por frequência de termos, e hasheia cada chunk em um ID estável de 16 caracteres. Um pipeline de RAG consegue embedar seu site sem nunca crawlear:

```json
{
  "version": "1.0",
  "generated": "2026-08-12T09:00:00.000Z",
  "site": {
    "title": "Ruben Marcus",
    "url": "https://www.rubenmarcus.dev"
  },
  "entries": [
    {
      "id": "9f2c1ab4e07d55aa",
      "url": "https://www.rubenmarcus.dev/blog/shipping-a-browser-fps",
      "title": "Shipping a browser FPS with no server",
      "content": "...chunk of up to 2,000 characters...",
      "keywords": ["webgpu", "wasm", "browser", "fps"],
      "metadata": {
        "chunkIndex": 0,
        "totalChunks": 3,
        "sourcePath": "blog/shipping-a-browser-fps.md"
      }
    }
  ],
  "metadata": {
    "totalEntries": 87,
    "generator": "aeo.js",
    "embedding": {
      "recommended": "text-embedding-ada-002",
      "dimensions": 1536
    }
  }
}
```

Esses arquivos te fazem ser citado amanhã? Não. O enquadramento honesto: eles reduzem o custo de entender seu site de "parsear o DOM inteiro e adivinhar" para "ler um arquivo". Quando as answer engines decidem o que citar, os sites baratos de entender vencem empates. Essa é a alegação inteira. É um efeito real e modesto.

## A ordem de implementação que paga

Depois de ver alguns milhares de resultados de scan, esta é a ordem que recomendo. Está ordenada por esforço-vs-impacto, não por moda.

**1. Política de robots.** Desbloqueie os crawlers que você realmente quer. Cinco minutos. Desbloqueia tudo abaixo dela. Se AI crawlers não conseguirem fazer fetch das suas páginas, o resto deste post é decoração.

**2. Structured data.** JSON-LD é o que as answer engines parseiam hoje, em escala, agora. Um bloco de `Article` com author, date e headline são 20 linhas de markup, e a categoria Schema Presence do scanner te diz exatamente quais blocos estão faltando.

**3. Exports.** Agora gere `llms.txt`, `ai-index.json` e afins. Não os mantenha à mão. Eles ficam stale no dia em que você publica o post número dois. Essa é a parte que o aeo.js automatiza, e como configs inventadas vivem aparecendo no mundo real, aqui está o verdadeiro. `npx aeo.js init` escreve esse arquivo:

```ts
// aeo.config.ts
import { defineConfig } from "aeo.js";

export default defineConfig({
  title: "Ruben Marcus",
  url: "https://www.rubenmarcus.dev",
  description: "Senior AI fullstack engineer.",

  generators: {
    robotsTxt: true,
    llmsTxt: true,
    llmsFullTxt: true,
    rawMarkdown: true,
    sitemap: true,
    aiIndex: true,
    schema: true,
  },

  robots: {
    allow: ["/"],
    disallow: ["/api"],
  },
});
```

Uma sutileza: `robots.allow` e `robots.disallow` são paths, não nomes de crawler. O robots.txt gerado já permite explicitamente 49 crawlers conhecidos de IA e SEO por nome. Seu config só molda o bloco wildcard `User-agent: *`.

No Astro, onde este site vive, é uma integração. Ele escaneia o HTML buildado em `astro:build:done`, gera os arquivos, e injeta canonical URLs, JSON-LD e links `rel="alternate"` em toda página que não os tem:

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import { aeoAstroIntegration } from "aeo.js/astro";

export default defineConfig({
  site: "https://www.rubenmarcus.dev",
  integrations: [
    aeoAstroIntegration({
      title: "Ruben Marcus",
      url: "https://www.rubenmarcus.dev",
      description: "Senior AI fullstack engineer.",
    }),
  ],
});
```

Next.js é um wrapper de config mais um post-build step, porque o conteúdo real da página só existe depois do prerendering:

```js
// next.config.mjs
import { withAeo } from "aeo.js/next";

export default withAeo({
  aeo: { title: "My Site", url: "https://mysite.com" },
});
```

```json
{
  "scripts": {
    "postbuild": "node -e \"import('aeo.js/next').then(m => m.postBuild({ title: 'My Site', url: 'https://mysite.com' }))\""
  }
}
```

Existem plugins para Vite, Nuxt, Remix, SvelteKit, Angular, Webpack, Docusaurus, Eleventy, VitePress e TanStack Start, além de `npx aeo.js generate` se seu stack não for nenhum desses. O ponto não é a ferramenta. Exports são um build artifact, não um documento.

**4. Camada de conteúdo.** Por último, porque é a cara. Answer engines citam páginas que respondem perguntas diretamente: headings que são perguntas, parágrafos que declaram fatos na primeira frase, números com fontes. Esse é trabalho editorial de verdade e nenhum config file faz por você. Faça depois do encanamento, porque o encanamento é uma tarde e o conteúdo é para sempre.

## Um antes e depois concreto

Aqui está o compósito que vejo repetidamente nos dados de scan, contado como uma história só. Uma pequena SaaS B2B, blog decente, clientes reais.

**Antes.** O robots.txt carregava um `Disallow: /` para GPTBot e ClaudeBot, herdado de um template. Sem `llms.txt`, sem `ai-index.json`, sem JSON-LD em lugar nenhum. As páginas de produto eram uma hero image, um slogan e uma tabela de preços. Score do scanner: 38 de 100. Quando alguém pedia a uma answer engine ferramentas da categoria dela, o site não existia. Não porque o modelo não gostasse dele, mas porque o crawler foi mandado embora e nada na página era citável de qualquer forma.

**Depois, uma tarde de encanamento.** Apagou as linhas de disallow. Adicionou um bloco JSON-LD de `Organization` e `Article`. Gerou `llms.txt` e `ai-index.json` em build time. Reescreveu exatamente três páginas de produto para que a primeira frase de cada uma respondesse "o que é isso e para quem é" em linguagem clara. Score do scanner: 91. Custo total: um desenvolvedor, um dia, zero reais em ferramentas.

O que mudou para o negócio: o site foi de "invisível para answer engines" para "barato de entender e fácil de citar". Essa é a promessa honesta. Não garante citações (nada garante), mas te move de inelegível para elegível, e elegibilidade é a parte que está inteiramente sob seu controle. A mecânica de crescimento depois disso é a mesma de sempre: ser encontrável onde seus clientes procuram, ser citável quando eles perguntam.

## Como medir um antes e depois

Atribuição em AEO é ruim. Não vou fingir o contrário. Você não consegue marcar uma resposta do ChatGPT com UTM. Então meça o que você controla, em um loop:
1. Rode um baseline: `npx aeo.js check yoursite.com`, ou o mesmo scan no navegador em check.aeojs.org. Tire um screenshot do resultado.
2. Conserte uma camada da ordem acima. Uma, não quatro.
3. Faça deploy, escaneie de novo, compare.
4. Repita até o scanner não ter mais nada a dizer.

O score do scanner é um proxy, e você deve tratá-lo assim. O que ele verifica é mecânico: crawlers conseguem te alcançar, os arquivos existem, o markup parseia, o conteúdo tem respostas extraíveis. O sinal mais lento é o tráfego de referral das answer engines no seu analytics. Verifique isso mensalmente, não diariamente. Ele se move devagar.

## O que AEO não conserta

Os limites, porque todo post sobre isso os pula:

- **AEO não conserta conteúdo ruim.** Se suas páginas não dizem nada, structured data descreve o nada com precisão. Answer engines citam páginas que contêm respostas.
- **Não substitui SEO.** Os mesmos crawlers e a mesma barra de qualidade de conteúdo alimentam ambos. AEO é uma camada sobre um site que funciona, não um plano de resgate para um site quebrado.
- **Não garante citações.** Ninguém fora dos labs conhece a ranking function de nenhuma answer engine, e os labs não estão contando. Qualquer um vendendo colocação garantida está vendendo outra coisa.

O que ele faz: remove as razões mecânicas por que uma answer engine não consegue te ler, e torna seu melhor conteúdo barato de encontrar uma vez que consiga. Para a maioria dos 2.259 sites que meu scanner viu, esse é o gap. Não estratégia. Encanamento.

Conserte o encanamento primeiro. É a única parte que é grátis.

*O aeo.js é open source. O scanner é grátis em check.aeojs.org. Se o seu score te surpreende, minha inbox está aberta.*
