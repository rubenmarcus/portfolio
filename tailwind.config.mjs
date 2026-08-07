/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Geist", "system-ui", "-apple-system", "sans-serif"],
        display: ["Instrument Serif", "Georgia", "serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        "bg-0": "var(--bg-0)",
        "bg-1": "var(--bg-1)",
        "bg-2": "var(--bg-2)",
        line: "var(--line)",
        "line-strong": "var(--line-strong)",
        "line-bright": "var(--line-bright)",
        text: "var(--text)",
        muted: "var(--muted)",
        "muted-soft": "var(--muted-soft)",
        accent: "var(--accent)",
        "accent-soft": "var(--accent-soft)",
        cream: "var(--cream)",
      },
      spacing: {
        "section-m": "5rem",
        "section-d": "8.5rem",
      },
      borderRadius: {
        card: "16px",
        button: "12px",
        pill: "9999px",
      },
      maxWidth: {
        content: "1180px",
        text: "680px",
        frame: "1240px",
      },
      fontSize: {
        mega: ["clamp(4rem, 12vw, 11rem)", { lineHeight: "0.92", letterSpacing: "-0.02em" }],
        display: ["clamp(3rem, 7vw, 6rem)", { lineHeight: "0.98", letterSpacing: "-0.015em" }],
        h1: ["clamp(2.25rem, 5vw, 4rem)", { lineHeight: "1.03", letterSpacing: "-0.01em" }],
        h2: ["clamp(1.75rem, 3.5vw, 2.75rem)", { lineHeight: "1.08", letterSpacing: "-0.005em" }],
        h3: ["clamp(1.15rem, 1.5vw, 1.4rem)", { lineHeight: "1.3" }],
        body: ["1rem", { lineHeight: "1.65" }],
        small: ["0.85rem", { lineHeight: "1.55" }],
        overline: ["0.7rem", { lineHeight: "1.2", letterSpacing: "0.16em" }],
      },
      transitionTimingFunction: {
        default: "cubic-bezier(0.22, 1, 0.36, 1)",
        emphasis: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      transitionDuration: {
        fast: "180ms",
        default: "220ms",
        reveal: "640ms",
      },
      backdropBlur: {
        sm: "10px",
        md: "16px",
        lg: "24px",
      },
      zIndex: {
        nav: "1000",
        modal: "2000",
      },
    },
  },
  plugins: [],
};
