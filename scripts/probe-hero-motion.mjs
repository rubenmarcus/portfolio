#!/usr/bin/env node
/**
 * Hero motion probe — one-off interaction check for HeroScan.
 *
 * The visual gauntlet forces prefers-reduced-motion for deterministic
 * scored shots, so it never exercises the shader's animated path. This
 * probe launches headless Chrome WITHOUT that flag, loads the index page,
 * sweeps the pointer across the hero portrait via CDP Input events, and
 * captures two frames mid/post sweep. Console errors land next to the
 * shots as <shot>.console.txt (empty = clean).
 *
 * Usage: node scripts/probe-hero-motion.mjs
 * Expects a dev server on http://localhost:4399 (start `pnpm dev --port 4399`).
 */

import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "http://localhost:4399";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const CDP_PORT = 9334;
const OUT_DIR = path.join(ROOT, "qa", "shots");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let chromeProc = null;
let ws = null;
let msgId = 0;
const pending = new Map();
const eventHandlers = new Map();

async function launchChrome() {
  chromeProc = spawn(CHROME, [
    "--headless=new",
    "--use-angle=metal",
    "--hide-scrollbars",
    `--remote-debugging-port=${CDP_PORT}`,
    "--window-size=1600,1000",
    "about:blank",
  ], { stdio: ["ignore", "ignore", "ignore"] });

  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
      const info = await res.json();
      if (info.webSocketDebuggerUrl) {
        ws = new WebSocket(info.webSocketDebuggerUrl);
        await new Promise((r, j) => {
          ws.onopen = r;
          ws.onerror = j;
        });
        ws.onmessage = (e) => {
          const msg = JSON.parse(e.data);
          if (msg.id && pending.has(msg.id)) {
            pending.get(msg.id)(msg);
            pending.delete(msg.id);
          } else if (msg.method && eventHandlers.has(msg.method)) {
            eventHandlers.get(msg.method)(msg.params);
          }
        };
        return;
      }
    } catch {}
    await sleep(500);
  }
  throw new Error("chrome CDP did not come up");
}

function send(method, params = {}, sessionId) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, (msg) => {
      if (msg.error) reject(new Error(`${method}: ${msg.error.message}`));
      else resolve(msg.result);
    });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await launchChrome();

  const consoleLines = [];
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });

  eventHandlers.set("Log.entryAdded", (params) => {
    if (params?.entry?.level === "error") {
      consoleLines.push(`[log] ${params.entry.text} (${params.entry.url ?? ""})`);
    }
  });
  eventHandlers.set("Runtime.exceptionThrown", (p) => {
    consoleLines.push(
      `[exception] ${p.exceptionDetails?.text ?? ""} ${p.exceptionDetails?.exception?.description ?? ""}`,
    );
  });

  try {
    await send("Page.enable", {}, sessionId);
    await send("Runtime.enable", {}, sessionId);
    await send("Log.enable", {}, sessionId);
    await send(
      "Emulation.setDeviceMetricsOverride",
      { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false },
      sessionId,
    );
    await send("Page.navigate", { url: `${BASE}/` }, sessionId);
    await sleep(6000); // let three boot + texture load + intro settle

    // Rapid sweep across the portrait (right half of the hero) — fast
    // pointer = high uEnergy = visible scanline tearing near the cursor.
    const move = (x, y) =>
      send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y }, sessionId);

    for (let i = 0; i <= 20; i++) {
      await move(800 + i * 32, 300 + Math.sin(i * 0.7) * 140);
      await sleep(28);
    }
    // mid/post-sweep frame — tearing + ripple + cursor light active
    const shot1 = await send(
      "Page.captureScreenshot",
      { format: "png", captureBeyondViewport: false },
      sessionId,
    );
    await writeFile(
      path.join(OUT_DIR, "hero-motion-sweep.png"),
      Buffer.from(shot1.data, "base64"),
    );

    // Slow drift back to centre-right, then let it settle a beat — idle
    // breathing + possibly a glitch band, energy decayed.
    for (let i = 0; i <= 10; i++) {
      await move(1440 - i * 20, 420 - i * 6);
      await sleep(90);
    }
    await sleep(400);
    const shot2 = await send(
      "Page.captureScreenshot",
      { format: "png", captureBeyondViewport: false },
      sessionId,
    );
    await writeFile(
      path.join(OUT_DIR, "hero-motion-settle.png"),
      Buffer.from(shot2.data, "base64"),
    );

    // Sanity: is the canvas actually mounted (WebGL path, not the img)?
    const { result } = await send(
      "Runtime.evaluate",
      {
        expression: `!!document.querySelector(".hero-scan canvas")`,
        returnByValue: true,
      },
      sessionId,
    );
    console.log(`[probe] hero-scan canvas mounted: ${result?.value}`);
  } finally {
    await writeFile(
      path.join(OUT_DIR, "hero-motion.console.txt"),
      consoleLines.join("\n") + (consoleLines.length ? "\n" : ""),
    );
    eventHandlers.delete("Log.entryAdded");
    eventHandlers.delete("Runtime.exceptionThrown");
    await send("Target.closeTarget", { targetId }).catch(() => {});
    chromeProc?.kill("SIGTERM");
  }

  console.log(
    consoleLines.length
      ? `[probe] shots saved; ${consoleLines.length} console error(s) — see hero-motion.console.txt`
      : "[probe] shots saved; console clean",
  );
}

try {
  await main();
} finally {
  chromeProc?.kill("SIGTERM");
}
process.exit(0);
