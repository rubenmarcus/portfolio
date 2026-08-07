<script lang="ts">
  /**
   * HeroScan — the hero's living portrait: a generated video loop of Ruben
   * typing at the laptop (/art/ruben-hero-loop.mp4, green phosphor scanline
   * render; /art/ruben-hero-scan.png as poster until it loads) drawn on a
   * fullscreen quad with a custom fragment shader that makes it react:
   *
   *   - typing — real generated video motion (Veo image-to-video from the
   *     poster frame; first frame == last frame so the loop is seamless)
   *   - cursor flow — scanline rows crawl THROUGH the lit surfaces of the
   *     subject and deflect tangentially around the pointer; pointer SPEED
   *     feeds the amplitude. With no pointer input the field drifts on its
   *     own (slow Lissajous) so the portrait always feels volumetric
   *   - dither — tones break into a Bayer dot-matrix matching the artwork's
   *     dot/scan texture, sharpening near the cursor
   *   - idle motion — a slow breathing warp plus an occasional faint glitch
   *     band that shears sideways for ~180ms every 3.5–8.5s
   *   - phosphor feel — luminance-driven bloom, raster scanlines and film
   *     grain; every glow term is scaled by luminance so the pure-black
   *     backdrop stays pure black
   *   - parallax — the plane slides/leans a few percent against the cursor
   *     (3% overscan so edges never bleed)
   *
   * Cost discipline (same guards as HeroDesk3D):
   *   - three.js is dynamically imported only when the wrapper nears the viewport
   *   - devicePixelRatio capped at 2, rendering paused while offscreen
   *   - prefers-reduced-motion → one settled static frame (no loop, no warp)
   *   - no WebGL / texture or shader failure → the plain <img> fallback stays
   *   - everything disposed on unmount
   */

  import { onMount } from "svelte";

  interface Props {
    /** Poster artwork URL (same origin) — fallback & pre-video frame. */
    src?: string;
    /** Typing loop video (same origin) — becomes the texture once playable. */
    video?: string;
    /** Class on the wrapping element. */
    class?: string;
  }
  let {
    src = "/art/ruben-hero-scan.png",
    video = "/art/ruben-hero-loop.mp4",
    class: className = "",
  }: Props = $props();

  let wrapper: HTMLDivElement | null = $state(null);
  let ready = $state(false); // canvas live → fade the fallback img out

  const VERT = /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `;

  const FRAG = /* glsl */ `
    precision highp float;
    uniform sampler2D uTex;   // video frame (or static poster until it loads)
    uniform vec2  uCover;   // cover-fit uv scale (with overscan baked in)
    uniform float uShiftX;  // horizontal window shift — glues the subject right
    uniform vec2  uMouse;   // smoothed cursor, uv space (y up)
    uniform float uBlackLift; // noise-floor crush (video sources have lifted blacks)
    varying vec2 vUv;

    void main() {
      // cover-fit + right shift, then the parallax lean against the cursor
      vec2 par = uMouse - 0.5;
      vec2 uv = (vUv - 0.5) * uCover + 0.5;
      uv.x += uShiftX;
      uv = (uv - 0.5) * (1.0 + 0.022 * length(par)) + 0.5;
      uv += par * vec2(0.016, 0.013);

      // the video passes CLEAN — no warps, no raster, no grain, no dither
      vec3 col = texture2D(uTex, uv).rgb;
      // crush the source's noise floor — video codecs lift "black" to ~10-25,
      // which the output gamma would raise to a visible grey wash
      col = max(col - vec3(uBlackLift), vec3(0.0)) * (1.0 / (1.0 - uBlackLift));

      // sRGB out — the texture is decoded to linear on sample; without this
      // the midtones (the dim scanlines) render far too dark
      gl_FragColor = vec4(pow(max(col, vec3(0.0)), vec3(0.4545)), 1.0);
    }
  `;

  // Wireframe scanline layer — horizontal line rows that bend around the
  // cursor (or the autoplay drift), colored by the texture beneath them.
  // Invisible at rest; only the subject's lit areas react. Black stays black.
  const LINE_VERT = /* glsl */ `
    precision highp float;
    attribute vec2 aGrid;   // clip-space position (-1..1)
    uniform sampler2D uTex;
    uniform vec2  uCover;
    uniform float uShiftX;
    uniform float uBlackLift;
    uniform float uAspect;
    uniform float uTime;
    uniform vec2  uMouse;
    uniform float uEnergy;
    varying vec2 vUv;
    varying float vAlpha;

    void main() {
      vec2 uv = aGrid * 0.5 + 0.5;
      vec2 tuv = (uv - 0.5) * uCover + 0.5;
      tuv.x += uShiftX;
      vec3 col = texture2D(uTex, tuv).rgb;
      float lum = dot(col, vec3(0.299, 0.587, 0.114));
      // crush the codec's noise floor BEFORE gating — the video's lifted
      // blacks (~17/255) otherwise pass the smoothstep and the rows light up
      // across the whole frame instead of only over the subject
      lum = max(lum - uBlackLift, 0.0) * (1.0 / (1.0 - uBlackLift));

      vec2 dm = (uv - uMouse) * vec2(uAspect, 1.0);
      float md = length(dm);
      float near = exp(-md * md * 10.0);

      // rows deflect tangentially around the cursor — scanlines contouring
      // the pointer, never breaking
      vec2 tang = vec2(-dm.y, dm.x) / max(md, 1e-4);
      vec2 off = tang * near * (0.010 + uEnergy * 0.035) * (0.25 + lum * 1.5);
      off.y -= near * 0.006 * (0.25 + lum); // slight pull toward the cursor

      vAlpha = near * (0.30 + uEnergy * 0.45) * smoothstep(0.04, 0.30, lum);
      vUv = tuv;
      gl_Position = vec4(aGrid + off * 2.0, 0.0, 1.0);
    }
  `;

  const LINE_FRAG = /* glsl */ `
    precision highp float;
    uniform sampler2D uTex;
    uniform float uBlackLift;
    varying vec2 vUv;
    varying float vAlpha;

    void main() {
      if (vAlpha < 0.01) discard;
      vec3 col = texture2D(uTex, vUv).rgb;
      col = max(col - vec3(uBlackLift), vec3(0.0)) * (1.0 / (1.0 - uBlackLift));
      col = pow(max(col, vec3(0.0)), vec3(0.4545));
      gl_FragColor = vec4(col, vAlpha);
    }
  `;

  onMount(() => {
    if (!wrapper) return;
    const el = wrapper;
    let cleanup: (() => void) | null = null;
    let started = false;

    // Lazy: only pay for three.js once the hero is near the viewport.
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
      { rootMargin: "240px" },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      cleanup?.();
    };
  });

  async function init(el: HTMLElement): Promise<() => void> {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let THREE: typeof import("three");
    try {
      THREE = await import("three");
    } catch {
      return () => {}; // no three — fallback img stays
    }

    let renderer: import("three").WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: true,
        powerPreference: "low-power",
      });
    } catch {
      return () => {}; // no WebGL — fallback img stays
    }

    const rect = el.getBoundingClientRect();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(rect.width || 1, rect.height || 1, false);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    // Shader compile guard — any failure tears the canvas down again.
    let shaderFailed = false;
    renderer.debug.onShaderError = (gl, program, vs, fs) => {
      shaderFailed = true;
      console.error(
        "[HeroScan] shader error:",
        gl.getProgramInfoLog(program),
        gl.getShaderInfoLog(vs),
        gl.getShaderInfoLog(fs),
      );
    };

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uTex: { value: null as import("three").Texture | null },
      uCover: { value: new THREE.Vector2(1, 1) },
      uShiftX: { value: 0 },
      uAspect: { value: 1 },
      uTime: { value: 2.0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uEnergy: { value: 0 },
      uBlackLift: { value: 0 },
      uPointScale: { value: 2.0 },
    };
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERT,
      fragmentShader: FRAG,
      depthTest: false,
      depthWrite: false,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    quad.frustumCulled = false;
    scene.add(quad);

    // Wireframe scanline layer — horizontal line rows that bend around the
    // cursor. Shares the quad's uniforms. ~140 rows × 128 segments.
    const lineVerts: number[] = [];
    const ROWS = 140;
    const SEGS = 128;
    for (let r = 0; r < ROWS; r++) {
      const y = -1 + (r / (ROWS - 1)) * 2;
      for (let s = 0; s < SEGS; s++) {
        const x0 = -1 + (s / SEGS) * 2;
        const x1 = -1 + ((s + 1) / SEGS) * 2;
        lineVerts.push(x0, y, x1, y);
      }
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(lineVerts, 2));
    lineGeo.setAttribute("aGrid", new THREE.Float32BufferAttribute(lineVerts, 2));
    const lineMat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: LINE_VERT,
      fragmentShader: LINE_FRAG,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
    });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    lines.frustumCulled = false;
    scene.add(lines);

    // Load the artwork — on 404/decode failure the fallback img stays.
    let tex: import("three").Texture;
    try {
      tex = await new THREE.TextureLoader().loadAsync(src);
    } catch {
      renderer.dispose();
      renderer.domElement.remove();
      return () => {};
    }
    if (!el.isConnected) {
      tex.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      return () => {};
    }
    tex.colorSpace = THREE.SRGBColorSpace;
    // mipmaps — the artwork's fine scanlines alias into moiré stripes when
    // downscaled with plain linear filtering (WebGL2 handles NPOT mips)
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    uniforms.uTex.value = tex;
    let texW = tex.image.width || 896;
    let texH = tex.image.height || 1152;

    // Typing loop video — becomes the texture as soon as it can play; the
    // poster texture above covers load time and any failure. Muted +
    // playsinline so it autoplays everywhere; loop is seamless by
    // construction (first frame == last frame in the generated clip).
    let videoEl: HTMLVideoElement | null = null;
    let videoTex: import("three").VideoTexture | null = null;
    if (!reduced) {
      videoEl = document.createElement("video");
      videoEl.src = video;
      videoEl.muted = true;
      videoEl.loop = true;
      videoEl.playsInline = true;
      videoEl.preload = "auto";
      videoEl.setAttribute("aria-hidden", "true");
      videoEl.addEventListener("canplay", () => {
        if (!videoEl || !el.isConnected) return;
        videoTex = new THREE.VideoTexture(videoEl);
        videoTex.colorSpace = THREE.SRGBColorSpace;
        videoTex.minFilter = THREE.LinearMipmapLinearFilter;
        videoTex.magFilter = THREE.LinearFilter;
        videoTex.generateMipmaps = true;
        uniforms.uTex.value = videoTex;
        uniforms.uBlackLift.value = 0.055; // crush the codec's noise floor
        uniforms.uShiftX.value = -0.10; // glue the subject to the right side
        texW = videoEl.videoWidth || texW;
        texH = videoEl.videoHeight || texH;
        resize();
        videoEl.play().catch(() => {});
      });
      videoEl.load();
    }

    const resize = () => {
      const r = el.getBoundingClientRect();
      const w = Math.max(1, r.width);
      const h = Math.max(1, r.height);
      renderer.setSize(w, h, false);
      const ca = w / h;
      const ta = texW / texH;
      // cover-fit the texture to the frame, 3% overscan for the parallax
      if (ca > ta) uniforms.uCover.value.set(0.97, (ta / ca) * 0.97);
      else uniforms.uCover.value.set((ca / ta) * 0.97, 0.97);
      uniforms.uAspect.value = ca;
      uniforms.uPointScale.value = 2.0 * renderer.getPixelRatio();
      if (reduced) renderStill();
    };

    const renderStill = () => {
      uniforms.uTime.value = 2.0;
      uniforms.uEnergy.value = 0;
      renderer.render(scene, camera);
    };

    resize();

    // Force-compile now; on failure, remove the canvas — img fallback stays.
    try {
      renderer.compile(scene, camera);
    } catch {
      shaderFailed = true;
    }
    if (shaderFailed) {
      tex.dispose();
      material.dispose();
      quad.geometry.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      return () => {};
    }

    // ── Pointer state — raw targets on events, smoothed in the loop ────
    let targetX = 0.5;
    let targetY = 0.5;
    let mouseX = 0.5;
    let mouseY = 0.5;
    let energy = 0;
    let lastRawX = -1;
    let lastRawY = -1;
    let lastMoveT = 0;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      const nx = (e.clientX - r.left) / r.width;
      const ny = 1 - (e.clientY - r.top) / r.height;
      const now = performance.now();
      if (lastRawX >= 0 && now > lastMoveT) {
        const d = Math.hypot(nx - lastRawX, ny - lastRawY);
        const dt = (now - lastMoveT) / 1000;
        // uv/sec → 0..1 energy; a brisk sweep across the frame ≈ 1
        energy = Math.min(1, energy + Math.min(1, (d / Math.max(dt, 0.008)) * 0.55) * 0.5);
      }
      lastRawX = nx;
      lastRawY = ny;
      lastMoveT = now;
      targetX = THREE.MathUtils.clamp(nx, -0.15, 1.15);
      targetY = THREE.MathUtils.clamp(ny, -0.15, 1.15);
    };

    // ── Idle drift — pointer idle → the field wanders on its own ─────────

    let rafId = 0;
    let visible = true;
    let lastT = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, lastT ? (now - lastT) / 1000 : 0.016);
      lastT = now;
      if (visible) {
        const k = Math.min(1, dt * 5.5); // heavy easing — drifts, never twitches
        // autoplay drift — with no pointer input for a few seconds the field
        // wanders on its own (slow Lissajous), so the particle swarm keeps
        // breathing through the subject
        if (now - lastMoveT > 2600) {
          const t = now * 0.001;
          targetX = 0.5 + Math.sin(t * 0.21) * 0.22;
          targetY = 0.48 + Math.sin(t * 0.16 + 1.3) * 0.16;
          energy = Math.min(1, energy + dt * 0.08); // gentle ambient energy
        }
        mouseX += (targetX - mouseX) * k;
        mouseY += (targetY - mouseY) * k;
        energy = Math.max(0, energy - dt * 1.6);

        uniforms.uTime.value = now * 0.001;
        uniforms.uMouse.value.set(mouseX, mouseY);
        uniforms.uEnergy.value = energy;
        renderer.render(scene, camera);
      }
      rafId = requestAnimationFrame(tick);
    };

    if (reduced) {
      // Static poster — one settled frame, no loop, no listeners.
      renderStill();
    } else {
      rafId = requestAnimationFrame(tick);
      window.addEventListener("pointermove", onMove, { passive: true });
    }

    ready = true; // swap the fallback img for the canvas

    const ro = new ResizeObserver(resize);
    ro.observe(el);

    // Pause rendering (and the video) while offscreen
    const vio = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false;
        if (videoEl && videoTex) {
          if (visible) videoEl.play().catch(() => {});
          else videoEl.pause();
        }
      },
      { threshold: 0 },
    );
    vio.observe(el);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      vio.disconnect();
      window.removeEventListener("pointermove", onMove);
      if (videoEl) {
        videoEl.pause();
        videoEl.removeAttribute("src");
        videoEl.load();
      }
      videoTex?.dispose();
      tex.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      material.dispose();
      quad.geometry.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }
</script>

<div bind:this={wrapper} class={`hero-scan ${className}`} aria-hidden="true">
  <img
    class="hero-scan__fallback"
    class:hero-scan__fallback--hidden={ready}
    {src}
    alt=""
    decoding="async"
  />
</div>

<style>
  .hero-scan {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }
  .hero-scan :global(canvas) {
    position: absolute;
    inset: 0;
    display: block;
    width: 100% !important;
    height: 100% !important;
  }
  .hero-scan__fallback {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: opacity 700ms var(--ease-default, ease);
  }
  .hero-scan__fallback--hidden {
    opacity: 0;
  }
</style>
