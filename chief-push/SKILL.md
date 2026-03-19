---
name: chief-push
version: 1.0.0
description: |
  Pre-push quality gate. Scans changed files for debug statements, runs lint,
  runs tests, checks branch setup, commits with conventional commit format,
  then pushes. Every step must pass before moving to the next. Dev approves
  the commit message and the final push before anything leaves local.
  Use when the developer wants to commit and push their work. Suggest when
  the developer says "push my changes", "commit and push", "ship this", or
  "I'm done with this feature".
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
  - Write
  - Edit
  - AskUserQuestion
---

# /chief-push — Commit & Push

Chief runs your code through every quality gate before anything leaves your machine.
Seven phases. All must pass. Dev approves the version bump, the commit, and the final push.

In Chief's voice at the start:
> "Alright, let's get this pushed. I'm gonna run through the checklist first —
> debug statements, lint, tests, branch setup, version bump — then we'll do the
> commit and push together. Shouldn't take long."

---

## Phase 0: Get the Lay of the Land

```bash
# What's changed
git status --porcelain
git diff --name-only HEAD 2>/dev/null
git diff --cached --name-only 2>/dev/null

# Current branch and upstream
git branch --show-current
git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null && echo "HAS_UPSTREAM:yes" || echo "HAS_UPSTREAM:no"

# Developer identity
git config user.name
git config user.email

# Read CHIEF.md for stack context if it exists
[ -f CHIEF.md ] && echo "CHIEF_CONTEXT:yes" || echo "CHIEF_CONTEXT:no"
```

Collect: list of changed files, current branch name, upstream status, developer name.
If CHIEF.md exists, read it for stack context (used for lint suggestion in Phase 2).

---

## Phase 1: Debug Statement Scan

Scan **only the changed files** for debug statements that should not go to production.

```bash
# Get the exact list of changed files (staged + unstaged, exclude deleted)
git diff --name-only HEAD 2>/dev/null
git diff --cached --name-only 2>/dev/null
git ls-files --others --exclude-standard 2>/dev/null
```

For each changed file, scan for these patterns based on file type:

**JavaScript / TypeScript (`.js`, `.ts`, `.jsx`, `.tsx`, `.mjs`):**
```bash
grep -n "console\.log\|console\.debug\|console\.warn\|console\.error\|console\.info\|debugger\s*;" <file>
```

**PHP / Laravel (`.php`):**
```bash
grep -n "\bdd(\|dump(\|var_dump(\|print_r(\|ray(" <file>
```

**Python (`.py`):**
```bash
grep -n "breakpoint()\|pdb\.set_trace()\|ipdb\.set_trace()\|import pdb\|import ipdb" <file>
# Also flag bare print() calls if not in a script context (main block)
grep -n "^\s*print(" <file>
```

**Ruby (`.rb`):**
```bash
grep -n "\bbinding\.pry\b\|\bbyebug\b\|\brequire ['\"]pry['\"]" <file>
# Also flag debugging pp/p calls
grep -n "^\s*\bpp\b\|^\s*\bp\b " <file>
```

**Go (`.go`):**
```bash
grep -n "fmt\.Println\|fmt\.Printf\|fmt\.Print\|log\.Print" <file>
# Only flag in non-main packages — ask if it's intentional
```

**Rust (`.rs`):**
```bash
grep -n "\bdbg!(" <file>
```

**All files — universal flags:**
```bash
grep -n "TODO\|FIXME\|HACK\|XXX\|TEMP\|REMOVEME\|DO NOT COMMIT" <file>
```

**If debug statements are found:**

Show them clearly — file, line number, the actual line:
```
Found debug statements in changed files:

src/auth/login.ts:42    console.log('user object:', user)
src/auth/login.ts:87    debugger;
src/utils/helpers.py:15  print(response.json())
```

Then ask via AskUserQuestion in Chief's voice:
> "Found [N] debug statement(s) in your changed files. These shouldn't go to production.
>
> A) Remove them for me — I'll clean them up now
> B) I'll remove them myself — pause while I do it
> C) Keep [specific ones] — they're intentional (tell me which)
>
> RECOMMENDATION: Choose A — takes 10 seconds and keeps the history clean."

If A: remove them, show what was removed, confirm with the developer.
If B: wait. When the developer says "done", re-run the scan to confirm they're gone.
If C: mark the flagged lines as intentional and skip them in future checks. Continue.

**If no debug statements found:**
> "No debug statements. Clean." → proceed to Phase 2.

---

## Phase 2: Lint

Check if the project has a linter configured.

```bash
# JavaScript / TypeScript
ls eslint.config.* .eslintrc .eslintrc.js .eslintrc.json .eslintrc.yml .eslintrc.yaml 2>/dev/null
ls biome.json 2>/dev/null

# Python
ls .flake8 .pylintrc pyproject.toml setup.cfg 2>/dev/null | xargs grep -l "flake8\|pylint\|ruff" 2>/dev/null

# Ruby
ls .rubocop.yml .rubocop.json 2>/dev/null

# Go
which golangci-lint 2>/dev/null

# Rust
# Clippy is built-in, check if it's configured
ls clippy.toml .clippy.toml 2>/dev/null
```

### If linter found — run it on changed files only

Get the list of changed files and run the linter scoped to them where possible:

**ESLint:**
```bash
npx eslint --no-eslintrc -c .eslintrc* $(git diff --name-only HEAD | grep -E '\.(js|ts|jsx|tsx)$' | tr '\n' ' ')
# Or with config detection:
npx eslint $(git diff --name-only HEAD | grep -E '\.(js|ts|jsx|tsx)$' | tr '\n' ' ')
```

**Biome:**
```bash
npx biome check $(git diff --name-only HEAD | tr '\n' ' ')
```

**Ruff (Python):**
```bash
ruff check $(git diff --name-only HEAD | grep '\.py$' | tr '\n' ' ')
```

**Rubocop:**
```bash
bundle exec rubocop $(git diff --name-only HEAD | grep '\.rb$' | tr '\n' ' ')
```

**Go:**
```bash
golangci-lint run $(git diff --name-only HEAD | grep '\.go$' | tr '\n' ' ')
```

**Clippy (Rust):**
```bash
cargo clippy 2>&1
```

**If lint passes:** > "Lint clean." → proceed to Phase 3.

**If lint has auto-fixable errors:**
> "Lint found [N] issues — [M] can be auto-fixed.
> A) Fix them — run the auto-fixer now
> B) Show me the errors — I want to fix them myself
> RECOMMENDATION: Choose A."

If A: run the auto-fixer (`--fix`, `--write`, `rubocop -A`, etc.), show the diff, continue.
If B: show all errors with file:line, wait for developer to fix, re-run lint to confirm clean.

**If lint has errors that can't be auto-fixed:**
Show them clearly. Chief does NOT push with lint errors.
> "These need to be fixed manually before we can push. Fix them and run `/chief-push` again."
STOP.

---

### If NO linter found — suggest one

Chief does not push without a linter check. Suggest the right one based on the stack.

**Suggest based on detected stack** (from CHIEF.md or file detection):

| Stack | Recommendation | Why |
|-------|---------------|-----|
| TypeScript / Next.js | ESLint + `@typescript-eslint` + Prettier | Industry standard, best TS support |
| JavaScript (Node API) | ESLint + `eslint-config-node` | Standard for Node projects |
| JavaScript (React SPA) | ESLint + `eslint-plugin-react` + Prettier | Standard for React |
| Python | Ruff | Fastest, modern, replaces flake8+isort+black in one tool |
| Ruby / Rails | RuboCop | The standard, no competition |
| Go | golangci-lint | Wraps all major Go linters |
| Rust | Clippy (built-in) | Ships with Rust, just needs enabling |
| PHP | PHP_CodeSniffer or PHP-CS-Fixer | PSR-12 compliance |

Ask via AskUserQuestion:
> "No linter found. I'd recommend [tool] for this stack — [one sentence why].
>
> A) Set it up now — I'll install and configure it, then lint the changes
> B) Skip lint this time — I know what I'm doing
> C) Use a different linter — tell me which one
>
> RECOMMENDATION: Choose A. Takes 2 minutes and every push after this is covered."

If A: install and configure the recommended linter, run it on the changed files, continue.
If B: skip lint, note it in the push summary. Continue.
If C: install and configure the developer's choice, run it, continue.

---

## Phase 3: Tests

Run the project's test suite.

```bash
# Read test command from CHIEF.md if available, or detect
[ -f CHIEF.md ] && grep -A2 "Testing\|Test command\|test:" CHIEF.md 2>/dev/null | head -5

# Detect test runner
[ -f package.json ] && cat package.json | grep -A3 '"test"' 2>/dev/null
[ -f .rspec ] && echo "RUNNER:rspec"
ls pytest.ini pyproject.toml 2>/dev/null | xargs grep -l "pytest" 2>/dev/null && echo "RUNNER:pytest"
[ -f go.mod ] && echo "RUNNER:go test"
[ -f Cargo.toml ] && echo "RUNNER:cargo test"
```

Run the full test suite. Stream output so the developer sees progress.

**If tests pass:**
> "Tests passed. ✓" → proceed to Phase 4.

**If tests fail:**
Show the failing tests clearly — test name, file, what failed.

Chief does NOT push with failing tests. Full stop.

> "Tests are failing. These need to be fixed before we push — broken tests in the
> repo are a problem for the whole team.
>
> A) Help me debug them — walk me through what's failing
> B) I'll fix them myself — pause and let me work
>
> RECOMMENDATION: Choose A — let's figure out what broke."

If A: dig into the failing tests, help the developer understand the failure (not fix the code —
use the coaching mode — explain what's failing and why, then let them fix it).
If B: wait. When the developer says "fixed", re-run tests. Don't proceed until green.

**If no test framework found:**
> "No tests detected. Pushing without tests is risky — especially for a team.
>
> A) Set up a test framework now (I'll suggest the right one)
> B) Push anyway — I know there are no tests
>
> RECOMMENDATION: Choose A. You can run `/chief-init` to get the full setup."

If A: hand off to the test bootstrap flow (same as in `/ship`) then continue.
If B: proceed, note "no tests" in the push summary.

---

## Phase 4: Branch Check

```bash
git branch --show-current
git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo "NO_UPSTREAM"
git config user.name
```

**Check 1: Is the developer on main/master?**

If the current branch is `main`, `master`, `develop`, or `trunk`:
> "Hold on — you're on `[branch]`. Pushing directly to [branch] is risky.
> For this kind of change I'd strongly suggest a feature branch.
>
> A) Create a feature branch now (I'll name it right)
> B) Push to [branch] anyway — I know what I'm doing
>
> RECOMMENDATION: Choose A."

If A: proceed to branch creation below.
If B: note it, continue.

**Check 2: Does the branch have an upstream?**

If `NO_UPSTREAM`:
> "This branch doesn't have an upstream yet. Need to create one before pushing.
> I'll set it up when we push: `git push -u origin [branch]`"

Note this — Chief will use `-u` flag on the push in Phase 6.

**Check 3: Does the branch name reflect the work?**

Look at the changed files and the diff. If the current branch name is generic
(`fix`, `update`, `changes`, `dev`, `test`, a ticket number with no description,
or clearly doesn't match the actual changes):

> "Branch name is `[name]` but looking at what you changed, this seems to be about
> [inferred topic]. Branch names should describe the work so the team knows what's in it.
>
> Suggested: `[developer-name]/[what-was-worked-on]`
>
> A) Rename to the suggested name
> B) Suggest a different name — tell me what to call it
> C) Keep `[current name]` — it's fine
>
> RECOMMENDATION: Choose A."

**Branch naming convention:**
```
[developer-name]/[what-the-developer-worked-on]
```
- `developer-name`: from `git config user.name`, lowercase, spaces → hyphens
  (e.g. "John Doe" → `john-doe`)
- `what-the-developer-worked-on`: inferred from the diff, present tense, kebab-case,
  short and descriptive (e.g. `add-user-authentication`, `fix-payment-timeout`,
  `refactor-api-error-handling`)

```bash
# Rename branch if approved
git branch -m [new-name]
```

---

## Phase 4.5: Version Bump

Ask via AskUserQuestion whether to bump the version before committing:

> "Want to bump the version?
>
> A) patch — bug fixes, small tweaks (e.g. 0.8.5 → 0.8.6)
> B) minor — new features, backwards-compatible (e.g. 0.8.5 → 0.9.0)
> C) major — breaking changes (e.g. 0.8.5 → 1.0.0)
> D) No bump — keep version as-is
>
> RECOMMENDATION: Choose A for most pushes. Choose D for docs/chore-only commits."

First, read the current version so the developer can see what they're bumping from:
```bash
cat VERSION 2>/dev/null || echo "no VERSION file"
```

If A, B, or C: run the bump script:
```bash
# Detect script location
_CHIEF_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
_BUMP_SCRIPT=""
[ -x "$_CHIEF_ROOT/bin/chief-bump-version" ] && _BUMP_SCRIPT="$_CHIEF_ROOT/bin/chief-bump-version"
[ -z "$_BUMP_SCRIPT" ] && [ -x "$HOME/.claude/skills/chief/bin/chief-bump-version" ] && _BUMP_SCRIPT="$HOME/.claude/skills/chief/bin/chief-bump-version"

# Run with the chosen bump type (patch / minor / major)
"$_BUMP_SCRIPT" <patch|minor|major>
```

Show the result: "Bumped to v[new version]." Then include `VERSION` and `package.json` in the files to be staged in Phase 5.

If D: skip, continue to Phase 5. Do not stage VERSION or package.json unless they were already changed.

---

## Phase 5: Commit

**Stage the changes:**

```bash
git status --porcelain
git diff --stat HEAD 2>/dev/null
```

Show the developer what's about to be staged:
```
Ready to commit:
  modified: src/auth/login.ts
  modified: src/utils/helpers.py
  new file: src/auth/types.ts
```

Ask if there are any files to exclude:
> "That everything going in, or do you want to leave anything out?"

If they want to exclude files: `git add` selectively, skip the excluded ones.
Otherwise: `git add` all changed files.

**Generate the commit message:**

Analyze the diff and generate a commit message following conventional commits format:

```
Format: <type>(<scope>): <subject>

Types:
  feat     — new feature for the user
  fix      — bug fix for the user
  docs     — changes to documentation only
  style    — formatting, missing semicolons (no logic change)
  refactor — refactoring code (no feature or bug change)
  test     — adding or fixing tests only
  chore    — build process, dependencies, tooling

Rules:
  - Subject in present tense ("add" not "added")
  - Subject lowercase, no period at end
  - Scope is optional — use it when the change is scoped to a specific module
  - Keep subject under 72 characters
  - If the change touches multiple types, pick the most significant one
```

Examples of good messages generated from diffs:
- `feat(auth): add JWT refresh token rotation`
- `fix(payments): handle timeout on Stripe webhook retry`
- `refactor(api): extract error handling into middleware`
- `test(auth): add coverage for login edge cases`
- `chore: upgrade Prisma to v5.8`

Present the suggested message in Chief's voice:
> "Here's the commit message I'd go with:
>
> `[generated message]`
>
> A) That's good — use it
> B) Edit it — I'll tweak the message
> C) Write my own — I'll give you the message
>
> RECOMMENDATION: Choose A unless you see something off."

Do NOT commit until the developer approves the message.

Once approved:
```bash
git commit -m "[approved message]"
```

Show the commit hash after it's made.

---

## Phase 6: Push

Present the final summary before pushing — this is the last checkpoint:

```
Ready to push:

  Branch:   [branch-name] → origin/[branch-name]
  Commit:   [hash] [commit message]
  Files:    [N] changed, [X] insertions, [Y] deletions

  Debug scan:  ✓ clean
  Lint:        ✓ passed (or "⚠ skipped")
  Tests:       ✓ [N] passed (or "⚠ no tests")
```

Ask via AskUserQuestion:
> "Everything looks good. Ready to push?
>
> A) Push it
> B) Hold on — I want to check something first"

If A:
```bash
# With upstream already set
git push

# If no upstream (first push of this branch)
git push -u origin $(git branch --show-current)
```

Show the push output. If push succeeds, Chief wraps up in its voice:
> "Pushed. You're live on [branch]. Nice work."

If push fails (rejected, conflicts, auth):
Show the error clearly. Help the developer understand what went wrong.
Common cases:
- Rejected (non-fast-forward): "Remote has commits you don't have — pull first, then push."
  Run `git pull --rebase` if approved.
- Auth failure: "Git credentials issue — check your SSH key or token."
- Protected branch: "This branch is protected — you'll need a PR instead of a direct push."

---

## Push Summary

After every run (success or failure), output a clean summary:

```
/chief-push summary
───────────────────────────────────────
Branch:      john-doe/add-user-auth
Commit:      a3f92b1 feat(auth): add JWT refresh token rotation
Files:       4 changed, 127 insertions, 12 deletions

Phase 1 — Debug scan:   ✓ 2 statements removed
Phase 2 — Lint:         ✓ 0 errors
Phase 3 — Tests:        ✓ 47 passed, 0 failed
Phase 4 — Branch:       ✓ upstream set
Phase 4.5 — Version:    ✓ bumped to v0.8.6 (or "⚠ skipped")
Phase 5 — Commit:       ✓ conventional commit
Phase 6 — Push:         ✓ pushed to origin

Status: DONE
───────────────────────────────────────
```

---

## Important Rules

- **Never push with failing tests.** Tests failing = the code is broken. Full stop.
- **Never push with lint errors.** Lint errors = the code doesn't meet the project standard.
- **Never skip the debug scan.** `console.log` in production is embarrassing at best,
  a security issue at worst.
- **Dev approves the commit message.** Always. No silent commits.
- **Dev approves the final push.** Always. The push summary is the last checkpoint.
- **Plan First rule applies here.** Before starting, Chief states what it's about to do:
  "I'm going to scan for debug statements, run lint, run tests, check your branch,
  then commit and push. Sound good?" Then waits for the green light.
- **Each phase is a hard gate.** A failure in any phase stops everything. No skipping
  ahead to commit anyway.
