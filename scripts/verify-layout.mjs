// Runtime test: Layout Mode with a developer-supplied component registry.
import { chromium } from "playwright-core";

const EXEC =
  process.env.PW_CHROME ||
  "/Users/panth977/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const BASE = process.env.BASE_URL || "http://localhost:5199";

const errors = [];
const browser = await chromium.launch({ executablePath: EXEC, headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`[console.error] ${m.text()}`);
});

await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

// Activate the toolbar (click the collapsed entry).
const entry = await page.evaluate(() => {
  const e = document.querySelector("[data-feedback-toolbar] [role='button']");
  if (!e) return null;
  const r = e.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
if (entry) await page.mouse.click(entry.x, entry.y);
await page.waitForTimeout(600);

// Click the Layout Mode button (button preceding the "Layout mode" tooltip).
const layoutBtn = await page.evaluate(() => {
  const spans = Array.from(document.querySelectorAll("[data-feedback-toolbar] span"));
  const tip = spans.find((s) => /layout mode/i.test(s.textContent || ""));
  const btn = tip?.parentElement?.querySelector("button") || tip?.previousElementSibling;
  if (!btn) return null;
  const r = btn.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
if (layoutBtn) await page.mouse.click(layoutBtn.x, layoutBtn.y);
else errors.push("could not locate Layout Mode button");
await page.waitForTimeout(800);

// Inspect the palette.
const palette = await page.evaluate(() => {
  const p = document.querySelector("[data-agentation-palette]");
  if (!p) return { open: false };
  const labels = Array.from(p.querySelectorAll("*"))
    .filter((el) => el.children.length === 0 && /\S/.test(el.textContent || ""))
    .map((el) => el.textContent.trim());
  return {
    open: true,
    hasButtonLabel: labels.includes("Button"),
    hasCardLabel: labels.includes("Card"),
    // live-rendered custom component DOM inside the palette tiles:
    demoButtons: p.querySelectorAll("[data-demo-button]").length,
    demoCards: p.querySelectorAll("[data-demo-card]").length,
    hasSearch: !!p.querySelector("input[type='text']"),
  };
});
console.log("palette:", JSON.stringify(palette));

// Search: type "card" and confirm Button tile filters out.
let afterSearch = null;
if (palette.open && palette.hasSearch) {
  const si = await page.$("[data-agentation-palette] input[type='text']");
  await si.fill("card");
  await page.waitForTimeout(400);
  afterSearch = await page.evaluate(() => {
    const p = document.querySelector("[data-agentation-palette]");
    return {
      demoButtons: p.querySelectorAll("[data-demo-button]").length,
      demoCards: p.querySelectorAll("[data-demo-card]").length,
    };
  });
  console.log("after search 'card':", JSON.stringify(afterSearch));
}

const pass =
  palette.open &&
  palette.hasButtonLabel &&
  palette.hasCardLabel &&
  palette.demoButtons >= 1 &&
  palette.demoCards >= 1 &&
  palette.hasSearch &&
  afterSearch &&
  afterSearch.demoButtons === 0 &&
  afterSearch.demoCards >= 1;

console.log("\nRESULT layout-registry:", pass ? "PASS ✅" : "FAIL ❌");
await browser.close();
console.log("\n=== ERRORS ===");
console.log(errors.length ? errors.join("\n") : "NONE");
process.exit(pass && errors.length === 0 ? 0 : 1);
