import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const failed = [];
page.on("response", (r) => {
  if (r.status() >= 400 && r.url().includes("vercel")) failed.push(`${r.status()} ${r.url()}`);
});

await page.goto("https://miguel-humberto-portfolio.vercel.app", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForSelector("article.work-card-focus");
await page.evaluate(() => document.getElementById("projects")?.scrollIntoView({ block: "center" }));
await page.waitForTimeout(1000);

await page.getByRole("button", { name: /View project: Cinematic/i }).click();
await page.waitForTimeout(1200);

const dialogCount = await page.locator('[role="dialog"]').count();
console.log("dialog:", dialogCount);

if (dialogCount) {
  await page.screenshot({ path: "/workspace/scripts/prod-modal.png", fullPage: true });
  const info = await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"]');
    const rect = d.getBoundingClientRect();
    const allFixed = [...document.querySelectorAll("*")]
      .filter((el) => {
        const s = getComputedStyle(el);
        if (s.position !== "fixed" && s.position !== "sticky") return false;
        const z = Number.parseInt(s.zIndex, 10);
        return Number.isFinite(z) && z > 50;
      })
      .map((el) => ({
        tag: el.tagName,
        cls: el.className?.toString?.().slice(0, 100),
        z: getComputedStyle(el).zIndex,
        rect: el.getBoundingClientRect().toJSON(),
      }));

    const elementsAtCenter = document.elementsFromPoint(window.innerWidth / 2, window.innerHeight / 2)
      .slice(0, 8)
      .map((el) => `${el.tagName}.${el.className?.toString?.().slice(0, 40)}`);

    return {
      dialogRect: rect.toJSON(),
      dialogStyles: {
        position: getComputedStyle(d).position,
        zIndex: getComputedStyle(d).zIndex,
        background: getComputedStyle(d).backgroundColor,
        opacity: getComputedStyle(d).opacity,
        visibility: getComputedStyle(d).visibility,
        transform: getComputedStyle(d).transform,
        top: getComputedStyle(d).top,
        height: getComputedStyle(d).height,
      },
      scrollY: window.scrollY,
      bodyOverflow: document.body.style.overflow,
      fixedHighZ: allFixed,
      elementsAtCenter,
      dialogParent: d.parentElement?.tagName,
      titleVisible: !!d.querySelector("h2")?.textContent,
    };
  });
  console.log(JSON.stringify(info, null, 2));
} else {
  await page.screenshot({ path: "/workspace/scripts/prod-no-modal.png", fullPage: false });
}

console.log("failed:", failed);

await browser.close();
