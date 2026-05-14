<script lang="ts">
  /**
   * Ice-flow background — a single-pass Three.js fullscreen quad with a
   * procedural FBM-noise fragment shader. Reads as slow drifting glacial
   * fog over a black bg. Inspired by quantum-website's ShaderAtmosphere
   * (`ice-flow` variant), stripped of the ASCII post-pass for a calmer
   * read and faster paint.
   *
   * Performance:
   *  - 30fps cap
   *  - IntersectionObserver pause when off-screen
   *  - prefers-reduced-motion: paints a single static frame
   */

  import { onMount } from "svelte";
  import * as THREE from "three";

  let wrapper: HTMLDivElement | null = $state(null);

  const FRAG = /* glsl */ `
    precision highp float;

    uniform vec2  uResolution;
    uniform float uTime;

    // Hash + noise primitives
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    float vnoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }
    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 5; i++) {
        v += a * vnoise(p);
        p *= 2.07;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / uResolution.xy;
      vec2 p = uv * 1.6;
      p.x *= uResolution.x / uResolution.y;

      // Domain warp so it billows
      float t = uTime * 0.06;
      vec2 q = vec2(fbm(p + vec2(t, 0.0)), fbm(p + vec2(0.0, t)));
      vec2 r = vec2(
        fbm(p + q + vec2(1.7, 9.2) + 0.15 * t),
        fbm(p + q + vec2(8.3, 2.8) + 0.13 * t)
      );
      float n = fbm(p + r);

      // Ice palette — black to glacial cyan
      vec3 deep = vec3(0.02, 0.03, 0.05);
      vec3 mid  = vec3(0.16, 0.34, 0.52);
      vec3 hi   = vec3(0.55, 0.78, 0.94);

      float v = smoothstep(0.25, 0.85, n);
      vec3 col = mix(deep, mid, v);
      col = mix(col, hi, smoothstep(0.7, 1.0, n) * 0.55);

      // Vignette
      float vig = smoothstep(1.1, 0.35, length(uv - 0.5));
      col *= 0.55 + 0.45 * vig;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  const VERT = /* glsl */ `
    void main() {
      gl_Position = vec4(position, 1.0);
    }
  `;

  onMount(() => {
    if (!wrapper) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    const rect = wrapper.getBoundingClientRect();
    renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
    renderer.setClearColor(0x000000, 1);
    wrapper.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uResolution: { value: new THREE.Vector2(rect.width, rect.height) },
      uTime: { value: 0 },
    };

    const mat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERT,
      fragmentShader: FRAG,
    });
    const geom = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geom, mat);
    scene.add(mesh);

    let rafId = 0;
    let visible = true;
    let lastDraw = 0;
    const TARGET_DT = 1000 / 30; // 30fps cap

    const tick = (now: number) => {
      if (!visible) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      if (now - lastDraw >= TARGET_DT) {
        uniforms.uTime.value = now * 0.001;
        renderer.render(scene, camera);
        lastDraw = now;
      }
      rafId = requestAnimationFrame(tick);
    };

    const resize = () => {
      if (!wrapper) return;
      const r = wrapper.getBoundingClientRect();
      renderer.setSize(Math.max(1, r.width), Math.max(1, r.height), false);
      uniforms.uResolution.value.set(r.width, r.height);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrapper);

    const io = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? false;
    });
    io.observe(wrapper);

    // Initial paint
    uniforms.uTime.value = 0;
    renderer.render(scene, camera);

    if (!reduced) rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      io.disconnect();
      renderer.dispose();
      geom.dispose();
      mat.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  });
</script>

<div bind:this={wrapper} class="ice-bg" aria-hidden="true"></div>

<style>
  .ice-bg {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
  }
  .ice-bg :global(canvas) {
    display: block;
    width: 100% !important;
    height: 100% !important;
  }
</style>
