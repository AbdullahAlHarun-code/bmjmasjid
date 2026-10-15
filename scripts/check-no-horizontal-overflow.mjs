/**
 * Regression check for the Step 4 clipping finding.
 *
 * Requires a running local server (default http://localhost:3000) and Playwright.
 * Uses CSS viewport sizing — do NOT use Chrome --window-size screenshots for this.
 *
 *   npx --yes playwright install chromium
 *   npm run build && npm run start
 *   node scripts/check-no-horizontal-overflow.mjs
 */

const base = process.env.SITE_URL || "http://localhost:3000";
const widths = [320, 390];
const routes = ["/", "/support", "/updates"];

async function main() {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    console.error(
      "Playwright is not installed. Run: npx --yes playwright install chromium",
    );
    process.exit(2);
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const failures = [];

  try {
    for (const width of widths) {
      await page.setViewportSize({ width, height: 844 });
      for (const route of routes) {
        await page.goto(new URL(route, base).toString(), {
          waitUntil: "networkidle",
        });
        const metrics = await page.evaluate(() => {
          const doc = document.documentElement;
          const en = Array.from(document.querySelectorAll("header button")).find(
            (b) => (b.textContent || "").includes("English"),
          );
          const enBox = en?.getBoundingClientRect();
          return {
            clientWidth: doc.clientWidth,
            scrollWidth: doc.scrollWidth,
            overflow: doc.scrollWidth > doc.clientWidth + 1,
            enRight: enBox ? enBox.right : null,
            enClipped: enBox ? enBox.right > window.innerWidth + 0.5 : null,
          };
        });

        const label = `${route} @ ${width}px`;
        if (metrics.overflow) {
          failures.push(
            `${label}: horizontal overflow (scrollWidth=${metrics.scrollWidth}, clientWidth=${metrics.clientWidth})`,
          );
        }
        if (metrics.enClipped) {
          failures.push(
            `${label}: English control clipped (right=${metrics.enRight}, innerWidth=${width})`,
          );
        }
        console.log(JSON.stringify({ route, width, ...metrics }));
      }
    }
  } finally {
    await browser.close();
  }

  if (failures.length) {
    console.error("FAIL\n" + failures.join("\n"));
    process.exit(1);
  }

  console.log("OK: no horizontal overflow or clipped English control");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
