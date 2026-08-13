/**
 * Helpers for the `.md` twin of a page — the plain-Markdown copy an agent can
 * fetch instead of parsing the rendered HTML (`/blog/foo` → `/blog/foo.md`).
 */
import type { CollectionEntry } from "astro:content";
import { getBlogPaths } from "./blog-routes";
import type { ConnectContent } from "./data/connect";
import { MCP_URL } from "./data/connect";

export const ORIGIN = "https://www.rubenmarcus.dev";

export type MarkdownFrontmatter = Record<string, string | string[] | undefined>;

/**
 * Serializes frontmatter + body into a standalone Markdown document. Values are
 * JSON-quoted because titles routinely contain colons and quotes, which would
 * otherwise produce invalid YAML.
 */
export const markdownDocument = (frontmatter: MarkdownFrontmatter, body: string) => {
  const lines = Object.entries(frontmatter)
    .filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0))
    .map(([key, value]) =>
      Array.isArray(value)
        ? `${key}: [${value.map((item) => JSON.stringify(item)).join(", ")}]`
        : `${key}: ${JSON.stringify(value)}`,
    );

  return `---\n${lines.join("\n")}\n---\n\n${body.trim()}\n`;
};

/**
 * Only honoured for on-demand responses — prerendered `.md` files are typed by
 * the host from their extension. Kept so both paths agree.
 */
export const MARKDOWN_HEADERS = {
  "content-type": "text/markdown; charset=utf-8",
  "cache-control": "public, max-age=3600",
};

/**
 * A blog post as a standalone document: the raw body it was authored from, plus
 * enough frontmatter for an agent to cite it (canonical URL, language, dates)
 * and to find the other language without a second request.
 */
export const blogPostMarkdown = (
  post: CollectionEntry<"blog"> | CollectionEntry<"blogPt">,
  locale: "en" | "pt",
) => {
  const paths = getBlogPaths(post.id);

  return markdownDocument(
    {
      title: post.data.title,
      description: post.data.description,
      language: locale === "pt" ? "pt-BR" : "en",
      published: post.data.date.toISOString(),
      updated: post.data.updated?.toISOString(),
      tags: post.data.tags,
      source: new URL(paths[locale], ORIGIN).href,
      // Syndicated posts point their canonical at dev.to/LinkedIn.
      canonical: post.data.canonical,
      translation: new URL(locale === "pt" ? paths.en : paths.pt, ORIGIN).href,
    },
    post.body ?? "",
  );
};

const CONNECT_LABELS = {
  en: {
    setup: "Setup by client",
    prompts: "Try asking your agent",
    plainHttp: "Prefer plain HTTP?",
    resume: "returns the machine-readable CV",
    hire: "takes a project brief",
  },
  pt: {
    setup: "Configuração por client",
    prompts: "Peça isto ao seu agent",
    plainHttp: "Prefere HTTP puro?",
    resume: "devolve o CV legível por máquina",
    hire: "recebe um brief de projeto",
  },
} as const;

/** The /connect page as Markdown — same steps, tools and prompts, no HTML. */
export const connectMarkdown = (content: ConnectContent, locale: "en" | "pt") => {
  const label = CONNECT_LABELS[locale];
  const path = locale === "pt" ? "/pt/connect" : "/connect";
  const other = locale === "pt" ? "/connect" : "/pt/connect";

  const body = [
    `# ${content.headline}`,
    "",
    content.intro,
    "",
    `## ${content.endpointLabel}`,
    "",
    "```",
    MCP_URL,
    "```",
    "",
    `## ${label.setup}`,
    "",
    ...content.clients.flatMap((client) => [
      `### ${client.name}`,
      "",
      ...client.steps.map(
        (step, index) => `${index + 1}. ${step.text}${step.url ? ` \`${MCP_URL}\`` : ""}`,
      ),
      "",
    ]),
    `## ${content.toolsHeading}`,
    "",
    ...content.tools.map((tool) => `- \`${tool.name}\` — ${tool.desc}`),
    "",
    ...(content.prompts?.length
      ? [`## ${label.prompts}`, "", ...content.prompts.map((prompt) => `- ${prompt}`), ""]
      : []),
    `## ${label.plainHttp}`,
    "",
    `- \`GET ${ORIGIN}/api/resume.json\` — ${label.resume}`,
    `- \`POST ${ORIGIN}/api/hire\` — ${label.hire}`,
  ].join("\n");

  return markdownDocument(
    {
      title: content.title,
      description: content.description,
      language: locale === "pt" ? "pt-BR" : "en",
      source: `${ORIGIN}${path}`,
      translation: `${ORIGIN}${other}`,
      mcp_endpoint: MCP_URL,
    },
    body,
  );
};
