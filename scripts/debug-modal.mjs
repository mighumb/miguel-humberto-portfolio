import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

await page.evaluate(() => {
  const work = document.getElementById("projects");
  if (work) work.scrollIntoView({ block: "center" });
});
await page.waitForTimeout(800);
await page.screenshot({ path: "/workspace/scripts/before-click.png", fullPage: false });

const card = page.locator("article.work-card-focus").first();
await card.click();
await page.waitForTimeout(500);

const modal = page.locator('[role="dialog"]');
const modalCount = await modal.count();
const modalVisible = modalCount > 0 ? await modal.isVisible() : false;
const modalBox = modalCount > 0 ? await modal.boundingBox() : null;

const diagnostics = await page.evaluate(() => {
  const dialog = document.querySelector('[role="dialog"]');
  const bodyChildren = [...document.body.children].map((el) => ({
    tag: el.tagName,
    className: el.className?.toString?.() ?? "",
    zIndex: getComputedStyle(el).zIndex,
    position: getComputedStyle(el).position,
    opacity: getComputedStyle(el).opacity,
    display: getComputedStyle(el).display,
    transform: getComputedStyle(el).transform,
  }));

  return {
    dialogExists: !!dialog,
    dialogParent: dialog?.parentElement?.tagName ?? null,
    dialogRect: dialog ? dialog.getBoundingClientRect().toJSON() : null,
    dialogStyles: dialog
      ? {
          zIndex: getComputedStyle(dialog).zIndex,
          position: getComputedStyle(dialog).position,
          background: getComputedStyle(dialog).backgroundColor,
          overflow: getComputedStyle(dialog).overflow,
          height: getComputedStyle(dialog).height,
        }
      : null,
    bodyOverflow: document.body.style.overflow,
    htmlOverflow: document.documentElement.style.overflow,
    scrollY: window.scrollY,
    bodyChildren: bodyChildren.slice(-5),
  };
});

await page.screenshot({ path: "/workspace/scripts/after-click.png", fullPage: false });

console.log(JSON.stringify({ modalCount, modalVisible, modalBox, diagnostics }, null, 2));

await browser.close();
