---
name: x-cover
description: Generate a WeChat article cover image from an X (Twitter) post URL. Use when the user provides an X or Twitter post URL and wants a styled cover image for a WeChat article.
user-invocable: true
---

Generate a WeChat article cover image from an X (Twitter) post URL.

## Step 1 — bootstrap check

```bash
SKILL_DIR="$HOME/.claude/skills/x-post-cover"
if [ ! -f "$SKILL_DIR/.env" ]; then
  echo "NEEDS_CONFIG:$SKILL_DIR"
else
  echo "READY:$SKILL_DIR"
fi
```

## Step 2 — act on the result

**If `NEEDS_CONFIG`:** Ask the user for:
- `DEEPSEEK_API_KEY` (from https://platform.deepseek.com)
- `LIBRARY` — absolute path to output folder

Write them to `$SKILL_DIR/.env` (copy from `$SKILL_DIR/.env.example`).

**If `READY`:** Run:
```bash
cd "$HOME/.claude/skills/x-post-cover" && node dist/index.js $ARGUMENTS
```
Report the saved files on success, or the error on failure.
