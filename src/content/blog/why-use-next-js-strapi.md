---
title: "Why use Next.js + Strapi?"
description: "The case for pairing Next.js with the Strapi headless CMS for a modern decoupled frontend / CMS stack. Headless concepts, alternatives, boilerplates."
date: 2021-05-07
readTime: "6 min"
tags: ["nextjs", "react", "strapi", "headless"]
cover: "/art/blog/why-use-next-js-strapi.png"
canonical: "https://dev.to/rubenmarcus/why-use-next-js-strapi-16b1"
reactions: 71
---

In this article I will show you the advantages of building a website with Strapi in the backend and Next.js in the frontend.

> At the time I wrote this article back in 2020, Directus was using an old Zend Framework in PHP that made a very interesting project full of features buggy, and not so easy to deploy and maintain as Strapi.
>
> But as Matt Williams stated in the comments, the Directus team made an incredible effort rewriting their entire CMS in Node.js and soon in Laravel 8 too.

## First of all: what is a Headless CMS?

<img src="https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fzcmwucc3i3zgy5l9mcpu.jpg" alt="Headless vs Traditional CMS" />

In short, a headless CMS is a content management system like WordPress, Drupal, or Contentful in which content management is separate from the presentation layer (frontend).

The main advantage of this approach is that it is tech independent: the website (SPA or otherwise), native apps, or anything else can be created with the tools or tech you want.

The main disadvantage is that you have to manage two or more web applications instead of one (which can be a disadvantage depending on the formation of your team).

There are CMS that come as headless by standard (API-based), and some that are git-based and generate static websites. And others that are API-based but not in that architecture by default and need plugins.

**The advantage of being headless and API-based by default is:**

- You have a source of information and can build many applications for different devices from it.
- Being a core functionality of the CMS, the chance of support and updates to the headless API are greater. If it's a plugin, the chance of it not being supported is more likely.

If you want to know more about Headless CMS, take a look at [headlesscms.org](https://headlesscms.org).

## Why use Strapi?

Strapi is an Open Source CMS, made in Node.js and MongoDB. It also supports MySQL, MariaDB, SQLite, and PostgreSQL.

It comes with easy deployment to AWS, Digital Ocean, Heroku, and many other cloud services. It has rich documentation and several tutorials on how to use the CMS.

It is possible to install [locally via CLI](https://strapi.io/documentation/3.0.0-beta.x/installation/cli) or using [Docker](https://github.com/strapi/strapi-docker), or using online services such as [Platform.sh](https://strapi.io/documentation/3.0.0-beta.x/installation/platformsh) or [Digital Ocean](https://strapi.io/documentation/3.0.0-beta.x/installation/digitalocean-one-click), or wherever you want.

It is possible to do unit tests with Jest or other test frameworks, since Strapi has a configurable webpack. Strapi also has webhooks to trigger actions for other applications.

Strapi's architecture is very simple and well-founded. It explains how to write plugins, how to model the API, how to manage content to be exported. The learning curve is between low and medium, depending on the developer's knowledge of Node.js and the headless CMS concept.

It is possible to restrict JWT API calls to Strapi user groups. Internationalization is only possible with a workaround, creating fields suffixed by languages.

The main competitor of Strapi in the Node.js world is Ghost, and open-source is Directus (originally PHP), also WordPress with its REST API (part of WordPress Core since 4.7).

Of these four open-source options, I consider Strapi the best: it's simple to manage and extend. WordPress has security issues and a different base concept; you can achieve the same goal as Strapi but with more settings and plugins. Ghost is very good on the security side, but Strapi is simpler and more complete on the content side. [Directus](https://directus.io/) is similar but had a PHP stack with critical bug reports at the time (the Node.js rewrite changed this).

## Why Next.js?

With the rise of SPA frameworks (Angular.js, React, Angular 2+, Vue), one major problem from client-rendered apps was SEO.

**Frameworks like Next.js solve this problem.**

Rendering the application via SSR (Server Side Rendering) or SSG (Static Site Generation), the search engine can read the content of your page and render it for results.

But the benefits go beyond that. Next.js increases the loading performance of your application. In a basic Google Lighthouse test, a Next.js SSR application had a First Meaningful Paint **87% faster** than a Create-React-App client-rendered application, because Next.js already renders part of your application on the server.

It has a folder and links scheme that also allows lazy loading of modules, as well as automatic code-splitting. You can choose which pages render on the server and which render statically (a hybrid app).

Next.js supports AMP (Accelerated Mobile Pages): no Node.js or React rendering, only pages in AMP format. It also supports the entire CSS universe: preprocessors (SASS, LESS, Stylus), CSS Modules, Styled Components, CSS-in-JS, TailwindCSS, Bootstrap, etc.

Next.js has a very strong focus on performance and tools to measure it (a topic for a separate article). It works with TypeScript, allowing strict data handling via interfaces and types. Dynamic imports use ES2020 syntax and generate components dynamically.

These are some benefits of Next.js: solving SPA SEO problems, giving you the entire React ecosystem, with a lean structure and rich documentation.

**Some companies using Next.js:** GoDaddy, Netflix, Marvel, InVision App, Tencent, TikTok, Uber, Trip.com, HostGator, Auth0, Binance, Staples, TicketMaster, Playstation, IGN, AT&T, Hulu, Twitch, Nike, Lego, Material UI, Expo, Ferrari, Avocode, Styled Components, Volvo, The Economist, Workable, Vodafone, CoinMarketCap, Monday, Elastic, History Channel, A&E TV, Lifetime, Hackernoon, Spotify, Pier, DAZN, Apify, CloudBees, Deno, Crazygames.

## Next.js vs Nuxt vs Angular Universal vs other React SSR frameworks

There are other frameworks that compete directly with Next.js: Nuxt.js with Vue, Angular Universal with Angular, etc.

Within the React ecosystem there are other ways to achieve the same goal: [After.js](https://github.com/jaredpalmer/after.js), [Razzle](https://github.com/jaredpalmer/razzle), or [React-SSR](https://github.com/alexnm/react-ssr).

## Starting with Next.js + Strapi: Boilerplates

Boilerplates let us start an application without configuring it from scratch. Two I'd recommend in the Next.js and Strapi universe:

- [Strapi Next.js Blog Boilerplate](https://github.com/strapi/strapi-starter-react-blog) (made by the Strapi team)
- [Next.js Strapi Example](https://github.com/vercel/next.js/tree/canary/examples/cms-strapi) (made by the Next.js team)

## References

- [Strapi Documentation](https://strapi.io/documentation/)
- [Next.js documentation](https://nextjs.org/docs)
- [10 Reasons you should use a Headless CMS](https://medium.com/strapi/10-reasons-why-you-should-use-a-headless-cms-cea598880dc7)
