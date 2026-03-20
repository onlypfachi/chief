# chief

<div align="center">
  <img src="assets/chief.png" alt="Chief" width="160" />
</div>

**Built for the Hybrid Developer. Not a replacement — a multiplier.**

The best developers today aren't just coders. They're **Hybrid Developers** — people who blend disciplines, tools, and modes of thinking to ship better products faster. They orchestrate AI tools without losing ownership of the system. They understand design and product well enough to make better technical decisions. They know when to reach for a visual builder and when to write the code from scratch.

Chief is built for that person.

chief is a set of Claude Code skills built to work hand-in-hand with developers. It keeps AI grounded in real engineering standards — clean code, passing tests, maintainable architecture — while multiplying what you can actually ship. You stay in the driver's seat. Chief rides shotgun and keeps the car on the road.

---

## Built on the shoulders of gstack

chief is a fork of **[gstack](https://github.com/garrytan/gstack)** by [Garry Tan](https://x.com/garrytan), President & CEO of Y Combinator. Garry built gstack as his personal open-source software factory — a system for one person to ship at the scale of a team of twenty. It is remarkable work, freely shared, and it inspired everything here.

Chief takes a different angle. Garry built gstack to replace the team around a solo technical founder. Chief is built to **make the developer better** — to sit alongside any developer, solo or on a team, and help them ship faster without cutting corners. The goal isn't to remove the human from the loop. It's to make that human significantly more capable.

Thank you, Garry. gstack is the foundation chief stands on.

---

## What chief actually is

AI coding tools are everywhere. Most of them are copilots — they complete your code, answer questions, help you move faster. That's useful. Chief is something different.

**Chief is your dev mate.** The senior engineer who happens to be free whenever you need them. The one who catches the `console.log` you forgot before it hits production. Who asks "did you write a test for that?" before you push. Who explains what a leaky abstraction actually is when you're staring at one — without making you feel dumb for asking. Who tells you the plan before doing anything and waits for your green light.

Chief doesn't replace developers. Chief makes developers better at being developers.

**What that looks like in practice:**

- You make the calls. Chief lays out the plan first and waits for your approval.
- Chief and you write the code. Chief reviews it before it goes anywhere — debug statements, lint, tests, all of it.
- You stay in control. Chief only takes the wheel if you explicitly hand it over (`/chief-cook`).
- You get better over time. Chief tracks your patterns, names what you're doing well, and gives you one concrete thing to improve each session.

**The standard chief holds:**

Every push goes through the quality gate — no debug statements in production, lint clean, tests passing, conventional commit, right branch. Not because chief is paranoid, but because that's what code that other people (and future you) can actually work with looks like.

---

## Who chief is for

Chief is built for the **Hybrid Developer** — in any of the forms that takes:

- **The AI-Empowered Coder** — You use Copilot, Claude, and Gemini as force multipliers. You're not typing boilerplate; you're directing the system, reviewing the output, and owning the architecture. Chief keeps that workflow disciplined: plan first, review before push, no debug statements in production.

- **The Multi-Disciplinary Builder** — You think in products, not tickets. You care about the user experience, understand the business logic, and write the code to bring it to life. Chief gives you the engineering rigour to match your breadth — quality gates, structured reviews, and a coaching layer that grows with you.

- **The Low-Code Fusion Developer** — You build 80% fast with the best tools available, and write the 20% that needs to be custom. Chief works wherever you land: it doesn't care how much of your stack is visual and how much is hand-written. It cares that what ships is clean, tested, and maintainable.

If you're still siloed — purely frontend, purely backend, or AI-free by choice — chief will still help you. But it's designed for the person who refuses to stay in one lane.

Chief works with Claude Code and any AI system that supports skills. It multiplies what AI can do for a developer — not by automating the developer away, but by making sure the AI is helping them build something they'll be proud of in six months.

---

## Quick start

1. Install chief (30 seconds — see below)
2. Run `/chief-init` inside your project — sets up your project context in 2 minutes
3. Run `/chief` — your first coaching session
4. Run `/chief-push` when you're ready to commit and push
5. That's it. You'll know if this is working.

---

## The skills

### Chief-native skills

| Skill | What it does |
|-------|-------------|
| `/chief` | Your dev mate. Coaching session: audits recent work, names patterns, gives you one concrete focus for the week. Starts every session in plan mode — lays out what it's going to do and waits for your go-ahead. |
| `/chief-init` | One-time project setup. Detects your stack, interviews you for what can't be inferred, writes `CHIEF.md` — the context file chief reads at the start of every session. |
| `/chief-push` | Pre-push quality gate. Scans for debug statements, runs lint, runs tests, checks your branch name, commits with conventional commit format, then pushes. Dev approves the commit and the push. |
| `/chief-cook` | Chief takes the wheel. Full autonomy — no plan approvals, no check-ins on file changes, chief makes all the calls. Only hard-stops for destructive operations (deletes, force-push, critical config). Use when you trust chief to handle something end-to-end. |
| `/chief-resolve` | PR review resolver. Pulls all reviewer comments on the open PR, works through them one by one — shows each in context, discusses it, implements fixes, and optionally replies on GitHub to mark it addressed. |

### Workflow skills (inherited from gstack, built on)

| Skill | What it does |
|-------|-------------|
| `/office-hours` | Think through what you're building before writing a line of code. Reframes the problem, challenges premises, generates alternatives. |
| `/plan-ceo-review` | Strategy review. Rethink scope, find the better product hiding in the request. |
| `/plan-eng-review` | Architecture review. Lock in data flow, edge cases, test plan, failure modes. |
| `/plan-design-review` | Design audit at the plan stage. Rates each dimension, explains what a 10 looks like. |
| `/design-consultation` | Build a complete design system. Research, creative direction, realistic mockups, `DESIGN.md`. |
| `/review` | Pre-merge code review. Finds bugs that pass CI but blow up in production. |
| `/investigate` | Systematic debugging. Root cause before any fix. Stops after 3 failed attempts and escalates. |
| `/design-review` | Visual design audit then fixes what it finds. Before/after screenshots, atomic commits. |
| `/qa` | Browser-based QA. Opens real Chromium, clicks through flows, finds bugs, fixes them, generates regression tests. |
| `/qa-only` | Same as `/qa` but report only — no code changes. |
| `/ship` | Release workflow. Sync main, run tests, coverage audit, push, open PR. |
| `/document-release` | Post-ship doc sync. Updates README, ARCHITECTURE, CLAUDE.md, TODOS to match what shipped. |
| `/retro` | Weekly engineering retrospective. Per-person breakdowns, shipping streaks, test health trends. |
| `/browse` | Headless Chromium browser for the AI. Real clicks, real screenshots, ~100ms per command. |
| `/setup-browser-cookies` | Import cookies from your real browser into the headless session for authenticated testing. |

### Power tools

| Skill | What it does |
|-------|-------------|
| `/codex` | Second opinion from OpenAI Codex CLI. Cross-model review when both `/review` and `/codex` have run. |
| `/careful` | Warns before destructive commands. Activate with "be careful". |
| `/freeze` | Lock edits to one directory while debugging. |
| `/guard` | `/careful` + `/freeze` together. Maximum safety for prod work. |
| `/unfreeze` | Remove the `/freeze` boundary. |
| `/gstack-upgrade` | Upgrade to latest. Detects global vs vendored install. |

---

## How chief works with you

Chief follows two core rules in every interaction:

**Plan first.** Before chief does anything that changes your code or your project, it tells you what it's going to do and waits for your green light. You're never surprised by what got changed. If something unexpected comes up mid-task, chief stops, explains, and gets a new go-ahead.

**Always in the conversation.** Chief doesn't make decisions silently. It explains complex concepts when it raises them, asks before it acts, and involves you in calls that matter. This isn't just courtesy — it's how you actually get better as a developer instead of just having things done for you.

When you want chief to go hands-free: `/chief-cook`. Chief takes over, makes all the calls, only stops for operations that could permanently damage something. You see the result when it's done.

---

## Install — takes 30 seconds

**Requirements:** [Claude Code](https://docs.anthropic.com/en/docs/claude-code), [Git](https://git-scm.com/), [Bun](https://bun.sh/) v1.0+

### Step 1: Install on your machine

Open Claude Code and paste this prompt. Claude does the rest.

```
Install chief: run `git clone https://github.com/onlypfachi/chief.git ~/.claude/skills/chief && cd ~/.claude/skills/chief && ./setup` — setup builds the browser binary, registers skills, and updates ~/.claude/CLAUDE.md. Then ask the user if they also want to add chief to the current project so teammates get it.
```

### Step 2: Add to your repo so teammates get it (optional)

```
Add chief to this project: run `cp -Rf ~/.claude/skills/chief .claude/skills/chief && rm -rf .claude/skills/chief/.git && cd .claude/skills/chief && ./setup` — setup builds the binary, registers skills, and updates this project's CLAUDE.md.
```

Real files get committed to your repo (not a submodule), so `git clone` just works. Everything lives inside `.claude/`. Nothing touches your PATH or runs in the background.

---

## Troubleshooting

**Skill not showing up?**
```
cd ~/.claude/skills/chief && ./setup
```

**`/browse` fails?**
```
cd ~/.claude/skills/chief && bun install && bun run build
```

**Stale install?** Run `/gstack-upgrade` — or set `auto_upgrade: true` in `~/.gstack/config.yaml`

**Claude says it can't see the skills?** Re-run setup — it updates `CLAUDE.md` automatically:
```
cd ~/.claude/skills/chief && ./setup
```

---

## Docs

| Doc | What it covers |
|-----|---------------|
| [Architecture](ARCHITECTURE.md) | Design decisions and system internals |
| [Browser Reference](BROWSER.md) | Full command reference for `/browse` |
| [Contributing](CONTRIBUTING.md) | Dev setup, testing, and contributor mode |
| [Changelog](CHANGELOG.md) | What's new in every version |

---

## License

MIT. Free forever. Go build something worth maintaining.
