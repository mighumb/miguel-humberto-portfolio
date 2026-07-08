import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto("http://localhost:3000", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForSelector("article.work-card-focus");
await page.evaluate(() => window.scrollTo(0, 900));
await page.waitForTimeout(300);
await page.getByRole("button", { name: /View project: Cinematic/i }).click();
await page.waitForTimeout(800);

const info = await page.evaluate(() => ({
  dialog: !!document.querySelector(".project-modal"),
  mainHidden: getComputedStyle(document.querySelector("main")).visibility,
  modalVisible: getComputedStyle(document.querySelector(".project-modal")).visibility,
  bodyPosition: getComputedStyle(document.body).position,
  htmlClass: document.documentElement.className,
  manifestoVisible: document.querySelector(".manifesto-section")?.getBoundingClientRect().top,
  behindCenter: document.elementsFromPoint(720, 400).slice(0, 5).map((el) => el.className?.toString?.().slice(0, 50)),
}));

console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: "/workspace/scripts/modal-fixed.png" });
await browser.close();
