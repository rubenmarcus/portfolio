<script lang="ts">
  /**
   * Rotates through a list of words. Instead of fading out / in (which reads
   * as a blink) the verb morphs char-by-char through scrambled glyphs into
   * the next word, then settles. Stays visible the whole time.
   */

  interface Props {
    words: string[];
    /** Total milliseconds each word remains visible before the morph begins. */
    interval?: number;
    /** Total milliseconds of the morph transition. */
    morphMs?: number;
    class?: string;
  }

  let {
    words,
    interval = 3400,
    morphMs = 700,
    class: className = "",
  }: Props = $props();

  // Same three-way pool as the global scramble utility
  const LATIN = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const NUMS = "0123456789";
  const KATAKANA =
    "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";
  const POOL = LATIN + LATIN + NUMS + NUMS + KATAKANA;

  function rand(): string {
    return POOL[Math.floor(Math.random() * POOL.length)];
  }

  let index = $state(0);
  let display = $state(words[0]);
  let morphing = $state(false);

  function morphTo(next: string) {
    const from = display;
    const target = next;
    const len = Math.max(from.length, target.length);
    const startedAt = performance.now();
    morphing = true;

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const t = Math.min(1, elapsed / morphMs);

      let out = "";
      // Each char locks at its own progress slice for a typewriter-style cascade
      for (let i = 0; i < target.length; i++) {
        const charProgress = Math.max(0, Math.min(1, (t - (i / len) * 0.5) / 0.5));
        if (charProgress >= 1) {
          out += target[i];
        } else if (target[i] === " ") {
          out += " ";
        } else {
          out += rand();
        }
      }

      display = out;
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        display = target;
        morphing = false;
      }
    };

    requestAnimationFrame(tick);
  }

  $effect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const id = setInterval(() => {
      const nextIdx = (index + 1) % words.length;
      index = nextIdx;
      if (reduced) {
        display = words[nextIdx];
      } else {
        morphTo(words[nextIdx]);
      }
    }, interval);

    return () => clearInterval(id);
  });
</script>

<span class={`rotating ${className}`} aria-live="polite">{display}</span>

<style>
  .rotating {
    display: inline-block;
    color: var(--accent-soft);
    /* Reserve width — keep the H1 layout stable as the word changes */
    min-width: 0;
  }
</style>
