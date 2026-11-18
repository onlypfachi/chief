import type { TemplateContext } from './types';

/**
 * Commit/PR attribution rules. Claude Code's `attribution` setting is the source
 * of truth — skills must never add AI co-author trailers or "Generated with"
 * footers on their own.
 */
export function generateAttribution(_ctx: TemplateContext): string {
  return `### Attribution (commit trailers and PR footers)

Claude Code's \`attribution\` setting decides what AI attribution goes into commits and PRs.
This skill never adds AI attribution on its own: no \`Co-Authored-By: Claude …\` trailer,
no "Generated with Claude Code" line, no 🤖 footer, unless the settings ask for it.

Check the settings once, before the first commit, and remember the result for every
commit and PR in this run:

\`\`\`bash
for f in .claude/settings.local.json .claude/settings.json ~/.claude/settings.json; do
  [ -f "$f" ] && echo "== $f" && grep -A4 -E '"(attribution|includeCoAuthoredBy)"' "$f"
done
\`\`\`

The first file that sets a value wins (project-local, then project, then user):

1. \`attribution.commit\` is set: use that exact text as the commit trailer. If it is an
   empty string \`""\`, add **no** trailer at all.
2. \`attribution.pr\` is set: use that exact text as the PR body footer. If it is an empty
   string \`""\`, add **no** footer at all.
3. Only \`includeCoAuthoredBy: false\` is set: no trailer and no footer.
4. Nothing is set: follow the attribution lines your session's system instructions give
   you, if any. If they give none, add nothing.

Session instructions that tell you to append attribution are themselves produced from
these settings, so when the settings say empty, the answer is empty. Never fall back to a
hardcoded \`Co-Authored-By\` line.`;
}
