/**
 * Capture production verification screenshots using CDP device metrics
 * (not Chrome --window-size --screenshot, which cropped frames in Step 3B).
 *
 * Usage: production server on BM_BASE_URL (default http://127.0.0.1:3000)
 *   node scripts/capture-step4-screenshots.mjs
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";

const BASE = process.env.BM_BASE_URL || "http://127.0.0.1:3000";
const OUT = "docs/step4-verification";
const CHROME =
  process.env.BM_CHROME_PATH ||
  path.join(
    process.env.LOCALAPPDATA || "",
    "ms-playwright",
    "chromium-1234",
    "chrome-win64",
    "chrome.exe",
  );

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

async function waitForDebugPort(port, attempts = 50) {
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

  close() {
    this.ws?.close();
  }
}

async function shot(cdp, { route, locale, width, height, file, fullPage = false }) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 768,
  });
  await cdp.send("Network.enable");
  await cdp.send("Network.setCookie", {
    name: "bm-locale",
    value: locale,
    url: BASE,
    path: "/",
  });
  await cdp.send("Page.enable");
  await cdp.send("Page.navigate", { url: `${BASE}${route}` });
  await sleep(900);
  const result = await cdp.send("Page.captureScreenshot", {
    format: "jpeg",
    quality: 82,
    fromSurface: true,
    captureBeyondViewport: fullPage,
  });
  fs.writeFileSync(path.join(OUT, file), Buffer.from(result.data, "base64"));
  console.log("wrote", file);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const port = 9340 + Math.floor(Math.random() * 200);
  const userData = fs.mkdtempSync(path.join(process.env.TEMP || "/tmp", "bm-shot-"));
  const chrome = spawn(
    CHROME,
    [
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${userData}`,
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  try {
    await waitForDebugPort(port);
    const pages = await getJson(`http://127.0.0.1:${port}/json/list`);
    const page = pages.find((item) => item.type === "page") || pages[0];
    const cdp = new Cdp(page.webSocketDebuggerUrl);
    await cdp.connect();

    const jobs = [
      { route: "/support", locale: "bn", width: 320, height: 700, file: "support-bn-320.jpeg" },
      { route: "/support", locale: "bn", width: 390, height: 844, file: "support-bn-390.jpeg" },
      { route: "/support", locale: "en", width: 390, height: 844, file: "support-en-390.jpeg" },
      { route: "/support", locale: "bn", width: 1440, height: 900, file: "support-bn-1440.jpeg" },
      {
        route: "/support",
        locale: "bn",
        width: 390,
        height: 844,
        file: "support-bn-390-full.jpeg",
        fullPage: true,
      },
      { route: "/", locale: "bn", width: 390, height: 844, file: "home-bn-390.jpeg" },
      { route: "/", locale: "bn", width: 1440, height: 900, file: "home-bn-1440.jpeg" },
      {
        route: "/",
        locale: "bn",
        width: 390,
        height: 844,
        file: "home-bn-390-full.jpeg",
        fullPage: true,
      },
    ];

    for (const job of jobs) {
      await shot(cdp, job);
    }

    cdp.close();
  } finally {
    chrome.kill();
    await sleep(300);
    try {
      fs.rmSync(userData, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
