---
title: "Getting started with Next.js + Strapi: Security first"
description: "Before touching Content-Types or routes, talk about security. This is the security playbook for a Strapi + Next.js stack — XSS, CSRF, clickjacking, JWT, SSL, monitoring."
date: 2021-05-16
readTime: "10 min"
tags: ["nextjs", "frontend", "strapi", "security"]
cover: "https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fa4baw8889wg224j7laly.jpg"
canonical: "https://dev.to/rubenmarcus/getting-started-with-next-js-strapi-security-first-3380"
reactions: 28
---

## Why worry about Security?

Before starting to see about Strapi's Content-Types, before looking at Next.js' file and route structure, it's good to discuss Security.

A concern that usually is not followed up with due attention in certain teams, and that can cause a very high cost, when a project is put into production.

This article is another introductory article to the Next.js + Strapi stack, we will also cover TypeScript, Data Fetch, Layouts, CI / CD and Deploy, but first of all we will cover security.

Below we will discuss, the most common security errors in web applications and how to mitigate or fix them in our Strapi + Next.js application:

**XSS / CSRF:**
XSS or Cross Site Scripting, is a malicious technique to inject code into our application and circumvent security to hijack data or manipulate a user's session for example.

**CSRF** or Cross-site request forgery, is when someone uses a malicious technique to get through a request either via Postman or browser to reach our database, delete user data for example, steal session data (like credit card, addresses, etc.) among other things.

**Click Jacking:**
Do you know when you open pages that tend to trick the user into typing data and in the end they end up sending that data to people they want to use maliciously? Or that they may have malware or exploits and install them on the user's machine?

## Common vulnerabilities in REST APIs

- **DOS & DDOS (Denial of Service):** When a hacker wants to take down an API, application or website, he can fire bulk requests for that API or endpoint. Exposure of Sensitive Information: When we expose sensitive user data, especially without encryption in our API. Ids, emails, addresses, payment information, etc.
- **MIM (Man in the Middle) attacks:** When a hacker tries to intercept client and server communication, with the intention of stealing data.
- **SQL Injection:** Injection of code that changes the expected behavior of the API and the Database. Through an injection, a hacker is able to steal information, break the API, change its operation.
- **Insecure Direct Object References:** When you expose an API with endpoints like `/user/id/30`, and a user tries to access an ID that does not belong to it, and succeeds, you are exposing Direct References for insecure objects.

## Common vulnerabilities in GraphQL APIs

- **`/graphql?query={__schema{types{name,fields{name}}}}`:** If your GraphQL API is public, only with a query like this, the user who uses it, can see the entire schema of your API.
- **Malicious Queries:** Hackers can mount malicious queries, whether to steal data, corrupt your database, or bring down your API / server.
- **Brute-Force:** To avoid problems with hackers trying to break the data in your GraphQL API, you can use plugins like [GraphQL Rate Limit](https://github.com/teamplanes/graphql-rate-limit), which will limit how many times the vulnerable fields of your query can be executed in a time interval.

## How to avoid all this?

### On Strapi

- **Understanding the Strapi Configuration file & its security:** Strapi has rich documentation that shows us [how to guarantee the security of the CMS](https://strapi.io/documentation/3.0.0-beta.x/concepts/configurations.html#security). It has configurations for XSS, P3P, HSTS, X-Frame-Options (Clickjacking), CORS (very useful to define which domains can access your application, which headers can be exposed), IP (can configure which IPs see or not your application).
- **Credential Injection:** Use a `.env` file, to avoid injecting credentials in the middle of your code.
- **Validation:** You can create a [middleware](https://medium.com/@prakash.gangurde/how-to-create-a-middleware-for-strapi-f80a24876fc9) to validate that your application data already exists and will not be duplicated, or you can also use a lib like [Joi](https://github.com/hapijs/joi), to validate your API fields, but Strapi already has some [native validations](https://strapi.io/documentation/v3.x/concepts/models.html#define-the-attributes) that you can define in your API models, only if you use MongoDB.
- **Roles & Permissions:** Ideally, you should create documentation for your API on which permissions and endpoints you will enable so that you don't end up making the mistake of allowing everything and offering risk to your API data.
- **Policies:** You can [set your API's policies](https://strapi.io/documentation/3.0.0-beta.x/concepts/policies.html#usage) directly in Strapi's code through `./config/policies` for global Policies and `./api/**/config/policies` for local endpoints. It is an extra layer of security for your Strapi application.
- **Data-Leak:** You can pass a `private: true` parameter, within the parameter in your API model, to remove the value of being accessed by anyone.
- **JWT:** you can require the user to access sensitive endpoints of your application to be [logged in and use JWT](https://strapi.io/documentation/v3.x/guides/jwt-validation.html#customize-the-jwt-validation-function).
- **Exposure of Sensitive Information:** Strapi allows you to [edit the controllers](https://strapi.io/documentation/3.0.0-beta.x/guides/custom-data-response.html), which information can be accessed in the calls of the endpoints. You can delete certain fields and parameters from the results.

### In GraphQL

- **DOS (Denial of Service):** You need to limit your queries. A malicious hacker, if they discover your GraphQL API, can mount a series of queries that can overload your server. This is a [great article](https://www.apollographql.com/blog/securing-your-graphql-api-from-malicious-queries-16130a324a6b) on the Apollo blog that teaches some cases of malicious queries and how to avoid them.
- **[Setting Policies for Queries](https://strapi.io/documentation/3.0.0-beta.x/plugins/graphql.html#customise-the-graphql-schema):** You have to customize the Schema of your GraphQL API, setting the desired policies to have control of who or how to access what in your API.
- **Unauthorized access:** You need to disable the GraphQL Playground, which is already disabled in the production version of Strapi. Your GraphQL endpoint is not maintained by a route but by middleware.

You need to create a [new middleware](https://strapi.io/documentation/v3.x/concepts/middlewares.html#middlewares), which will check if the endpoint we want is `/graphql` and if the authenticated user is what we want:

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

To be authenticated you need to send a JWT in the header. See [Strapi's authentication documentation](https://strapi.io/documentation/v3.x/plugins/users-permissions.html#token-usage).

### In Next.js

- **Validating fields:** The validation of form fields is not only used to guide your users, but also to guarantee the integrity of the information transmitted from the client to the server. This prevents a series of malicious codes from being entered into our services. The user can still try to manipulate the data by editing the HTML in DevTools, but that is another problem.
- **CSRF:** Passing the parameter `Content-Type: application/JSON` in our requests, forces our application not to use simple requests, and protects against attacks.
- **XSS:** [This OWASP guide](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html) is very useful and shows some rules to follow when developing our front-end. [next-secure-headers](https://github.com/jagaapple/next-secure-headers) also helps to implement XSS Protection.
- **Security Headers & ClickJacking:** Using `X-Frame-Options: DENY` or `SAMEORIGIN`, you prevent third parties from being able to run your Next.js application within a frame. The [next-secure-headers plugin](https://github.com/jagaapple/next-secure-headers) helps with FrameGuard, XSS Protection, [Content Security Policy](https://developer.mozilla.org/docs/Web/HTTP/Headers/Content-Security-Policy), [nosniff](https://developer.mozilla.org/docs/Web/HTTP/Headers/X-Content-Type-Options), [noopen](https://developer.mozilla.org/docs/Web/HTTP/Headers/X-Download-Options), [forceHTTPSRedirect](https://developer.mozilla.org/docs/Web/HTTP/Headers/Strict-Transport-Security), [referrerPolicy](https://developer.mozilla.org/docs/Web/HTTP/Headers/Referrer-Policy), [expectCT](https://developer.mozilla.org/docs/Web/HTTP/Headers/Expect-CT).
- **JWT & Rolling Tokens:** You can implement JWT for the authentication of your App to guarantee the integrity of your API and access to it. [This is a good tutorial](https://medium.com/@xfor/apollo-next-js-refresh-token-authentication-flow-15e5f45df5a3).

**More:** [NextAuth.js](https://next-auth.js.org/) — a plugin to help you with security in the authentication of your Next.js app.

## SSL

One step before we publish our site for production is to set our domain and server to the HTTPS protocol. HTTPS protects our requests from being targeted by Man In the Middle attacks and is also crucial for SEO as it impacts Google's ranking.

Some ways to get free SSL certificates for your website are to use the service of:

- [Let's Encrypt](https://letsencrypt.org/)
- [SSL For Free](https://www.sslforfree.com/)
- [AWS Certificate Manager](https://aws.amazon.com/certificate-manager/)
- [ZeroSSL](https://zerossl.com/)
- [Cloudflare SSL](https://www.cloudflare.com/ssl/)

## API Caching

Although it is not only a concern with security but also with performance, API caching can be recommended so that your site can work even in offline environments. When it comes to dynamic data it ends up being not recommended, only for data that does not constantly change. Some reading:

- [Web.dev: Cache API Quick Guide](https://web.dev/cache-api-quick-guide/)
- [Amazon API Gateway: API Caching](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-caching.html)
- [Using Cloudflare with your API](https://support.cloudflare.com/hc/en-us/articles/200504045-Using-Cloudflare-with-your-API)
- [GraphQL Caching](https://graphql.org/learn/caching/)

## Checking tools

There are some sites and tools on the web that test how secure our application is:

- **[Sentry](https://sentry.io/)** — error monitoring. Integrates with [GraphQL](https://github.com/BrunoScheufler/graphql-middleware-sentry), [Strapi](https://strapi.io/documentation/3.0.0-beta.x/guides/error-catching.html) or [Next.js](https://leerob.io/blog/configuring-sentry-for-nextjs-apps). Free tier for developers.
- **Sqreen** — security monitoring platform. Can bring real-time data from potential exploits, protect you from attacks and malicious activities. Strapi supports Sqreen natively; Next.js needs a custom server.
- **[LGTM](https://lgtm.com/)** — open-source static analysis tool used by Google, Microsoft, NASA, Dell. Checks for vulnerabilities on GitHub or BitBucket. Has automatic code review and powerful alerts.
- **[SonarCloud](https://sonarcloud.io/)** — checks for bugs and vulnerabilities, plus code maintainability, test coverage, codesmells, duplication. Can stop a PR/MR on GitHub, GitLab, Azure DevOps, or BitBucket if it does not reach the expected code quality.
- **[Mozilla Observatory](https://observatory.mozilla.org/)** — insights about the security of your website.
- **[DigiCert SSL Tools](https://ssltools.digicert.com/checker/views/checkInstallation.jsp)** — SSL certificate data, vulnerabilities, certificate chain, server configuration.
- **[Qualys SSL Labs](https://www.ssllabs.com/ssltest)** — more complete SSL testing than DigiCert.
- **[Pen-test Tool: Website Vulnerability](https://pentest-tools.com/website-vulnerability-scanning/website-scanner)** — SQL Injection, XSS, file inclusion, remote command execution (paid).
- **[Sucuri SiteChecker](https://sitecheck.sucuri.net/)** — checks if your site is blacklisted on Google, has unsafe links, etc.

The intent of this article was to give a general idea of how to mitigate and solve various security and vulnerability problems in web applications with Next.js and Strapi before you start using the stack. The concepts mentioned here apply to any web application using REST or GraphQL APIs.

## References

- [Strapi Vulnerabilities](https://snyk.io/vuln/npm:strapi)
- [Vulnerabilities in Next.js](https://vulmon.com/searchpage.php?q=next.js&sortby=byrelevance&remote=on&local=on&physical=on&nanalyzed=on)
- [Cross Site Scripting Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [Clickjacking](https://www.imperva.com/learn/application-security/clickjacking/)
- [Securing your GraphQL API from Malicious Queries](https://www.apollographql.com/blog/securing-your-graphql-api-from-malicious-queries-16130a324a6b)
- [GraphQL NoSQL Injection through JSON Types](http://www.petecorey.com/blog/2017/06/12/graphql-nosql-injection-through-json-types/)
- [GraphQL Injection](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/GraphQL%20Injection)
