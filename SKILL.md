---
name: x-cover
description: Render a styled WeChat cover image from an already-collected X post (reads post.json produced by x-collect). Use when the user wants a cover image for a tweet that has been collected into the material library. Pure rendering — does not scrape; run x-collect first.
user-invocable: true
---

纯渲染封面卡:读 `x-collect` 产出的 `post.json` → `cover.png`(落同一推文件夹)。**不抓推**,采集请先用 `/x-collect`。

## Step 1 — bootstrap check

```bash
SKILL_DIR="$HOME/.claude/skills/x-cover"
[ -d "$SKILL_DIR" ] || SKILL_DIR="$HOME/Code/scripts/x-cover"
[ -d "$SKILL_DIR" ] || SKILL_DIR="$HOME/Code/scripts/x-post-cover"
[ -f "$SKILL_DIR/dist/index.js" ] && echo "READY SKILL_DIR=$SKILL_DIR" || echo "NEEDS:build SKILL_DIR=$SKILL_DIR"
```

## Step 2 — act

**If `NEEDS:build`**:`cd "$SKILL_DIR" && npm install && npm run build`。

**If `READY`**(`$ARGUMENTS` 为推文件夹路径,或 `post.json` 路径):

```bash
cd "$SKILL_DIR"
node dist/index.js $ARGUMENTS
```

产物 `<文件夹>/cover.png`。版式/二维码改 `public/index.html`、`public/assets/`;显示二维码设 `QRCODE=show`。

> 典型流程:`/x-collect <X链接>` 先采(出 post.json + media/avatar.jpg)→ `/x-cover <那个文件夹>` 出封面。
