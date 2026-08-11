/**
 * Stable translation keys and locale-specific public slugs for the blog.
 * English content IDs remain the internal keys and asset names.
 */
export const PT_BLOG_SLUGS: Record<string, string> = {
  "aeo-what-it-moves": "como-aeo-pode-fazer-seu-negocio-crescer",
  "agent-command-center": "centro-de-comando-para-swarms-de-agentes-em-markdown",
  "agents-welcome-portfolio": "este-portfolio-e-agent-first",
  "automating-entire-workflows-with-ralph-starter": "automatizando-fluxos-de-trabalho-com-ralph-starter",
  "autoresearcher-pareto-frontier": "mantendo-um-agente-de-pesquisa-autonomo-honesto",
  "context-engineering": "context-engineering-em-um-runtime-com-344k-chats",
  "cs-brasil-ai-harness": "harness-de-ia-por-tras-do-cs-brasil",
  "dag-agent-orchestration": "git-worktrees-como-orquestrador-de-agentes",
  "evals-are-the-product": "evals-sao-o-produto",
  "from-prompt-to-product-five-ways-to-build-with-ai": "do-prompt-ao-produto-cinco-formas-de-desenvolver-com-ia",
  "frontend-ai-harness-prompt-to-pull-request": "meu-harness-de-ia-para-frontend-do-prompt-ao-pull-request",
  "getting-started-with-next-js-strapi-security-first": "comecando-com-next-js-e-strapi-seguranca-em-primeiro-lugar",
  "how-i-hit-1-qec-using-ai": "como-cheguei-ao-primeiro-lugar-em-correcao-de-erros-quanticos-com-ia",
  "i-built-my-portfolio-with-a-fleet-of-ai-agents": "como-construi-este-portfolio-com-agentes-de-ia",
  "inside-the-gauntlet-loop": "por-dentro-do-gauntlet-loop",
  "llm-cross-pollination": "polinizacao-cruzada-de-llms-revisao-por-pares-para-maquinas",
  "mastra-field-notes": "reescrevi-meu-loop-de-agente-em-mastra",
  "mini-shai-hulud-dependency-risk": "mini-shai-hulud-e-o-risco-real-das-dependencias",
  "openrouter-routing": "roteando-papeis-de-agente-entre-providers-com-openrouter",
  "rag-in-production": "como-o-rag-funciona-dentro-do-mirofi-sh",
  "shipping-a-browser-fps": "construindo-um-fps-de-navegador-com-agentes-de-ia",
  "the-agent-swarm-that-took-1-on-ecdsa-fail": "o-swarm-que-chegou-ao-primeiro-lugar-no-ecdsa-fail",
  "vercel-ai-sdk-streaming": "streaming-de-2-85-milhoes-de-mensagens-com-vercel-ai-sdk",
  "why-use-next-js-strapi": "por-que-usar-next-js-e-strapi",
};

const EN_BY_PT_SLUG = new Map(
  Object.entries(PT_BLOG_SLUGS).map(([translationKey, slug]) => [slug, translationKey]),
);

export const getBlogSlug = (locale: "en" | "pt", translationKey: string) =>
  locale === "pt" ? (PT_BLOG_SLUGS[translationKey] ?? translationKey) : translationKey;

export const getBlogPaths = (translationKey: string) => ({
  en: `/blog/${getBlogSlug("en", translationKey)}`,
  pt: `/pt/blog/${getBlogSlug("pt", translationKey)}`,
});

export const getBlogPathsFromPathname = (pathname: string) => {
  const normalized = pathname.replace(/\/$/, "");
  const match = normalized.match(/^\/(pt\/)?blog\/([^/]+)$/);
  if (!match) return null;

  const isPt = Boolean(match[1]);
  const visibleSlug = match[2];
  const translationKey = isPt ? (EN_BY_PT_SLUG.get(visibleSlug) ?? visibleSlug) : visibleSlug;
  return getBlogPaths(translationKey);
};

export const PT_BLOG_REDIRECTS = Object.fromEntries(
  Object.entries(PT_BLOG_SLUGS).map(([translationKey, slug]) => [
    `/pt/blog/${translationKey}`,
    `/pt/blog/${slug}`,
  ]),
);
