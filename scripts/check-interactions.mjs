/**
 * Production interaction smoke checks via CDP (no new dependencies).
 * Requires production server at BM_BASE_URL.
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
    this.ws = null;
    this.nextId = 1;
    this.pending = new Map();
    this.wsUrl = wsUrl;
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

async function evaluate(cdp, expression) {
  const { result } = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  return result.value;
}

async function waitFor(cdp, expression, attempts = 40, delayMs = 250) {
  for (let i = 0; i < attempts; i++) {
    const value = await evaluate(cdp, expression);
    if (value) return value;
    await sleep(delayMs);
  }
  return null;
}

async function main() {
  const port = 9350 + Math.floor(Math.random() * 200);
  const userData = fs.mkdtempSync(path.join(process.env.TEMP || "/tmp", "bm-ix-"));
  const chrome = spawn(
    CHROME,
    [
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${userData}`,
      "--headless=new",
      "--disable-gpu",
      "--force-device-scale-factor=1",
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  const report = { base: BASE, checkedAt: new Date().toISOString() };

  try {
    await waitForDebugPort(port);
    const pages = await getJson(`http://127.0.0.1:${port}/json/list`);
    const page = pages.find((item) => item.type === "page") || pages[0];
    const cdp = new Cdp(page.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Browser.grantPermissions", {
      origin: BASE,
      permissions: ["clipboardReadWrite", "clipboardSanitizedWrite"],
    }).catch(() => {});
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });

    // Support share + language
    await cdp.send("Network.enable");
    await cdp.send("Network.setCookie", {
      name: "bm-locale",
      value: "bn",
      url: BASE,
      path: "/",
    });
    await cdp.send("Page.navigate", { url: `${BASE}/support` });
    await waitFor(
      cdp,
      `!!Array.from(document.querySelectorAll('button')).find((b) => /লিংক কপি|Copy link/i.test(b.textContent || ''))`,
    );

    report.support = await evaluate(
      cdp,
      `(() => {
        const imgs = Array.from(document.images);
        const broken = imgs.filter((img) => img.complete && img.naturalWidth === 0).length;
        const forms = document.forms.length;
        return {
          path: location.pathname,
          lang: document.documentElement.lang,
          title: document.title,
          brokenImages: broken,
          forms,
          hasCopy: !!Array.from(document.querySelectorAll('button')).find((b) => /কপি|Copy/i.test(b.textContent || '')),
          hasWhatsApp: !!Array.from(document.querySelectorAll('button')).find((b) => /WhatsApp/i.test(b.textContent || '')),
          nativeShareSupported: typeof navigator.share === 'function',
          h1: document.querySelector('h1')?.textContent || '',
        };
      })()`,
    );

    // Click copy via DOM
    report.copy = await evaluate(
      cdp,
      `(async () => {
        const btn = Array.from(document.querySelectorAll('button')).find((b) => /লিংক কপি|Copy link/i.test(b.textContent || ''));
        if (!btn) return { ok: false, reason: 'missing button' };
        btn.click();
        await new Promise((r) => setTimeout(r, 300));
        const status = Array.from(document.querySelectorAll('[role=\"status\"]')).map((el) => el.textContent || '').join('|');
        let clipboard = null;
        try { clipboard = await navigator.clipboard.readText(); } catch (e) { clipboard = 'blocked:' + e.message; }
        return { ok: true, status, clipboard };
      })()`,
    );

    // WhatsApp href construction without relying on popup
    report.whatsapp = await evaluate(
      cdp,
      `(() => {
        const url = location.href;
        const template = Array.from(document.querySelectorAll('section')).map(s => s.textContent).join(' ');
        // Recompute the same way the component does: message template is not in DOM; check button exists and current URL is used at click time by patching open.
        let opened = '';
        const original = window.open;
        window.open = (u) => { opened = String(u); return null; };
        const btn = Array.from(document.querySelectorAll('button')).find((b) => /WhatsApp/i.test(b.textContent || ''));
        btn?.click();
        window.open = original;
        return {
          opened,
          usesCurrentUrl: opened.includes(encodeURIComponent(url)) || opened.includes(url),
          isWaMe: opened.startsWith('https://wa.me/?text='),
        };
      })()`,
    );

    // Language switch
    await evaluate(
      cdp,
      `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'English');
        btn?.click();
        return !!btn;
      })()`,
    );
    await waitFor(cdp, `document.documentElement.lang === 'en'`);
    report.languageEn = await evaluate(
      cdp,
      `({ path: location.pathname, lang: document.documentElement.lang, title: document.title, h1: document.querySelector('h1')?.textContent || '' })`,
    );

    // Mobile menu keyboard-ish via DOM focus + Escape key event
    await cdp.send("Network.setCookie", {
      name: "bm-locale",
      value: "bn",
      url: BASE,
      path: "/",
    });
    await cdp.send("Page.navigate", { url: `${BASE}/` });
    await waitFor(cdp, `!!document.querySelector('header button[aria-expanded]')`);
    report.menu = await evaluate(
      cdp,
      `(async () => {
        const btn = document.querySelector('header button[aria-expanded]');
        btn?.focus();
        btn?.click();
        await new Promise((r) => setTimeout(r, 200));
        const expanded = btn?.getAttribute('aria-expanded');
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await new Promise((r) => setTimeout(r, 200));
        return {
          expandedAfterOpen: expanded,
          expandedAfterEscape: btn?.getAttribute('aria-expanded'),
          focusVisibleStylePresent: !!Array.from(document.styleSheets).some((sheet) => {
            try {
              return Array.from(sheet.cssRules || []).some((rule) => String(rule.selectorText || '').includes(':focus-visible'));
            } catch { return false; }
          }),
          bodyPaddingBottom: getComputedStyle(document.body).paddingBottom,
        };
      })()`,
    );

    // Gallery
    await cdp.send("Page.navigate", { url: `${BASE}/updates` });
    await waitFor(cdp, `!!document.querySelector('main button')`);
    report.gallery = await evaluate(
      cdp,
      `(async () => {
        const first = document.querySelector('main button');
        first?.click();
        await new Promise((r) => setTimeout(r, 300));
        const dialog = document.querySelector('[role=\"dialog\"]');
        const close = dialog && Array.from(dialog.querySelectorAll('button')).find((b) => /বন্ধ|Close/i.test(b.textContent || ''));
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await new Promise((r) => setTimeout(r, 250));
        const dialogAfter = document.querySelector('[role=\"dialog\"]');
        return {
          opened: !!dialog,
          hasClose: !!close,
          closedAfterEscape: !dialogAfter,
          brokenImages: Array.from(document.images).filter((img) => img.complete && img.naturalWidth === 0).length,
        };
      })()`,
    );

    // Reduced motion
    await cdp.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
    report.reducedMotion = await evaluate(
      cdp,
      `({ scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior })`,
    );

    // Footer nav
    await cdp.send("Page.navigate", { url: `${BASE}/about` });
    await sleep(700);
    report.footer = await evaluate(
      cdp,
      `(() => {
        const link = document.querySelector('footer a[href=\"/support\"]');
        link?.click();
        return { href: link?.getAttribute('href') || null };
      })()`,
    );
    await sleep(700);
    report.footerLanded = await evaluate(cdp, `location.pathname`);

    fs.mkdirSync("docs/step4-verification", { recursive: true });
    fs.writeFileSync(
      "docs/step4-verification/interaction-check.json",
      JSON.stringify(report, null, 2),
    );
    console.log(JSON.stringify(report, null, 2));
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
