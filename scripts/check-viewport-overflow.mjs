/**
 * Small regression check for the Step 4 clipping false-positive.
 * Uses the locally installed Chromium + CDP (no new npm dependency).
 *
 * Usage (production server must already be running):
 *   node scripts/check-viewport-overflow.mjs
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";

const BASE = process.env.BM_BASE_URL || "http://127.0.0.1:3000";
const CHROME =
  process.env.BM_CHROME_PATH ||
  path.join(
    process.env.LOCALAPPDATA || "",
    "ms-playwright",
    "chromium-1234",
    "chrome-win64",
    "chrome.exe",
  );

const VIEWPORTS = [
  { width: 320, height: 700 },
  { width: 390, height: 844 },
  { width: 768, height: 900 },
  { width: 1440, height: 900 },
];

const ROUTES = [
  "/",
  "/about",
  "/construction",
  "/support",
  "/updates",
  "/transparency",
  "/contact",
  "/privacy",
  "/donation-policy",
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      })
      .on("error", reject);
  });
}

async function waitForDebugPort(port, attempts = 40) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await getJson(`http://127.0.0.1:${port}/json/version`);
    } catch {
      await sleep(100);
    }
  }
  throw new Error(`Chrome debug port ${port} did not open`);
}

class Cdp {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.nextId = 1;
    this.pending = new Map();
  }

  async connect() {
    // Node 22+ has global WebSocket
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });
    this.ws.addEventListener("message", (event) => {
      const msg = JSON.parse(String(event.data));
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  async close() {
    this.ws?.close();
  }
}

async function measure(cdp, route, viewport, locale) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.width < 768,
  });
  await cdp.send("Network.setCookie", {
    name: "bm-locale",
    value: locale,
    url: BASE,
    path: "/",
  });
  const url = `${BASE}${route}`;
  await cdp.send("Page.navigate", { url });
  await cdp.send("Page.enable");
  await sleep(700);
  const { result } = await cdp.send("Runtime.evaluate", {
    expression: `(() => {
      const doc = document.documentElement;
      const overflow = doc.scrollWidth > doc.clientWidth + 1;
      const clipped = Array.from(document.querySelectorAll('main p, header, .site-container'))
        .slice(0, 20)
        .some((el) => el.scrollWidth > el.clientWidth + 1);
      return {
        route: ${JSON.stringify(route)},
        locale: ${JSON.stringify(locale)},
        viewport: ${JSON.stringify(viewport)},
        innerWidth: window.innerWidth,
        clientWidth: doc.clientWidth,
        scrollWidth: doc.scrollWidth,
        overflow,
        clipped,
        lang: doc.lang,
        title: document.title,
      };
    })()`,
    returnByValue: true,
  });
  return result.value;
}

async function main() {
  if (!fs.existsSync(CHROME)) {
    console.error(`Chrome not found at ${CHROME}`);
    process.exit(1);
  }

  const port = 9333 + Math.floor(Math.random() * 200);
  const userData = fs.mkdtempSync(path.join(process.env.TEMP || "/tmp", "bm-cdp-"));
  const chrome = spawn(
    CHROME,
    [
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${userData}`,
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "ignore"] },
  );

  try {
    await waitForDebugPort(port);
    const pages = await getJson(`http://127.0.0.1:${port}/json/list`);
    const page = pages.find((item) => item.type === "page") || pages[0];
    if (!page?.webSocketDebuggerUrl) {
      throw new Error("No CDP page target");
    }
    const cdp = new Cdp(page.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send("Page.enable");

    const failures = [];
    const rows = [];
    for (const viewport of VIEWPORTS) {
      for (const locale of ["bn", "en"]) {
        for (const route of ROUTES) {
          const row = await measure(cdp, route, viewport, locale);
          rows.push(row);
          if (row.overflow || row.clipped) failures.push(row);
        }
      }
    }

    await cdp.close();

    const outDir = "docs/step4-verification";
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(
      path.join(outDir, "overflow-check.json"),
      JSON.stringify({ base: BASE, checkedAt: new Date().toISOString(), rows, failures }, null, 2),
    );

    if (failures.length) {
      console.error(`FAIL: ${failures.length} overflow/clip findings`);
      console.error(JSON.stringify(failures.slice(0, 10), null, 2));
      process.exit(1);
    }
    console.log(`OK: ${rows.length} route/viewport/locale checks, no overflow`);
  } finally {
    chrome.kill();
    try {
      fs.rmSync(userData, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors on Windows when Chrome exits slowly
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
