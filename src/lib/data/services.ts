export type Locale = "en" | "pt";

export interface ServiceOffer {
  slug: "ai-product-systems" | "ai-native-frontend" | "aeo";
  icon: "mcp" | "react" | "eye";
  name: Record<Locale, string>;
  summary: Record<Locale, string>;
  fit: Record<Locale, string>;
  duration: Record<Locale, string>;
  tags: string[];
  deliverables: Record<Locale, string[]>;
  proof: Record<Locale, Array<{ label: string; value: string }>>;
}

export const serviceOffers: ServiceOffer[] = [
  {
    slug: "ai-product-systems",
    icon: "mcp",
    name: {
      en: "AI products & agent systems",
      pt: "Produtos de IA & sistemas de agents",
    },
    summary: {
      en: "Turn an AI idea or brittle prototype into a product with an operating harness, evals, observability, and a path to production.",
      pt: "Transforme uma ideia de IA ou protótipo frágil em produto com harness operacional, evals, observabilidade e caminho até produção.",
    },
    fit: {
      en: "For founders and engineering teams shipping agentic workflows, RAG, internal tools, or AI-native products.",
      pt: "Para founders e times de engenharia entregando workflows agênticos, RAG, ferramentas internas ou produtos AI-native.",
    },
    duration: { en: "Typical engagement: 3–8 weeks", pt: "Engajamento típico: 3–8 semanas" },
    tags: ["agents", "RAG", "evals"],
    deliverables: {
      en: [
        "Architecture and risk map",
        "Working product slice or production hardening",
        "Model routing, tool contracts, and eval suite",
        "Observability, cost controls, and handoff documentation",
      ],
      pt: [
        "Arquitetura e mapa de riscos",
        "Fatia funcional do produto ou hardening para produção",
        "Roteamento de modelos, contratos de tools e suíte de evals",
        "Observabilidade, controle de custos e documentação de handoff",
      ],
    },
    proof: {
      en: [
        { value: "#1", label: "ECDSA.fail and QEC benchmark results" },
        { value: "9", label: "specialist roles in one autonomous harness" },
        { value: "7+", label: "model providers routed with fallbacks" },
      ],
      pt: [
        { value: "#1", label: "resultados nos benchmarks ECDSA.fail e QEC" },
        { value: "9", label: "papéis especialistas em um harness autônomo" },
        { value: "7+", label: "providers roteados com fallbacks" },
      ],
    },
  },
  {
    slug: "ai-native-frontend",
    icon: "react",
    name: {
      en: "AI-native frontend & design engineering",
      pt: "Frontend AI-native & design engineering",
    },
    summary: {
      en: "Build or modernize a distinctive web product with senior frontend engineering and an AI delivery harness that preserves quality.",
      pt: "Construa ou modernize um produto web distinto com engenharia frontend sênior e um harness de entrega com IA que preserva qualidade.",
    },
    fit: {
      en: "For product teams that need a premium interface, an interactive experience, or a reliable React, Next.js, Svelte, or Astro delivery system.",
      pt: "Para times de produto que precisam de interface premium, experiência interativa ou entrega confiável em React, Next.js, Svelte ou Astro.",
    },
    duration: { en: "Typical engagement: 2–6 weeks", pt: "Engajamento típico: 2–6 semanas" },
    tags: ["React / Svelte", "Three.js", "visual QA"],
    deliverables: {
      en: [
        "Product and interaction architecture",
        "Responsive, accessible production implementation",
        "Performance budget and Core Web Vitals gates",
        "Visual regression and repository-aware AI workflow",
      ],
      pt: [
        "Arquitetura de produto e interação",
        "Implementação responsiva, acessível e pronta para produção",
        "Budget de performance e gates de Core Web Vitals",
        "Regressão visual e workflow de IA consciente do repositório",
      ],
    },
    proof: {
      en: [
        { value: "14+", label: "years shipping web products" },
        { value: "3D", label: "Three.js, WebGL, shaders, and interaction" },
        { value: "2.1K", label: "CS Brasil alpha players" },
      ],
      pt: [
        { value: "14+", label: "anos entregando produtos web" },
        { value: "3D", label: "Three.js, WebGL, shaders e interação" },
        { value: "2,1K", label: "jogadores no alpha do CS Brasil" },
      ],
    },
  },
  {
    slug: "aeo",
    icon: "eye",
    name: { en: "AEO audit & implementation", pt: "Auditoria & implementação de AEO" },
    summary: {
      en: "Make a site legible, trustworthy, and citable to answer engines—from crawl policy and entities to content, evidence, and machine-readable delivery.",
      pt: "Torne um site legível, confiável e citável por answer engines — de políticas de crawl e entidades a conteúdo, evidência e entrega machine-readable.",
    },
    fit: {
      en: "For companies whose expertise should appear in AI answers, but whose current site is difficult for crawlers and models to interpret or cite.",
      pt: "Para empresas cuja expertise deveria aparecer em respostas de IA, mas cujo site ainda é difícil para crawlers e modelos interpretarem ou citarem.",
    },
    duration: { en: "Typical engagement: 2–4 weeks", pt: "Engajamento típico: 2–4 semanas" },
    tags: ["entities", "structured data", "citations"],
    deliverables: {
      en: [
        "Technical SEO/AEO and entity audit",
        "robots, sitemap, canonical, hreflang, and structured-data fixes",
        "llms.txt, AI index, content hierarchy, and citation surfaces",
        "Measurement plan, implementation, and verification report",
      ],
      pt: [
        "Auditoria técnica de SEO/AEO e entidades",
        "Correções de robots, sitemap, canonical, hreflang e structured data",
        "llms.txt, AI index, hierarquia de conteúdo e superfícies de citação",
        "Plano de medição, implementação e relatório de verificação",
      ],
    },
    proof: {
      en: [
        { value: "AEO.js", label: "framework and site export tooling" },
        { value: "AEO Checker", label: "scanner for actionable site diagnostics" },
        { value: "EN/PT", label: "canonical bilingual publishing system" },
      ],
      pt: [
        { value: "AEO.js", label: "framework e tooling de exportação" },
        { value: "AEO Checker", label: "scanner para diagnóstico acionável" },
        { value: "EN/PT", label: "sistema canônico de publicação bilíngue" },
      ],
    },
  },
];

export const getService = (slug: string) => serviceOffers.find((service) => service.slug === slug);
