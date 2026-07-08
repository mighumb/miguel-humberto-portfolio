import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

await page.goto("https://miguel-humberto-portfolio.vercel.app", { waitUntil: "networkidle" });
await page.evaluate(() => {
  document.getElementById("projects")?.scrollIntoView({ block: "center" });
});
await page.waitForTimeout(800);
await page.getByRole("button", { name: /View project/i }).first().click();
await page.waitForTimeout(800);

const dialog = page.locator('[role="dialog"]');
for (const pos of [0, 600, 1200, 2000, 3200]) {
  await dialog.evaluate((el, y) => el.scrollTo(0, y), pos);
  await page.waitForTimeout(200);
  await page.screenshot({ path: `/workspace/scripts/modal-scroll-${pos}.png`, fullPage: false });
}

await browser.close();
