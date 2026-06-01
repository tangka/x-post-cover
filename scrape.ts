import "dotenv/config";
import puppeteer, { CookieParam } from "puppeteer-core";
import Database from "better-sqlite3";
import { execSync } from "child_process";
import * as crypto from "crypto";
import * as path from "path";
import * as fs from "fs";
import * as https from "https";
import { IncomingMessage } from "http";

// When bundled by ncc __dirname is dist/, resolve up to project root
const ROOT = path.basename(__dirname) === "dist" ? path.join(__dirname, "..") : __dirname;

const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const COOKIES_DB = process.env.COOKIES_DB ?? path.join(process.env.HOME!, "Library/Application Support/Google/Chrome/Default/Cookies");
const DATA_OUT = path.join(ROOT, "public/post-data.js");

// BCP 47 tag → human-readable name used in the translation prompt
const LANG_NAMES: Record<string, string> = {
  zh: "Chinese", ja: "Japanese", ko: "Korean",
  fr: "French",  de: "German",  es: "Spanish",
  pt: "Portuguese", ru: "Russian", ar: "Arabic",
};
const TARGET_LANG = process.env.TARGET_LANG ?? "zh";
const TARGET_LANG_NAME = LANG_NAMES[TARGET_LANG] ?? TARGET_LANG;

const tweetUrl = process.argv[2];
if (!tweetUrl || !tweetUrl.includes("x.com")) {
  console.error("Usage: tsx scrape.ts <x.com tweet URL>");
  process.exit(1);
}

// --- Cookie extraction & decryption ---

interface ChromeCookieRow {
  name: string;
  encrypted_value: Buffer;
  host_key: string;
  path: string;
  is_secure: number;
  is_httponly: number;
  samesite: number;
}

function getXCookies(): CookieParam[] {
  const password = execSync("security find-generic-password -wa 'Chrome'", {
    stdio: ["pipe", "pipe", "ignore"],
  }).toString().trim();

  const key = crypto.pbkdf2Sync(password, "saltysalt", 1003, 16, "sha1");
  const iv = Buffer.alloc(16, 0x20);

  function decrypt(buf: Buffer): string {
    if (!buf || buf.length < 4) return "";
    if (buf.slice(0, 3).toString() !== "v10") return buf.toString("utf8");
    try {
      const d = crypto.createDecipheriv("aes-128-cbc", key, iv);
      return Buffer.concat([d.update(buf.slice(3)), d.final()]).toString("utf8");
    } catch { return ""; }
  }

  const tmp = "/tmp/_chrome_cookies_scrape.db";
  fs.copyFileSync(COOKIES_DB, tmp);

  const db = new Database(tmp, { readonly: true });
  const rows = db.prepare<[], ChromeCookieRow>(`
    SELECT name, encrypted_value, host_key, path, is_secure, is_httponly, samesite
    FROM cookies
    WHERE host_key LIKE '%.x.com' OR host_key = 'x.com'
       OR host_key LIKE '%.twitter.com' OR host_key = 'twitter.com'
  `).all();
  db.close();

  // Chrome samesite: -1=unspecified, 0=no_restriction(None), 1=Lax, 2=Strict
  const sameSiteMap: Record<number | string, "Strict" | "Lax" | "None"> = {
    "-1": "None", 0: "None", 1: "Lax", 2: "Strict",
  };

  return rows
    .map(r => ({
      name: r.name,
      value: decrypt(r.encrypted_value),
      domain: r.host_key,
      path: r.path || "/",
      httpOnly: Boolean(r.is_httponly),
      secure: Boolean(r.is_secure),
      sameSite: sameSiteMap[r.samesite] ?? "None",
    } satisfies CookieParam))
    .filter(c => c.value && c.name);
}

// --- Helpers ---

function download(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const follow = (u: string) => {
      https.get(u, (res: IncomingMessage) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          follow(res.headers.location);
        } else {
          const file = fs.createWriteStream(dest);
          res.pipe(file).on("finish", resolve);
        }
      }).on("error", reject);
    };
    follow(url);
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findTweetResult(obj: any, tweetId: string): any {
  if (!obj || typeof obj !== "object") return null;
  if (obj.__typename === "Tweet" && obj.rest_id === tweetId) return obj;
  if (obj.__typename === "TweetWithVisibilityResults" && obj.tweet?.rest_id === tweetId) return obj.tweet;
  for (const v of Object.values(obj)) {
    const found = findTweetResult(v, tweetId);
    if (found) return found;
  }
  return null;
}

async function translate(paragraphs: string[]): Promise<string[]> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.warn("DEEPSEEK_API_KEY not set, skipping translation");
    return [];
  }

  const input = paragraphs.map((p, i) => `[${i + 1}] ${p}`).join("\n\n");
  const body = JSON.stringify({
    model: "deepseek-chat",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `Translate the following tweet paragraphs into ${TARGET_LANG_NAME}. Keep paragraph numbers. Leave technical terms (Codex, ChatGPT, token, etc.) in English. Output only the translation, no explanations.\n\n${input}`,
    }],
  });

  const raw = await new Promise<string>((resolve, reject) => {
    const req = https.request(
      { hostname: "api.deepseek.com", path: "/chat/completions", method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` } },
      res => {
        let data = "";
        res.on("data", (c: Buffer) => { data += c; });
        res.on("end", () => resolve(data));
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });

  const json = JSON.parse(raw);
  const text: string = json.choices?.[0]?.message?.content ?? "";
  // Split on [N] markers regardless of surrounding whitespace
  return text
    .split(/(?=\[\d+\])/)
    .map(s => s.replace(/^\[\d+\]\s*/, "").trim())
    .filter(Boolean);
}

function fmtCount(n: string | number): string {
  const num = parseInt(String(n), 10);
  if (isNaN(num)) return "";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(num);
}

function writeDebug(data: unknown, status: "success" | "failure"): string {
  const dir = path.join(ROOT, "debug");
  fs.mkdirSync(dir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(dir, `${ts}_${status}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  return file;
}

// --- Main ---

export async function scrape(tweetUrl: string): Promise<void> {
  console.log("Reading Chrome cookies...");
  const cookies = getXCookies();
  console.log(`Injecting ${cookies.length} x.com cookies`);

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  for (const c of cookies) {
    try { await page.setCookie(c); } catch { /* skip invalid */ }
  }

  let tweetData: unknown = null;
  page.on("response", async (response) => {
    const url = response.url();
    if (!url.includes("TweetDetail") && !url.includes("TweetResultByRestId")) return;
    try {
      const json = await response.json();
      if (!tweetData) tweetData = json;
    } catch { /* ignore */ }
  });

  console.log("Loading tweet...");
  await page.goto(tweetUrl, { waitUntil: "networkidle2", timeout: 30000 });

  for (let i = 0; i < 20 && !tweetData; i++) {
    await new Promise(r => setTimeout(r, 500));
  }

  await browser.close();

  if (!tweetData) {
    console.error(`No GraphQL data intercepted. Debug written to ${writeDebug(tweetData, "failure")}`);
    process.exit(1);
  }

  const tweetId = tweetUrl.match(/status\/(\d+)/)?.[1];
  if (!tweetId) { console.error("Could not parse tweet ID from URL"); process.exit(1); }

  const tweet = findTweetResult(tweetData, tweetId);
  if (!tweet) {
    console.error(`Tweet not found in response. Debug written to ${writeDebug(tweetData, "failure")}`);
    process.exit(1);
  }

  const legacy = tweet.legacy;
  const userResult = tweet.core?.user_results?.result;
  const user = userResult?.core ?? userResult?.legacy ?? {}; // new API structure uses .core
  const avatarUrl: string = userResult?.avatar?.image_url ?? userResult?.legacy?.profile_image_url_https ?? "";
  const views: string = tweet.views?.count ?? "";
  const created_at: string = legacy.created_at;

  const paragraphs: string[] = legacy.full_text
    .replace(/https:\/\/t\.co\/\S+/g, "") // strip t.co short links
    .trim()
    .split(/\n\n+/)
    .map((s: string) => s.replace(/\n/g, " ").trim())
    .filter(Boolean);

  console.log("Translating...");
  const translatedParagraphs = await translate(paragraphs);

  let avatarPath = "assets/avatar.jpg";
  const avatarSrc = avatarUrl.replace(/_normal\./, "_400x400.");
  if (avatarSrc) {
    try {
      await download(avatarSrc, path.join(ROOT, "public/assets", "avatar.jpg"));
      console.log("Avatar downloaded");
    } catch { avatarPath = avatarSrc; }
  }

  const showQrcode = (process.env.QRCODE ?? "show") === "show";

  const js = `window.X_POST_COVER_DATA = {
  qrcode: "assets/codexx-qrcode.jpg",
  showQrcode: ${showQrcode},
  avatar: ${JSON.stringify(avatarPath)},
  authorName: ${JSON.stringify(user.name ?? "")},
  handle: ${JSON.stringify("@" + (user.screen_name ?? ""))},

  englishText: ${JSON.stringify(paragraphs, null, 4).replace(/^/gm, "  ").trimStart()},

  translatedText: ${JSON.stringify(translatedParagraphs, null, 4).replace(/^/gm, "  ").trimStart()},

  created_at: ${JSON.stringify(created_at)},
  views: ${parseInt(views) || 0},
  target_lang: ${JSON.stringify(TARGET_LANG)},

  metrics: {
    reply_count: ${legacy.reply_count},
    retweet_count: ${legacy.retweet_count},
    like_count: ${legacy.favorite_count},
  },
};
`;

  fs.writeFileSync(DATA_OUT, js);
  writeDebug(tweetData, "success");

  console.log(`${path.basename(DATA_OUT)} updated`);
  console.log(`  author:  ${user.name} @${user.screen_name}`);
  console.log(`  date:    ${created_at}`);
  console.log(`  views:   ${fmtCount(views)}  replies: ${legacy.reply_count}  retweets: ${legacy.retweet_count}  likes: ${legacy.favorite_count}`);
}

if (require.main === module) {
  const url = process.argv[2];
  if (!url || !url.includes("x.com")) {
    console.error("Usage: node scrape.js <x.com tweet URL>");
    process.exit(1);
  }
  scrape(url);
}
