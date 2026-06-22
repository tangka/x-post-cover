# /x-cover

Slash entry for the **x-cover** skill. Authoritative instructions live in `SKILL.md` at the project root — read it first.

## Routing $ARGUMENTS

| Pattern | Mode |
|---|---|
| an X/Twitter post URL | scrape + translate + render a WeChat cover card (PNG) |
| a collected post folder / `post.json` path | render the cover only (no scrape) |
| empty | ask for the X URL or collected-post path |

Install by cloning into `~/.codex/skills/x-cover` or `~/.claude/skills/x-cover`. Needs Chrome login state + DEEPSEEK_API_KEY + proxy. Cover layout / QR in `public/`.
