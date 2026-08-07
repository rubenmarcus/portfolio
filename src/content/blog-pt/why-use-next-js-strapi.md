---
title: "Por que usar Next.js + Strapi?"
description: "O caso para parear Next.js com o CMS headless Strapi para uma stack moderna e desacoplada de frontend / CMS. Conceitos de headless, alternativas, boilerplates."
date: 2021-05-07
readTime: "6 min"
tags: ["nextjs", "react", "strapi", "headless"]
cover: "/art/blog/why-use-next-js-strapi.png"
reactions: 71
---

Neste artigo vou mostrar as vantagens de construir um site com Strapi no backend e Next.js no frontend.

> Na época em que escrevi este artigo, em 2020, o Directus usava um velho Zend Framework em PHP que tornava um projeto muito interessante e cheio de features buggy, e não tão fácil de fazer deploy e manter quanto o Strapi.
>
> Mas, como o Matt Williams observou nos comentários, o time do Directus fez um esforço incrível reescrevendo todo o CMS em Node.js e em breve no Laravel 8 também.

## Primeiro de tudo: o que é um CMS Headless?

<img src="https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fzcmwucc3i3zgy5l9mcpu.jpg" alt="Headless vs Traditional CMS" />

Em resumo, um CMS headless é um sistema de gerenciamento de conteúdo como WordPress, Drupal ou Contentful no qual o gerenciamento de conteúdo é separado da camada de apresentação (frontend).

A principal vantagem dessa abordagem é que ele é independente de tecnologia: o site (SPA ou outro), aplicativos nativos ou qualquer outra coisa podem ser criados com as ferramentas ou a tecnologia que você quiser.

A principal desvantagem é que você precisa gerenciar duas ou mais aplicações web em vez de uma (o que pode ser uma desvantagem dependendo da formação do seu time).

Existem CMS que já vêm como headless por padrão (baseados em API), e alguns que são git-based e geram sites estáticos. E outros que são baseados em API, mas não com essa arquitetura por padrão, e precisam de plugins.

**A vantagem de ser headless e baseado em API por padrão é:**

- Você tem uma fonte de informação e pode construir muitas aplicações para diferentes dispositivos a partir dela.
- Sendo uma funcionalidade central do CMS, a chance de suporte e atualizações para a API headless é maior. Se for um plugin, a chance de não ter suporte é maior.

Se você quiser saber mais sobre CMS Headless, dê uma olhada em [headlesscms.org](https://headlesscms.org).

## Por que usar Strapi?

O Strapi é um CMS Open Source, feito em Node.js e MongoDB. Ele também suporta MySQL, MariaDB, SQLite e PostgreSQL.

Ele vem com deploy fácil para AWS, Digital Ocean, Heroku e muitos outros serviços de nuvem. Tem uma documentação rica e vários tutoriais sobre como usar o CMS.

É possível instalar [localmente via CLI](https://strapi.io/documentation/3.0.0-beta.x/installation/cli) ou usando [Docker](https://github.com/strapi/strapi-docker), ou usando serviços online como [Platform.sh](https://strapi.io/documentation/3.0.0-beta.x/installation/platformsh) ou [Digital Ocean](https://strapi.io/documentation/3.0.0-beta.x/installation/digitalocean-one-click), ou onde você quiser.

É possível fazer testes unitários com Jest ou outros frameworks de teste, já que o Strapi tem um webpack configurável. O Strapi também tem webhooks para disparar ações para outras aplicações.

A arquitetura do Strapi é muito simples e bem fundamentada. Ele explica como escrever plugins, como modelar a API, como gerenciar conteúdo para ser exportado. A curva de aprendizado fica entre baixa e média, dependendo do conhecimento do desenvolvedor sobre Node.js e do conceito de CMS headless.

É possível restringir chamadas de API via JWT a grupos de usuários do Strapi. A internacionalização só é possível com um workaround, criando campos sufixados por idioma.

O principal concorrente do Strapi no mundo Node.js é o Ghost, e em open-source é o Directus (originalmente PHP), também o WordPress com sua REST API (parte do WordPress Core desde a 4.7).

Dessas quatro opções open-source, considero o Strapi a melhor: é simples de gerenciar e estender. O WordPress tem problemas de segurança e um conceito base diferente; você consegue atingir o mesmo objetivo que o Strapi, mas com mais configurações e plugins. O Ghost é muito bom no lado de segurança, mas o Strapi é mais simples e mais completo no lado de conteúdo. O [Directus](https://directus.io/) é parecido, mas tinha uma stack PHP com relatos de bugs críticos na época (o rewrite em Node.js mudou isso).

## Por que Next.js?

Com a ascensão dos frameworks de SPA (Angular.js, React, Angular 2+, Vue), um grande problema das apps renderizadas no cliente foi o SEO.

**Frameworks como o Next.js resolvem esse problema.**

Renderizando a aplicação via SSR (Server Side Rendering) ou SSG (Static Site Generation), o motor de busca consegue ler o conteúdo da sua página e renderizá-lo para os resultados.

Mas os benefícios vão além disso. O Next.js aumenta a performance de carregamento da sua aplicação. Em um teste básico do Google Lighthouse, uma aplicação SSR em Next.js teve um First Meaningful Paint **87% mais rápido** do que uma aplicação client-rendered em Create-React-App, porque o Next.js já renderiza parte da sua aplicação no servidor.

Ele tem um esquema de pastas e links que também permite lazy loading de módulos, além de code-splitting automático. Você pode escolher quais páginas renderizam no servidor e quais renderizam estaticamente (uma app híbrida).

O Next.js suporta AMP (Accelerated Mobile Pages): sem renderização Node.js ou React, apenas páginas em formato AMP. Também suporta todo o universo CSS: preprocessadores (SASS, LESS, Stylus), CSS Modules, Styled Components, CSS-in-JS, TailwindCSS, Bootstrap, etc.

O Next.js tem um foco muito forte em performance e ferramentas para medi-la (um tópico para um artigo separado). Ele funciona com TypeScript, permitindo tratamento estrito de dados via interfaces e tipos. Importações dinâmicas usam sintaxe ES2020 e geram componentes dinamicamente.

Esses são alguns benefícios do Next.js: resolvendo os problemas de SEO das SPAs, dando a você todo o ecossistema React, com uma estrutura enxuta e documentação rica.

**Algumas empresas usando Next.js:** GoDaddy, Netflix, Marvel, InVision App, Tencent, TikTok, Uber, Trip.com, HostGator, Auth0, Binance, Staples, TicketMaster, Playstation, IGN, AT&T, Hulu, Twitch, Nike, Lego, Material UI, Expo, Ferrari, Avocode, Styled Components, Volvo, The Economist, Workable, Vodafone, CoinMarketCap, Monday, Elastic, History Channel, A&E TV, Lifetime, Hackernoon, Spotify, Pier, DAZN, Apify, CloudBees, Deno, Crazygames.

## Next.js vs Nuxt vs Angular Universal vs outros frameworks React SSR

Existem outros frameworks que competem diretamente com o Next.js: Nuxt.js com Vue, Angular Universal com Angular, etc.

Dentro do ecossistema React há outras formas de atingir o mesmo objetivo: [After.js](https://github.com/jaredpalmer/after.js), [Razzle](https://github.com/jaredpalmer/razzle) ou [React-SSR](https://github.com/alexnm/react-ssr).

## Começando com Next.js + Strapi: Boilerplates

Boilerplates nos permitem iniciar uma aplicação sem configurá-la do zero. Dois que eu recomendaria no universo Next.js e Strapi:

- [Strapi Next.js Blog Boilerplate](https://github.com/strapi/strapi-starter-react-blog) (feito pelo time do Strapi)
- [Next.js Strapi Example](https://github.com/vercel/next.js/tree/canary/examples/cms-strapi) (feito pelo time do Next.js)

## Referências

- [Documentação do Strapi](https://strapi.io/documentation/)
- [Documentação do Next.js](https://nextjs.org/docs)
- [10 Reasons you should use a Headless CMS](https://medium.com/strapi/10-reasons-why-you-should-use-a-headless-cms-cea598880dc7)
