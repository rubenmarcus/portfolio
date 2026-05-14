<script lang="ts">
  import { onMount } from "svelte";
  import * as THREE from "three";

  interface Props {
    /** Visual variant — particles drift volumetrically; lattice rotates a wireframe icosahedron; rings shows three orbital lines. */
    variant?: "particles" | "lattice" | "rings";
    /** Particle count for the "particles" variant. Lower = cheaper. */
    count?: number;
    /** Class on the wrapping element. */
    class?: string;
  }

  let {
    variant = "particles",
    count = 320,
    class: className = "",
  }: Props = $props();

  let wrapper: HTMLDivElement | null = $state(null);
  let enabled = $state(false);

  onMount(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!wrapper) return;
    enabled = true;

    const rect = wrapper.getBoundingClientRect();
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(rect.width || 1, rect.height || 1, false);
    renderer.setClearColor(0x000000, 0);
    wrapper.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, (rect.width || 1) / (rect.height || 1), 0.1, 100);
    camera.position.set(0, 0, 16);

    // ── Variant-specific objects ──────────────────────────────────────
    let particleMesh: THREE.Points | null = null;
    let lattice: THREE.LineSegments | null = null;
    const rings: THREE.Line[] = [];

    if (variant === "particles") {
      const positions = new Float32Array(count * 3);
      const sizes = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        // Volume around origin, slightly elongated on Z
        positions[i * 3 + 0] = (Math.random() - 0.5) * 30;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 24;
        sizes[i] = 0.05 + Math.random() * 0.18;
      }
      const geom = new THREE.BufferGeometry();
      geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geom.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

      const mat = new THREE.PointsMaterial({
        color: new THREE.Color("#bce7ff"),
        size: 0.085,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.78,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      particleMesh = new THREE.Points(geom, mat);
      scene.add(particleMesh);
    }

    if (variant === "lattice") {
      const geom = new THREE.IcosahedronGeometry(7, 1);
      const edges = new THREE.EdgesGeometry(geom);
      const mat = new THREE.LineBasicMaterial({
        color: new THREE.Color("#8fa9ff"),
        transparent: true,
        opacity: 0.35,
      });
      lattice = new THREE.LineSegments(edges, mat);
      scene.add(lattice);

      // Inner glow point cloud
      const pCount = 120;
      const pos = new Float32Array(pCount * 3);
      for (let i = 0; i < pCount; i++) {
        const r = 7 + Math.random() * 2.5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        pos[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
        pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        pos[i * 3 + 2] = r * Math.cos(phi);
      }
      const gpg = new THREE.BufferGeometry();
      gpg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const gpm = new THREE.PointsMaterial({
        color: new THREE.Color("#cfe5ff"),
        size: 0.12,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const haloDots = new THREE.Points(gpg, gpm);
      scene.add(haloDots);
    }

    if (variant === "rings") {
      const ringDefs = [
        { radius: 5.5, tilt: 0.15, color: "#8fa9ff", speed: 0.12 },
        { radius: 8.0, tilt: -0.45, color: "#bce7ff", speed: -0.07 },
        { radius: 11, tilt: 0.95, color: "#cfe5ff", speed: 0.05 },
      ];
      for (const def of ringDefs) {
        const segments = 128;
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i <= segments; i++) {
          const a = (i / segments) * Math.PI * 2;
          pts.push(new THREE.Vector3(Math.cos(a) * def.radius, 0, Math.sin(a) * def.radius));
        }
        const g = new THREE.BufferGeometry().setFromPoints(pts);
        const m = new THREE.LineBasicMaterial({
          color: new THREE.Color(def.color),
          transparent: true,
          opacity: 0.32,
        });
        const line = new THREE.Line(g, m);
        line.rotation.x = def.tilt;
        line.userData.speed = def.speed;
        scene.add(line);
        rings.push(line);
      }
    }

    // ── Loop ──────────────────────────────────────────────────────────
    let rafId = 0;
    let visible = true;
    let mouseX = 0, mouseY = 0;
    let targetCamX = 0, targetCamY = 0;
    let lastT = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(48, now - lastT) / 1000;
      lastT = now;
      if (!visible) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      // Smooth mouse-driven camera parallax
      targetCamX += ((mouseX * 1.6) - targetCamX) * 0.04;
      targetCamY += ((-mouseY * 1.1) - targetCamY) * 0.04;
      camera.position.x = targetCamX;
      camera.position.y = targetCamY;
      camera.lookAt(0, 0, 0);

      if (particleMesh && !reduced) {
        particleMesh.rotation.y += dt * 0.04;
        particleMesh.rotation.x += dt * 0.012;
      }
      if (lattice && !reduced) {
        lattice.rotation.y += dt * 0.08;
        lattice.rotation.x += dt * 0.03;
      }
      if (rings.length > 0 && !reduced) {
        for (const r of rings) {
          r.rotation.y += dt * (r.userData.speed ?? 0.1);
        }
      }

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(tick);
    };

    // Resize
    const resize = () => {
      if (!wrapper) return;
      const r = wrapper.getBoundingClientRect();
      const w = Math.max(1, r.width);
      const h = Math.max(1, r.height);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrapper);

    // Visibility
    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false;
      },
      { threshold: 0 },
    );
    io.observe(wrapper);

    const onMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("mousemove", onMove);
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      scene.traverse((obj) => {
        if ((obj as any).geometry) (obj as any).geometry.dispose?.();
        if ((obj as any).material) {
          const m = (obj as any).material;
          if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
          else m.dispose();
        }
      });
    };
  });
</script>

<div bind:this={wrapper} class={`three-bg ${className}`} aria-hidden="true"></div>

<style>
  .three-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }
  .three-bg :global(canvas) {
    display: block;
    width: 100% !important;
    height: 100% !important;
  }
</style>
