export type SkillScope = "products" | "ecdsa-fail" | "cs-brasil" | "portfolio" | "general";
export type SkillStatus = "public" | "documented" | "internal";

export interface AgentSkill {
  slug: string;
  name: string;
  thumbnail: string;
  scope: SkillScope;
  status: SkillStatus;
  summary: { en: string; pt: string };
  contract: { en: string; pt: string };
  evidence: { en: string; pt: string };
  article?: { en: string; pt: string };
  discoveryUrl?: string;
  digest?: string;
}

export const agentSkills: AgentSkill[] = [
  {
    slug: "ralph-starter-orchestration",
    name: "Ralph Starter Orchestration",
    thumbnail: "/art/covers/ralph-starter.png",
    scope: "products",
    status: "documented",
    summary: {
      en: "Delivery harness for running one or many coding agents through bounded specs, isolated git worktrees, feedback loops, and explicit completion gates.",
      pt: "Harness de entrega para rodar um ou vários coding agents com specs limitadas, git worktrees isoladas, loops de feedback e gates explícitos de conclusão.",
    },
    contract: {
      en: "A repository and verifiable objective in; an isolated, reviewed implementation or an evidence-backed stop out.",
      pt: "Repositório e objetivo verificável entram; implementação isolada e revisada ou parada sustentada por evidência sai.",
    },
    evidence: {
      en: "Powers Ralph Starter's single-agent, race, consensus, and pipeline modes with integrations for GitHub, Linear, Notion, Figma, and MCP.",
      pt: "Sustenta os modos single-agent, race, consensus e pipeline do Ralph Starter, com integrações GitHub, Linear, Notion, Figma e MCP.",
    },
    article: { en: "/work/ralph-starter", pt: "/pt/work/ralph-starter" },
  },
  {
    slug: "autoresearch-benchmark-loop",
    name: "Autoresearch Benchmark Loop",
    thumbnail: "/art/covers/autoresearcher.png",
    scope: "products",
    status: "documented",
    summary: {
      en: "Autonomous research method where every agent proposal must survive a reproducible benchmark before it enters the frontier.",
      pt: "Método de pesquisa autônoma em que toda proposta de agent precisa sobreviver a um benchmark reproduzível antes de entrar na fronteira.",
    },
    contract: {
      en: "Objective, benchmark, and stopping rule in; an auditable keep/reject lineage with measured results out.",
      pt: "Objetivo, benchmark e regra de parada entram; linhagem auditável de keep/reject com resultados medidos sai.",
    },
    evidence: {
      en: "The operating loop behind Autoresearcher and leaderboard work in QEC and ECDSA.fail, with git and JSONL as the audit trail.",
      pt: "É o loop operacional do Autoresearcher e dos trabalhos de leaderboard em QEC e ECDSA.fail, com git e JSONL como trilha de auditoria.",
    },
    article: { en: "/blog/autoresearcher-pareto-frontier", pt: "/pt/blog/mantendo-um-agente-de-pesquisa-autonomo-honesto" },
  },
  {
    slug: "aeo-delivery-system",
    name: "AEO Delivery System",
    thumbnail: "/art/covers/aeojs.png",
    scope: "products",
    status: "documented",
    summary: {
      en: "Technical AEO workflow that treats crawler policy, canonical identity, entities, structured data, and machine-readable surfaces as one tested system.",
      pt: "Workflow técnico de AEO que trata política de crawlers, identidade canônica, entidades, dados estruturados e superfícies legíveis por máquinas como um único sistema testado.",
    },
    contract: {
      en: "A site and target entities in; a measured audit, implementation, and before/after discovery report out.",
      pt: "Site e entidades-alvo entram; auditoria medida, implementação e relatório de descoberta antes/depois saem.",
    },
    evidence: {
      en: "Encoded in AEO.js, AEO Checker, and this portfolio's fail-closed discovery gate.",
      pt: "Codificado no AEO.js, AEO Checker e no gate fail-closed de descoberta deste portfólio.",
    },
    article: { en: "/work/aeo-platform", pt: "/pt/work/aeo-platform" },
  },
  {
    slug: "benchmark-frontier-archaeology",
    name: "Benchmark Frontier Archaeology",
    thumbnail: "/art/blog/agent-frontier-dissector.png",
    scope: "ecdsa-fail",
    status: "documented",
    summary: {
      en: "Reverse-engineers every accepted frontier move to separate the transferable structural lever from nonce luck and search artifacts.",
      pt: "Faz engenharia reversa de cada avanço aceito na fronteira para separar a alavanca estrutural transferível de sorte de nonce e artefatos de busca.",
    },
    contract: {
      en: "Winner history and trusted evaluator in; a measured delta decomposition and next-route slate out.",
      pt: "Histórico dos vencedores e avaliador confiável entram; decomposição medida do delta e próximas rotas saem.",
    },
    evidence: {
      en: "Used by the ECDSA.fail Frontier Dissector to react to structural leaderboard changes without spending on stale routes.",
      pt: "Usada pelo Frontier Dissector do ECDSA.fail para reagir a mudanças estruturais do leaderboard sem gastar em rotas vencidas.",
    },
    article: { en: "/blog/the-agent-swarm-that-took-1-on-ecdsa-fail", pt: "/pt/blog/o-swarm-que-chegou-ao-primeiro-lugar-no-ecdsa-fail" },
  },
  {
    slug: "ecdsa-route-spec",
    name: "ECDSA.fail Route Spec",
    thumbnail: "/art/blog/agent-research-scout.png",
    scope: "ecdsa-fail",
    status: "documented",
    summary: {
      en: "Source-anchored gate that turns papers, diffs, and hypotheses into bounded route packets before code or compute is spent.",
      pt: "Gate ancorado em fontes que transforma papers, diffs e hipóteses em pacotes de rota limitados antes de gastar código ou computação.",
    },
    contract: {
      en: "One hypothesis in; invariant, cheapest falsifier, validator, budget, kill condition, and reopen condition out.",
      pt: "Uma hipótese entra; invariante, falsificador mais barato, validador, orçamento, condição de morte e de reabertura saem.",
    },
    evidence: {
      en: "Prevents vague research prompts from reaching workers or paid GPU hunts in the ECDSA.fail command center.",
      pt: "Impede prompts vagos de pesquisa de chegarem aos workers ou às buscas pagas em GPU do command center do ECDSA.fail.",
    },
    article: { en: "/blog/agent-command-center", pt: "/pt/blog/centro-de-comando-para-swarms-de-agentes-em-markdown" },
  },
  {
    slug: "circuit-engineer-factory",
    name: "Circuit Engineer Factory",
    thumbnail: "/art/blog/agent-circuit-engineer.png",
    scope: "ecdsa-fail",
    status: "documented",
    summary: {
      en: "Role factory for dispatching circuit engineers with the exact field, group, phase, ancilla, and cost constraints of a route.",
      pt: "Fábrica de papéis para despachar circuit engineers com as restrições exatas de campo, grupo, fase, ancillas e custo de uma rota.",
    },
    contract: {
      en: "Approved route packet in; a specialist worker contract with evidence labels and a landing verdict out.",
      pt: "Pacote de rota aprovado entra; contrato de worker especialista com rótulos de evidência e veredito de chegada sai.",
    },
    evidence: {
      en: "Keeps model-specific workers aligned with the reversible-circuit invariants the command center actually evaluates.",
      pt: "Mantém workers de modelos diferentes alinhados aos invariantes de circuitos reversíveis que o command center realmente avalia.",
    },
    article: { en: "/blog/agent-command-center", pt: "/pt/blog/centro-de-comando-para-swarms-de-agentes-em-markdown" },
  },
  {
    slug: "circuit-optimization",
    name: "ECDSA Circuit Optimization",
    thumbnail: "/art/covers/ecdsa-fail.png",
    scope: "ecdsa-fail",
    status: "documented",
    summary: {
      en: "Structural optimization method for point-addition circuits across qubit width, Toffoli count, live ranges, arithmetic, and score.",
      pt: "Método de otimização estrutural de circuitos de point addition considerando qubits, Toffolis, live ranges, aritmética e score.",
    },
    contract: {
      en: "A correct circuit and current bottleneck in; ranked structural levers with validation obligations out.",
      pt: "Circuito correto e gargalo atual entram; alavancas estruturais priorizadas com obrigações de validação saem.",
    },
    evidence: {
      en: "Applied to the secp256k1 point-addition circuit that reached #1 on ECDSA.fail.",
      pt: "Aplicada ao circuito de point addition secp256k1 que chegou ao primeiro lugar no ECDSA.fail.",
    },
    article: { en: "/work/ecdsa-fail", pt: "/pt/work/ecdsa-fail" },
  },
  {
    slug: "reversible-circuit-validation",
    name: "Reversible Circuit Validation",
    thumbnail: "/art/blog/agent-orchestrator-reviewer.png",
    scope: "ecdsa-fail",
    status: "documented",
    summary: {
      en: "Correctness protocol that isolates classical output, phase behavior, and ancilla cleanup before an optimization is trusted.",
      pt: "Protocolo de correção que isola saída clássica, comportamento de fase e limpeza de ancillas antes de confiar numa otimização.",
    },
    contract: {
      en: "Candidate circuit and trusted reference in; differential, inverse, phase, and cleanup verdicts out.",
      pt: "Circuito candidato e referência confiável entram; vereditos diferenciais, de inversa, fase e limpeza saem.",
    },
    evidence: {
      en: "The command center's cls/pha/anc gate separates a cheap-looking circuit from one that is actually submission-safe.",
      pt: "O gate cls/pha/anc do command center separa um circuito que parece barato de um realmente seguro para submissão.",
    },
    article: { en: "/work/ecdsa-fail", pt: "/pt/work/ecdsa-fail" },
  },
  {
    slug: "peak-qubit-reduction",
    name: "Peak Qubit Reduction",
    thumbnail: "/art/blog/agent-density-analyst.png",
    scope: "ecdsa-fail",
    status: "documented",
    summary: {
      en: "Timeline-based method for finding the tallest live-qubit moment and creating safe holes through earlier uncompute or later recompute.",
      pt: "Método baseado em timeline para encontrar o pico de qubits vivos e criar folgas seguras antecipando uncompute ou adiando recompute.",
    },
    contract: {
      en: "Circuit timeline in; peak owner, co-binders, reuse opportunities, and width tradeoffs out.",
      pt: "Timeline do circuito entra; dono do pico, co-binders, oportunidades de reuso e tradeoffs de largura saem.",
    },
    evidence: {
      en: "Makes width reduction explicit instead of treating total ancilla count as a proxy for peak cost.",
      pt: "Torna a redução de largura explícita em vez de tratar a contagem total de ancillas como proxy do custo de pico.",
    },
    article: { en: "/blog/the-agent-swarm-that-took-1-on-ecdsa-fail", pt: "/pt/blog/o-swarm-que-chegou-ao-primeiro-lugar-no-ecdsa-fail" },
  },
  {
    slug: "toffoli-reduction",
    name: "Toffoli Reduction",
    thumbnail: "/art/blog/agent-combinator.png",
    scope: "ecdsa-fail",
    status: "documented",
    summary: {
      en: "Gate-cost method for cutting Toffoli and non-Clifford work through algebraic fusion, measured replay, and cheaper uncomputation.",
      pt: "Método de custo de gates para reduzir Toffolis e trabalho non-Clifford via fusão algébrica, replay medido e uncomputation mais barato.",
    },
    contract: {
      en: "Validated circuit and gate profile in; transformations with emitted-cost and correctness consequences out.",
      pt: "Circuito validado e perfil de gates entram; transformações com consequências de custo emitido e correção saem.",
    },
    evidence: {
      en: "Separates the gate axis from qubit width so the command center can optimize the score's moving bottleneck.",
      pt: "Separa o eixo de gates da largura em qubits para o command center otimizar o gargalo móvel do score.",
    },
    article: { en: "/work/ecdsa-fail", pt: "/pt/work/ecdsa-fail" },
  },
  {
    slug: "island-hunting",
    name: "ECDSA.fail Island Hunting",
    thumbnail: "/art/blog/agent-pod-manager.png",
    scope: "ecdsa-fail",
    status: "documented",
    summary: {
      en: "Spend-gated search protocol for estimating clean-island density, validating candidates, and deciding whether a GPU nonce hunt is economical.",
      pt: "Protocolo de busca com controle de gasto para estimar densidade de clean islands, validar candidatos e decidir se uma busca de nonce em GPU é econômica.",
    },
    contract: {
      en: "Validated structural candidate in; density estimate, hunt verdict, capped ranges, and verified survivor out.",
      pt: "Candidato estrutural validado entra; estimativa de densidade, veredito de busca, ranges limitados e survivor verificado saem.",
    },
    evidence: {
      en: "Connects CPU triage to GPU spend using explicit huntability thresholds and trusted full validation.",
      pt: "Conecta triagem em CPU a gasto em GPU usando thresholds explícitos de viabilidade e validação completa confiável.",
    },
    article: { en: "/blog/the-agent-swarm-that-took-1-on-ecdsa-fail", pt: "/pt/blog/o-swarm-que-chegou-ao-primeiro-lugar-no-ecdsa-fail" },
  },
  {
    slug: "multi-agent-research-collaboration",
    name: "Multi-Agent Research Collaboration",
    thumbnail: "/art/blog/agent-command-center.png",
    scope: "ecdsa-fail",
    status: "documented",
    summary: {
      en: "Scientific collaboration contract for splitting orthogonal investigations, exchanging exact evidence, and reconciling agent disagreement.",
      pt: "Contrato de colaboração científica para dividir investigações ortogonais, trocar evidência exata e reconciliar divergências entre agents.",
    },
    contract: {
      en: "Shared route and independent lanes in; convergence map, conflicts, verified findings, and next experiment out.",
      pt: "Rota compartilhada e lanes independentes entram; mapa de convergência, conflitos, achados verificados e próximo experimento saem.",
    },
    evidence: {
      en: "Coordinates Claude, Codex, Kimi, GLM, Amp, and specialist workers without making chat history the source of truth.",
      pt: "Coordena Claude, Codex, Kimi, GLM, Amp e workers especialistas sem transformar o histórico de chat em fonte da verdade.",
    },
    article: { en: "/blog/agent-command-center", pt: "/pt/blog/centro-de-comando-para-swarms-de-agentes-em-markdown" },
  },
  {
    slug: "csbrasil-content-pipeline",
    name: "CS Brasil Content Pipeline",
    thumbnail: "/art/covers/corosolto.png",
    scope: "cs-brasil",
    status: "internal",
    summary: {
      en: "Six-gate creation pipeline for Brazilian characters, teams, real-world maps, and 3D assets, from sourced research to in-engine validation.",
      pt: "Pipeline de criação em seis portões para personagens brasileiros, times, mapas de lugares reais e assets 3D, da pesquisa com fontes à validação no engine.",
    },
    contract: {
      en: "A culturally grounded theme in; sourced spec, references, generation prompts, integrated asset, ruler, and independent review out.",
      pt: "Tema culturalmente ancorado entra; ficha com fontes, referências, prompts, asset integrado, régua e revisão independente saem.",
    },
    evidence: {
      en: "The canonical `/csbrasil` skill routes content through spec, compose, map, and generate without skipping provenance or gameplay gates.",
      pt: "A skill canônica `/csbrasil` conduz conteúdo por spec, compose, map e generate sem pular procedência ou gates de jogabilidade.",
    },
    article: { en: "/work/cs-brasil", pt: "/pt/work/cs-brasil" },
  },
  {
    slug: "faction-pipeline",
    name: "Faction Pipeline",
    thumbnail: "/art/blog/shipping-a-browser-fps.png",
    scope: "cs-brasil",
    status: "internal",
    summary: {
      en: "Vertical-slice pipeline for shipping a playable faction as one system: roster, crest, cover, character, thumbnail, selection video, voice, and UI integration.",
      pt: "Pipeline em fatia vertical para entregar uma facção jogável como sistema: elenco, brasão, cover, personagem, thumbnail, vídeo de seleção, voz e integração na UI.",
    },
    contract: {
      en: "Faction spec in; one registry-driven, asset-complete, playable faction with mutation-tested gates out.",
      pt: "Spec de facção entra; facção jogável completa em assets, derivada de um registro e com gates testados por mutação sai.",
    },
    evidence: {
      en: "Coordinates content creation, visual review, gameplay, voice, and shared metadata so a faction is not a loose folder of files.",
      pt: "Coordena criação, revisão visual, gameplay, voz e metadata compartilhada para uma facção não virar uma pasta solta de arquivos.",
    },
  },
  {
    slug: "asset-review",
    name: "Adversarial Asset Review",
    thumbnail: "/art/blog/agent-gauntlet-critics.png",
    scope: "cs-brasil",
    status: "internal",
    summary: {
      en: "Clean-context critic for every new character, map, model, and texture; the builder's explanation is deliberately excluded from the review.",
      pt: "Crítico com contexto limpo para cada personagem, mapa, modelo e textura novos; a justificativa de quem construiu é deliberadamente excluída da revisão.",
    },
    contract: {
      en: "Spec, served-size screenshots, and references in; concrete visual gaps, engine checks, and approve/reject verdict out.",
      pt: "Ficha, screenshots no tamanho servido e referências entram; gaps visuais concretos, checks do engine e veredito approve/reject saem.",
    },
    evidence: {
      en: "Checks cultural specificity, silhouette at gameplay distance, ownership constraints, polycount, texture, and pivot before an asset is accepted.",
      pt: "Verifica especificidade cultural, silhueta na distância de jogo, restrições autorais, polycount, textura e pivô antes de aceitar um asset.",
    },
  },
  {
    slug: "regua",
    name: "Régua / Executable Quality Gate",
    thumbnail: "/art/blog/cs-brasil-ai-harness.png",
    scope: "cs-brasil",
    status: "internal",
    summary: {
      en: "Method for writing invariants, probes, and thresholds that must prove they can fail before they are allowed to protect the game.",
      pt: "Método para escrever invariantes, probes e thresholds que precisam provar que conseguem falhar antes de proteger o jogo.",
    },
    contract: {
      en: "A regression risk in; one shared ruler, a red mutation, an honest failure mode, and a CI gate out.",
      pt: "Risco de regressão entra; uma régua compartilhada, mutação vermelha, modo de falha honesto e gate de CI saem.",
    },
    evidence: {
      en: "Encodes the repository law: a ruler that cannot turn red is decoration, not evidence.",
      pt: "Codifica a lei do repositório: régua que não pode ficar vermelha é decoração, não evidência.",
    },
    article: { en: "/blog/cs-brasil-ai-harness", pt: "/pt/blog/harness-de-ia-por-tras-do-cs-brasil" },
  },
  {
    slug: "csbrasil-pr-triage",
    name: "CS Brasil PR Triage",
    thumbnail: "/art/blog/agent-regression-hunter.png",
    scope: "cs-brasil",
    status: "internal",
    summary: {
      en: "Risk classifier for deciding whether a pull request is mergeable, needs staging, or requires human gameplay or backend review.",
      pt: "Classificador de risco para decidir se um pull request pode ser mergeado, precisa de staging ou exige revisão humana de gameplay ou backend.",
    },
    contract: {
      en: "PR diff and checks in; surface classification, risk labels, and explicit mergeability verdict out.",
      pt: "Diff e checks do PR entram; classificação da superfície, labels de risco e veredito explícito de mergeabilidade saem.",
    },
    evidence: {
      en: "Treats gameplay, render, HUD, maps, characters, API, Supabase, ranking, and anti-cheat as sensitive surfaces.",
      pt: "Trata gameplay, render, HUD, mapas, personagens, API, Supabase, ranking e anti-cheat como superfícies sensíveis.",
    },
  },
  {
    slug: "csbrasil-smoke-check",
    name: "CS Brasil Smoke Check",
    thumbnail: "/art/blog/agent-gauntlet-builders.png",
    scope: "cs-brasil",
    status: "internal",
    summary: {
      en: "Playable-journey gate covering menu, ranking, nickname, team and character selection, initial boot, and first HUD.",
      pt: "Gate da jornada jogável cobrindo menu, ranking, nickname, seleção de time e personagem, boot inicial e primeiro HUD.",
    },
    contract: {
      en: "User-visible PR in; browser evidence that the minimum playable flow still reaches the HUD without an immediate crash out.",
      pt: "PR visível ao usuário entra; evidência de browser de que o fluxo jogável mínimo ainda chega ao HUD sem crash imediato sai.",
    },
    evidence: {
      en: "A stable-selector flow isolates launch breakage before deeper gameplay or staging review.",
      pt: "Um fluxo com seletores estáveis isola quebras de lançamento antes da revisão profunda de gameplay ou staging.",
    },
  },
  {
    slug: "gauntlet-fps",
    name: "Gauntlet FPS",
    thumbnail: "/art/blog/inside-the-gauntlet-loop.png",
    scope: "cs-brasil",
    status: "documented",
    summary: {
      en: "Adversarial visual-improvement loop for a browser FPS: independent critics, measured screenshots, conflict-aware builders, and regression gates.",
      pt: "Loop adversarial de melhoria visual para um FPS de navegador: críticos independentes, screenshots medidos, builders conscientes de conflitos e gates de regressão.",
    },
    contract: {
      en: "Pixels and measurements in; ranked gaps with file:line evidence and numeric fixes out.",
      pt: "Pixels e medições entram; gaps priorizados com evidência arquivo:linha e correções numéricas saem.",
    },
    evidence: {
      en: "Used to evolve CS Brasil maps, weapons, HUD, lighting, and gameplay without letting builders grade their own work.",
      pt: "Usada para evoluir mapas, armas, HUD, iluminação e jogabilidade do CS Brasil sem deixar builders avaliarem o próprio trabalho.",
    },
    article: { en: "/blog/inside-the-gauntlet-loop", pt: "/pt/blog/por-dentro-do-gauntlet-loop" },
  },
  {
    slug: "bug-hunt",
    name: "Bug Hunt",
    thumbnail: "/art/blog/agent-bug-hunter.png",
    scope: "cs-brasil",
    status: "internal",
    summary: {
      en: "Measurement-first debugging protocol that requires a failing ruler, a falsifiable hypothesis, and a mutation proving the fix can regress.",
      pt: "Protocolo de debugging measurement-first que exige uma régua vermelha, hipótese falsificável e uma mutação provando que o fix pode regredir.",
    },
    contract: {
      en: "Reproduction and negative evidence in; localized defect, regression test, and verified fix out.",
      pt: "Reprodução e evidência negativa entram; defeito localizado, teste de regressão e fix verificado saem.",
    },
    evidence: {
      en: "Separates the user-visible symptom from the code location that actually owns the defect.",
      pt: "Separa o sintoma visível para o usuário do ponto do código que realmente possui o defeito.",
    },
  },
  {
    slug: "blog-voice",
    name: "Blog Voice",
    thumbnail: "/art/blog/i-built-my-portfolio-with-a-fleet-of-ai-agents.png",
    scope: "portfolio",
    status: "public",
    summary: {
      en: "Editorial voice contract for technical writing grounded in shipped systems, concrete tradeoffs, and verifiable claims.",
      pt: "Contrato de voz editorial para escrita técnica baseada em sistemas entregues, tradeoffs concretos e afirmações verificáveis.",
    },
    contract: {
      en: "Evidence and a thesis in; an article that sounds authored rather than generated out.",
      pt: "Evidência e tese entram; um artigo com voz autoral, não texto genérico, sai.",
    },
    evidence: {
      en: "The shared voice layer behind the bilingual technical blog.",
      pt: "A camada de voz compartilhada por todo o blog técnico bilíngue.",
    },
  },
  {
    slug: "bilingual-publishing",
    name: "Bilingual Publishing",
    thumbnail: "/art/blog/from-prompt-to-product-five-ways-to-build-with-ai.png",
    scope: "portfolio",
    status: "public",
    summary: {
      en: "End-to-end publishing contract for paired English and Portuguese articles, localized slugs, metadata, internal links, RSS, and covers.",
      pt: "Contrato de publicação ponta a ponta para artigos pareados em inglês e português, slugs localizados, metadata, links internos, RSS e capas.",
    },
    contract: {
      en: "One researched article in; two canonical, route-safe, publishable versions out.",
      pt: "Um artigo pesquisado entra; duas versões canônicas, publicáveis e seguras para rotas saem.",
    },
    evidence: {
      en: "Keeps content, hreflang, feeds, and translated routes synchronized in CI.",
      pt: "Mantém conteúdo, hreflang, feeds e rotas traduzidas sincronizados no CI.",
    },
  },
  {
    slug: "portfolio-cover-system",
    name: "Portfolio Cover System",
    thumbnail: "/art/blog/frontend-ai-harness-prompt-to-pull-request.png",
    scope: "portfolio",
    status: "public",
    summary: {
      en: "Visual-system skill for generating consistent bilingual article covers and social thumbnails in the portfolio's phosphor language.",
      pt: "Skill de sistema visual para gerar capas bilíngues e thumbnails sociais consistentes na linguagem fósforo do portfólio.",
    },
    contract: {
      en: "Article thesis and visual motif in; production cover plus EN/PT social assets out.",
      pt: "Tese do artigo e motivo visual entram; capa de produção e assets sociais EN/PT saem.",
    },
    evidence: {
      en: "Versioned references and visual gates keep every article inside one recognizable family.",
      pt: "Referências versionadas e gates visuais mantêm cada artigo dentro de uma família reconhecível.",
    },
  },
  {
    slug: "frontend-delivery-harness",
    name: "Frontend Delivery Harness",
    thumbnail: "/art/blog/frontend-ai-harness-prompt-to-pull-request.png",
    scope: "general",
    status: "documented",
    summary: {
      en: "Repository-aware frontend workflow combining specs, browser evidence, responsive checks, accessibility, tests, and diff review.",
      pt: "Workflow de frontend consciente do repositório combinando specs, evidência de browser, checks responsivos, acessibilidade, testes e revisão de diff.",
    },
    contract: {
      en: "Product intent in; a verified pull request with visual and regression evidence out.",
      pt: "Intenção de produto entra; pull request verificado com evidência visual e de regressão sai.",
    },
    evidence: {
      en: "The operating method behind this portfolio's prompt-to-pull-request workflow.",
      pt: "O método operacional por trás do fluxo prompt-to-pull-request deste portfólio.",
    },
    article: { en: "/blog/frontend-ai-harness-prompt-to-pull-request", pt: "/pt/blog/meu-harness-de-ia-para-frontend-do-prompt-ao-pull-request" },
  },
  {
    slug: "portfolio-mcp",
    name: "Portfolio MCP",
    thumbnail: "/art/blog/agents-welcome-portfolio.png",
    scope: "general",
    status: "public",
    summary: {
      en: "Agent-facing discovery skill for evaluating experience, services, availability, and starting an introduction through MCP.",
      pt: "Skill de descoberta para agents avaliarem experiência, serviços, disponibilidade e iniciarem uma conversa via MCP.",
    },
    contract: {
      en: "A hiring question in; structured, source-linked portfolio evidence out.",
      pt: "Uma pergunta de contratação entra; evidência estruturada e ligada às fontes do portfólio sai.",
    },
    evidence: {
      en: "Published through Agent Skills discovery and the site's public MCP endpoint.",
      pt: "Publicada via descoberta Agent Skills e pelo endpoint MCP público do site.",
    },
    discoveryUrl: "/.well-known/agent-skills/portfolio-mcp/SKILL.md",
    digest: "sha256:a92c645621d60003fade5f068d5a6c0112a753b3b4d71f03405e4d59a7c39c38",
  },
];

export const discoverableSkills = agentSkills.filter((skill) => skill.discoveryUrl);
