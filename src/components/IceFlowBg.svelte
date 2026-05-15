<script lang="ts">
  /**
   * Ice-flow ambient bg — direct port of quantum-website's ShaderAtmosphere
   * (`ice-flow` variant) with the ASCII post-pass and cursor flashlight.
   *
   * Pipeline:
   *   1. BG pass: full-quad atmosphere shader (warped FBM + voronoi + grain)
   *   2. ASCII pass: converts the buffer into glyphs, applies scanlines /
   *      vignette / cursor halo
   *
   * Cursor tracking listens on document.pointermove so the flashlight
   * follows the user even while they're hovering content stacked above.
   */

  import { onMount, onDestroy } from "svelte";
  import * as THREE from "three";
  import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
  import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
  import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

  let host: HTMLDivElement | null = $state(null);
  let cleanup: () => void = () => {};

  // ─── Atmosphere shader (ice-flow variant only) ────────────────────────
  const VERT = /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const ATMO_FRAG = /* glsl */ `
    precision highp float;
    uniform float uTime;
    uniform vec2  uResolution;
    varying vec2 vUv;

    float hash11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
    float hash21(vec2 p)  { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
    vec2  hash22(vec2 p)  { vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      float a = hash21(i);
      float b = hash21(i + vec2(1.0, 0.0));
      float c = hash21(i + vec2(0.0, 1.0));
      float d = hash21(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    float fbm(vec2 p) {
      float v = 0.0; float a = 0.5;
      for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.07; a *= 0.5; }
      return v;
    }

    float warpedFbm(vec2 p, float t) {
      vec2 q = vec2(fbm(p + vec2(0.0, t * 0.05)),
                    fbm(p + vec2(5.2, 1.3) + t * 0.03));
      vec2 r = vec2(fbm(p + 4.0 * q + vec2(1.7, 9.2) + t * 0.04),
                    fbm(p + 4.0 * q + vec2(8.3, 2.8) - t * 0.04));
      return fbm(p + 4.0 * r);
    }

    vec2 voronoi(vec2 p, float t) {
      vec2 i = floor(p); vec2 f = fract(p);
      float F1 = 1e9, F2 = 1e9;
      for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
          vec2 g = vec2(float(x), float(y));
          vec2 o = hash22(i + g);
          o = 0.5 + 0.5 * sin(t * 0.3 + 6.2831 * o);
          vec2 r = g + o - f;
          float d = dot(r, r);
          if (d < F1) { F2 = F1; F1 = d; } else if (d < F2) { F2 = d; }
        }
      }
      return vec2(sqrt(F1), sqrt(F2));
    }

    vec3 paletteIce(float t) {
      vec3 a = vec3(0.04, 0.06, 0.10);
      vec3 b = vec3(0.36, 0.55, 0.74);
      vec3 c = vec3(0.66, 0.76, 0.86);
      return mix(a, mix(b, c, smoothstep(0.5, 1.0, t)), smoothstep(0.0, 1.0, t));
    }

    void main() {
      vec2 uv = vUv;
      vec2 ar = vec2(uResolution.x / uResolution.y, 1.0);
      vec2 p = (uv - 0.5) * ar;

      // ICE-FLOW variant 0
      float w = warpedFbm(p * 1.6, uTime * 0.7);
      vec2 vor = voronoi(p * 1.8, uTime * 0.4);
      float cells = smoothstep(0.0, 0.18, vor.y - vor.x);
      vec3 color = paletteIce(w);
      color += vec3(0.04, 0.07, 0.10) * (1.0 - cells) * 0.6;

      float vig = 1.0 - smoothstep(0.55, 1.05, length(p));
      color *= vig;
      float grain = (hash21(gl_FragCoord.xy + vec2(uTime * 60.0)) - 0.5) * 0.04;
      color += grain;

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  // ─── ASCII post-pass with cursor flashlight ──────────────────────────
  const ASCII_FRAG = /* glsl */ `
    precision highp float;
    uniform sampler2D tDiffuse;
    uniform vec2  uResolution;
    uniform float uCellSize;
    uniform vec3  uColor;
    uniform vec3  uBackgroundColor;
    uniform float uTime;
    uniform vec2  uMouse;
    uniform float uMouseGlow;
    uniform float uMouseRadius;
    uniform float uMouseStrength;
    uniform float uScanlines;
    uniform float uVignette;
    varying vec2 vUv;

    float character(int n, vec2 p) {
      p = floor(p * vec2(4.0, -4.0) + 2.5);
      if (clamp(p.x, 0.0, 4.0) == p.x && clamp(p.y, 0.0, 4.0) == p.y) {
        int a = int(round(p.x) + 5.0 * round(p.y));
        if (((n >> a) & 1) == 1) return 1.0;
      }
      return 0.0;
    }

    void main() {
      vec2 pix = gl_FragCoord.xy;
      vec2 uv = vUv;

      vec2 cellCoord = floor(pix / uCellSize) * uCellSize;
      vec2 cellUV = (cellCoord + uCellSize * 0.5) / uResolution;
      vec4 sceneColor = texture2D(tDiffuse, cellUV);

      float gray = dot(sceneColor.rgb, vec3(0.299, 0.587, 0.114));

      float mouseBoost = 0.0;
      if (uMouseGlow > 0.0) {
        vec2 mouseUV = uMouse / uResolution;
        vec2 ar = vec2(uResolution.x / uResolution.y, 1.0);
        float dist = length((uv - mouseUV) * ar);
        float halo = smoothstep(uMouseRadius, 0.0, dist);
        float centerDist = length((uv - vec2(0.5)) * ar);
        float centerFade = smoothstep(0.18, 0.42, centerDist);
        mouseBoost = halo * uMouseGlow * centerFade;
        gray = clamp(gray + mouseBoost * uMouseStrength, 0.0, 1.0);
      }

      int n = 0;
      if (gray > 0.05) n = 4194304;
      if (gray > 0.15) n = 131200;
      if (gray > 0.25) n = 4329604;
      if (gray > 0.35) n = 14815374;
      if (gray > 0.45) n = 4357252;
      if (gray > 0.55) n = 15255086;
      if (gray > 0.65) n = 4532014;
      if (gray > 0.75) n = 11512810;
      if (gray > 0.85) n = 27141542;

      vec2 cellPos = mod(pix, uCellSize) / uCellSize;
      vec2 charPos = cellPos * 2.0 - 1.0;
      float char = character(n, charPos);

      vec3 charColor = uColor * (0.55 + gray * 1.35);
      vec3 finalColor = mix(uBackgroundColor, charColor, char * gray * 1.5);

      if (uMouseGlow > 0.0) finalColor += uColor * mouseBoost * 0.45;

      if (uScanlines > 0.0) {
        float scanline = sin(pix.y * 3.14159 * 2.0) * 0.5 + 0.5;
        scanline = pow(scanline, 1.5) * uScanlines * 0.15;
        finalColor -= scanline;
      }
      if (uVignette > 0.0) {
        float v = 1.0 - length(uv - 0.5) * uVignette * 1.2;
        v = clamp(v, 0.0, 1.0);
        finalColor *= v;
      }

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  onMount(() => {
    if (!host) return;
    if (typeof WebGLRenderingContext === "undefined") return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth < 768;
    const effCell = isMobile ? 14 : 8;

    let w = host.clientWidth;
    let h = host.clientHeight;
    if (w === 0 || h === 0) {
      const id = requestAnimationFrame(() => {
        w = host!.clientWidth;
        h = host!.clientHeight;
        if (w > 0 && h > 0) start();
      });
      cleanup = () => cancelAnimationFrame(id);
      return;
    }
    start();

    function start() {
      if (!host) return;
      const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
      renderer.setPixelRatio(1);
      renderer.setSize(w, h);
      renderer.setClearColor(0x000000, 1);
      host.appendChild(renderer.domElement);
      renderer.domElement.style.display = "block";
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";

      // BG scene
      const bgScene = new THREE.Scene();
      const bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const bgMat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uResolution: { value: new THREE.Vector2(w, h) },
        },
        vertexShader: VERT,
        fragmentShader: ATMO_FRAG,
        depthWrite: false,
        depthTest: false,
      });
      const bgPlane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
      bgPlane.frustumCulled = false;
      bgScene.add(bgPlane);

      // Composer: bg → ASCII
      const composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(bgScene, bgCamera));

      const asciiPass = new ShaderPass({
        uniforms: {
          tDiffuse: { value: null },
          uResolution: { value: new THREE.Vector2(w, h) },
          uCellSize: { value: effCell },
          uColor: { value: new THREE.Color("#a8c3d8") },
          uBackgroundColor: { value: new THREE.Color("#000000") },
          uTime: { value: 0 },
          uMouse: { value: new THREE.Vector2(w * 0.5, h * 0.5) },
          uMouseGlow: { value: 0 },
          uMouseRadius: { value: 0.28 },
          uMouseStrength: { value: 0.85 },
          uScanlines: { value: 0.18 },
          uVignette: { value: 0.45 },
        },
        vertexShader: VERT,
        fragmentShader: ASCII_FRAG,
      });
      composer.addPass(asciiPass);

      // Cursor tracking — document level so the halo follows the user
      // even while hovering content on top of this bg
      const mouse = new THREE.Vector2(w * 0.5, h * 0.5);
      let targetGlow = 0;
      let currentGlow = 0;

      function onPointerMove(e: PointerEvent) {
        if (!host) return;
        const rect = host.getBoundingClientRect();
        const lx = e.clientX - rect.left;
        const ly = e.clientY - rect.top;
        const inside = lx >= 0 && lx <= rect.width && ly >= 0 && ly <= rect.height;
        if (inside) {
          mouse.x = lx;
          mouse.y = rect.height - ly; // shader uv origin = bottom-left
          targetGlow = 1;
        } else {
          targetGlow = 0;
        }
      }
      function onPointerLeaveDoc() { targetGlow = 0; }
      if (!isMobile) {
        document.addEventListener("pointermove", onPointerMove, { passive: true });
        document.addEventListener("pointerleave", onPointerLeaveDoc);
      }

      // In-view + frame pacing
      let visible = true;
      const io = new IntersectionObserver(
        (entries) => { visible = entries[0]?.isIntersecting ?? false; },
        { threshold: 0.01 },
      );
      io.observe(host);

      let raf = 0;
      let last = 0;
      const frameMs = 1000 / 30;
      const startT = performance.now();

      function tick() {
        const now = performance.now();
        if (now - last < frameMs || !visible) {
          if (!reduced) raf = requestAnimationFrame(tick);
          return;
        }
        last = now;
        const t = (now - startT) * 0.001;
        bgMat.uniforms.uTime.value = t;
        asciiPass.uniforms.uTime.value = t;

        currentGlow += (targetGlow - currentGlow) * 0.08;
        asciiPass.uniforms.uMouse.value.copy(mouse);
        asciiPass.uniforms.uMouseGlow.value = currentGlow;

        composer.render();
        if (!reduced) raf = requestAnimationFrame(tick);
      }

      function onResize() {
        if (!host) return;
        w = host.clientWidth;
        h = host.clientHeight;
        if (w === 0 || h === 0) return;
        renderer.setSize(w, h);
        composer.setSize(w, h);
        bgMat.uniforms.uResolution.value.set(w, h);
        asciiPass.uniforms.uResolution.value.set(w, h);
      }
      window.addEventListener("resize", onResize);
      raf = requestAnimationFrame(tick);

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        if (!isMobile) {
          document.removeEventListener("pointermove", onPointerMove);
          document.removeEventListener("pointerleave", onPointerLeaveDoc);
        }
        io.disconnect();
        bgPlane.geometry.dispose();
        bgMat.dispose();
        composer.dispose();
        renderer.dispose();
        while (host && host.firstChild) host.removeChild(host.firstChild);
      };
    }
  });

  onDestroy(() => cleanup());
</script>

<div bind:this={host} class="ice-bg" aria-hidden="true"></div>

<style>
  .ice-bg {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    width: 100%;
    height: 100%;
  }
</style>
