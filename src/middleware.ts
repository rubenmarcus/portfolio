/**
 * curl easter egg — browsers get the site, terminals get the resume.
 * Explicit terminal clients (curl, wget, httpie) hitting a page route
 * get the plain-text resume instead of HTML.
 */
import { defineMiddleware } from "astro:middleware";

const PAGE = /^\/(|pt)(\/(portfolio|ai|lab|blog|about|contact|connect|agents)?)?\/?$/;
const TERMINAL = /curl|wget|httpie|libcurl/i;

export const onRequest = defineMiddleware(async (ctx, next) => {
  const ua = ctx.request.headers.get("user-agent") ?? "";
  if (TERMINAL.test(ua) && PAGE.test(ctx.url.pathname)) {
    return ctx.rewrite("/api/resume.txt");
  }
  return next();
});
