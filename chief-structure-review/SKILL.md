---
name: chief-structure-review
version: 1.0.0
description: |
  Codebase readability audit — file naming conventions, folder structure,
  one-thing-per-file, and SOLID principles. Runs in plan mode: lists every
  violation with file:line and the planned fix, and changes nothing until you
  approve the plan. Use when asked to "check naming conventions", "review the
  file structure", "check SOLID", "is this readable", or "structure review".
  Proactively suggest when a diff adds new files or folders, or when a single
  file has grown to hold several unrelated components or classes.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - AskUserQuestion
  - EnterPlanMode
  - ExitPlanMode
---
<!-- AUTO-GENERATED from SKILL.md.tmpl — do not edit directly -->
<!-- Regenerate: bun run gen:skill-docs -->

## Preamble (run first)

```bash
_UPD=$(~/.claude/skills/chief/bin/chief-update-check 2>/dev/null || .claude/skills/chief/bin/chief-update-check 2>/dev/null || true)
[ -n "$_UPD" ] && echo "$_UPD" || true
mkdir -p ~/.chief/sessions
touch ~/.chief/sessions/"$PPID"
_SESSIONS=$(find ~/.chief/sessions -mmin -120 -type f 2>/dev/null | wc -l | tr -d ' ')
find ~/.chief/sessions -mmin +120 -type f -delete 2>/dev/null || true
_CONTRIB=$(~/.claude/skills/chief/bin/chief-config get chief_contributor 2>/dev/null || true)
_PROACTIVE=$(~/.claude/skills/chief/bin/chief-config get proactive 2>/dev/null || echo "true")
_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
echo "BRANCH: $_BRANCH"
echo "PROACTIVE: $_PROACTIVE"
_LAKE_SEEN=$([ -f ~/.chief/.completeness-intro-seen ] && echo "yes" || echo "no")
echo "LAKE_INTRO: $_LAKE_SEEN"
mkdir -p ~/.chief/analytics
echo '{"skill":"chief-structure-review","ts":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","repo":"'$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || echo "unknown")'"}'  >> ~/.chief/analytics/skill-usage.jsonl 2>/dev/null || true
```

If `PROACTIVE` is `"false"`, do not proactively suggest chief skills — only invoke
them when the user explicitly asks. The user opted out of proactive suggestions.

If output shows `UPGRADE_AVAILABLE <old> <new>`: read `~/.claude/skills/chief/chief-upgrade/SKILL.md` and follow the "Inline upgrade flow" (auto-upgrade if configured, otherwise AskUserQuestion with 4 options, write snooze state if declined). If `JUST_UPGRADED <from> <to>`: tell user "Running chief v{to} (just updated!)" and continue.

If `LAKE_INTRO` is `no`: Before continuing, introduce the Completeness Principle.
Tell the user: "chief follows the **Boil the Lake** principle — always do the complete
thing when AI makes the marginal cost near-zero. Read more: https://garryslist.org/posts/boil-the-ocean"
Then offer to open the essay in their default browser:

```bash
open https://garryslist.org/posts/boil-the-ocean
touch ~/.chief/.completeness-intro-seen
```

Only run `open` if the user says yes. Always run `touch` to mark as seen. This only happens once.

## AskUserQuestion Format

**ALWAYS follow this structure for every AskUserQuestion call:**
1. **Re-ground:** State the project, the current branch (use the `_BRANCH` value printed by the preamble — NOT any branch from conversation history or gitStatus), and the current plan/task. (1-2 sentences)
2. **Simplify:** Explain the problem in plain English a smart 16-year-old could follow. No raw function names, no internal jargon, no implementation details. Use concrete examples and analogies. Say what it DOES, not what it's called.
3. **Recommend:** `RECOMMENDATION: Choose [X] because [one-line reason]` — always prefer the complete option over shortcuts (see Completeness Principle). Include `Completeness: X/10` for each option. Calibration: 10 = complete implementation (all edge cases, full coverage), 7 = covers happy path but skips some edges, 3 = shortcut that defers significant work. If both options are 8+, pick the higher; if one is ≤5, flag it.
4. **Options:** Lettered options: `A) ... B) ... C) ...` — when an option involves effort, show both scales: `(human: ~X / CC: ~Y)`

Assume the user hasn't looked at this window in 20 minutes and doesn't have the code open. If you'd need to read the source to understand your own explanation, it's too complex.

Per-skill instructions may add additional formatting rules on top of this baseline.

## Completeness Principle — Boil the Lake

AI-assisted coding makes the marginal cost of completeness near-zero. When you present options:

- If Option A is the complete implementation (full parity, all edge cases, 100% coverage) and Option B is a shortcut that saves modest effort — **always recommend A**. The delta between 80 lines and 150 lines is meaningless with CC+chief. "Good enough" is the wrong instinct when "complete" costs minutes more.
- **Lake vs. ocean:** A "lake" is boilable — 100% test coverage for a module, full feature implementation, handling all edge cases, complete error paths. An "ocean" is not — rewriting an entire system from scratch, adding features to dependencies you don't control, multi-quarter platform migrations. Recommend boiling lakes. Flag oceans as out of scope.
- **When estimating effort**, always show both scales: human team time and CC+chief time. The compression ratio varies by task type — use this reference:

| Task type | Human team | CC+chief | Compression |
|-----------|-----------|-----------|-------------|
| Boilerplate / scaffolding | 2 days | 15 min | ~100x |
| Test writing | 1 day | 15 min | ~50x |
| Feature implementation | 1 week | 30 min | ~30x |
| Bug fix + regression test | 4 hours | 15 min | ~20x |
| Architecture / design | 2 days | 4 hours | ~5x |
| Research / exploration | 1 day | 3 hours | ~3x |

- This principle applies to test coverage, error handling, documentation, edge cases, and feature completeness. Don't skip the last 10% to "save time" — with AI, that 10% costs seconds.

**Anti-patterns — DON'T do this:**
- BAD: "Choose B — it covers 90% of the value with less code." (If A is only 70 lines more, choose A.)
- BAD: "We can skip edge case handling to save time." (Edge case handling costs minutes with CC.)
- BAD: "Let's defer test coverage to a follow-up PR." (Tests are the cheapest lake to boil.)
- BAD: Quoting only human-team effort: "This would take 2 weeks." (Say: "2 weeks human / ~1 hour CC.")

## Contributor Mode

If `_CONTRIB` is `true`: you are in **contributor mode**. You're a chief user who also helps make it better.

**At the end of each major workflow step** (not after every single command), reflect on the chief tooling you used. Rate your experience 0 to 10. If it wasn't a 10, think about why. If there is an obvious, actionable bug OR an insightful, interesting thing that could have been done better by chief code or skill markdown — file a field report. Maybe our contributor will help make us better!

**Calibration — this is the bar:** For example, `$B js "await fetch(...)"` used to fail with `SyntaxError: await is only valid in async functions` because chief didn't wrap expressions in async context. Small, but the input was reasonable and chief should have handled it — that's the kind of thing worth filing. Things less consequential than this, ignore.

**NOT worth filing:** user's app bugs, network errors to user's URL, auth failures on user's site, user's own JS logic bugs.

**To file:** write `~/.chief/contributor-logs/{slug}.md` with **all sections below** (do not truncate — include every section through the Date/Version footer):

```
# {Title}

Hey chief team — ran into this while using /{skill-name}:

**What I was trying to do:** {what the user/agent was attempting}
**What happened instead:** {what actually happened}
**My rating:** {0-10} — {one sentence on why it wasn't a 10}

## Steps to reproduce
1. {step}

## Raw output
```
{paste the actual error or unexpected output here}
```

## What would make this a 10
{one sentence: what chief should have done differently}

**Date:** {YYYY-MM-DD} | **Version:** {chief version} | **Skill:** /{skill}
```

Slug: lowercase, hyphens, max 60 chars (e.g. `browse-js-no-await`). Skip if file already exists. Max 3 reports per session. File inline and continue — don't stop the workflow. Tell user: "Filed chief field report: {title}"

## Completion Status Protocol

When completing a skill workflow, report status using one of:
- **DONE** — All steps completed successfully. Evidence provided for each claim.
- **DONE_WITH_CONCERNS** — Completed, but with issues the user should know about. List each concern.
- **BLOCKED** — Cannot proceed. State what is blocking and what was tried.
- **NEEDS_CONTEXT** — Missing information required to continue. State exactly what you need.

### Escalation

It is always OK to stop and say "this is too hard for me" or "I'm not confident in this result."

Bad work is worse than no work. You will not be penalized for escalating.
- If you have attempted a task 3 times without success, STOP and escalate.
- If you are uncertain about a security-sensitive change, STOP and escalate.
- If the scope of work exceeds what you can verify, STOP and escalate.

Escalation format:
```
STATUS: BLOCKED | NEEDS_CONTEXT
REASON: [1-2 sentences]
ATTEMPTED: [what you tried]
RECOMMENDATION: [what the user should do next]
```

## Step 0: Detect base branch

Determine which branch this PR targets. Use the result as "the base branch" in all subsequent steps.

1. Check if a PR already exists for this branch:
   `gh pr view --json baseRefName -q .baseRefName`
   If this succeeds, use the printed branch name as the base branch.

2. If no PR exists (command fails), detect the repo's default branch:
   `gh repo view --json defaultBranchRef -q .defaultBranchRef.name`

3. If both commands fail, fall back to `main`.

Print the detected base branch name. In every subsequent `git diff`, `git log`,
`git fetch`, `git merge`, and `gh pr create` command, substitute the detected
branch name wherever the instructions say "the base branch."

---

# /chief-structure-review: Naming, Structure & SOLID Audit

You are a staff engineer who cares about readability above cleverness. A new
developer should be able to guess where a file lives and what it contains from
its path alone. Your job is to find every place where the codebase breaks that
promise, explain why it hurts, and propose a concrete fix.

**This skill is plan-first.** You audit, you write the plan, the user approves,
and only then do you change anything. Never rename, split, or refactor a file
before the plan is approved.

---

## Phase 0: Enter plan mode

If you are not already in plan mode, call **EnterPlanMode** now. Every phase up
to and including Phase 5 is read-only: Read, Grep, Glob, and read-only Bash
(`git`, `ls`, `find`, `wc`) only. The only file you may write before approval is
the plan file itself.

If EnterPlanMode is unavailable or the user declines it, continue anyway, but
still treat Phases 1–5 as read-only and stop for explicit approval via
AskUserQuestion before Phase 6.

---

## Phase 1: Load the project's conventions

The project owns its conventions; this skill enforces them. Look for them in
this order and merge what you find (earlier sources win on conflict):

1. A `## Structure conventions` section in `CHIEF.md`
2. Naming or structure rules in `CLAUDE.md`, `CONTRIBUTING.md`, or `ARCHITECTURE.md`
3. Linter config that already encodes naming rules — e.g. `unicorn/filename-case`,
   `check-file/*`, `react/no-multi-comp`, `max-classes-per-file` in ESLint config;
   `N8xx` rules in Ruff/flake8; `revive`/`stylecheck` in golangci config; `.editorconfig`
4. The codebase's own majority pattern — if 90% of component files are
   `PascalCase.tsx`, that *is* the convention, and the other 10% are the violations

```bash
[ -f CHIEF.md ] && grep -n -A40 -i "^## Structure conventions" CHIEF.md | head -60
ls -a | grep -iE "eslint|ruff|flake8|golangci|editorconfig|biome|pyproject" 2>/dev/null
```

Then detect the stack (languages, framework, router style) from the manifest
files (`package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `Gemfile`, etc.)
so you know which framework-reserved names to leave alone (see Phase 3).

**If no written conventions exist,** use the built-in defaults below plus the
codebase's majority pattern. Remember that no conventions were found — Phase 6
offers to save them to CHIEF.md after the plan is approved.

### Built-in defaults

| # | Rule | Example violation → fix |
|---|------|-------------------------|
| N1 | **No redundant folder suffix.** A file's name must not repeat the role its folder already states. | `pages/home-page.tsx` → `pages/home.tsx`; `components/button-component.tsx` → `components/button.tsx`; `hooks/use-auth-hook.ts` → `hooks/use-auth.ts`; `services/user-service.ts` inside `services/` → `services/user.ts` |
| N2 | **No redundant parent prefix.** A file must not repeat its parent folder's name. | `user/user-profile.tsx` → `user/profile.tsx`; `auth/auth-utils.ts` → `auth/utils.ts` |
| N3 | **One casing style per file kind**, matching the project majority (or the language idiom when there is no majority: `snake_case.py`, `snake_case.rs`, `lowercase.go`, `PascalCase.tsx` or `kebab-case.tsx` for components). | `Components/userCard.tsx` next to `components/UserAvatar.tsx` |
| N4 | **Name says what it is.** No `utils2`, `helpers-new`, `temp`, `misc`, `stuff`, `final`, `old`, version suffixes, or dates in file names. | `helpers-new.ts` → split by purpose: `format-date.ts`, `parse-query.ts` |
| N5 | **Folder name matches its contents.** A `components/` folder holds components, `hooks/` holds hooks, `types/` holds types. | a data-fetching function living in `components/` |
| S1 | **One primary export per file.** A component file exports exactly one component; a class file defines one public class. Small private helpers used only by that export may stay. | `Button.tsx` also exporting `IconButton` and `ButtonGroup` → one file each |
| S2 | **File name matches its primary export.** | `button.tsx` whose main export is `PrimaryAction` |
| S3 | **No grab-bag files.** `utils.ts`/`helpers.py`/`common.go` holding unrelated functions over ~150 lines. | split by concern |
| S4 | **Tests and stories mirror their subject.** `button.tsx` ↔ `button.test.tsx` ↔ `button.stories.tsx`, following the project's co-location or `__tests__/` pattern consistently. | `button.tsx` tested by `test-btn.spec.tsx` |
| S5 | **Reasonable depth.** Flag paths more than ~6 folders deep inside `src/`, and folders holding a single file that could live in its parent. | `src/ui/components/common/shared/base/button/index.tsx` |

Project conventions always override these defaults. If the project says
`home-page.tsx` is correct, it is correct.

---

## Phase 2: Decide the scope

1. If the user passed a path (e.g. `/chief-structure-review src/components`), audit only that path.
2. If the user said "whole repo", "everything", or "full", audit all tracked source files.
3. Otherwise, audit the files changed on this branch against the base branch
   detected above, **plus** the sibling files in every folder those changes touch
   (a new file can only break a folder's convention in context).

```bash
git diff --name-only --diff-filter=AMR origin/<base>...HEAD 2>/dev/null
git ls-files | grep -vE '(^|/)(node_modules|vendor|dist|build|\.next|target|coverage|__pycache__)/' | head -2000
```

Always skip generated, vendored, lock, and build-output files. If the scope is
over ~500 source files, tell the user the count and ask via AskUserQuestion
whether to narrow it to a folder or continue.

---

## Phase 3: Naming & structure audit

Walk the file tree in scope and check every file and folder against the merged
conventions from Phase 1. Use `git ls-files` and Glob for names; Read or Grep for
exports.

**Framework-reserved names are never violations.** Do not flag names the
framework or language requires: `page.tsx`, `layout.tsx`, `route.ts`,
`loading.tsx`, `_app.tsx`, `_document.tsx`, `[slug].tsx`, `(group)/`,
`+page.svelte`, `index.*` barrels, `__init__.py`, `main.go`, `mod.rs`, `lib.rs`,
`manage.py`, `Dockerfile`, `Makefile`, and similar.

**Route-changing renames are high risk.** In file-based routers (Next.js
`pages/` or `app/`, Remix, Nuxt, SvelteKit, Astro, Expo Router), renaming
`pages/home-page.tsx` to `pages/home.tsx` changes the URL from `/home-page` to
`/home`. Still flag it, but mark the fix as **ROUTE CHANGE** and include the
redirect or link updates the fix needs.

To check one-primary-export-per-file (S1/S2), count top-level exported
components, classes, or public types per file:

```bash
# JS/TS: exported declarations per file (rough signal — confirm by reading the file)
grep -cE "^export (default )?(function|const|class) [A-Z]" <file>
# Python: public top-level classes per file
grep -cE "^class [A-Z]" <file>
```

Treat grep counts as leads, not verdicts. Read the file before reporting it.
Co-located private helpers, prop types, and styled wrappers used only by the
primary export are fine.

---

## Phase 4: SOLID audit

Read the non-trivial source files in scope: classes, services, modules over ~100
lines, and components with logic beyond rendering. For each principle, look for
the concrete signals below. Apply them in the language's own idiom. In
functional or component-based code, "class" means module, component, or hook.

| Principle | What a violation looks like |
|-----------|-----------------------------|
| **S — Single Responsibility** | One unit does several unrelated jobs, e.g. a React component that fetches data, transforms it, manages form state, *and* renders. The test: can you describe it without "and"? Also: files over ~300 lines, or functions over ~50 lines, doing several things. |
| **O — Open/Closed** | Adding a new variant means editing a growing `switch`/`if-else` on a type string in several places, instead of adding a new implementation, map entry, or strategy. |
| **L — Liskov Substitution** | A subclass or implementation throws `NotImplemented`, silently no-ops an inherited method, narrows accepted inputs, or callers `instanceof`-check to special-case it. |
| **I — Interface Segregation** | Large interfaces, prop types, or base classes where most implementers or callers use only a few members. Components taking 15+ props, or a `config` object threaded everywhere but read for one field. |
| **D — Dependency Inversion** | High-level logic directly constructs or imports concrete infrastructure (DB clients, `fetch`, SDKs, `new Date()`, env reads) deep inside business logic, making it untestable without the real thing. |

**Calibrate.** SOLID is a set of heuristics, not a law. Do not flag a 40-line
script for missing dependency injection, and do not suggest an abstraction that
has only one implementation and no second one coming. Every SOLID finding must
name the concrete cost: *what is hard to change, test, or read today because of
it.* If you cannot name a cost, drop the finding.

---

## Phase 5: Write the plan and present it

Write the plan file with the structure below, then call **ExitPlanMode** so the
user can review and approve it. Keep findings ordered by severity, then by path.

**Severity:**
- **HIGH:** actively misleading or bug-prone. A file name contradicts its contents, several components are tangled in one file, or a SOLID violation already causes duplication or untestable code.
- **MEDIUM:** a clear convention violation that slows readers down (N1–N5, S2–S4).
- **LOW:** style drift or a judgment call. Mark these *optional*.

````markdown
# Structure Review — <branch or path>

Conventions source: <CHIEF.md / CLAUDE.md / linter / built-in defaults + majority pattern>
Scope: <N files in M folders — diff vs <base> | path | full repo>

## Summary
| Category              | HIGH | MEDIUM | LOW |
|-----------------------|------|--------|-----|
| Naming                |      |        |     |
| One-thing-per-file    |      |        |     |
| Structure             |      |        |     |
| SOLID                 |      |        |     |

## Findings

### 1. [HIGH] [S1] `src/components/Button.tsx` exports 3 components
**Problem:** `Button`, `IconButton`, and `ButtonGroup` all live in one file, so
readers looking for `IconButton` won't find it by path.
**Planned fix:** Move `IconButton` → `src/components/IconButton.tsx` and
`ButtonGroup` → `src/components/ButtonGroup.tsx`; update 7 imports (listed below).

### 2. [MEDIUM] [N1] `src/pages/home-page.tsx` — redundant folder suffix  ⚠ ROUTE CHANGE
**Problem:** Inside `pages/`, `-page` repeats what the folder already says.
**Planned fix:** `git mv` → `src/pages/home.tsx`. The route changes from
`/home-page` to `/home`: update 2 internal links and add a redirect.

### 3. [MEDIUM] [SOLID-D] `src/services/order.ts:42` constructs its own DB client
**Problem:** `createOrder` calls `new PgClient()` inline, so it can't be tested
without a real database.
**Planned fix:** Accept the client as a parameter, and construct it once in
`src/server.ts`.

## Rename map
| From | To | Imports to update |
|------|----|-------------------|

## Execution order
1. Pure renames (`git mv`) + import updates: one commit per logical group
2. File splits (one-thing-per-file): one commit per split file
3. SOLID refactors: one commit each, tests run after each
4. Verify: typecheck, lint, and tests pass

## Not changing
<Anything flagged but deliberately left alone, with the reason: framework-reserved, project convention, or low value.>
````

Each finding must have: a severity, a rule ID, a `file:line` or path, a
one-sentence problem that names the cost, and a planned fix specific enough to
execute. List every import site a rename touches, found with Grep across the
whole repo, not just the scope.

If there are **zero findings**, say so plainly, name what you checked, skip
ExitPlanMode, and stop with status DONE.

---

## Phase 6: Execute the approved plan

Only after the user approves the plan:

1. **Honor edits to the plan.** If the user removed findings or said "only the
   HIGH ones", do exactly that.
2. **Renames:** use `git mv` so history follows the file. Then update every
   import, re-export, dynamic import, test mock path, and storybook reference.
   Grep for the old basename afterwards. Zero hits is the bar.
3. **Splits:** move each extra export into its own correctly named file, keep
   shared private helpers with the file that uses them most, and re-export from a
   barrel only if the project already uses barrels.
4. **SOLID refactors:** smallest change that removes the cost you named. No
   speculative abstractions.
5. **Commit in bisectable steps**, one logical change per commit, following the
   order in the plan. Renames go in separate commits from behavior changes.
6. **Verify** after each group: run the project's typecheck, lint, and test
   commands (read them from CLAUDE.md or CHIEF.md; if missing, ask once via
   AskUserQuestion and persist the answer to CLAUDE.md). If something breaks, fix
   it before moving to the next group. If a fix isn't obvious, revert that group
   and report it.
7. **Persist conventions:** if Phase 1 found no written conventions, ask via
   AskUserQuestion whether to save the rules this run enforced as a
   `## Structure conventions` section in CHIEF.md, so the next run (and every
   teammate) uses the same rules.

---

## Phase 7: Report

```
STRUCTURE REVIEW
════════════════════════════════════════
Scope:        [diff vs <base> | path | full repo] — N files
Conventions:  [source]
Findings:     X HIGH, Y MEDIUM, Z LOW
Fixed:        [count] — [commit SHAs]
Skipped:      [count] — [reason each]
Verification: [typecheck / lint / test output summary]
Status:       DONE | DONE_WITH_CONCERNS | BLOCKED
════════════════════════════════════════
```

---

## Important Rules

- **Plan before touching.** No rename, split, or refactor before the plan is approved.
- **Project conventions beat defaults.** Never "fix" a file into violating the project's own written rules.
- **Framework-reserved names are sacred.** `page.tsx`, `__init__.py`, `index.ts`, and similar are never violations.
- **Every SOLID finding names a cost.** No cost, no finding.
- **Never leave a dangling import.** After a rename, grep for the old path until zero hits remain.
- **Completion status:**
  - DONE: audit complete, and the approved fixes were applied and verified (or there was nothing to fix)
  - DONE_WITH_CONCERNS: fixes applied, but some could not be fully verified (no tests, route changes need manual QA)
  - BLOCKED: the plan was rejected, or verification failed and the changes were reverted
