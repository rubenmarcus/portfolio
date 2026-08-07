---
title: "O caso Mini Shai-Hulud e o risco real das dependências"
description: "A onda de Mini Shai-Hulud de maio de 2026 não apenas roubou um token do npm — ela abusou do próprio pipeline de build e publicação: pull_request_target, cache poisoning, OIDC trusted publishing e install scripts. O que de fato aconteceu e o que eu auditaria primeiro."
date: 2026-05-12
readTime: "4 min"
cover: "/art/blog/mini-shai-hulud-dependency-risk.png"
tags: ["security", "supply-chain", "npm", "ci-cd", "dependencies"]
---

Em 11 de maio de 2026, uma nova onda de Mini Shai-Hulud comprometeu pacotes do npm e do PyPI em um ataque à cadeia de suprimentos.

O incidente ganhou atenção primeiro através da TanStack: 84 versões maliciosas em 42 pacotes `@tanstack/*` foram publicadas em poucos minutos. Depois, a campanha apareceu em outros pacotes e namespaces.

O ponto mais importante: este não foi apenas um caso de "alguém roubou um token do npm".

Com base no que foi publicado até agora, o ataque abusou do próprio pipeline de build e publicação. Nos pacotes comprometidos da TanStack, por exemplo, um arquivo ofuscado chamado `router_init.js` foi adicionado. Uma optionalDependency suspeita chamada `@tanstack/setup` também apareceu, apontando para um commit no GitHub.

Esse pacote Git tinha um script `prepare` que executava `bun run tanstack_runner.js`. Como lifecycle scripts podem rodar durante a instalação, simplesmente instalar uma versão afetada poderia executar o payload em uma máquina de desenvolvedor ou em um runner de CI.

O payload tentava coletar credenciais do ambiente, incluindo tokens do GitHub Actions, tokens do npm, credenciais de nuvem, tokens do Kubernetes, tokens do Vault e chaves SSH.

A parte séria é que, no caso da TanStack, a publicação passou por partes legítimas da infraestrutura: GitHub Actions, OIDC/trusted publishing e o pipeline de release. Em outras palavras, o pacote podia parecer legítimo porque foi publicado por um caminho legítimo que tinha sido abusado pelo atacante.

**Em resumo, os pontos técnicos mais relevantes foram:**

- **pull_request_target**: um workflow do GitHub Actions rodou com privilégios elevados ao tratar pull requests.
- **Cache poisoning**: o atacante conseguiu influenciar o cache usado pelo pipeline.
- **OIDC/trusted publishing**: a publicação podia acontecer sem um token clássico do npm, usando uma identidade temporária do próprio pipeline.
- **Install scripts**: código malicioso rodou durante a instalação e tentou coletar credenciais do ambiente.

**Se eu estivesse revisando um ambiente agora, focaria principalmente em:**

- Lockfiles: `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `uv.lock`, `poetry.lock`.
- Caches de CI e imagens Docker.
- Runners que instalaram alguma versão afetada.
- Secretes acessíveis a partir desses ambientes: GitHub, npm, nuvem, Kubernetes, Vault, SSH e tokens de deploy.
- Workflows que usam `pull_request_target`.
- Jobs com `id-token: write`.
- Instalação automática de versões recém-publicadas.

A lição aqui é muito direta: uma dependência não é apenas uma "biblioteca". É código de terceiros rodando na sua máquina, dentro do seu CI e, às vezes, dentro da sua cadeia de deploy.

Segurança da cadeia de suprimentos não é apenas varredura de CVEs. É CI/CD, credenciais, publicação, permissões e resposta rápida a incidentes.

**Fontes principais**

- Postmortem oficial da TanStack: [https://tanstack.com/blog/npm-supply-chain-compromise-postmortem](https://tanstack.com/blog/npm-supply-chain-compromise-postmortem)
- Advisory oficial do GitHub Security para os pacotes TanStack: [https://github.com/TanStack/router/security/advisories/GHSA-g7cv-rxg3-hmpx](https://github.com/TanStack/router/security/advisories/GHSA-g7cv-rxg3-hmpx)
- Lista geral mantida pela Socket Research: [https://socket.dev/blog/tanstack-npm-packages-compromised-mini-shai-hulud-supply-chain-attack#All-Compromised-Packages](https://socket.dev/blog/tanstack-npm-packages-compromised-mini-shai-hulud-supply-chain-attack#All-Compromised-Packages)
- Rastreador da campanha Mini Shai-Hulud da Socket: [https://socket.dev/supply-chain-attacks/mini-shai-hulud](https://socket.dev/supply-chain-attacks/mini-shai-hulud)
