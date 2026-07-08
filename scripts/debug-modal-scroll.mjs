import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto("https://miguel-humberto-portfolio.vercel.app", { waitUntil: "networkidle" });
await page.evaluate(() => window.scrollTo(0, 900));
await page.waitForTimeout(300);
await page.getByRole("button", { name: /View project: Cinematic/i }).click();
await page.waitForTimeout(500);

const before = await page.evaluate(() => ({
  scrollY: window.scrollY,
  bodyOverflow: getComputedStyle(document.body).overflow,
  htmlOverflow: getComputedStyle(document.documentElement).overflow,
  manifestoTop: document.querySelector(".manifesto-section")?.getBoundingClientRect().top,
}));

await page.mouse.wheel(0, 800);
await page.waitForTimeout(300);

const afterWheelOnModal = await page.evaluate(() => ({
  scrollY: window.scrollY,
  dialogScrollTop: document.querySelector('[role="dialog"]')?.scrollTop,
  manifestoTop: document.querySelector(".manifesto-section")?.getBoundingClientRect().top,
  contactVisible: document.querySelector("#contact")?.getBoundingClientRect().top,
  elementsTop: document.elementsFromPoint(720, 450).slice(0, 6).map((el) => el.tagName + "." + String(el.className).split(" ")[0]),
}));

console.log("before", before);
console.log("after wheel", afterWheelOnModal);

await page.screenshot({ path: "/workspace/scripts/modal-after-wheel.png" });

await browser.close();
