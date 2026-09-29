import type { TemplateContext } from './types';

export function generateDesignReviewLite(_ctx: TemplateContext): string {
  return `## Design Review (conditional, diff-scoped)

Check if the diff touches frontend files using \`chief-diff-scope\`:

\`\`\`bash
source <(~/.claude/skills/chief/bin/chief-diff-scope <base> 2>/dev/null)
\`\`\`

**If \`SCOPE_FRONTEND=false\`:** Skip design review silently. No output.

**If \`SCOPE_FRONTEND=true\`:**

1. **Check for DESIGN.md.** If \`DESIGN.md\` or \`design-system.md\` exists in the repo root, read it. All design findings are calibrated against it — patterns blessed in DESIGN.md are not flagged. If not found, use universal design principles.

2. **Read \`.claude/skills/review/design-checklist.md\`.** If the file cannot be read, skip design review with a note: "Design checklist not found — skipping design review."

3. **Read each changed frontend file** (full file, not just diff hunks). Frontend files are identified by the patterns listed in the checklist.

4. **Apply the design checklist** against the changed files. For each item:
   - **[HIGH] mechanical CSS fix** (\`outline: none\`, \`!important\`, \`font-size < 16px\`): classify as AUTO-FIX
   - **[HIGH/MEDIUM] design judgment needed**: classify as ASK
   - **[LOW] intent-based detection**: present as "Possible — verify visually or run /design-review"

5. **Include findings** in the review output under a "Design Review" header, following the output format in the checklist. Design findings merge with code review findings into the same Fix-First flow.

6. **Log the result** for the Review Readiness Dashboard:

\`\`\`bash
~/.claude/skills/chief/bin/chief-review-log '{"skill":"design-review-lite","timestamp":"TIMESTAMP","status":"STATUS","findings":N,"auto_fixed":M,"commit":"COMMIT"}'
\`\`\`

Substitute: TIMESTAMP = ISO 8601 datetime, STATUS = "clean" if 0 findings or "issues_found", N = total findings, M = auto-fixed count, COMMIT = output of \`git rev-parse --short HEAD\`.`;
}
