import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const logs = [];
page.on("console", (msg) => logs.push(`[${msg.type()}] ${msg.text()}`));
page.on("pageerror", (err) => logs.push(`[pageerror] ${err.message}`));

await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
await page.evaluate(() => document.getElementById("projects")?.scrollIntoView({ block: "center" }));
await page.waitForTimeout(1000);

const hasArticle = await page.locator("article.work-card-focus").count();
console.log("cards:", hasArticle);

await page.locator("article.work-card-focus h3").first().click();
await page.waitForTimeout(1000);

const dialog = await page.locator('[role="dialog"]').count();
console.log("dialog after h3 click:", dialog);

const reactState = await page.evaluate(() => {
  const articles = [...document.querySelectorAll("article.work-card-focus")];
  return {
    articleCount: articles.length,
    firstOnClick: articles[0]?.onclick ? "native" : "none",
    bodyHTMLSnippet: document.body.innerHTML.includes("role=\"dialog\""),
    mainHTML: document.querySelector("main")?.innerHTML.slice(0, 500),
  };
});
console.log("reactState:", JSON.stringify(reactState, null, 2));
console.log("logs:", logs.join("\n"));

if (dialog) await page.screenshot({ path: "/workspace/scripts/modal-open.png", fullPage: true });

await browser.close();
