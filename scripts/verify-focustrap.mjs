// Runtime test: annotation popup must hold focus even when a client modal has a
// focus trap (Radix FocusScope-style: document focusin → refocus the modal).
import { chromium } from "playwright-core";

const EXEC =
  process.env.PW_CHROME ||
  "/Users/panth977/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const BASE = process.env.BASE_URL || "http://localhost:5199";

const errors = [];
const browser = await chromium.launch({ executablePath: EXEC, headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));

await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

// Inject a client modal WITH a focus trap (bubble-phase focusin → refocus modal).
await page.evaluate(() => {
  const modal = document.createElement("div");
  modal.id = "client-modal";
  modal.style.cssText =
    "position:fixed;top:20px;left:20px;width:300px;padding:16px;background:#fff;border:1px solid #ccc;z-index:5000;";
  modal.innerHTML = '<input id="trap-input" placeholder="modal input" /><p>Client modal (focus-trapped)</p>';
  document.body.appendChild(modal);
  const trap = (e) => {
    if (!modal.contains(e.target)) {
      // Radix-style: pull focus back into the modal.
      document.getElementById("trap-input").focus();
    }
  };
  document.addEventListener("focusin", trap); // bubble phase, like most libs
  document.getElementById("trap-input").focus();
  (window).__trapActive = () => document.activeElement?.id === "trap-input";
});
await page.waitForTimeout(200);

// Sanity: the trap actually steals focus from a plain page element.
const trapWorks = await page.evaluate(() => {
  const b = document.querySelector("main button");
  b?.focus();
  return document.activeElement?.id === "trap-input"; // trap pulled it back
});
console.log("client focus-trap active (steals focus):", trapWorks);

// Activate the toolbar.
const entry = await page.evaluate(() => {
  const e = document.querySelector("[data-feedback-toolbar] [role='button']");
  if (!e) return null;
  const r = e.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
if (entry) await page.mouse.click(entry.x, entry.y);
await page.waitForTimeout(600);

// Annotate an element (open the popup) — click the hero heading.
const h1 = await page.$("h1");
const box = h1 && (await h1.boundingBox());
if (box) {
  await page.mouse.move(box.x + 40, box.y + box.height / 2);
  await page.waitForTimeout(150);
  await page.mouse.click(box.x + 40, box.y + box.height / 2);
  await page.waitForTimeout(700);
}

// The popup textarea should hold focus despite the trap. Also click it + type.
const ta = await page.$("[data-annotation-popup] textarea");
let focusedAfterOpen = false;
let focusedAfterClick = false;
let typed = "";
if (ta) {
  focusedAfterOpen = await page.evaluate(
    () => !!document.activeElement?.closest("[data-annotation-popup]"),
  );
  await ta.click();
  await page.waitForTimeout(150);
  focusedAfterClick = await page.evaluate(
    () => document.activeElement?.tagName === "TEXTAREA" &&
          !!document.activeElement?.closest("[data-annotation-popup]"),
  );
  await page.keyboard.type("focus works under a trapped modal");
  await page.waitForTimeout(100);
  typed = await page.evaluate(() => {
    const t = document.querySelector("[data-annotation-popup] textarea");
    return t ? t.value : "";
  });
}
console.log("popup textarea present:", !!ta);
console.log("focused after open:", focusedAfterOpen);
console.log("focused after click:", focusedAfterClick);
console.log("typed value:", JSON.stringify(typed));

const pass =
  trapWorks && !!ta && focusedAfterClick && typed.includes("focus works under a trapped modal");
console.log("\nRESULT focus-trap:", pass ? "PASS ✅" : "FAIL ❌");

await browser.close();
console.log("\n=== ERRORS ===");
console.log(errors.length ? errors.join("\n") : "NONE");
process.exit(pass ? 0 : 1);
