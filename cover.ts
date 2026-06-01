import "dotenv/config";
import * as path from "path";
import * as fs from "fs";
import { scrape } from "./scrape";
import { screenshot } from "./screenshot";

if (!process.env.LIBRARY) {
  console.error("LIBRARY is not set in .env");
  process.exit(1);
}
const LIBRARY = process.env.LIBRARY;
const ROOT = path.basename(__dirname) === "dist" ? path.join(__dirname, "..") : __dirname;
const DATA_FILE = path.join(ROOT, "public/post-data.js");

const url = process.argv[2];
if (!url || !url.includes("x.com")) {
  console.error("Usage: node cover.js <x.com tweet URL>");
  process.exit(1);
}

interface PostData {
  authorName: string;
  handle: string;
  englishText: string[];
  translatedText: string[];
  created_at: string;
  views: number;
  target_lang: string;
  metrics: {
    reply_count: number;
    retweet_count: number;
    like_count: number;
  };
}

// Labels keyed by BCP 47 tag — add more as needed
const MD_LABELS: Record<string, { time: string; views: string; replies: string; retweets: string; likes: string; source: string; translation: string }> = {
  zh: { time: "时间", views: "浏览", replies: "回复", retweets: "转发", likes: "点赞", source: "原文", translation: "译文" },
  ja: { time: "日時", views: "表示", replies: "返信", retweets: "リツイート", likes: "いいね", source: "原文", translation: "翻訳" },
  ko: { time: "시간", views: "조회", replies: "댓글", retweets: "리트윗", likes: "좋아요", source: "원문", translation: "번역" },
  fr: { time: "Date", views: "Vues", replies: "Réponses", retweets: "Retweets", likes: "J'aime", source: "Original", translation: "Traduction" },
  de: { time: "Zeit", views: "Aufrufe", replies: "Antworten", retweets: "Retweets", likes: "Gefällt mir", source: "Original", translation: "Übersetzung" },
  es: { time: "Fecha", views: "Vistas", replies: "Respuestas", retweets: "Retweets", likes: "Me gusta", source: "Original", translation: "Traducción" },
};
const DEFAULT_LABELS = MD_LABELS["zh"];

function fmtCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

(async () => {
  // 1. Scrape
  await scrape(url);

  // 2. Read post-data.js for folder metadata
  const src = fs.readFileSync(DATA_FILE, "utf8");
  const _w: { X_POST_COVER_DATA?: PostData } = {};
  new Function("window", src)(_w);
  const data = _w.X_POST_COVER_DATA!;

  const labels = MD_LABELS[data.target_lang] ?? DEFAULT_LABELS;

  const tweetId = url.match(/status\/(\d+)/)?.[1] ?? String(Date.now());
  const dt = new Date(data.created_at);
  const datePrefix = dt.toISOString().slice(0, 10);
  const handle = (data.handle ?? "").replace(/^@/, "");
  const folderName = `${datePrefix}_${handle}_${tweetId}`;
  const folderPath = path.join(LIBRARY, folderName);

  fs.mkdirSync(folderPath, { recursive: true });

  // 3. Screenshot → folder/cover.png
  const coverPath = path.join(folderPath, "cover.png");
  await screenshot(coverPath);

  // 4. Write content.md
  const time = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const date = dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const md = `# ${data.authorName} (${data.handle})

**${labels.time}：** ${time} · ${date}
**${labels.views}：** ${fmtCount(data.views)} · **${labels.replies}：** ${data.metrics.reply_count} · **${labels.retweets}：** ${data.metrics.retweet_count} · **${labels.likes}：** ${data.metrics.like_count}
**URL：** ${url}

---

## ${labels.source}

${(data.englishText ?? []).join("\n\n")}

## ${labels.translation}

${(data.translatedText ?? []).join("\n\n")}
`;

  fs.writeFileSync(path.join(folderPath, "content.md"), md);

  console.log(`\nSaved to ${path.basename(LIBRARY)}/${folderName}/`);
  console.log(`  cover.png`);
  console.log(`  content.md`);
})();
