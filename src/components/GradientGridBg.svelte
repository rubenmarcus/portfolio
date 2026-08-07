<script lang="ts">
  /**
   * Gradient-grid backdrop — a full-bleed GLSL quad behind the hero content.
   *
   * Near-black base with slowly drifting deep-green/teal FBM blooms and a
   * faint green perspective floor grid scrolling toward the viewer, all faded
   * to black at the edges by a radial mask. Rendered with
   * `mix-blend-mode: screen` so the dark base never obscures the layers
   * underneath.
   *
   * Performance:
   *   - lazily boots three.js near the viewport, DPR capped at 1.5
   *   - paused while offscreen, everything disposed on unmount
   *   - prefers-reduced-motion / small screens → single static frame
   */

  import { onMount } from "svelte";

  let host: HTMLDivElement | null = $state(null);

  const VERT = /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const FRAG = /* glsl */ `
    precision highp float;
    uniform float uTime;
    uniform vec2  uResolution;
    uniform vec2  uPointer; // smoothed cursor in uv — blooms/grid lean toward it
    varying vec2 vUv;

    float hash21(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      float a = hash21(i), b = hash21(i + vec2(1, 0)),
            c = hash21(i + vec2(0, 1)), d = hash21(i + vec2(1, 1));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.05; a *= 0.5; }
      return v;
    }

    void main() {
      vec2 uv = vUv;
      vec2 ar = vec2(uResolution.x / uResolution.y, 1.0);
      vec2 p = (uv - 0.5) * ar;
      float t = uTime;

      vec3 col = vec3(0.0);
      // pointer offset in the same centred space, subtle amplitude
      vec2 ptr = (uPointer - 0.5) * ar;

      // Drifting blooms — deep green upper field, forest-teal lower right.
      // Each bloom field slides a touch toward the cursor.
      float b1 = fbm(p * 1.6 + vec2(t * 0.030, -t * 0.017) + vec2(2.0, 5.0) - ptr * 0.22);
      b1 = smoothstep(0.42, 0.9, b1);
      float b2 = fbm(p * 1.3 + vec2(-t * 0.021, t * 0.026) + vec2(7.3, 1.1) - ptr * 0.14);
      b2 = smoothstep(0.5, 0.95, b2);

      col += vec3(0.078, 0.325, 0.176) * b1 * 0.16; // deep green #14532d
      col += vec3(0.020, 0.180, 0.086) * b2 * 0.14; // forest    #052e16

      // Faint perspective floor grid scrolling toward the viewer — the
      // horizon and vanishing point shift subtly with the cursor
      float horizon = 0.62 + ptr.y * 0.05;
      if (uv.y < horizon) {
        float z = 0.10 / max(horizon - uv.y, 0.002);
        vec2 g = vec2((p.x - ptr.x * 0.16) * z * 1.4, z + t * 0.5);
        vec2 fw = fwidth(g) + 1e-4;
        vec2 gf = abs(fract(g - 0.5) - 0.5) / fw;
        float line = 1.0 - min(min(gf.x, gf.y), 1.0);
        float fade = exp(-z * 0.35);
        col += vec3(0.0, 1.0, 0.255) * line * fade * 0.07; // terminal #00ff41
      }

      // Radial mask — edges fade to black
      float vig = 1.0 - smoothstep(0.35, 0.85, length(p));
      col *= vig;

      // Micro grain
      col += (hash21(gl_FragCoord.xy + vec2(t * 47.0)) - 0.5) * 0.012;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  onMount(() => {
    if (!host) return;
    if (typeof WebGLRenderingContext === "undefined") return;
    const el = host;
    let cleanup: (() => void) | null = null;
    let started = false;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !started) {
          started = true;
          io.disconnect();
          init(el).then((c) => {
            cleanup = c;
          });
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      cleanup?.();
    };
  });

  async function init(el: HTMLElement): Promise<() => void> {
    const THREE = await import("three");

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const smallScreen = window.matchMedia("(max-width: 767px)").matches;
    const staticMode = reduced || smallScreen;

    const rect = el.getBoundingClientRect();
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(rect.width || 1, rect.height || 1, false);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 12 }, // a nicely-composed frame for static mode
        uResolution: {
          value: new THREE.Vector2(rect.width || 1, rect.height || 1),
        },
        uPointer: { value: new THREE.Vector2(0.5, 0.5) },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      depthWrite: false,
      depthTest: false,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    quad.frustumCulled = false;
    scene.add(quad);

    const render = (t: number) => {
      mat.uniforms.uTime.value = t;
      renderer.render(scene, camera);
    };

    // Pointer tracking — target updates on mousemove, the uniform eases
    // toward it with a ~2s settle so blooms/grid drift, never snap.
    let ptrTargetX = 0.5;
    let ptrTargetY = 0.5;
    let ptrX = 0.5;
    let ptrY = 0.5;
    const onMove = (e: MouseEvent) => {
      ptrTargetX = e.clientX / window.innerWidth;
      ptrTargetY = 1 - e.clientY / window.innerHeight;
    };
    if (!staticMode) {
      window.addEventListener("mousemove", onMove, { passive: true });
    }

    let rafId = 0;
    let visible = true;
    let lastT = 0;
    const startT = performance.now();
    const tick = (now: number) => {
      const dt = lastT ? Math.min((now - lastT) / 1000, 0.1) : 0.016;
      lastT = now;
      const k = Math.min(1, dt * 1.1); // ≈2s to converge
      ptrX += (ptrTargetX - ptrX) * k;
      ptrY += (ptrTargetY - ptrY) * k;
      mat.uniforms.uPointer.value.set(ptrX, ptrY);
      if (visible) render((now - startT) * 0.001 + 12);
      rafId = requestAnimationFrame(tick);
    };
    if (!staticMode) {
      rafId = requestAnimationFrame(tick);
    } else {
      render(12);
    }

    const resize = () => {
      const r = el.getBoundingClientRect();
      const w = Math.max(1, r.width);
      const h = Math.max(1, r.height);
      renderer.setSize(w, h, false);
      mat.uniforms.uResolution.value.set(w, h);
      if (staticMode) render(12);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const vio = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false;
      },
      { threshold: 0 },
    );
    vio.observe(el);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      vio.disconnect();
      window.removeEventListener("mousemove", onMove);
      quad.geometry.dispose();
      mat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }
</script>

<div bind:this={host} class="gradient-grid-bg" aria-hidden="true"></div>

<style>
  .gradient-grid-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    mix-blend-mode: screen;
  }
  .gradient-grid-bg :global(canvas) {
    display: block;
    width: 100% !important;
    height: 100% !important;
  }
</style>
