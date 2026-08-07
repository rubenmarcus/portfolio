#!/usr/bin/env node
/**
 * Visual gauntlet harness.
 *
 * Screenshots every page at desktop (1600x1000) and mobile (390x844) with
 * headless Chrome over the DevTools protocol, saving to
 * qa/shots/<page>-<viewport>-cycle<N>.png. Page console errors and uncaught
 * exceptions are written next to each shot as <shot>.console.txt
 * (empty file = clean).
 *
 * Why CDP instead of `chrome --screenshot`:
 *  - `--window-size=390` is clamped to ~490px min in headless=new, so
 *    CLI-only "mobile" shots crop a 490px layout. CDP
 *    Emulation.setDeviceMetricsOverride gives a true 390px layout.
 *  - `--use-angle=metal` renders the real GPU path; SwiftShader (the
 *    headless default) fails/mangles this site's shaders.
 *  - `--force-prefers-reduced-motion` makes every shot a deterministic
 *    settled frame (the site's first-class static path). The vortex intro
 *    only plays with motion enabled — verify it with dedicated shots, not
 *    the scored set.
 *
 * Usage:
 *   node scripts/visual-gauntlet.mjs [--cycle N] [--pages /,/about] [--keep-server]
 *
 * Starts `pnpm dev` on port 4399 unless something is already serving there.
 * A server started by this script is shut down on exit unless --keep-server.
 */

import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 4399;
const BASE = `http://localhost:${PORT}`;
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const CDP_PORT = 9333;
const SHOTS_DIR = path.join(ROOT, "qa", "shots");

const ALL_PAGES = ["/", "/portfolio", "/ai", "/blog", "/about", "/contact"];
const VIEWPORTS = [
  { name: "1600x1000", w: 1600, h: 1000, mobile: false },
  { name: "390x844", w: 390, h: 844, mobile: true },
];
// Settle time after load before capturing (GLB fetch + decode + poster).
const SETTLE_MS = 9000;

const args = process.argv.slice(2);
function argValue(flag, fallback) {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}
const CYCLE = Number(argValue("--cycle", "1"));
const PAGES = argValue("--pages", ALL_PAGES.join(","))
  .split(",")
  .map((p) => (p.startsWith("/") ? p : `/${p}`));
const KEEP_SERVER = args.includes("--keep-server");

const slug = (p) => (p === "/" ? "index" : p.replace(/^\//, "").replace(/\//g, "-"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Dev server ──────────────────────────────────────────────────────────

async function serverUp() {
  try {
    const res = await fetch(BASE + "/", { signal: AbortSignal.timeout(2000) });
    return res.status < 500;
  } catch {
    return false;
  }
}

let devProc = null;

async function ensureServer() {
  if (await serverUp()) {
    console.log(`[gauntlet] reusing server on ${BASE}`);
    return;
  }
  console.log(`[gauntlet] starting pnpm dev on port ${PORT} ...`);
  devProc = spawn("pnpm", ["dev", "--port", String(PORT)], {
    cwd: ROOT,
    stdio: ["ignore", "ignore", "inherit"],
  });
  const start = Date.now();
  while (Date.now() - start < 60000) {
    if (await serverUp()) return;
    await sleep(1000);
  }
  throw new Error(`dev server did not come up on ${BASE} within 60s`);
}

// ── Chrome + CDP ────────────────────────────────────────────────────────

let chromeProc = null;
let ws = null;
let msgId = 0;
const pending = new Map();
const eventHandlers = new Map();

async function launchChrome() {
  chromeProc = spawn(CHROME, [
    "--headless=new",
    "--use-angle=metal",
    "--force-prefers-reduced-motion",
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

async function shoot(page, viewport) {
  const name = `${slug(page)}-${viewport.name}-cycle${CYCLE}`;
  const out = path.join(SHOTS_DIR, `${name}.png`);
  const consoleLines = [];

  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });

  const onEvent = (params) => {
    if (params?.entry?.level === "error") {
      consoleLines.push(`[log] ${params.entry.text} (${params.entry.url ?? ""})`);
    }
  };
  eventHandlers.set("Log.entryAdded", onEvent);
  eventHandlers.set("Runtime.exceptionThrown", (p) => {
    consoleLines.push(`[exception] ${p.exceptionDetails?.text ?? ""} ${p.exceptionDetails?.exception?.description ?? ""}`);
  });

  try {
    await send("Page.enable", {}, sessionId);
    await send("Runtime.enable", {}, sessionId);
    await send("Log.enable", {}, sessionId);
    await send(
      "Emulation.setDeviceMetricsOverride",
      {
        width: viewport.w,
        height: viewport.h,
        deviceScaleFactor: 1,
        mobile: viewport.mobile,
      },
      sessionId,
    );
    await send("Page.navigate", { url: `${BASE}${page}` }, sessionId);
    await sleep(SETTLE_MS);

    const shot = await send(
      "Page.captureScreenshot",
      { format: "png", captureBeyondViewport: false },
      sessionId,
    );
    await writeFile(out, Buffer.from(shot.data, "base64"));
  } finally {
    eventHandlers.delete("Log.entryAdded");
    eventHandlers.delete("Runtime.exceptionThrown");
    await send("Target.closeTarget", { targetId }).catch(() => {});
  }

  await writeFile(
    path.join(SHOTS_DIR, `${name}.console.txt`),
    consoleLines.join("\n") + (consoleLines.length ? "\n" : ""),
  );
  return { page, viewport: viewport.name, out, consoleLines };
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  await mkdir(SHOTS_DIR, { recursive: true });
  await ensureServer();
  await launchChrome();

  const results = [];
  for (const page of PAGES) {
    for (const vp of VIEWPORTS) {
      process.stdout.write(`[gauntlet] ${page} @${vp.name} ... `);
      const r = await shoot(page, vp);
      console.log(
        r.consoleLines.length
          ? `shot + ${r.consoleLines.length} console error(s)`
          : "shot (console clean)",
      );
      results.push(r);
    }
  }

  const dirty = results.filter((r) => r.consoleLines.length);
  console.log(
    `\n[gauntlet] cycle ${CYCLE}: ${results.length} shots in qa/shots, ` +
      `${dirty.length} with console errors`,
  );
  for (const d of dirty) {
    console.log(`  - ${d.page} @${d.viewport}:`);
    for (const l of d.consoleLines.slice(0, 5)) console.log(`      ${l}`);
  }
}

try {
  await main();
} finally {
  chromeProc?.kill("SIGTERM");
  if (devProc && !KEEP_SERVER) devProc.kill("SIGTERM");
}
// With --keep-server the spawned dev server is deliberately left alive;
// exit explicitly so its process handle doesn't hold this script open.
process.exit(0);
