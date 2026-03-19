---
name: chief-init
version: 1.0.0
description: |
  One-time project setup for chief. Run inside any project to generate CHIEF.md —
  a project context file that chief reads at the start of every session. Detects
  the stack automatically, then interviews the developer for what can't be inferred
  from code. The result is a permanent project memory that makes every chief skill
  smarter from the first use.
  Use when setting up chief on a new project, when the team wants to configure chief
  for their workflow, or when CHIEF.md is missing or out of date.
  Suggest when the user runs /chief for the first time in a project that has no
  CHIEF.md, or when the user says "set up chief", "configure chief", or "init chief".
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
  - Write
  - Edit
  - AskUserQuestion
---

# /chief-init — Project Setup

Sets up chief for this project by creating `CHIEF.md` — the project context file that
every chief skill reads at the start of each session. Run once per project, re-run when
the stack changes significantly.

Chief's voice is active from the first message. Casual, direct, no fluff. Like a friend
who happens to know your whole codebase.

**If `CHIEF.md` already exists:** Read it first, then say something like:
"Looks like you've already got a CHIEF.md from [date]. What do you want to do with it?"

> A) Update it — I'll re-scan and merge in anything new
> B) Start over — blow it away and rebuild fresh
> C) Leave it — I just wanted to check

---

## Phase 1: Auto-Detect the Stack

Run all detection silently. Collect results. Do NOT ask the developer anything yet.

```bash
# Runtime / language
[ -f package.json ] && echo "RUNTIME:node" && cat package.json | head -60
[ -f Gemfile ] && echo "RUNTIME:ruby" && cat Gemfile | head -40
[ -f requirements.txt ] && echo "RUNTIME:python"
[ -f pyproject.toml ] && echo "RUNTIME:python" && cat pyproject.toml | head -40
[ -f go.mod ] && echo "RUNTIME:go" && cat go.mod | head -10
[ -f Cargo.toml ] && echo "RUNTIME:rust" && cat Cargo.toml | head -20
[ -f composer.json ] && echo "RUNTIME:php"
[ -f mix.exs ] && echo "RUNTIME:elixir"

# Package manager (Node only)
[ -f bun.lockb ] && echo "PKG_MANAGER:bun"
[ -f yarn.lock ] && echo "PKG_MANAGER:yarn"
[ -f pnpm-lock.yaml ] && echo "PKG_MANAGER:pnpm"
[ -f package-lock.json ] && echo "PKG_MANAGER:npm"

# Test framework
ls jest.config.* vitest.config.* 2>/dev/null && echo "TEST:jest/vitest"
ls .rspec 2>/dev/null && echo "TEST:rspec"
ls pytest.ini setup.cfg pyproject.toml 2>/dev/null | xargs grep -l "pytest" 2>/dev/null && echo "TEST:pytest"
ls -d cypress/ e2e/ playwright.config.* 2>/dev/null && echo "TEST:e2e"
ls -d test/ tests/ spec/ __tests__/ 2>/dev/null

# Database
ls prisma/schema.prisma schema.prisma 2>/dev/null && echo "DB:prisma"
ls db/schema.rb 2>/dev/null && echo "DB:activerecord"
ls -d alembic/ migrations/ 2>/dev/null
grep -r "postgresql\|postgres\|mysql\|sqlite\|mongodb\|redis" \
  .env .env.example .env.local 2>/dev/null | head -5

# Deployment
[ -f vercel.json ] || [ -d .vercel ] && echo "DEPLOY:vercel"
[ -f fly.toml ] && echo "DEPLOY:fly"
[ -f render.yaml ] && echo "DEPLOY:render"
[ -f railway.toml ] || [ -f railway.json ] && echo "DEPLOY:railway"
[ -f Dockerfile ] && echo "DEPLOY:docker"
[ -d .github/workflows ] && echo "CI:github-actions" && ls .github/workflows/
[ -d .gitlab-ci.yml ] && echo "CI:gitlab"

# TypeScript
[ -f tsconfig.json ] && echo "LANG:typescript" && cat tsconfig.json | head -20

# Linting / formatting
ls .eslintrc* .eslintrc.json .eslintrc.js eslint.config.* 2>/dev/null && echo "LINT:eslint"
ls .prettierrc* prettier.config.* 2>/dev/null && echo "FMT:prettier"
ls .rubocop.yml 2>/dev/null && echo "LINT:rubocop"
ls pyproject.toml 2>/dev/null | xargs grep -l "ruff\|black\|flake8" 2>/dev/null

# Monorepo
ls -d packages/ apps/ 2>/dev/null && echo "MONOREPO:yes"
[ -f turbo.json ] && echo "MONOREPO:turborepo"
[ -f nx.json ] && echo "MONOREPO:nx"

# Git context
git log --oneline -5 2>/dev/null
git remote get-url origin 2>/dev/null
```

Parse the package.json `dependencies` and `devDependencies` to detect framework:
- `next` → Next.js
- `react` (without next) → React SPA
- `vue` → Vue
- `svelte` → Svelte
- `express`, `fastify`, `hono`, `koa` → Node API
- `nestjs` / `@nestjs/core` → NestJS
- `prisma` / `@prisma/client` → Prisma ORM
- `drizzle-orm` → Drizzle ORM
- `@supabase/supabase-js` → Supabase
- `tailwindcss` → Tailwind CSS
- `trpc` / `@trpc/server` → tRPC

---

## Phase 2: Read Existing Docs

Read these files if they exist — extract conventions, architecture notes, and context:

```bash
ls CLAUDE.md README.md CONTRIBUTING.md ARCHITECTURE.md DESIGN.md TESTING.md 2>/dev/null
```

Read each one that exists. Extract:
- Tech stack mentions
- Stated conventions (naming, file structure, test requirements)
- Team notes or contributor guidelines
- Any existing context relevant to chief

---

## Phase 2.5: Detect Versioning Strategy

Run all versioning detection silently. Collect results. Do NOT ask the developer anything yet.

```bash
# Version files — check in order of priority
[ -f VERSION ] && echo "VERSION_FILE:VERSION" && cat VERSION
[ -f version.txt ] && echo "VERSION_FILE:version.txt" && cat version.txt
[ -f package.json ] && node -e "const p=require('./package.json'); if(p.version) console.log('PACKAGE_JSON_VERSION:'+p.version)" 2>/dev/null
[ -f pyproject.toml ] && grep -E '^version\s*=' pyproject.toml | head -1 && echo "VERSION_FILE:pyproject.toml"
[ -f Cargo.toml ] && grep -E '^version\s*=' Cargo.toml | head -1 && echo "VERSION_FILE:Cargo.toml"
[ -f setup.py ] && grep -E "version\s*=" setup.py | head -1 && echo "VERSION_FILE:setup.py"
[ -f setup.cfg ] && grep -E '^version\s*=' setup.cfg | head -1 && echo "VERSION_FILE:setup.cfg"
[ -f Chart.yaml ] && grep -E '^version:' Chart.yaml | head -1 && echo "VERSION_FILE:Chart.yaml"
[ -f build.gradle ] && grep -E "^version\s*=" build.gradle | head -1 && echo "VERSION_FILE:build.gradle"
[ -f pom.xml ] && grep -m1 '<version>' pom.xml | sed 's/.*<version>\(.*\)<\/version>.*/VERSION_FILE:pom.xml VERSION:\1/'

# CHANGELOG format hint
[ -f CHANGELOG.md ] && head -5 CHANGELOG.md
[ -f CHANGELOG ] && head -5 CHANGELOG
[ -f HISTORY.md ] && head -3 HISTORY.md

# Bump scripts
ls bin/bump* scripts/bump* scripts/version* bin/version* Makefile 2>/dev/null
[ -f Makefile ] && grep -i "version\|bump\|release" Makefile | head -5
```

From the results, determine:
- **Version source of truth**: which file(s) hold the canonical version
- **Version format**: semver (e.g. `1.2.3`), calendar (e.g. `2024.01.15`), or other
- **Whether version is synced across files**: e.g. both `VERSION` and `package.json` need updating
- **Bump script**: is there an existing bump/release script to reuse?

---

## Phase 3: Developer Interview

Ask these questions **ONE AT A TIME** via AskUserQuestion. Auto-detected answers can be
confirmed rather than re-asked (e.g. "I detected Next.js + TypeScript + Prisma — is that
right, or anything to add?").

**Q1: Confirm / complete the stack**

Present what was detected in Chief's voice — casual, like you're comparing notes:

> "Okay so here's what I found:
> - Runtime: [detected or "couldn't tell"]
> - Framework: [detected or "couldn't tell"]
> - Database: [detected or "nothing obvious"]
> - Tests: [detected or "don't see any — we should talk about that"]
> - Deployment: [detected or "unclear"]
>
> That right? Anything I missed or got wrong?"

**Q2: What kind of project is this?**

> A) Real product — users, revenue, uptime matters
> B) Internal tool — team uses it, but it's not customer-facing
> C) Side project — building for fun, learning, or experimenting
> D) Open source — community project, outside contributors
> E) Client work — shipping for someone else

**Q3: Who's on this with you?**

> A) Just me
> B) Small crew (2-4) — everyone knows the whole codebase
> C) Mid-size team (5-15) — code review is normal, people own areas
> D) Larger org (15+) — multiple services or codebases in play

If not solo: "What's the experience mix? Like, 2 seniors and a mid, or something else?"

**Q4: What are you working on right now?**

> "What's the actual thing you're building or fixing this week? Not the roadmap — the
> thing you'll have open in your editor tomorrow."

**Q5: What part of this codebase makes you groan?**

> "Be honest — what slows you down or causes dread?"
>
> A) Tests — hard to write, slow, or basically don't exist
> B) Architecture — tangled, one change breaks three other things
> C) Performance — getting slower and you're not sure why
> D) Onboarding — hard to explain to someone new
> E) Reliability — bugs in prod, hard to reproduce, unpredictable
> F) Something else — just say it

**Q6: How much do you want Chief in your face?**

> "When you're working, I can notice what stage you're in and suggest the right skill.
> How proactive do you want me?"
>
> A) All in — suggest skills whenever they're relevant
> B) Selective — only for code review (/review) and QA (/qa)
> C) Minimal — just for shipping (/ship) and debugging (/investigate)
> D) On demand — don't suggest, I'll call you when I need you

---

## Phase 4: Write CHIEF.md

Write `CHIEF.md` at the project root. This is the file chief reads every session.

```markdown
# Chief Project Context

> Generated by /chief-init on {date}. Edit freely — chief reads this every session.
> Re-run `/chief-init` to update detected values after major stack changes.

## Stack

| | |
|---|---|
| Language | {TypeScript / JavaScript / Ruby / Python / Go / Rust / etc.} |
| Runtime | {Node.js vX / Ruby X / Python X / etc.} |
| Framework | {Next.js 14 / Rails 7 / FastAPI / etc. or "none"} |
| Package manager | {bun / npm / yarn / pnpm / pip / bundler / etc.} |
| Database | {PostgreSQL (Prisma) / MySQL / SQLite / MongoDB / none / etc.} |
| ORM / Query layer | {Prisma / Drizzle / ActiveRecord / SQLAlchemy / none / etc.} |
| Testing | {Vitest / Jest / RSpec / pytest / go test / etc.} |
| Linting / formatting | {ESLint + Prettier / Rubocop / Ruff / etc.} |
| Deployment | {Vercel / Fly.io / Railway / Render / Docker / etc.} |
| CI/CD | {GitHub Actions / GitLab CI / etc. or "none"} |

## Versioning

| | |
|---|---|
| Format | {semver / calver / other} |
| Version files | {list each file that must be updated on release, e.g. `VERSION`, `package.json`} |
| Bump script | {path to bump script, or "none — chief-push manages it"} |
| Notes | {any project-specific versioning rules, e.g. "major only on breaking API changes"} |

## Project Structure

{Auto-generated from top-level directory scan. Format as a brief description of
what each key directory does — not just a file listing.}

Example:
- `src/app/` — Next.js app router pages and layouts
- `src/components/` — shared UI components
- `src/lib/` — utilities, shared logic, third-party client setup
- `prisma/` — database schema and migrations
- `test/` — unit and integration tests

## Project Context

| | |
|---|---|
| Type | {Startup / Internal tool / Side project / Open source / Contract} |
| Team size | {Solo / 2-4 / 5-15 / 15+} |
| Team levels | {e.g. "2 seniors, 1 mid" or "solo mid-level"} |
| Current focus | {what's being built or fixed right now} |

## Known Pain Points

{From Q5 — what's been hardest to work with. Be specific.}

## Engineering Conventions

{Extracted from CONTRIBUTING.md, CLAUDE.md, README.md, linting config.
If none found, write "None documented — add conventions here."}

Key conventions:
- {e.g. "All new features require tests before merging"}
- {e.g. "Components live in src/components/, organized by feature not type"}
- {e.g. "API routes in src/app/api/, always return typed responses"}

## Chief Configuration

### Proactive Skill Suggestions
{List of skills the developer wants suggested, from Q6}

### Coaching Focus Areas
chief will pay attention to these areas during code reviews and coaching:
- {e.g. "Test coverage — team is building the habit, reinforce when tests are added"}
- {e.g. "Function size — flag functions over 30 lines for possible splitting"}
- {e.g. "Error handling — team often skips error cases, always surface this"}

### Skills to Prioritize
{Which chief skills are most useful for this project's workflow}
```

---

## Phase 5: Update CLAUDE.md

Check if `CLAUDE.md` exists and whether it already references `CHIEF.md`:

```bash
[ -f CLAUDE.md ] && grep -l "CHIEF.md\|chief-init\|chief reads" CLAUDE.md 2>/dev/null
```

**If CLAUDE.md exists and has no chief reference:** Append a chief section:

```markdown

## Chief

This project uses chief for developer coaching and workflow automation.

**At the start of every chief session:** Read `CHIEF.md` for project context —
stack, conventions, team setup, and coaching configuration.

Available skills: /chief, /chief-init, /chief-push, /chief-cook, /chief-resolve,
/chief-upgrade, /review, /ship, /qa, /qa-only, /investigate, /retro, /office-hours,
/plan-eng-review, /plan-ceo-review, /plan-design-review, /design-review,
/design-consultation, /document-release, /codex, /careful, /freeze, /guard,
/unfreeze, /browse, /setup-browser-cookies.
```

**If CLAUDE.md does not exist:** Create it with just the chief section above.

**If CLAUDE.md already references chief:** Skip — don't duplicate.

---

## Phase 6: Confirm

Wrap up in Chief's voice — no formality, just a quick handoff:

> "Done. CHIEF.md is at [path]. I'll read it at the start of every session now.
> CLAUDE.md is updated too.
>
> You can edit CHIEF.md any time — it's your file. If the stack changes or the team
> grows, just update it or re-run `/chief-init`.
>
> What do you want to do now?"

Ask via AskUserQuestion:

> A) Looks good — we're set
> B) Change something — I want to fix a section
> C) Let's go — run `/chief` now with this context loaded

If B: "What needs fixing?" — make the change in CHIEF.md, confirm it's done.
If C: proceed directly into the `/chief` coaching session with CHIEF.md loaded.

---

## Important Rules

- **Never overwrite existing CLAUDE.md content.** Only append. Never delete sections.
- **CHIEF.md is the developer's file.** Don't treat it as auto-generated and
  regenerate it without asking. On re-run, merge — don't overwrite.
- **Stack detection is a starting point, not gospel.** If the developer corrects
  a detection, trust their answer over the file scan.
- **One question at a time.** Never batch Q1-Q6 into one AskUserQuestion.
- **Completion status:**
  - DONE — CHIEF.md written, CLAUDE.md updated, developer confirmed
  - DONE_WITH_CONCERNS — written but developer flagged something to revisit
  - NEEDS_CONTEXT — can't detect stack and developer declined to answer
