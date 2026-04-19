import { chromium, type Browser } from "playwright";

let browser: Browser;

export async function initBrowser() {
  browser = await chromium.launch();
}

export async function screenshotHtml(html: string): Promise<Buffer> {
  const page = await browser.newPage({
    viewport: { width: 800, height: 480 },
    deviceScaleFactor: 1,
  });
  await page.setContent(html, { waitUntil: "load" });
  const buffer = await page.screenshot({ type: "png" });
  await page.close();
  return Buffer.from(buffer);
}

export async function closeBrowser() {
  await browser?.close();
}
