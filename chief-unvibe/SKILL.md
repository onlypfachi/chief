---
name: chief-unvibe
version: 1.0.0
description: |
  Strip the "AI-vibecoded slop" look out of a UI and rebuild it as something a
  real designer would ship. Greps the source for the tells of machine-generated
  pages (purple gradients, glassmorphism, glow halos, three-up card grids, bento
  grids, gradient text, Inter/Geist, eyebrow labels, pulsing dots, em-dash copy,
  SaaS buzzwords, fake testimonials) and the newer "tasteful" defaults that are
  now slop too (cream backgrounds, oversized italic serif heroes, Instrument
  Serif, pill chips). Replaces them with specific, earned design choices and
  checks a craft floor (contrast, line length, line height, spacing rhythm).
  Use when asked to "unvibe", "unvibecode this", "make this not look
  AI-generated", "remove the vibecoded slop", "de-slop this UI", "make it look
  like a real designer made it", or "this looks too AI, fix it".
  Proactively suggest when a UI you are building or reviewing shows several of
  these tells, especially a freshly generated landing page.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - AskUserQuestion
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
echo '{"skill":"chief-unvibe","ts":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","repo":"'$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || echo "unknown")'"}'  >> ~/.chief/analytics/skill-usage.jsonl 2>/dev/null || true
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

# /chief-unvibe: De-slop a Vibecoded UI

Take a UI that screams "an AI generated this in one shot" and turn it into
something that looks like a human designer with taste made deliberate choices.
The goal is not more polish on top. It is to **remove the generic tells** and
replace them with restraint, intention, and a point of view.

Vibecoded slop all looks the same because the model reaches for the same
defaults every time. Your job is to notice those defaults in the current code
and consciously choose against them.

> Detection catalog distilled from **impeccable.style/slop** (an anti-slop
> design reviewer). The tells below are the concrete, recurring signatures of
> generated UI. Grep the source for them.

---

## The trap that matters most: second-generation slop

The slop defaults moved. The first wave was purple gradients, pure white, Inter,
drop-shadow-on-everything. So everyone "fixed" it the same way, and **the fixes
became the new slop.** These now read as AI-by-reflex just as loudly as the
originals:

- **Cream / warm-beige page backgrounds** (`#faf7f0`-ish): the default "tasteful" AI surface now.
- **Oversized italic serif hero headlines**, especially **Instrument Serif**. "Taste in isolation," the universal AI-startup hero.
- **Off-white `#fafaf9`/`#f5f5f4` as a reflex**: better than `#fff`, but still a default if reached for without a reason.
- **A generic "characterful" serif** dropped in to signal editorial trust.

The lesson: **there is no safe default to swap in.** Un-slopping is not trading
one default palette or font for a nicer default palette or font. That just moves
you one generation down the same tell. The fix is always a *specific, earned
choice for this particular product*, committed to consistently. Cream and italic
serif are fine **iff** this product genuinely calls for them and the rest of the
design commits, not because they are the current "tasteful" reach. If you can't
say *why this product* wants that exact choice, it's still slop.

---

## Step 0: Scope and context

1. **Find the UI.** If the user named files, pages, or a route, use those.
   Otherwise Glob for the UI source (HTML, CSS, JSX/TSX, Vue, Svelte, Tailwind
   config, Flutter widgets, whatever the project uses) and pick the pages the
   user most likely means: the landing page and any top-level marketing or app
   shell. If it's ambiguous, ask once via AskUserQuestion which pages are in scope.
2. **Read the product.** Skim README, CHIEF.md, and the page copy so you can say
   what this product is and who it is for. Every replacement choice in Step 2
   must be justified against that.
3. **Respect an existing design system.** If `DESIGN.md` exists (for example
   from /design-consultation), it is the source of truth. Values outside it are
   tells; values inside it are not slop by definition, even if they appear in
   the catalog below. If DESIGN.md itself prescribes catalog tells, flag that in
   the report instead of silently overriding it.
4. **Know how to run it.** Find the build/dev command in CLAUDE.md or CHIEF.md.
   If missing, ask once via AskUserQuestion and persist the answer to CLAUDE.md.
   If a dev server can run, take a before screenshot with `$B screenshot` so
   the report can show before/after. Set up the browse binary first:

## SETUP (run this check BEFORE any browse command)

```bash
_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
B=""
[ -n "$_ROOT" ] && [ -x "$_ROOT/.claude/skills/chief/browse/dist/browse" ] && B="$_ROOT/.claude/skills/chief/browse/dist/browse"
[ -z "$B" ] && B=~/.claude/skills/chief/browse/dist/browse
if [ -x "$B" ]; then
  echo "READY: $B"
else
  echo "NEEDS_SETUP"
fi
```

If `NEEDS_SETUP`:
1. Tell the user: "chief browse needs a one-time build (~10 seconds). OK to proceed?" Then STOP and wait.
2. Run: `cd <SKILL_DIR> && ./setup`
3. If `bun` is not installed: `curl -fsSL https://bun.sh/install | bash`

If no dev server can run, skip the screenshots and work from source alone.

---

## Step 1: Detect the slop. Grep the source, inventory the tells

Read the actual markup and styles. Don't guess from a screenshot; grep the
source. Record every tell you find with `file:line` so the user sees exactly
what is getting removed.

### Color & contrast
- Purple/violet gradients; cyan-on-dark. The most recognizable palette tell.
- Radial-gradient **background halo** / faint **spotlight glow** behind a section on a dark page.
- Dark mode with **colored `box-shadow` glows**: the default "cool" AI look.
- **Gradient text**: decorative, not meaningful; especially on headings and metrics.
- Pure `#fff` or pure `#000` backgrounds.
- **Cream/beige** background reached for as "tasteful" (see the second-gen trap above).
- Rainbow/neon color-coding; flat pastel palettes; purple-and-black as the whole identity.

### Visual / surface
- **Side-tab accent border**: thick colored border on one side of a card. *The* most recognizable tell of generated UIs.
- **Border accent clashing with rounded corners**: thick accent border on a rounded card.
- **Hairline border + wide diffuse shadow** together: a recurring generated signature.
- Drop shadows on *everything*: every card, button, input, div.
- **Extreme border-radius**: 24px+ on a small card; over-rounded sections and inputs.
- Glassmorphism / "liquid glass" / frosted `backdrop-filter: blur` as decoration.
- **Repeating-gradient stripes** as surface decoration.
- **Dot grids / grid-line backgrounds** covering a surface that isn't a canvas, map, or measure.
- Radial orbs / blurred gradient blobs floating in the background; colored top accent stripe.
- Fake terminal / code-window mockups standing in for a real demo.

### Layout & space
- **Identical card grids**: same-sized icon+heading+text cards repeated endlessly. The default AI homepage.
- **Three feature cards in a row**; bento grids.
- **Nested cards**: cards inside cards; excessive depth and noise.
- **Hero-metric layout**: big number, small label, three supporting stats, gradient accent.
- **Tiny numbered section labels** ("01 / 02 / 03") imitating editorial structure.
- **Monotonous spacing**: one spacing value everywhere; no rhythm, no variation.

### Typography
- **Overused fonts**: Inter, Geist, Space Grotesk, and now **Instrument Serif**.
- **Single font for the whole page**: no display/body pairing.
- **Oversized italic serif hero headline** (second-gen tell).
- **Oversized hero headline**: full-sentence display size dominating the fold.
- **Eyebrow / kicker**: tracked uppercase label above a heading, borrowing editorial authority; same shape as a **pill chip** above the hero.
- **Icon tile above heading**: small rounded-square icon container stacked over a heading. The universal feature-card template.
- **Flat type hierarchy**: sizes too close together, no clear hierarchy.
- **Crushed letter-spacing**: tracking so tight characters lose their shapes.
- Emojis in headings, bullets, and buttons; ✨/sparkle and loose decorative icons floating beside text.

### Motion
- **Pulsing status dot**: decorative pulse making static status look live.
- **Fake blinking cursor**: a caret making non-editable hero copy look like a terminal.
- **Auto-scrolling marquee**: continuous scroll that demands attention and hides content.
- **Bounce / elastic easing** on UI elements: dated and tacky.
- **Image hover transform**: scale/rotate on hover.
- Hover animations on *every* element.

### Copy / text
- **Em-dash overuse**: more than a couple in body copy is an AI cadence tell.
- **SaaS buzzwords**: streamline, empower, supercharge, world-class, enterprise-grade.
- **"It's not X, it's Y" / "Not just X. Y."** manufactured-contrast aphorisms.
- **Aphoristic cadence**: sections landing on a short rebuttal that reads as cadence, not voice.
- **"Theater" framing**: dismissing something as "theater" is a recurring generated tic.
- Checkmark (✓) bullet lists; generic filler headlines ("Supercharge your workflow", "The future of X").

### Imagery
- **Shape-assembled illustration**: hero art from generic SVG shapes; reads as placeholder clip art.
- **Amateur hand-drawn SVG**: hand-coded scene/mascot doodles.

### Missing legitimacy
- Three pricing tiers (Free / Pro / Enterprise), always three.
- Fabricated testimonials: invented names, roles, avatars.
- No real product demo (mockups of nothing); no ToS / Privacy links; lorem-grade placeholder copy.

### Grep starting points

These catch most tells fast. Adapt the globs to the project's file types, and
read each hit in context before counting it (a dot grid on an actual map is fine).

```bash
# Gradients, glows, glass, blobs
grep -rnE "linear-gradient|radial-gradient|repeating-(linear|radial)-gradient|bg-gradient-|from-(purple|violet|indigo|fuchsia)|to-(cyan|sky|blue)|bg-clip-text|text-transparent|backdrop-filter|backdrop-blur|blur-3xl" --include=*.{css,scss,html,jsx,tsx,vue,svelte} . | grep -v node_modules | head -60
# Shadows, radius, side-tab borders
grep -rnE "box-shadow|shadow-(lg|xl|2xl)|rounded-(2xl|3xl|full)|border-radius: *(2[4-9]|[3-9][0-9])px|border-l-[48]|border-left: *[3-9]px" --include=*.{css,scss,html,jsx,tsx,vue,svelte} . | grep -v node_modules | head -60
# Fonts
grep -rnEi "Inter|Geist|Space Grotesk|Instrument Serif" --include=*.{css,scss,html,jsx,tsx,vue,svelte,js,ts} . | grep -v node_modules | head -30
# Motion tells
grep -rnE "animate-(pulse|bounce|ping)|marquee|cubic-bezier\([^)]*-|hover:scale|scale-1[01][05]|@keyframes (blink|pulse|bounce)" --include=*.{css,scss,html,jsx,tsx,vue,svelte} . | grep -v node_modules | head -40
# Copy tells
grep -rnEi "streamline|empower|supercharge|world-class|enterprise-grade|seamless|theater|it's not .* it's|not just" --include=*.{html,jsx,tsx,vue,svelte,md,mdx,json} . | grep -v node_modules | head -40
grep -rnc "—" --include=*.{html,jsx,tsx,vue,svelte,mdx} . | grep -v node_modules | grep -v ":0$"
```

### Checkpoint: confirm the direction before rewriting

Present the inventory grouped by category, with counts and `file:line` for each
hit, plus the design direction you propose for Step 4 and one sentence on why it
fits this product. Then ask via AskUserQuestion: proceed with this direction,
pick a different direction, or limit the pass to certain categories (for
example "copy only" or "leave the fonts"). Honor the answer exactly.

Skip the checkpoint only when running under /chief-cook or when the user already
said to go ahead without asking.

If you found **zero tells**, say so plainly, name what you checked, still run
the Step 3 craft floor, and stop.

---

## Step 2: Replace, don't just delete, with an *earned* choice, not a new default

Removing tells leaves holes. Fill them with intentional choices a real designer
makes, and remember the second-gen trap: **do not swap one default for a nicer
default.** Every choice below must be justifiable for *this specific product*.

- **Color.** Drop the gradient-and-neon palette. Choose a restrained palette *for this product* and be able to say why. A near-neutral background that isn't pure white is fine, but pick the specific neutral on purpose (and don't default to cream because it's the current tasteful reflex). One or two disciplined accents. Real WCAG AA contrast (4.5:1 body, 3:1 large). Kill gradient text; kill dark-mode neon glows.
- **Type.** Swap Inter/Geist/Space Grotesk/Instrument Serif for a typeface with character that suits *this* product, and **pair a distinctive display face with a refined body face** rather than running one font for everything. If you reach for an italic serif hero, that's a red flag: stop and ask whether the product earns it or you're just doing the AI-startup move. Build a genuine type scale with real steps (not everything crammed at 16/24/48). Remove emojis from headings and buttons; if icons are needed, one consistent purposeful set, no floating sparkles. Kill the eyebrow/kicker/pill-chip and the icon-tile-above-heading templates.
- **Depth.** Remove blanket drop shadows and the hairline-border-plus-wide-shadow combo. Use one considered separation method (a hairline border *or* a background-tone step *or* a single shadow layer) and only where elevation is meaningful (menu, modal). Never the side-tab accent border. Tighten radius to one intentional, consistent value (often 4–8px, or genuinely sharp), not 24px+ on small cards.
- **Layout.** Break the identical-card / three-up / bento / nested-card symmetry. Real whitespace, a considered grid, and content that varies in size because the *content* varies, not to fill a template. Delete orbs, dot grids, stripes, spotlight halos, numbered eyebrow labels, and the big-number hero-metric block. Establish a **spacing rhythm** (varied, related steps) instead of one value everywhere.
- **Copy.** Rewrite filler into specific, concrete, honest claims about what the thing does. Cut em dashes to normal usage, kill the "not X, it's Y" and "theater" tics and the streamline/empower/supercharge buzzwords, replace ✓-bullets with prose or a real list, and remove fabricated testimonials (use real ones the user provides, or drop the section; never invent people).
- **Motion.** Remove hover-everything, pulsing dots, fake carets, marquees, bounce/elastic easing, and image hover-scale. Keep motion only where it communicates state (loading, view transitions); animate `transform`/`opacity`, never `width`/`height`/`padding`/`margin` (layout thrash). Add real skeleton/loading states where data is fetched. Motion felt, not noticed. For a live visual pass afterwards, suggest /design-review.
- **Legitimacy.** Real ToS / Privacy links (stubs the user fills); replace fake demos with a real screenshot/recording or an honest "coming soon", never a fake terminal pretending to be the product.

---

## Step 3: Craft floor. The checkable rules a designer wouldn't miss

De-slopping isn't only removing tells; it's meeting a baseline of craft. Verify
these concrete rules, since "make it good" is unfalsifiable and these aren't:

- **Contrast** ≥ 4.5:1 body / 3:1 large text (WCAG AA). No gray text on colored backgrounds.
- **Body text** ≥ 14px (16 ideal); functional/label text ≥ 11px. Nothing tiny.
- **Line-height** 1.5–1.7 for body (never < 1.3). **Line length** ≤ ~80 characters.
- **Letter-spacing** on body ≤ 0.05em; don't crush display tracking past legibility.
- **Padding** ≥ 8px (ideally 12–16) inside containers; body text never flush to the viewport edge.
- No **justified** text without hyphenation (rivers of white). No **all-caps** long passages.
- **Heading hierarchy** doesn't skip levels (no h1→h3). Headings sit closer to their own content than the previous block.
- No content **overflowing** its container or clipped by an `overflow:hidden` ancestor (tooltips, menus). No content left **invisible at rest** by reveal-on-scroll code. No **uncaught script error** on load.

When a dev server is running, check the last three in the browser with `$B`
(`$B console --errors`, `$B responsive`) rather than by reading code alone.

---

## Step 4: Rebuild with a point of view

The difference between slop and design is that design makes *choices*. Pick a
direction and commit (editorial, brutalist, quiet/Swiss, warm/human, technical,
whatever genuinely fits) and make every element consistent with it. A cohesive
opinionated look beats a "safe" generic one every time. This is what actually
beats second-generation slop: not a better default, but genuine commitment to a
specific idea.

Keep the product's function and content intact. You are re-skinning,
re-typesetting, and rewriting copy, not rebuilding the app's logic. Behavior
works exactly as before.

**Commit in bisectable steps**, one logical change per commit, for example:
design tokens (palette, type scale, radius, spacing), then typography, then
surfaces and depth, then layout, then motion, then copy. Each commit should
build on its own and be revertable without breaking the next.

**Optional but powerful: a DESIGN.md.** If the project has none, offer via
AskUserQuestion to write the chosen system down: the exact type scale (every
step), the exact palette (every literal color), the shape/radius scale, the
spacing steps. Then treat **any value outside the documented system as a tell**:
a font not in the scale, a color not in the palette, a radius off the scale, a
size falling between steps. This is how a real design system keeps slop from
creeping back. The discipline is the doc, and every value has to be *in* it or it
doesn't ship. (For a fuller system with research and previews, suggest
/design-consultation.)

---

## Step 5: Show the before/after

```
UNVIBE REPORT
════════════════════════════════════════
Scope:       [pages/files] — N files
Direction:   [chosen direction] — why it fits this product
Removed:     X tells (Y second-gen) across [categories]
Craft floor: [pass/fail per rule]
Placeholders:[real testimonials, ToS/Privacy, demo asset, ...]
Build:       [command + result]
Commits:     [SHAs]
Status:      DONE | DONE_WITH_CONCERNS | BLOCKED
════════════════════════════════════════
```

Below the block, include:

- The Step 1 inventory, ticked off: which slop signals you removed (including any second-gen ones), and any you deliberately kept, with the reason.
- The design **direction** you chose and *why it fits this product* (not "it looks nicer").
- Any placeholders left for the user (real testimonials, ToS/Privacy content, real demo asset).
- The Step 3 craft rules verified.
- Before/after screenshots if you took them in Step 0.
- Confirmation that it still builds and the UI still works after the reskin.

The measure of success: someone can't tell an AI made it, because the choices
are specific, restrained, intentional, and committed, not the same defaults
(first- *or* second-generation) that every generated page reaches for.

---

## Important Rules

- **Grep, don't guess.** Every tell in the inventory has a `file:line`.
- **No new defaults.** Every replacement is justified against this product, in one sentence. "Looks nicer" is not a reason.
- **Never invent people.** Fabricated testimonials are removed, never rewritten into new fabrications.
- **Behavior is untouchable.** Re-skin and rewrite copy; don't change logic, routes, or data flow.
- **DESIGN.md wins.** If one exists, it is the system. Flag conflicts with this catalog; don't override silently.
- **Completion status:**
  - DONE: tells removed, craft floor met, and the build passes
  - DONE_WITH_CONCERNS: done, but placeholders remain or some craft rules could not be verified (no dev server, no build)
  - BLOCKED: the user rejected the direction, or the build broke and the changes were reverted
