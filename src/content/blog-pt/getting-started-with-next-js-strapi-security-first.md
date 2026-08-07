---
title: "Começando com Next.js + Strapi: segurança em primeiro lugar"
description: "Antes de mexer em Content-Types ou rotas, vamos falar de segurança. Este é o guia de segurança para uma stack Strapi + Next.js — XSS, CSRF, clickjacking, JWT, SSL, monitoramento."
date: 2021-05-16
readTime: "10 min"
tags: ["nextjs", "frontend", "strapi", "security"]
cover: "/art/blog/getting-started-with-next-js-strapi-security-first.png"
reactions: 28
---

## Por que se preocupar com segurança?

Antes de começar a ver sobre os Content-Types do Strapi, antes de olhar a estrutura de arquivos e rotas do Next.js, é bom falar sobre segurança.

Uma preocupação que normalmente não é acompanhada com a devida atenção em alguns times, e que pode custar muito caro quando um projeto entra em produção.

Este artigo é mais um artigo introdutório à stack Next.js + Strapi, também vamos cobrir TypeScript, Data Fetch, Layouts, CI/CD e Deploy, mas antes de tudo vamos cobrir segurança.

Abaixo vamos discutir os erros de segurança mais comuns em aplicações web e como mitigá-los ou corrigi-los na nossa aplicação Strapi + Next.js:

**XSS / CSRF:**
XSS ou Cross Site Scripting é uma técnica maliciosa para injetar código na nossa aplicação e burlar a segurança para roubar dados ou manipular a sessão de um usuário, por exemplo.

**CSRF** ou Cross-site request forgery é quando alguém usa uma técnica maliciosa para conseguir, através de uma requisição seja via Postman ou navegador, chegar ao nosso banco de dados, deletar dados de usuários por exemplo, roubar dados de sessão (como cartão de crédito, endereços, etc.) entre outras coisas.

**Click Jacking:**
Você sabe quando abre páginas que costumam enganar o usuário para digitar dados e, no fim, acabam enviando esses dados para pessoas que vão usá-los de forma maliciosa? Ou que podem ter malware ou exploits e os instalam na máquina do usuário?

## Vulnerabilidades comuns em APIs REST

- **DOS & DDOS (Denial of Service):** Quando um hacker quer derrubar uma API, aplicação ou site, ele pode disparar requisições em massa para essa API ou endpoint. Exposição de informações sensíveis: quando expomos dados sensíveis de usuários, especialmente sem criptografia na nossa API. Ids, emails, endereços, informações de pagamento, etc.
- **Ataques MIM (Man in the Middle):** Quando um hacker tenta interceptar a comunicação entre cliente e servidor, com a intenção de roubar dados.
- **SQL Injection:** Injeção de código que muda o comportamento esperado da API e do banco de dados. Através de uma injeção, um hacker consegue roubar informações, quebrar a API, mudar seu funcionamento.
- **Referências diretas a objetos inseguras:** Quando você expõe uma API com endpoints como `/user/id/30`, e um usuário tenta acessar um ID que não pertence a ele e consegue, você está expondo referências diretas a objetos de forma insegura.

## Vulnerabilidades comuns em APIs GraphQL

- **`/graphql?query={__schema{types{name,fields{name}}}}`:** Se a sua API GraphQL é pública, só com uma query como essa, o usuário que a usa consegue ver todo o schema da sua API.
- **Queries maliciosas:** Hackers podem montar queries maliciosas, seja para roubar dados, corromper seu banco de dados ou derrubar sua API/servidor.
- **Brute-Force:** Para evitar problemas com hackers tentando quebrar os dados da sua API GraphQL, você pode usar plugins como o [GraphQL Rate Limit](https://github.com/teamplanes/graphql-rate-limit), que vai limitar quantas vezes os campos vulneráveis da sua query podem ser executados em um intervalo de tempo.

## Como evitar tudo isso?

### No Strapi

- **Entendendo o arquivo de configuração do Strapi e sua segurança:** O Strapi tem uma documentação rica que nos mostra [como garantir a segurança do CMS](https://strapi.io/documentation/3.0.0-beta.x/concepts/configurations.html#security). Há configurações para XSS, P3P, HSTS, X-Frame-Options (Clickjacking), CORS (muito útil para definir quais domínios podem acessar sua aplicação, quais headers podem ser expostos), IP (é possível configurar quais IPs veem ou não sua aplicação).
- **Injeção de credenciais:** Use um arquivo `.env`, para evitar injetar credenciais no meio do seu código.
- **Validação:** Você pode criar um [middleware](https://medium.com/@prakash.gangurde/how-to-create-a-middleware-for-strapi-f80a24876fc9) para validar que os dados da sua aplicação já existem e não serão duplicados, ou também pode usar uma lib como o [Joi](https://github.com/hapijs/joi) para validar os campos da sua API, mas o Strapi já tem algumas [validações nativas](https://strapi.io/documentation/v3.x/concepts/models.html#define-the-attributes) que você pode definir nos seus modelos de API, somente se usar MongoDB.
- **Roles & Permissions:** O ideal é que você crie documentação para a sua API sobre quais permissões e endpoints você vai habilitar, para não cometer o erro de permitir tudo e oferecer risco aos dados da sua API.
- **Policies:** Você pode [configurar as policies da sua API](https://strapi.io/documentation/3.0.0-beta.x/concepts/policies.html#usage) diretamente no código do Strapi através de `./config/policies` para Policies globais e `./api/**/config/policies` para endpoints locais. É uma camada extra de segurança para sua aplicação Strapi.
- **Data-Leak:** Você pode passar um parâmetro `private: true`, dentro do parâmetro no seu modelo de API, para retirar o valor de ser acessado por qualquer pessoa.
- **JWT:** você pode exigir que o usuário, para acessar endpoints sensíveis da sua aplicação, esteja [logado e use JWT](https://strapi.io/documentation/v3.x/guides/jwt-validation.html#customize-the-jwt-validation-function).
- **Exposição de informações sensíveis:** O Strapi permite [editar os controllers](https://strapi.io/documentation/3.0.0-beta.x/guides/custom-data-response.html), quais informações podem ser acessadas nas chamadas dos endpoints. Você pode apagar certos campos e parâmetros dos resultados.

### No GraphQL

- **DOS (Denial of Service):** Você precisa limitar suas queries. Um hacker malicioso, se descobrir sua API GraphQL, pode montar uma série de queries que podem sobrecarregar seu servidor. Este é um [ótimo artigo](https://www.apollographql.com/blog/securing-your-graphql-api-from-malicious-queries-16130a324a6b) no blog da Apollo que ensina alguns casos de queries maliciosas e como evitá-las.
- **[Configurando Policies para Queries](https://strapi.io/documentation/3.0.0-beta.x/plugins/graphql.html#customise-the-graphql-schema):** Você precisa customizar o Schema da sua API GraphQL, configurando as policies desejadas para ter controle de quem ou como acessar o quê na sua API.
- **Acesso não autorizado:** Você precisa desabilitar o GraphQL Playground, que já é desabilitado na versão de produção do Strapi. Seu endpoint GraphQL não é mantido por uma rota, mas por middleware.

Você precisa criar um [novo middleware](https://strapi.io/documentation/v3.x/concepts/middlewares.html#middlewares), que vai checar se o endpoint que queremos é o `/graphql` e se o usuário autenticado é o que queremos:

```js
module.exports = strapi => {
  return {
    initialize() {
      strapi.app.use(async (ctx, next) => {
        const handleErrors = (ctx, err = undefined, type) => {
          if (ctx.request.graphql === null) {
            return (ctx.request.graphql = strapi.errors[type](err));
          }
          return ctx[type](err);
        };

        // check if it's a graphql request
        if (ctx.request.url === '/graphql' && ctx.request.method === 'POST') {
          if (ctx.request && ctx.request.header && ctx.request.header.authorization) {
            try {
              // get token data
              const { id } = await strapi.plugins['users-permissions']
                .services.jwt.getToken(ctx);

              if (id === undefined) {
                throw new Error('Invalid token: Token did not contain required fields');
              }

              // check if the id match to the user you want
              if (id !== 'my-user-id') {
                return handleErrors(ctx, 'You are not authorized to access to the GraphQL API', 'unauthorized');
              }
            } catch (err) {
              return handleErrors(ctx, err, 'unauthorized');
            }
          } else {
            return handleErrors(ctx, 'You need to be authenticated to request GraphQL API', 'unauthorized');
          }
        }

        await next();
      });
    }
  };
};
```

Para estar autenticado, você precisa enviar um JWT no header. Veja a [documentação de autenticação do Strapi](https://strapi.io/documentation/v3.x/plugins/users-permissions.html#token-usage).

### No Next.js

- **Validando campos:** A validação de campos de formulário não serve apenas para guiar seus usuários, mas também para garantir a integridade das informações transmitidas do cliente para o servidor. Isso impede que uma série de códigos maliciosos seja inserida nos nossos serviços. O usuário ainda pode tentar manipular os dados editando o HTML nas DevTools, mas aí é outro problema.
- **CSRF:** Passar o parâmetro `Content-Type: application/JSON` nas nossas requisições força a nossa aplicação a não usar requisições simples, e protege contra ataques.
- **XSS:** [Este guia da OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html) é muito útil e mostra algumas regras para seguir ao desenvolver nosso front-end. O [next-secure-headers](https://github.com/jagaapple/next-secure-headers) também ajuda a implementar XSS Protection.
- **Security Headers & ClickJacking:** Usando `X-Frame-Options: DENY` ou `SAMEORIGIN`, você impede que terceiros consigam rodar sua aplicação Next.js dentro de um frame. O [plugin next-secure-headers](https://github.com/jagaapple/next-secure-headers) ajuda com FrameGuard, XSS Protection, [Content Security Policy](https://developer.mozilla.org/docs/Web/HTTP/Headers/Content-Security-Policy), [nosniff](https://developer.mozilla.org/docs/Web/HTTP/Headers/X-Content-Type-Options), [noopen](https://developer.mozilla.org/docs/Web/HTTP/Headers/X-Download-Options), [forceHTTPSRedirect](https://developer.mozilla.org/docs/Web/HTTP/Headers/Strict-Transport-Security), [referrerPolicy](https://developer.mozilla.org/docs/Web/HTTP/Headers/Referrer-Policy), [expectCT](https://developer.mozilla.org/docs/Web/HTTP/Headers/Expect-CT).
- **JWT & Rolling Tokens:** Você pode implementar JWT para a autenticação da sua aplicação, para garantir a integridade da sua API e o acesso a ela. [Este é um bom tutorial](https://medium.com/@xfor/apollo-next-js-refresh-token-authentication-flow-15e5f45df5a3).

**Mais:** [NextAuth.js](https://next-auth.js.org/), um plugin para ajudar você com segurança na autenticação do seu app Next.js.

## SSL

Um passo antes de publicarmos nosso site em produção é configurar nosso domínio e servidor para o protocolo HTTPS. O HTTPS protege nossas requisições de serem alvo de ataques Man In the Middle e também é crucial para SEO, pois impacta o ranking do Google.

Algumas formas de obter certificados SSL gratuitos para o seu site é usar o serviço de:

- [Let's Encrypt](https://letsencrypt.org/)
- [SSL For Free](https://www.sslforfree.com/)
- [AWS Certificate Manager](https://aws.amazon.com/certificate-manager/)
- [ZeroSSL](https://zerossl.com/)
- [Cloudflare SSL](https://www.cloudflare.com/ssl/)

## Cache de API

Embora não seja apenas uma preocupação com segurança, mas também com performance, o cache de API pode ser recomendado para que seu site possa funcionar mesmo em ambientes offline. Quando se trata de dados dinâmicos, acaba não sendo recomendado, apenas para dados que não mudam constantemente. Algumas leituras:

- [Web.dev: Cache API Quick Guide](https://web.dev/cache-api-quick-guide/)
- [Amazon API Gateway: API Caching](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-caching.html)
- [Using Cloudflare with your API](https://support.cloudflare.com/hc/en-us/articles/200504045-Using-Cloudflare-with-your-API)
- [GraphQL Caching](https://graphql.org/learn/caching/)

## Ferramentas de checagem

Existem alguns sites e ferramentas na web que testam o quão segura é a nossa aplicação:

- **[Sentry](https://sentry.io/)**: monitoramento de erros. Integra-se com [GraphQL](https://github.com/BrunoScheufler/graphql-middleware-sentry), [Strapi](https://strapi.io/documentation/3.0.0-beta.x/guides/error-catching.html) ou [Next.js](https://leerob.io/blog/configuring-sentry-for-nextjs-apps). Plano gratuito para desenvolvedores.
- **Sqreen**: plataforma de monitoramento de segurança. Pode trazer dados em tempo real de exploits em potencial, proteger você de ataques e atividades maliciosas. O Strapi suporta Sqreen nativamente; o Next.js precisa de um servidor customizado.
- **[LGTM](https://lgtm.com/)**: ferramenta open-source de análise estática usada por Google, Microsoft, NASA, Dell. Checa vulnerabilidades no GitHub ou BitBucket. Tem code review automático e alertas poderosos.
- **[SonarCloud](https://sonarcloud.io/)**: checa bugs e vulnerabilidades, além de manutenibilidade do código, cobertura de testes, code smells, duplicação. Pode barrar um PR/MR no GitHub, GitLab, Azure DevOps ou BitBucket se não atingir a qualidade de código esperada.
- **[Mozilla Observatory](https://observatory.mozilla.org/)**: insights sobre a segurança do seu site.
- **[DigiCert SSL Tools](https://ssltools.digicert.com/checker/views/checkInstallation.jsp)**: dados de certificado SSL, vulnerabilidades, cadeia de certificados, configuração do servidor.
- **[Qualys SSL Labs](https://www.ssllabs.com/ssltest)**: testes de SSL mais completos que a DigiCert.
- **[Pen-test Tool: Website Vulnerability](https://pentest-tools.com/website-vulnerability-scanning/website-scanner)**: SQL Injection, XSS, file inclusion, remote command execution (pago).
- **[Sucuri SiteChecker](https://sitecheck.sucuri.net/)**: checa se o seu site está blacklisted no Google, tem links inseguros, etc.

A intenção deste artigo foi dar uma ideia geral de como mitigar e resolver vários problemas de segurança e vulnerabilidade em aplicações web com Next.js e Strapi antes de você começar a usar a stack. Os conceitos mencionados aqui se aplicam a qualquer aplicação web que use APIs REST ou GraphQL.

## Referências

- [Strapi Vulnerabilities](https://snyk.io/vuln/npm:strapi)
- [Vulnerabilities in Next.js](https://vulmon.com/searchpage.php?q=next.js&sortby=byrelevance&remote=on&local=on&physical=on&nanalyzed=on)
- [Cross Site Scripting Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [Clickjacking](https://www.imperva.com/learn/application-security/clickjacking/)
- [Securing your GraphQL API from Malicious Queries](https://www.apollographql.com/blog/securing-your-graphql-api-from-malicious-queries-16130a324a6b)
- [GraphQL NoSQL Injection through JSON Types](http://www.petecorey.com/blog/2017/06/12/graphql-nosql-injection-through-json-types/)
- [GraphQL Injection](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/GraphQL%20Injection)
