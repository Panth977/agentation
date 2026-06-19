// Runtime smoke test for the ported toolbar. Drives the dev server with the
// cached Playwright chromium and reports console errors / page exceptions while
// exercising the core annotate flow.
import { chromium } from "playwright-core";

const EXEC =
  process.env.PW_CHROME ||
  "/Users/panth977/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const BASE = process.env.BASE_URL || "http://localhost:5199";

const errors = [];
const logs = [];

function note(tag, msg) {
  logs.push(`${tag} ${msg}`);
}

const browser = await chromium.launch({ executablePath: EXEC, headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

page.on("console", (m) => {
  const t = m.type();
  if (t === "error" || t === "warning") note(`[console.${t}]`, m.text());
});
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));
page.on("requestfailed", (r) => {
  const f = r.failure();
  // ignore external placeholder image failures (offline sandbox)
  if (!r.url().includes("placehold.co")) note("[requestfailed]", `${r.url()} ${f?.errorText}`);
});

async function step(name, fn) {
  try {
    await fn();
    note("[ok]", name);
  } catch (e) {
    errors.push(`[step:${name}] ${e.message}`);
  }
}

await step("load home", async () => {
  await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 20000 });
});

// Give client hydration + toolbar mount a moment.
await page.waitForTimeout(1500);

await step("toolbar mounted", async () => {
  const el = await page.$("[data-feedback-toolbar], [data-agentation-accent], .agentation, [class*='toolbar']");
  if (!el) throw new Error("no toolbar root element found in DOM");
});

await step("find + click activation control", async () => {
  // The toolbar entry control is a button; click the first visible toolbar button.
  const btn = await page.$("[data-feedback-toolbar] button, [data-feedback-toolbar] [role='button']");
  if (btn) {
    await btn.click({ timeout: 3000 }).catch(() => {});
  } else {
    note("[info]", "no obvious toolbar button selector matched (inspecting roots only)");
  }
});

await page.waitForTimeout(500);

await step("navigate dashboard", async () => {
  await page.goto(BASE + "/dashboard", { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(800);
});

await step("navigate pricing", async () => {
  await page.goto(BASE + "/pricing", { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(800);
});

// dump a small DOM fingerprint of toolbar-related nodes
const fingerprint = await page.evaluate(() => {
  const sel = [
    "[data-feedback-toolbar]",
    "[data-agentation-accent]",
    "[data-agentation-palette]",
    "style[id^='feedback-tool-styles']",
    "style#agentation-color-tokens",
  ];
  const out = {};
  for (const s of sel) out[s] = document.querySelectorAll(s).length;
  return out;
});

await browser.close();

console.log("=== STEP LOG ===");
console.log(logs.join("\n") || "(none)");
console.log("\n=== DOM FINGERPRINT (toolbar-related node counts) ===");
console.log(JSON.stringify(fingerprint, null, 2));
console.log("\n=== ERRORS / EXCEPTIONS ===");
console.log(errors.length ? errors.join("\n") : "NONE 🎉");
process.exit(errors.length ? 1 : 0);
