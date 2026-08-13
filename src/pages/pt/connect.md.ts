import type { APIRoute } from "astro";
import { CONNECT_PT } from "../../lib/data/connect";
import { MARKDOWN_HEADERS, connectMarkdown } from "../../lib/markdown-doc";

export const prerender = true;

export const GET: APIRoute = () =>
  new Response(connectMarkdown(CONNECT_PT, "pt"), { headers: MARKDOWN_HEADERS });
