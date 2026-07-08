import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
await page.evaluate(() => document.getElementById("projects")?.scrollIntoView({ block: "center" }));
await page.waitForTimeout(1000);

const card = page.locator("article.work-card-focus").first();
await card.focus();
await page.keyboard.press("Enter");
await page.waitForTimeout(600);

let dialog = await page.locator('[role="dialog"]').count();
console.log("after Enter:", dialog);

if (!dialog) {
  await card.click({ position: { x: 200, y: 100 }, force: true });
  await page.waitForTimeout(600);
  dialog = await page.locator('[role="dialog"]').count();
  console.log("after force click:", dialog);
}

if (!dialog) {
  const result = await page.evaluate(() => {
    const card = document.querySelector("article.work-card-focus");
    if (!card) return "no card";
    card.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    return "dispatched";
  });
  console.log("dispatch:", result);
  await page.waitForTimeout(600);
  dialog = await page.locator('[role="dialog"]').count();
  console.log("after dispatch:", dialog);
}

if (dialog) {
  await page.screenshot({ path: "/workspace/scripts/modal-open.png", fullPage: true });
  const info = await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"]');
    const rect = d?.getBoundingClientRect();
    const styles = d ? getComputedStyle(d) : null;
    const manifesto = document.querySelector(".manifesto-section");
    const manifestoRect = manifesto?.getBoundingClientRect();
    const manifestoZ = manifesto ? getComputedStyle(manifesto).zIndex : null;

    const overlapping = [];
    document.querySelectorAll("body *").forEach((el) => {
      if (el === d || d?.contains(el)) return;
      const s = getComputedStyle(el);
      if (s.position !== "fixed" && s.position !== "sticky") return;
      const z = Number.parseInt(s.zIndex, 10);
      if (!Number.isFinite(z) || z < 100) return;
      overlapping.push({
        tag: el.tagName,
        className: el.className?.toString?.().slice(0, 80),
        zIndex: z,
      });
    });

    return {
      dialogRect: rect ? { width: rect.width, height: rect.height, top: rect.top, left: rect.left } : null,
      dialogZ: styles?.zIndex,
      dialogBg: styles?.backgroundColor,
      manifestoTop: manifestoRect?.top,
      manifestoZ,
      overlapping,
      bodyChildCount: document.body.children.length,
      dialogParent: d?.parentElement?.tagName,
    };
  });
  console.log(JSON.stringify(info, null, 2));
}

await browser.close();
