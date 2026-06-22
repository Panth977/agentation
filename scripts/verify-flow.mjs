// Deep behavioral test: activate toolbar → annotate an element → submit → marker.
import { chromium } from "playwright-core";

const EXEC =
  process.env.PW_CHROME ||
  "/Users/panth977/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const BASE = process.env.BASE_URL || "http://localhost:5199";

const errors = [];
const browser = await chromium.launch({ executablePath: EXEC, headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  permissions: ["clipboard-read", "clipboard-write"],
});
const page = await ctx.newPage();
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`[console.error] ${m.text()}`);
});

const $ = (sel) => page.evaluate((s) => document.querySelectorAll(s).length, sel);

await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

// 1. Activate: real mouse click on the collapsed entry control center
// (Svelte 5 uses event delegation — real input events trigger it reliably).
const entryBox = await page.evaluate(() => {
  const entry =
    document.querySelector("[data-feedback-toolbar] [role='button']") ||
    document.querySelector("[data-feedback-toolbar]");
  if (!entry) return null;
  const r = entry.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
console.log("entry control box:", JSON.stringify(entryBox));
if (entryBox) {
  await page.mouse.click(entryBox.x, entryBox.y);
}
await page.waitForTimeout(800);
const isExpanded = await page.evaluate(
  () => !!document.querySelector("[data-feedback-toolbar] [class*='expanded']"),
);
console.log("toolbar expanded (active):", isExpanded);

// 2. Click the hero heading to open an annotation popup.
const h1 = await page.$("h1");
const box = h1 && (await h1.boundingBox());
if (box) {
  await page.mouse.move(box.x + 40, box.y + box.height / 2);
  await page.waitForTimeout(200);
  await page.mouse.click(box.x + 40, box.y + box.height / 2);
  await page.waitForTimeout(700);
}
const popups = await $("[data-annotation-popup]");
console.log("annotation popup open:", popups);

// 3. Type a comment + submit (Enter).
let markersAfter = 0;
if (popups > 0) {
  const ta = await page.$("[data-annotation-popup] textarea");
  if (ta) {
    await ta.fill("The hero headline should be larger and bolder.");
    await page.waitForTimeout(150);
    await ta.press("Enter");
    await page.waitForTimeout(900);
  }
}
markersAfter = await $("[data-annotation-marker]");
const markerPos = await page.evaluate(() => {
  const m = document.querySelector("[data-annotation-marker]");
  if (!m) return null;
  const cs = getComputedStyle(m);
  const r = m.getBoundingClientRect();
  const h1 = document.querySelector("h1").getBoundingClientRect();
  return { topStyle: cs.top, rectTop: Math.round(r.top), h1Top: Math.round(h1.top) };
});
console.log("marker position:", JSON.stringify(markerPos));
console.log("annotation markers after submit:", markersAfter);

// 4. Copy output: find the copy button and read clipboard.
let clip = "";
if (markersAfter > 0) {
  // Hover controls then click copy (IconCopyAnimated button). Try title/aria match.
  const copied = await page.evaluate(async () => {
    const btns = Array.from(document.querySelectorAll("[data-feedback-toolbar] button"));
    const copyBtn = btns.find((b) =>
      /copy/i.test((b.getAttribute("aria-label") || "") + (b.getAttribute("title") || "")),
    );
    if (copyBtn) {
      copyBtn.click();
      return true;
    }
    return false;
  });
  await page.waitForTimeout(400);
  if (copied) {
    clip = await page.evaluate(() => navigator.clipboard.readText().catch(() => "")).catch(() => "");
  }
}
console.log("copy button fired:", markersAfter > 0);
console.log("clipboard length:", clip.length, clip ? "| starts: " + JSON.stringify(clip.slice(0, 60)) : "");

const result = isExpanded && popups > 0 && markersAfter > 0;
console.log("\nRESULT annotate-flow:", result ? "PASS ✅" : "FAIL ❌");

await browser.close();
console.log("\n=== ERRORS ===");
console.log(errors.length ? errors.join("\n") : "NONE");
process.exit(result && errors.length === 0 ? 0 : 1);
