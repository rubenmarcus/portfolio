/**
 * GET /api/resume.json — machine-readable CV for agents and crawlers.
 * Linked from llms.txt and the /connect page. Data comes from the shared
 * src/lib/resume.ts module (same source as the MCP get_resume tool).
 */
export const prerender = false;

import type { APIRoute } from "astro";
import { AVAILABILITY, RESUME, SERVICES } from "../../lib/resume";

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        name: RESUME.name,
        role: RESUME.role,
        base: RESUME.base,
        years_experience: RESUME.yearsExperience,
        summary: RESUME.summary,
        availability: AVAILABILITY,
        services: SERVICES,
        proof: RESUME.proof,
        experience: RESUME.experience,
        skills: RESUME.skills,
        education: RESUME.education,
        open_source: RESUME.openSource,
        links: RESUME.links,
        contact: {
          github: RESUME.links.github,
          linkedin: RESUME.links.linkedin,
          hire_api: "https://rubenmarcus.dev/api/hire",
          mcp: "https://rubenmarcus.dev/api/mcp",
        },
      },
      null,
      2,
    ),
    {
      headers: {
        "content-type": "application/json",
        "access-control-allow-origin": "*",
        "cache-control": "public, max-age=3600",
      },
    },
  );
