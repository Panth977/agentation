import { chromium } from "playwright-core";
const EXEC="/Users/panth977/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const BASE="http://localhost:5212/layout";
const errs=[];
const b=await chromium.launch({executablePath:EXEC,headless:true});
const p=await b.newPage({viewport:{width:1400,height:900},permissions:["clipboard-read","clipboard-write"]});
p.on("pageerror",e=>errs.push("[pageerror] "+e.message));
p.on("console",m=>{if(m.type()==="error")errs.push("[console] "+m.text());});
await p.goto(BASE,{waitUntil:"networkidle"}); await p.waitForTimeout(1200);

const shot=n=>p.screenshot({path:`/tmp/le-${n}.png`});
await shot("01-empty");

// add 3 components by clicking palette items
async function addByLabel(lbl){
  const ok=await p.evaluate((lbl)=>{
    const items=[...document.querySelectorAll("[class*='palItem']")];
    const it=items.find(i=>i.textContent.trim().toLowerCase().startsWith(lbl.toLowerCase()));
    if(it){it.click(); return true;} return false;
  },lbl); await p.waitForTimeout(250); return ok;
}
// search to narrow then add
const si=await p.$("[class*='search']");
await si.fill("button"); await p.waitForTimeout(300); await addByLabel("Button");
await si.fill(""); await p.waitForTimeout(200);
await si.fill("card"); await p.waitForTimeout(300); await addByLabel("Card");
await si.fill(""); await p.waitForTimeout(200);
await si.fill("input"); await p.waitForTimeout(300); await addByLabel("Input");
await si.fill(""); await p.waitForTimeout(200);

const state1=await p.evaluate(()=>({
  canvasNodes:document.querySelectorAll("[data-node-id]").length,
  layers:document.querySelectorAll("[class*='layer']").length,
}));
console.log("after adding 3:", JSON.stringify(state1));
await shot("02-added");

// select the root via layers ("Screen"), set direction row
await p.evaluate(()=>{ const L=[...document.querySelectorAll("[class*='layer']")].find(x=>/Screen/.test(x.textContent)); L&&L.click(); });
await p.waitForTimeout(300);
const dirBtn=await p.evaluate(()=>{ const b=[...document.querySelectorAll("[class*='seg'] button")].find(x=>/Row/.test(x.textContent)); if(b){b.click();return true} return false;});
await p.waitForTimeout(300);
console.log("set root direction row:", dirBtn);
await shot("03-row");

// multi-select two leaf components in layers (shift) then group
await p.evaluate(()=>{
  const L=[...document.querySelectorAll("[class*='layer']")];
  const comps=L.filter(x=>/◆/.test(x.textContent));
  if(comps[0]) comps[0].dispatchEvent(new MouseEvent("click",{bubbles:true}));
  if(comps[1]) comps[1].dispatchEvent(new MouseEvent("click",{bubbles:true,shiftKey:true}));
});
await p.waitForTimeout(200);
await p.evaluate(()=>{ const g=[...document.querySelectorAll("[class*='tbtn']")].find(b=>/Group/.test(b.textContent)&&!/Ungroup/.test(b.textContent)); g&&g.click(); });
await p.waitForTimeout(300);
const state2=await p.evaluate(()=>({frames:document.querySelectorAll("[class*='frameRow']").length}));
console.log("after group, frame layers:", JSON.stringify(state2));

// copy XML
await p.evaluate(()=>{ const c=[...document.querySelectorAll("[class*='tbtn']")].find(b=>/Copy XML/.test(b.textContent)); c&&c.click(); });
await p.waitForTimeout(300);
const xml=await p.evaluate(()=>document.querySelector("pre")?.textContent||"");
console.log("XML present:", xml.length>0, "| hasScreen:", xml.includes("<screen"), "| hasComponent:", xml.includes("<component"));
console.log("---XML---\n"+xml.slice(0,400));
await shot("04-final");

await b.close();
console.log("\nERRORS:", errs.length?errs.join("\n"):"NONE");
