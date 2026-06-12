import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { screenshot } from "./screenshot";
import { PostData } from "./types";

// x-cover:纯渲染。读 x-collect 产出的 post.json → 生成 public/post-data.js → 截图 → <folder>/cover.png。
// 不再自己抓推(采集归 x-collect)。入参:推文件夹路径,或直接给 post.json 路径。

function findRoot(dir: string): string {
  if (fs.existsSync(path.join(dir, ".env.example"))) return dir;
  const parent = path.dirname(dir);
  return parent !== dir ? findRoot(parent) : dir;
}
const ROOT = findRoot(__dirname);
const DATA_OUT = path.join(ROOT, "public/post-data.js");

function resolvePostJson(arg: string): { postPath: string; folder: string } {
  const p = path.resolve(arg);
  const stat = fs.existsSync(p) ? fs.statSync(p) : null;
  if (stat?.isDirectory()) return { postPath: path.join(p, "post.json"), folder: p };
  if (p.endsWith(".json")) return { postPath: p, folder: path.dirname(p) };
  throw new Error("入参应为推文件夹 或 post.json 路径");
}

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error("用法: node cover.js <推文件夹 | post.json>");
    process.exit(1);
  }
  const { postPath, folder } = resolvePostJson(arg);
  if (!fs.existsSync(postPath)) {
    console.error(`找不到 ${postPath}(先跑 x-collect)`);
    process.exit(1);
  }
  const post = JSON.parse(fs.readFileSync(postPath, "utf8")) as PostData;

  // 头像:把文件夹里的 media/avatar.jpg 拷到 public/assets/avatar.jpg 供模板加载(本地 file://,远程 URL 在国内加载不出)
  const avatar = "assets/avatar.jpg";
  const folderAvatar = path.join(folder, post.author.avatar || "media/avatar.jpg");
  if (fs.existsSync(folderAvatar)) {
    fs.copyFileSync(folderAvatar, path.join(ROOT, "public/assets/avatar.jpg"));
  } else {
    console.warn("没找到本地头像,用上次的 assets/avatar.jpg");
  }

  const showQrcode = (process.env.QRCODE ?? "hide") === "show";
  const data = {
    qrcode: "assets/codexx-qrcode.jpg",
    showQrcode,
    avatar,
    authorName: post.author.name,
    handle: post.author.handle,
    englishText: post.text_en,
    translatedText: post.text_zh,
    created_at: post.created_at,
    views: post.metrics.views,
    target_lang: post.target_lang,
    metrics: {
      reply_count: post.metrics.reply,
      retweet_count: post.metrics.retweet,
      like_count: post.metrics.like,
    },
  };
  fs.writeFileSync(DATA_OUT, `window.X_POST_COVER_DATA = ${JSON.stringify(data, null, 2)};\n`);

  const coverPath = path.join(folder, "cover.png");
  await screenshot(coverPath);
  console.log(`\n✅ 封面:${coverPath}`);
}

main();
