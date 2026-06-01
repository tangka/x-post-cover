import "dotenv/config";
import puppeteer from "puppeteer-core";
import path from "path";

const ROOT = path.basename(__dirname) === "dist" ? path.join(__dirname, "..") : __dirname;
const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const HTML = path.resolve(ROOT, "public/index.html");

export async function screenshot(outFile: string): Promise<void> {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 900, deviceScaleFactor: 2 });
  await page.goto(`file://${HTML}`, { waitUntil: "networkidle0" });

  const cover = await page.$(".cover");
  if (!cover) throw new Error(".cover element not found");

  await cover.screenshot({ path: outFile, omitBackground: false });
  await browser.close();

  console.log(outFile);
}

if (require.main === module) {
  const outArg = process.argv[2];
  const outFile = outArg ? path.resolve(outArg) : path.join(__dirname, `cover-${Date.now()}.png`);
  screenshot(outFile);
}
