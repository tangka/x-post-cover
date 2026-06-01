# x-post-cover

A Claude Code skill that turns any X (Twitter) post into a styled cover image + Markdown file — ready for WeChat articles.

**One command:**
```
/x-cover https://x.com/someone/status/123456789
```

Claude scrapes the tweet, translates it, generates a cover PNG, and saves everything to your library folder.

---

## What it produces

```
library/
└── 2026-05-31_OpenAIDevs_206076.../
    ├── cover.png      ← styled tweet card (360 × auto px, 2× retina)
    └── content.md     ← original text + translation + metadata
```

---

## Requirements

- macOS (uses Chrome's cookie store for X authentication)
- [Node.js](https://nodejs.org) ≥ 18
- Google Chrome — logged into X
- [Claude Code](https://claude.ai/code)
- A [DeepSeek API key](https://platform.deepseek.com) for translation

---

## Setup

```bash
# 1. Clone
git clone https://github.com/<you>/x-post-cover
cd x-post-cover

# 2. Install dependencies
npm install

# 3. Configure
cp .env.example .env
# Edit .env — set DEEPSEEK_API_KEY and LIBRARY at minimum

# 4. Register the install path
echo 'export X_COVER_HOME="'$(pwd)'"' >> ~/.zshrc
source ~/.zshrc

# 5. Install the Claude Code skill
cp .claude/commands/x-cover.md ~/.claude/commands/
```

---

## Configuration (`.env`)

| Key | Required | Description |
|-----|----------|-------------|
| `DEEPSEEK_API_KEY` | Yes | DeepSeek API key for translation |
| `LIBRARY` | Yes | Absolute path to output folder |
| `TARGET_LANG` | No | Translation language — BCP 47 tag (default: `zh`) |
| `QRCODE` | No | Show QR code: `show` or `hide` (default: `show`) |
| `CHROME` | No | Chrome executable path (macOS default works out of the box) |
| `COOKIES_DB` | No | Chrome Cookies DB path (override for non-default profiles) |

Replace `public/assets/codexx-qrcode.jpg` with your own QR code image.

---

## Usage

```
/x-cover https://x.com/someone/status/123456789
```

Or run directly:

```bash
npm run cover -- https://x.com/someone/status/123456789
```

---

## Supported translation languages

`zh` · `ja` · `ko` · `fr` · `de` · `es` · `pt` · `ru` · `ar`

---

## License

MIT
