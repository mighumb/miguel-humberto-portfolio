import { chromium, devices } from "playwright";

for (const profile of [
  { name: "desktop-scrolled", width: 1440, height: 900, scroll: 826 },
  { name: "desktop-top", width: 1440, height: 900, scroll: 0 },
  { name: "iphone", device: devices["iPhone 13"] },
]) {
  const browser = await chromium.launch({ headless: true });
  const context = profile.device
    ? await browser.newContext({ ...profile.device })
    : await browser.newContext({ viewport: { width: profile.width, height: profile.height } });
  const page = await context.newPage();

  await page.goto("https://miguel-humberto-portfolio.vercel.app", { waitUntil: "networkidle" });
  await page.waitForSelector("article.work-card-focus");

  if (profile.scroll !== undefined) {
    await page.evaluate((y) => window.scrollTo(0, y), profile.scroll);
    await page.waitForTimeout(300);
  } else if (profile.device) {
    await page.evaluate(() => document.getElementById("projects")?.scrollIntoView({ block: "center" }));
    await page.waitForTimeout(500);
  }

  await page.getByRole("button", { name: /View project/i }).first().click();
  await page.waitForTimeout(1000);

  const info = await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"]');
    if (!d) return { open: false };
    const header = d.querySelector(".sticky");
    const hero = d.querySelector(".aspect-video");
    const h2 = d.querySelector("h2");
    return {
      open: true,
      scrollY: window.scrollY,
      visualViewport: window.visualViewport
        ? { offsetTop: window.visualViewport.offsetTop, height: window.visualViewport.height }
        : null,
      dialogTop: d.getBoundingClientRect().top,
      headerTop: header?.getBoundingClientRect().top,
      heroTop: hero?.getBoundingClientRect().top,
      h2Top: h2?.getBoundingClientRect().top,
      dialogScrollTop: d.scrollTop,
      bodyTop: document.body.getBoundingClientRect().top,
      htmlTop: document.documentElement.getBoundingClientRect().top,
      behindVisible: (() => {
        const sample = document.elementsFromPoint(20, 20).slice(0, 5).map((el) => el.tagName + (el.className ? "." + String(el.className).split(" ")[0] : ""));
        return sample;
      })(),
    };
  });

  await page.screenshot({ path: `/workspace/scripts/modal-${profile.name}.png`, fullPage: false });
  console.log(profile.name, JSON.stringify(info));
  await browser.close();
}
