import { createRequire } from "node:module";
import fs from "node:fs/promises";

const require = createRequire(import.meta.url);
const playwright = require(process.env.PLAYWRIGHT_PACKAGE || "playwright");
const base = process.env.SITE_URL || "https://www.cowinmotors.com";
const paths = (process.env.AUDIT_PATHS || "/,/products,/headlights,/tail-lights,/exhaust,/wheels,/body-kits,/news,/blog,/quote,/support,/contact").split(",");
const widths = (process.env.AUDIT_WIDTHS || "1440,390").split(",").map(Number);
const screenshotDirectory = process.env.AUDIT_SCREENSHOT_DIR || "";
const browser = await playwright.chromium.launch({ headless: true });
const results = [];

for (const width of widths) {
  const context = await browser.newContext({ viewport: { width, height: width < 600 ? 844 : 900 } });
  const page = await context.newPage();
  for (const path of paths) {
    const errors = [];
    const onError = (error) => errors.push(error.message);
    page.on("pageerror", onError);
    const start = Date.now();
    try {
      const response = await page.goto(new URL(path, base).href, { waitUntil: "domcontentloaded", timeout: 20_000 });
      const snapshot = await page.evaluate(() => ({
        title: document.title,
        h1: document.querySelector("h1")?.textContent?.trim() || "",
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") || "",
        robots: document.querySelector('meta[name="robots"]')?.getAttribute("content") || "",
        overflow: document.documentElement.scrollWidth > innerWidth + 2,
        brokenImages: [...document.images].filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.currentSrc || image.src).slice(0, 5),
        imagesWithoutAlt: [...document.images].filter((image) => !image.hasAttribute("alt")).length,
        images: document.images.length,
        navCount: document.querySelectorAll('nav[aria-label="Primary navigation"]').length,
      }));
      if (screenshotDirectory) {
        await fs.mkdir(screenshotDirectory, { recursive: true });
        await page.screenshot({ path: `${screenshotDirectory}/${width}-${path.replace(/[^a-z0-9]/gi, "-") || "home"}.png`, fullPage: true });
      }
      results.push({ width, path, status: response?.status(), ms: Date.now() - start, ...snapshot, errors });
    } catch (error) {
      results.push({ width, path, error: String(error).slice(0, 200), ms: Date.now() - start });
    }
    page.off("pageerror", onError);
    console.log(JSON.stringify(results.at(-1)));
  }
  await context.close();
}

await browser.close();
if (results.some((result) => result.status !== 200 || result.overflow || result.brokenImages?.length || result.errors?.length)) {
  process.exitCode = 1;
}
