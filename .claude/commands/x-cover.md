Generate a WeChat article cover image from an X (Twitter) post URL.

## Step 1 — bootstrap check

```bash
INSTALL_DIR="${X_COVER_HOME:-$HOME/.x-post-cover}"
if [ ! -f "$INSTALL_DIR/dist/index.js" ]; then
  echo "NEEDS_INSTALL:$INSTALL_DIR"
elif [ ! -f "$INSTALL_DIR/.env" ]; then
  echo "NEEDS_CONFIG:$INSTALL_DIR"
else
  echo "READY:$INSTALL_DIR"
fi
```

## Step 2 — act on the result

**If `NEEDS_INSTALL`:** Run:
```bash
git clone https://github.com/tangkakakaka/x-post-cover "${X_COVER_HOME:-$HOME/.x-post-cover}"
```
No `npm install` needed — `dist/` is pre-built. Then proceed to `NEEDS_CONFIG`.

**If `NEEDS_CONFIG`:** Ask the user for:
- `DEEPSEEK_API_KEY` (from https://platform.deepseek.com)
- `LIBRARY` — absolute path to output folder

Write them to `$INSTALL_DIR/.env` (copy from `.env.example`). Then use the `update-config` skill to set `X_COVER_HOME` in `~/.claude/settings.json`.

**If `READY`:** Run:
```bash
cd "${X_COVER_HOME:-$HOME/.x-post-cover}" && node dist/index.js $ARGUMENTS
```
Report the saved files on success, or the error on failure.
