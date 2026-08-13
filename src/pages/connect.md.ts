import type { APIRoute } from "astro";
import { CONNECT_EN } from "../lib/data/connect";
import { MARKDOWN_HEADERS, connectMarkdown } from "../lib/markdown-doc";

export const prerender = true;

export const GET: APIRoute = () =>
  new Response(connectMarkdown(CONNECT_EN, "en"), { headers: MARKDOWN_HEADERS });
