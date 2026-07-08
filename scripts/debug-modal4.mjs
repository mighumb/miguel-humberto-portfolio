import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const failed = [];
page.on("requestfailed", (r) => failed.push(r.url()));
page.on("response", (r) => {
  if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`);
});

await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
await page.waitForSelector("article.work-card-focus");
await page.waitForTimeout(2000);

await page.evaluate(() => document.getElementById("projects")?.scrollIntoView({ block: "center" }));
await page.waitForTimeout(500);

// Use Playwright's click which should work with React
await page.getByRole("button", { name: /View project: Cinematic/i }).click();
await page.waitForTimeout(1000);

const dialog = await page.locator('[role="dialog"]').count();
console.log("dialog:", dialog);

if (!dialog) {
  // Try clicking the article via getByLabel
  await page.getByLabel(/View project: Social/i).click();
  await page.waitForTimeout(1000);
  console.log("dialog after 2nd:", await page.locator('[role="dialog"]').count());
}

if (await page.locator('[role="dialog"]').count()) {
  await page.screenshot({ path: "/workspace/scripts/modal-open.png", fullPage: true });
  const html = await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"]');
    return {
      innerHeight: window.innerHeight,
      scrollY: window.scrollY,
      rect: d.getBoundingClientRect().toJSON(),
      computed: {
        top: getComputedStyle(d).top,
        height: getComputedStyle(d).height,
        position: getComputedStyle(d).position,
        zIndex: getComputedStyle(d).zIndex,
      },
      visibleText: d?.textContent?.slice(0, 200),
    };
  });
  console.log("modal info:", JSON.stringify(html, null, 2));
}

console.log("failed:", failed.slice(0, 10));

await browser.close();
