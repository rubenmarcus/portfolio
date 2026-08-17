/**
 * GET /api/resume.txt — the terminal resume. curl rubenmarcus.dev gets this
 * same payload straight from src/middleware.ts (and, for prerendered pages,
 * from the routing layer via scripts/vercel-route-policy.mjs).
 */
export const prerender = false;

import type { APIRoute } from "astro";
import { terminalResumeResponse } from "../../lib/terminal-resume";

export const GET: APIRoute = () => terminalResumeResponse();
