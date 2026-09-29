# chief

<div align="center">
  <img src="assets/chief.png" alt="Chief" width="160" />
</div>

My opinionated AI workflows and skills for Claude Code — the setup I use to make AI actually useful in day-to-day development.

Built on a fork of [gstack](https://github.com/garrytan/gstack) by [Garry Tan](https://x.com/garrytan). gstack aims to replace a team; chief keeps the developer in charge and makes them better.

**How it behaves:**
- **Plan first.** Chief says what it's going to do and waits for your go-ahead.
- **Nothing ships dirty.** Every push goes through the gates: no debug statements, lint clean, tests passing, clean commits.
- **You stay in control.** Chief only runs on its own when you hand it the wheel (`/chief-cook`).

---

## Install

Requires [Claude Code](https://docs.anthropic.com/en/docs/claude-code), [Git](https://git-scm.com/), and [Bun](https://bun.sh/).

```bash
git clone https://github.com/onlypfachi/chief.git ~/.claude/skills/chief
cd ~/.claude/skills/chief && ./setup
```

To share it with a team, vendor it into the repo:

```bash
cp -Rf ~/.claude/skills/chief .claude/skills/chief && rm -rf .claude/skills/chief/.git
cd .claude/skills/chief && ./setup
```

## Quick start

1. `/chief-init` — one-time project setup (writes `CHIEF.md`)
2. `/chief` — coaching session and a plan for the week
3. `/chief-push` — commit, push, and open the PR through the quality gates

---

## Skills

**Chief's own**

| Skill | What it does |
|-------|-------------|
| `/chief` | Coaching session: reviews your recent work, names patterns, gives you one thing to focus on. |
| `/chief-init` | Detects your stack, asks what it can't infer, writes `CHIEF.md`. |
| `/chief-push` | Debug scan → lint → tests → coverage audit → review → version + CHANGELOG → commit → push → PR → doc sync. `/chief-push auto` for hands-off. |
| `/chief-cook` | Full autonomy. Only stops for destructive operations. |
| `/chief-resolve` | Works through PR review comments one by one and fixes them. |
| `/chief-structure-review` | Plan-mode audit of file naming, folder structure, one-thing-per-file, and SOLID. Lists every violation with the planned fix before changing anything. |

**Planning & review**

| Skill | What it does |
|-------|-------------|
| `/office-hours` | Think the idea through before writing code. |
| `/plan-ceo-review` | Rethink scope; find the better product. |
| `/plan-eng-review` | Lock in architecture, edge cases, and the test plan. |
| `/plan-design-review` | Design audit at the plan stage. |
| `/design-consultation` | Build a design system and `DESIGN.md`. |
| `/review` | Pre-merge code review for bugs that pass CI. |
| `/codex` | Second opinion from OpenAI Codex. |

**Testing & debugging**

| Skill | What it does |
|-------|-------------|
| `/investigate` | Root-cause debugging before any fix. |
| `/qa` / `/qa-only` | Browser QA that fixes bugs (or only reports them). |
| `/design-review` | Visual audit of the live site, then fixes. |
| `/browse` | Headless Chromium for the AI. |
| `/setup-browser-cookies` | Import your browser cookies to test logged-in pages. |

**Housekeeping & safety**

| Skill | What it does |
|-------|-------------|
| `/document-release` | Sync docs with what shipped. |
| `/retro` | Weekly engineering retro. |
| `/careful` · `/freeze` · `/guard` · `/unfreeze` | Warn on destructive commands; lock edits to one directory. |
| `/chief-upgrade` | Upgrade chief. |

---

## Troubleshooting

- **Skills missing?** `cd ~/.claude/skills/chief && ./setup`
- **`/browse` broken?** `cd ~/.claude/skills/chief && bun install && bun run build`
- **Out of date?** `/chief-upgrade`, or set `auto_upgrade: true` in `~/.chief/config.yaml`

## More

[Architecture](ARCHITECTURE.md) · [Browser reference](BROWSER.md) · [Contributing](CONTRIBUTING.md) · [Changelog](CHANGELOG.md)

MIT licensed.
