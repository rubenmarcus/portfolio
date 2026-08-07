<script lang="ts">
  /**
   * HeroTerminal — real code typed live across the hero's BACKGROUND (no
   * card): the ralph swarm loop the portrait is "writing", with syntax
   * highlighting in layered phosphor greens. Human typing rhythm (variable
   * keystroke delay with occasional hesitations), blinking block cursor.
   * The snippet loops forever; old lines scroll off the top so the layer
   * never shifts layout.
   *
   * Guards: prefers-reduced-motion → the full snippet rendered statically,
   * no loop, no blinking. Hidden below 900px by the parent (HeroScene).
   * Pauses while offscreen.
   */

  import { onMount } from "svelte";

  interface Props {
    class?: string;
  }
  let { class: className = "" }: Props = $props();

  // Token classes — layered greens, dim enough to stay a background layer.
  type Tok = { cls: "kw" | "str" | "com" | "fn" | "num" | "txt"; text: string };
  type CodeLine = Tok[];

  const kw = (text: string): Tok => ({ cls: "kw", text });
  const str = (text: string): Tok => ({ cls: "str", text });
  const com = (text: string): Tok => ({ cls: "com", text });
  const fn = (text: string): Tok => ({ cls: "fn", text });
  const txt = (text: string): Tok => ({ cls: "txt", text });

  // The snippet — what he actually ships: a spec-driven agent swarm loop.
  const CODE: CodeLine[] = [
    [com("// spec in, PR out")],
    [kw("import"), txt(" { "), fn("swarm"), txt(" } "), kw("from"), str(' "ralph-starter"'), txt(";")],
    [],
    [kw("const"), txt(" fleet = "), fn("swarm"), txt("({")],
    [txt("  agents: ["), str('"planner"'), txt(", "), str('"coder"'), txt(", "), str('"reviewer"'), txt("],")],
    [txt("  worktrees: "), str('"isolated"'), txt(",  strategy: "), str('"consensus"'), txt(",")],
    [txt("});")],
    [],
    [kw("for await"), txt(" ("), kw("const"), txt(" patch "), kw("of"), txt(" fleet."), fn("run"), txt("(spec)) {")],
    [txt("  "), kw("const"), txt(" ci = "), kw("await"), txt(" "), fn("checks"), txt("(patch);  "), com("// test · lint · build")],
    [txt("  "), kw("if"), txt(" (ci.green) {")],
    [txt("    "), kw("await"), txt(" patch."), fn("push"), txt("();"), com("  // ship it")],
    [txt("    "), kw("break"), txt(";")],
    [txt("  }")],
    [txt("  fleet."), fn("feedback"), txt("(ci.errors);")],
    [txt("}")],
  ];

  const MAX_LINES = 14;

  let root: HTMLDivElement | null = $state(null);
  let done = $state<CodeLine[]>([]); // fully typed lines
  let cur = $state<CodeLine>([]); // the line being typed (last token grows)
  let lineId = 0;
  let doneIds = $state<number[]>([]);

  const pushLine = (line: CodeLine) => {
    done = [...done, line].slice(-MAX_LINES);
    doneIds = [...doneIds, lineId++].slice(-MAX_LINES);
  };

  onMount(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      for (const line of CODE) pushLine(line);
      return;
    }

    let cancelled = false;
    let visible = true;
    const timers = new Set<number>();

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const id = window.setTimeout(() => {
          timers.delete(id);
          resolve();
        }, ms);
        timers.add(id);
      });

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false;
      },
      { threshold: 0 },
    );

    /** Type one token char by char with a human rhythm. */
    const typeToken = async (tok: Tok) => {
      cur = [...cur, { cls: tok.cls, text: "" }];
      for (const ch of tok.text) {
        if (cancelled) return;
        const last = cur[cur.length - 1];
        cur = [...cur.slice(0, -1), { ...last, text: last.text + ch }];
        let d = 22 + Math.random() * 42;
        if (ch === " ") d += 30 + Math.random() * 60;
        if (Math.random() < 0.04) d += 240; // mid-word hesitation
        await wait(d);
      }
    };

    const run = async () => {
      if (root) io.observe(root);
      await wait(1400); // let the hero settle before the first keystroke
      while (!cancelled) {
        if (!visible || document.visibilityState !== "visible") {
          await wait(600);
          continue;
        }
        for (const line of CODE) {
          if (cancelled) return;
          cur = [];
          if (line.length === 0) {
            pushLine([]);
            await wait(120 + Math.random() * 180);
            continue;
          }
          for (const tok of line) {
            if (cancelled) return;
            await typeToken(tok);
          }
          pushLine(line);
          cur = [];
          await wait(180 + Math.random() * 380); // reading the line back
        }
        // snippet done — let it sit, then clear and start fresh
        await wait(6000);
        if (cancelled) return;
        done = [];
        doneIds = [];
        await wait(650);
      }
    };
    run();

    return () => {
      cancelled = true;
      io.disconnect();
      for (const id of timers) clearTimeout(id);
    };
  });
</script>

<div bind:this={root} class={`hero-terminal ${className}`} aria-hidden="true">
  <div class="hero-terminal__body">
    {#each done as line, i (doneIds[i])}
      <div class="hero-terminal__line">
        {#each line as tok}<span class="tk-{tok.cls}">{tok.text}</span>{/each}
        {#if line.length === 0}&nbsp;{/if}
      </div>
    {/each}
    <div class="hero-terminal__line">
      {#each cur as tok}<span class="tk-{tok.cls}">{tok.text}</span>{/each}<span class="hero-terminal__cursor"></span>
    </div>
  </div>
</div>

<style>
  /* Background layer — no card chrome. The code drifts behind the whole
     hero like the output of the typing in the portrait: felt, not read. */
  .hero-terminal {
    position: absolute;
    inset: 0;
    overflow: hidden;
    font-family: var(--font-mono);
    font-size: clamp(12px, 1.05vw, 15px);
    line-height: 1.9;
    color: rgba(74, 222, 128, 0.34);
    text-align: left;
    pointer-events: none;
    /* Vertical fade (clear of nav + lede) × horizontal fade (clear of the
       portrait) — where the type crossed the face it read as noise. */
    mask-image:
      linear-gradient(180deg, transparent 0%, #000 12%, #000 72%, transparent 96%),
      linear-gradient(90deg, #000 0%, #000 52%, transparent 74%);
    mask-composite: intersect;
    -webkit-mask-image:
      linear-gradient(180deg, transparent 0%, #000 12%, #000 72%, transparent 96%),
      linear-gradient(90deg, #000 0%, #000 52%, transparent 74%);
    -webkit-mask-composite: source-in;
  }

  /* Lines anchored top-center, pouring down behind the hero — the code the
     portrait is "writing", clear of the nav and the lede. */
  .hero-terminal__body {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: min(52%, 620px);
    top: 12%;
    bottom: 42%;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    overflow: hidden;
  }

  .hero-terminal__line {
    white-space: pre;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Syntax palette — layered phosphor greens, dim on purpose. */
  .tk-txt { color: rgba(74, 222, 128, 0.34); }
  .tk-kw  { color: rgba(0, 255, 65, 0.5); text-shadow: 0 0 8px rgba(0, 255, 65, 0.25); }
  .tk-str { color: rgba(187, 247, 208, 0.38); }
  .tk-com { color: rgba(74, 222, 128, 0.24); font-style: italic; }
  .tk-fn  { color: rgba(134, 239, 172, 0.48); }
  .tk-num { color: rgba(163, 230, 53, 0.42); }

  .hero-terminal__cursor {
    display: inline-block;
    width: 0.6em;
    height: 1.05em;
    margin-left: 1px;
    vertical-align: text-bottom;
    background: rgba(0, 255, 65, 0.55);
    box-shadow: 0 0 10px rgba(0, 255, 65, 0.45);
    animation: ht-blink 1.05s steps(1) infinite;
  }
  @keyframes ht-blink {
    0%, 55% { opacity: 1; }
    56%, 100% { opacity: 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .hero-terminal__cursor {
      animation: none;
      opacity: 1;
    }
  }
</style>
