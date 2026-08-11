export interface OutcomeCaseStudy {
  slug: "ralph-starter" | "aeo-platform" | "cs-brasil";
  projectSlug: string;
  index: string;
  title: { en: string; pt: string };
  description: { en: string; pt: string };
  overline: { en: string; pt: string };
  heading: { en: string; pt: string };
  lede: { en: string; pt: string };
  meta: { en: Array<{ label: string; value: string }>; pt: Array<{ label: string; value: string }> };
  stats: { en: Array<{ value: string; label: string; sub: string }>; pt: Array<{ value: string; label: string; sub: string }> };
  challenge: { en: string; pt: string };
  system: { en: string[]; pt: string[] };
  outcome: { en: string; pt: string };
  links: Array<{ label: string; href: string }>;
}

export const outcomeCaseStudies: OutcomeCaseStudy[] = [
  {
    slug: "ralph-starter",
    projectSlug: "ralph-starter",
    index: "03",
    title: { en: "Ralph Starter · Case study", pt: "Ralph Starter · Estudo de caso" },
    description: {
      en: "How Ralph Starter turns AI coding from an open-ended chat into an isolated, verifiable multi-agent delivery system.",
      pt: "Como o Ralph Starter transforma coding com IA de chat aberto em um sistema multi-agent isolado e verificável de entrega.",
    },
    overline: { en: "Case study — agent orchestration", pt: "Estudo de caso — orquestração de agents" },
    heading: { en: "A delivery harness, not another chat window.", pt: "Um harness de entrega, não outra janela de chat." },
    lede: {
      en: "Ralph Starter packages the operating system around AI coding: specs, isolated worktrees, race and consensus modes, integrations, verification, and a clean path back into a real repository.",
      pt: "Ralph Starter empacota o sistema operacional ao redor do coding com IA: specs, worktrees isoladas, modos race e consensus, integrações, verificação e um caminho limpo de volta ao repositório real.",
    },
    meta: {
      en: [{ label: "Role", value: "Creator / AI engineering" }, { label: "Period", value: "2026 — present" }, { label: "Surface", value: "CLI + MCP" }, { label: "Status", value: "Production" }],
      pt: [{ label: "Papel", value: "Criador / AI engineering" }, { label: "Período", value: "2026 — presente" }, { label: "Superfície", value: "CLI + MCP" }, { label: "Status", value: "Produção" }],
    },
    stats: {
      en: [{ value: "100+", label: "Daily downloads", sub: "Public npm adoption" }, { value: "3", label: "Swarm modes", sub: "Race · consensus · pipeline" }, { value: "4", label: "Integrations", sub: "Figma · GitHub · Linear · Notion" }, { value: "1", label: "Delivery contract", sub: "Spec → isolated work → verified merge" }],
      pt: [{ value: "100+", label: "Downloads diários", sub: "Adoção pública no npm" }, { value: "3", label: "Modos de swarm", sub: "Race · consensus · pipeline" }, { value: "4", label: "Integrações", sub: "Figma · GitHub · Linear · Notion" }, { value: "1", label: "Contrato de entrega", sub: "Spec → trabalho isolado → merge verificado" }],
    },
    challenge: {
      en: "Raw model capability was not the bottleneck. The hard part was making parallel agents useful inside repositories where collisions, stale context, unverifiable claims, and unbounded token use can erase the speed advantage.",
      pt: "Capacidade bruta do modelo não era o gargalo. A parte difícil era tornar agents paralelos úteis em repositórios onde colisões, contexto velho, afirmações não verificadas e uso ilimitado de tokens podem apagar a vantagem de velocidade.",
    },
    system: {
      en: ["Specs define outcome, constraints, acceptance checks, and ownership before work starts.", "Each worker runs in an isolated git worktree so parallel attempts remain comparable and recoverable.", "Race, consensus, and pipeline modes match the collaboration pattern to the problem instead of treating every task alike.", "Repository checks and visual evidence decide what lands; the model does not grade its own output."],
      pt: ["Specs definem resultado, restrições, checks de aceite e ownership antes do trabalho começar.", "Cada worker roda em uma git worktree isolada para que tentativas paralelas continuem comparáveis e recuperáveis.", "Modos race, consensus e pipeline adaptam a colaboração ao problema em vez de tratar toda tarefa igual.", "Checks do repositório e evidência visual decidem o que entra; o modelo não avalia o próprio output."],
    },
    outcome: {
      en: "The result is a reusable operating layer for AI development: teams can increase parallelism without giving up repository discipline, reviewability, or the ability to reproduce how a change was produced.",
      pt: "O resultado é uma camada operacional reutilizável para desenvolvimento com IA: times aumentam paralelismo sem abrir mão de disciplina de repositório, revisão ou reprodução de como uma mudança foi produzida.",
    },
    links: [{ label: "ralphstarter.ai", href: "https://ralphstarter.ai" }],
  },
  {
    slug: "aeo-platform",
    projectSlug: "aeojs",
    index: "04",
    title: { en: "AEO.js + AEO Checker · Case study", pt: "AEO.js + AEO Checker · Estudo de caso" },
    description: {
      en: "A framework, scanner, and publishing system for making websites legible and citable to answer engines.",
      pt: "Um framework, scanner e sistema de publicação para tornar sites legíveis e citáveis por answer engines.",
    },
    overline: { en: "Case study — answer engine optimization", pt: "Estudo de caso — answer engine optimization" },
    heading: { en: "AEO as a delivery system, not a checklist.", pt: "AEO como sistema de entrega, não checklist." },
    lede: {
      en: "AEO.js and AEO Checker connect diagnosis to implementation: crawler policy, canonical discovery, entity signals, structured data, content hierarchy, and machine-readable exports are tested as one system.",
      pt: "AEO.js e AEO Checker conectam diagnóstico à implementação: política de crawler, descoberta canônica, sinais de entidade, structured data, hierarquia de conteúdo e exports machine-readable são testados como um sistema.",
    },
    meta: {
      en: [{ label: "Role", value: "Creator / fullstack" }, { label: "Period", value: "2026 — present" }, { label: "Products", value: "Framework + scanner" }, { label: "Status", value: "Production" }],
      pt: [{ label: "Papel", value: "Criador / fullstack" }, { label: "Período", value: "2026 — presente" }, { label: "Produtos", value: "Framework + scanner" }, { label: "Status", value: "Produção" }],
    },
    stats: {
      en: [{ value: "2", label: "Product surfaces", sub: "Implementation framework + diagnostic scanner" }, { value: "EN/PT", label: "Publishing model", sub: "Canonical localized routes and hreflang" }, { value: "JSON-LD", label: "Entity layer", sub: "Structured claims tied to visible content" }, { value: "CI", label: "Verification", sub: "Discovery artifacts checked at build time" }],
      pt: [{ value: "2", label: "Superfícies", sub: "Framework de implementação + scanner diagnóstico" }, { value: "EN/PT", label: "Publicação", sub: "Rotas localizadas canônicas e hreflang" }, { value: "JSON-LD", label: "Camada de entidades", sub: "Claims estruturados ligados ao conteúdo visível" }, { value: "CI", label: "Verificação", sub: "Artefatos de descoberta validados no build" }],
    },
    challenge: {
      en: "A site can look correct to a person while contradicting itself to crawlers: stale sitemaps, incorrect canonicals, duplicated machine indexes, and schema that promises facts the page does not support.",
      pt: "Um site pode parecer correto para uma pessoa enquanto se contradiz para crawlers: sitemaps velhos, canonicals incorretos, índices machine-readable duplicados e schema prometendo fatos que a página não sustenta.",
    },
    system: {
      en: ["The scanner identifies concrete crawl, metadata, entity, and content failures instead of producing a generic score alone.", "The framework generates consistent discovery surfaces for Astro and Next.js while keeping canonical ownership explicit.", "Visible copy, JSON-LD, sitemaps, hreflang, llms.txt, and AI indexes are treated as projections of the same content model.", "Build gates catch stale URLs, duplicate outputs, missing alternates, and unsupported structured claims before deploy."],
      pt: ["O scanner identifica falhas concretas de crawl, metadata, entidade e conteúdo em vez de produzir apenas um score genérico.", "O framework gera superfícies de descoberta consistentes para Astro e Next.js mantendo ownership canônico explícito.", "Copy visível, JSON-LD, sitemaps, hreflang, llms.txt e AI indexes são tratados como projeções do mesmo modelo de conteúdo.", "Gates de build capturam URLs velhas, outputs duplicados, alternates ausentes e claims estruturados sem suporte antes do deploy."],
    },
    outcome: {
      en: "AEO becomes inspectable engineering work: every claim has a visible source, every route has one canonical identity, and every machine-readable surface can be verified before it reaches production.",
      pt: "AEO vira trabalho de engenharia inspecionável: cada claim tem fonte visível, cada rota tem uma identidade canônica e cada superfície machine-readable pode ser verificada antes de chegar à produção.",
    },
    links: [{ label: "AEO.js", href: "https://aeojs.org" }, { label: "AEO Checker", href: "https://check.aeojs.org" }],
  },
  {
    slug: "cs-brasil",
    projectSlug: "cs-brasil",
    index: "05",
    title: { en: "CS Brasil · Case study", pt: "CS Brasil · Estudo de caso" },
    description: {
      en: "A browser FPS built with Three.js and an AI production harness spanning gameplay, maps, visual QA, telemetry, and automated issue capture.",
      pt: "Um FPS de navegador construído com Three.js e um harness de produção com IA cobrindo jogabilidade, mapas, QA visual, telemetria e captura automatizada de issues.",
    },
    overline: { en: "Case study — browser game", pt: "Estudo de caso — jogo de navegador" },
    heading: { en: "A playable product built through an AI harness.", pt: "Um produto jogável construído por um harness de IA." },
    lede: {
      en: "CS Brasil is both a browser FPS and a test of AI-native product engineering: specialist skills define visual, gameplay, map, regression, and bug-hunt contracts while real usage telemetry closes the loop.",
      pt: "CS Brasil é ao mesmo tempo um FPS de navegador e um teste de product engineering AI-native: skills especialistas definem contratos visuais, de jogabilidade, mapas, regressão e bug hunt enquanto telemetria real fecha o loop.",
    },
    meta: {
      en: [{ label: "Role", value: "Creator / fullstack" }, { label: "Period", value: "2026" }, { label: "Stack", value: "Three.js + Supabase" }, { label: "Stage", value: "Public alpha" }],
      pt: [{ label: "Papel", value: "Criador / fullstack" }, { label: "Período", value: "2026" }, { label: "Stack", value: "Three.js + Supabase" }, { label: "Estágio", value: "Alpha público" }],
    },
    stats: {
      en: [{ value: "2,191", label: "Players", sub: "Public alpha" }, { value: "154K+", label: "Kills", sub: "Measured gameplay events" }, { value: "27", label: "Countries", sub: "Players reached" }, { value: "WebGL", label: "Runtime", sub: "No install required" }],
      pt: [{ value: "2.191", label: "Jogadores", sub: "Alpha público" }, { value: "154K+", label: "Kills", sub: "Eventos reais de gameplay" }, { value: "27", label: "Países", sub: "Alcance dos jogadores" }, { value: "WebGL", label: "Runtime", sub: "Sem instalação" }],
    },
    challenge: {
      en: "A game exposes weak AI workflows quickly. A change that makes one screenshot prettier can reduce readability, break collision, destabilize frame time, or regress another map. Speed only matters when the evaluation loop can catch that.",
      pt: "Um jogo expõe workflows fracos de IA rapidamente. Uma mudança que embeleza um screenshot pode reduzir legibilidade, quebrar colisão, desestabilizar o frame time ou regredir outro mapa. Velocidade só importa quando o loop de avaliação captura isso.",
    },
    system: {
      en: ["Repository skills encode repeatable contracts for maps, characters, visual quality, gameplay, and bug hunting.", "Independent visual critics inspect screenshots and measurements; builders do not approve their own work.", "Automated issue capture turns player-visible failures into structured GitHub reports for triage and repair.", "Private product telemetry records rounds, maps, characters, scores, and session behavior so iteration follows evidence."],
      pt: ["Skills do repositório codificam contratos repetíveis para mapas, personagens, qualidade visual, jogabilidade e bug hunting.", "Críticos visuais independentes inspecionam screenshots e medições; builders não aprovam o próprio trabalho.", "Captura automática de issues transforma falhas vistas por jogadores em reports estruturados no GitHub para triagem e reparo.", "Telemetria privada de produto registra rounds, mapas, personagens, scores e sessões para que a iteração siga evidência."],
    },
    outcome: {
      en: "The public alpha became a measurable production system rather than a demo: player behavior informs the backlog, the harness turns evidence into scoped work, and regression checks protect previous gains.",
      pt: "O alpha público virou um sistema de produção mensurável em vez de uma demo: comportamento dos jogadores informa o backlog, o harness transforma evidência em trabalho com escopo e checks de regressão protegem ganhos anteriores.",
    },
    links: [{ label: "csbrasil.online", href: "https://csbrasil.online" }],
  },
];
