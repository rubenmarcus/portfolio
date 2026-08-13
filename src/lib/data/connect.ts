import type { SvgIconName } from "../assets";

/**
 * The MCP onboarding content, shared by the rendered page (`/connect`) and its
 * Markdown twin (`/connect.md`). It lives here so the two cannot drift: an
 * agent reading the `.md` gets exactly the steps a human reads on the page.
 */

export const MCP_URL = "https://www.rubenmarcus.dev/api/mcp";

// A step is prose, optionally followed by the endpoint rendered as a copyable
// code block. Interpolating the URL into the sentence made it one long
// unbreakable token that overflowed the card on narrow columns.
export type ConnectStep = { text: string; url?: boolean };
export type ConnectClient = { name: string; icon: SvgIconName; steps: ConnectStep[] };
export type ConnectTool = { name: string; desc: string };

export type ConnectContent = {
  /** Page <title> and og:title. */
  title: string;
  /** Meta description. */
  description: string;
  overline: string;
  headline: string;
  /** Lead paragraph under the headline. */
  intro: string;
  endpointLabel: string;
  toolsHeading: string;
  clients: ConnectClient[];
  tools: ConnectTool[];
  /** Copy-to-clipboard starter prompts. EN-only for now. */
  prompts?: string[];
};

export const CONNECT_EN: ConnectContent = {
  title: "Connect — Ruben Marcus",
  description:
    "Agent-ready, humans welcome. Add rubenmarcus.dev as an MCP connector in Claude, ChatGPT, Cursor or Kimi so an agent can evaluate experience, check availability, and book an intro.",
  overline: "Agent-ready · MCP",
  headline: "This site speaks MCP.",
  intro:
    "Agent-ready, humans welcome. Add this portfolio as a connector and your agent can evaluate my work, check availability, and book a project intro. No account, auth, or signup.",
  endpointLabel: "MCP endpoint",
  toolsHeading: "The four tools",
  clients: [
    {
      name: "Claude",
      icon: "claude",
      steps: [
        { text: "Open Claude settings → Connectors → Add custom connector." },
        { text: "Name it rubenmarcus and paste the URL:", url: true },
        { text: "Connect. Then ask: what has Ruben shipped?" },
      ],
    },
    {
      name: "ChatGPT",
      icon: "openai",
      steps: [
        { text: "Settings → Apps & Connectors → developer mode → Create." },
        { text: "Paste the URL and save:", url: true },
        { text: "Ask ChatGPT to call get_resume or book_intro." },
      ],
    },
    {
      name: "Kimi",
      icon: "kimi",
      steps: [
        { text: "Add a streamable-HTTP MCP server, or paste the URL in Kimi's MCP settings:", url: true },
        { text: "Run tools/list to see the four tools." },
      ],
    },
    {
      name: "Cursor / any MCP client",
      icon: "cursor",
      steps: [
        { text: "Add a streamable-HTTP MCP server:", url: true },
        { text: "Run tools/list to see the four tools." },
      ],
    },
  ],
  tools: [
    { name: "get_resume", desc: "full resume: experience, skills, proof points, links" },
    { name: "get_services", desc: "the three flagship fixed-scope offers" },
    { name: "check_availability", desc: "current engagement status" },
    { name: "book_intro", desc: "posts a project brief to my inbox" },
  ],
  prompts: [
    "What has Ruben shipped?",
    "Summarize Ruben's experience with AI agents.",
    "Is Ruben available for freelance work right now?",
    "What services does Ruben offer?",
    "Book an intro with Ruben — I want to build a trading bot.",
  ],
};

export const CONNECT_PT: ConnectContent = {
  title: "Conectar — Ruben Marcus",
  description:
    "Agent-ready, humans welcome. Adicione rubenmarcus.dev como conector MCP no Claude, ChatGPT, Cursor ou Kimi para seu agent avaliar experiência, checar disponibilidade e agendar uma conversa.",
  overline: "Agent-ready · MCP",
  headline: "Este site fala MCP.",
  intro:
    "Agent-ready, humans welcome. Adicione este portfólio como conector e seu agent consegue avaliar meu trabalho, checar disponibilidade e agendar uma conversa. Sem conta, auth ou signup.",
  endpointLabel: "Endpoint MCP",
  toolsHeading: "As quatro tools",
  clients: [
    {
      name: "Claude",
      icon: "claude",
      steps: [
        { text: "Abra as configurações do Claude → Connectors → Add custom connector." },
        { text: "Dê o nome rubenmarcus e cole a URL:", url: true },
        { text: "Conecte. Depois pergunte: o que o Ruben já publicou?" },
      ],
    },
    {
      name: "ChatGPT",
      icon: "openai",
      steps: [
        { text: "Settings → Apps & Connectors → developer mode → Create." },
        { text: "Cole a URL e salve:", url: true },
        { text: "Peça ao ChatGPT pra chamar get_resume ou book_intro." },
      ],
    },
    {
      name: "Kimi",
      icon: "kimi",
      steps: [
        { text: "Adicione um servidor MCP streamable-HTTP, ou cole a URL nas configurações de MCP do Kimi:", url: true },
        { text: "Rode tools/list pra ver as quatro tools." },
      ],
    },
    {
      name: "Cursor / qualquer client MCP",
      icon: "cursor",
      steps: [
        { text: "Adicione um servidor MCP streamable-HTTP:", url: true },
        { text: "Rode tools/list pra ver as quatro tools." },
      ],
    },
  ],
  tools: [
    { name: "get_resume", desc: "quem eu sou, pontos de prova, links" },
    { name: "get_services", desc: "as seis ofertas de escopo fixo" },
    { name: "check_availability", desc: "status atual de engajamento" },
    { name: "book_intro", desc: "envia um brief de projeto pro meu inbox" },
  ],
};
