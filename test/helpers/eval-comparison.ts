/**
 * Eval run comparison — matches tests between two runs by name, computes
 * pass/fail, cost, duration, and tool-usage deltas, and formats the result.
 *
 * Used by EvalCollector (auto-compare after each run) and the eval:compare CLI.
 */

import type { EvalResult, EvalTestEntry } from './eval-store';

// --- Interfaces ---

export interface TestDelta {
  name: string;
  before: { passed: boolean; cost_usd: number; turns_used?: number; duration_ms?: number;
            detection_rate?: number; tool_summary?: Record<string, number> };
  after:  { passed: boolean; cost_usd: number; turns_used?: number; duration_ms?: number;
            detection_rate?: number; tool_summary?: Record<string, number> };
  status_change: 'improved' | 'regressed' | 'unchanged';
}

export interface ComparisonResult {
  before_file: string;
  after_file: string;
  before_branch: string;
  after_branch: string;
  before_timestamp: string;
  after_timestamp: string;
  deltas: TestDelta[];
  total_cost_delta: number;
  total_duration_delta: number;
  improved: number;
  regressed: number;
  unchanged: number;
  tool_count_before: number;
  tool_count_after: number;
}

/**
 * Extract tool call counts from a transcript.
 * Returns e.g. { Bash: 8, Read: 3, Write: 1 }.
 */
export function extractToolSummary(transcript: any[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const event of transcript) {
    if (event.type === 'assistant') {
      const content = event.message?.content || [];
      for (const item of content) {
        if (item.type === 'tool_use') {
          const name = item.name || 'unknown';
          counts[name] = (counts[name] || 0) + 1;
        }
      }
    }
  }
  return counts;
}

/**
 * Compare two eval results. Matches tests by name.
 */
export function compareEvalResults(
  before: EvalResult,
  after: EvalResult,
  beforeFile: string,
  afterFile: string,
): ComparisonResult {
  const deltas: TestDelta[] = [];
  let improved = 0, regressed = 0, unchanged = 0;
  let toolCountBefore = 0, toolCountAfter = 0;

  // Index before tests by name
  const beforeMap = new Map<string, EvalTestEntry>();
  for (const t of before.tests) {
    beforeMap.set(t.name, t);
  }

  // Walk after tests, match by name
  for (const afterTest of after.tests) {
    const beforeTest = beforeMap.get(afterTest.name);
    const beforeToolSummary = beforeTest?.transcript ? extractToolSummary(beforeTest.transcript) : {};
    const afterToolSummary = afterTest.transcript ? extractToolSummary(afterTest.transcript) : {};

    const beforeToolCount = Object.values(beforeToolSummary).reduce((a, b) => a + b, 0);
    const afterToolCount = Object.values(afterToolSummary).reduce((a, b) => a + b, 0);
    toolCountBefore += beforeToolCount;
    toolCountAfter += afterToolCount;

    let statusChange: TestDelta['status_change'] = 'unchanged';
    if (beforeTest) {
      if (!beforeTest.passed && afterTest.passed) { statusChange = 'improved'; improved++; }
      else if (beforeTest.passed && !afterTest.passed) { statusChange = 'regressed'; regressed++; }
      else { unchanged++; }
    } else {
      // New test — treat as unchanged (no prior data)
      unchanged++;
    }

    deltas.push({
      name: afterTest.name,
      before: {
        passed: beforeTest?.passed ?? false,
        cost_usd: beforeTest?.cost_usd ?? 0,
        turns_used: beforeTest?.turns_used,
        duration_ms: beforeTest?.duration_ms,
        detection_rate: beforeTest?.detection_rate,
        tool_summary: beforeToolSummary,
      },
      after: {
        passed: afterTest.passed,
        cost_usd: afterTest.cost_usd,
        turns_used: afterTest.turns_used,
        duration_ms: afterTest.duration_ms,
        detection_rate: afterTest.detection_rate,
        tool_summary: afterToolSummary,
      },
      status_change: statusChange,
    });

    beforeMap.delete(afterTest.name);
  }

  // Tests that were in before but not in after (removed tests)
  for (const [name, beforeTest] of beforeMap) {
    const beforeToolSummary = beforeTest.transcript ? extractToolSummary(beforeTest.transcript) : {};
    const beforeToolCount = Object.values(beforeToolSummary).reduce((a, b) => a + b, 0);
    toolCountBefore += beforeToolCount;
    unchanged++;
    deltas.push({
      name: `${name} (removed)`,
      before: {
        passed: beforeTest.passed,
        cost_usd: beforeTest.cost_usd,
        turns_used: beforeTest.turns_used,
        duration_ms: beforeTest.duration_ms,
        detection_rate: beforeTest.detection_rate,
        tool_summary: beforeToolSummary,
      },
      after: { passed: false, cost_usd: 0, tool_summary: {} },
      status_change: 'unchanged',
    });
  }

  return {
    before_file: beforeFile,
    after_file: afterFile,
    before_branch: before.branch,
    after_branch: after.branch,
    before_timestamp: before.timestamp,
    after_timestamp: after.timestamp,
    deltas,
    total_cost_delta: after.total_cost_usd - before.total_cost_usd,
    total_duration_delta: after.total_duration_ms - before.total_duration_ms,
    improved,
    regressed,
    unchanged,
    tool_count_before: toolCountBefore,
    tool_count_after: toolCountAfter,
  };
}

/**
 * Format a ComparisonResult as a readable string.
 */
export function formatComparison(c: ComparisonResult): string {
  const lines: string[] = [];
  const ts = c.before_timestamp ? c.before_timestamp.replace('T', ' ').slice(0, 16) : 'unknown';
  lines.push(`\nvs previous: ${c.before_branch}/${c.deltas.length ? 'eval' : ''} (${ts})`);
  lines.push('─'.repeat(70));

  // Per-test deltas
  for (const d of c.deltas) {
    const arrow = d.status_change === 'improved' ? '↑' : d.status_change === 'regressed' ? '↓' : '=';
    const beforeStatus = d.before.passed ? 'PASS' : 'FAIL';
    const afterStatus = d.after.passed ? 'PASS' : 'FAIL';

    // Turns delta
    let turnsDelta = '';
    if (d.before.turns_used !== undefined && d.after.turns_used !== undefined) {
      const td = d.after.turns_used - d.before.turns_used;
      turnsDelta = ` ${d.before.turns_used}→${d.after.turns_used}t`;
      if (td !== 0) turnsDelta += `(${td > 0 ? '+' : ''}${td})`;
    } else if (d.after.turns_used !== undefined) {
      turnsDelta = ` ${d.after.turns_used}t`;
    }

    // Duration delta
    let durDelta = '';
    if (d.before.duration_ms !== undefined && d.after.duration_ms !== undefined) {
      const bs = Math.round(d.before.duration_ms / 1000);
      const as = Math.round(d.after.duration_ms / 1000);
      const dd = as - bs;
      durDelta = ` ${bs}→${as}s`;
      if (dd !== 0) durDelta += `(${dd > 0 ? '+' : ''}${dd})`;
    } else if (d.after.duration_ms !== undefined) {
      durDelta = ` ${Math.round(d.after.duration_ms / 1000)}s`;
    }

    let detail = '';
    if (d.before.detection_rate !== undefined || d.after.detection_rate !== undefined) {
      detail = ` ${d.before.detection_rate ?? '?'}→${d.after.detection_rate ?? '?'} det`;
    } else {
      const costBefore = d.before.cost_usd.toFixed(2);
      const costAfter = d.after.cost_usd.toFixed(2);
      detail = ` $${costBefore}→$${costAfter}`;
    }

    const name = d.name.length > 30 ? d.name.slice(0, 27) + '...' : d.name.padEnd(30);
    lines.push(`  ${name}  ${beforeStatus.padEnd(5)} → ${afterStatus.padEnd(5)}  ${arrow}${detail}${turnsDelta}${durDelta}`);
  }

  lines.push('─'.repeat(70));

  // Totals
  const parts: string[] = [];
  if (c.improved > 0) parts.push(`${c.improved} improved`);
  if (c.regressed > 0) parts.push(`${c.regressed} regressed`);
  if (c.unchanged > 0) parts.push(`${c.unchanged} unchanged`);
  lines.push(`  Status: ${parts.join(', ')}`);

  const costSign = c.total_cost_delta >= 0 ? '+' : '';
  lines.push(`  Cost:   ${costSign}$${c.total_cost_delta.toFixed(2)}`);

  const durDelta = Math.round(c.total_duration_delta / 1000);
  const durSign = durDelta >= 0 ? '+' : '';
  lines.push(`  Duration: ${durSign}${durDelta}s`);

  const toolDelta = c.tool_count_after - c.tool_count_before;
  const toolSign = toolDelta >= 0 ? '+' : '';
  lines.push(`  Tool calls: ${c.tool_count_before} → ${c.tool_count_after} (${toolSign}${toolDelta})`);

  // Tool breakdown (show tools that changed)
  const allTools = new Set<string>();
  for (const d of c.deltas) {
    for (const t of Object.keys(d.before.tool_summary || {})) allTools.add(t);
    for (const t of Object.keys(d.after.tool_summary || {})) allTools.add(t);
  }

  if (allTools.size > 0) {
    // Aggregate tool counts across all tests
    const totalBefore: Record<string, number> = {};
    const totalAfter: Record<string, number> = {};
    for (const d of c.deltas) {
      for (const [t, n] of Object.entries(d.before.tool_summary || {})) {
        totalBefore[t] = (totalBefore[t] || 0) + n;
      }
      for (const [t, n] of Object.entries(d.after.tool_summary || {})) {
        totalAfter[t] = (totalAfter[t] || 0) + n;
      }
    }

    for (const tool of [...allTools].sort()) {
      const b = totalBefore[tool] || 0;
      const a = totalAfter[tool] || 0;
      if (b !== a) {
        const d = a - b;
        lines.push(`    ${tool}: ${b} → ${a} (${d >= 0 ? '+' : ''}${d})`);
      }
    }
  }

  // Commentary — interpret what the deltas mean
  const commentary = generateCommentary(c);
  if (commentary.length > 0) {
    lines.push('');
    lines.push('  Takeaway:');
    for (const line of commentary) {
      lines.push(`    ${line}`);
    }
  }

  return lines.join('\n');
}

/**
 * Generate human-readable commentary interpreting comparison deltas.
 * Pure function — analyzes the numbers and explains what they mean.
 */
export function generateCommentary(c: ComparisonResult): string[] {
  const notes: string[] = [];

  // 1. Regressions are the most important signal — call them out first
  const regressions = c.deltas.filter(d => d.status_change === 'regressed');
  if (regressions.length > 0) {
    for (const d of regressions) {
      notes.push(`REGRESSION: "${d.name}" was passing, now fails. Investigate immediately.`);
    }
  }

  // 2. Improvements
  const improvements = c.deltas.filter(d => d.status_change === 'improved');
  for (const d of improvements) {
    notes.push(`Fixed: "${d.name}" now passes.`);
  }

  // 3. Per-test efficiency changes (only for unchanged-status tests — regressions/improvements are already noted)
  const stable = c.deltas.filter(d => d.status_change === 'unchanged' && d.after.passed);
  for (const d of stable) {
    const insights: string[] = [];

    // Turns
    if (d.before.turns_used !== undefined && d.after.turns_used !== undefined && d.before.turns_used > 0) {
      const turnsDelta = d.after.turns_used - d.before.turns_used;
      const turnsPct = Math.round((turnsDelta / d.before.turns_used) * 100);
      if (Math.abs(turnsPct) >= 20 && Math.abs(turnsDelta) >= 2) {
        if (turnsDelta < 0) {
          insights.push(`${Math.abs(turnsDelta)} fewer turns (${Math.abs(turnsPct)}% more efficient)`);
        } else {
          insights.push(`${turnsDelta} more turns (${turnsPct}% less efficient)`);
        }
      }
    }

    // Duration
    if (d.before.duration_ms !== undefined && d.after.duration_ms !== undefined && d.before.duration_ms > 0) {
      const durDelta = d.after.duration_ms - d.before.duration_ms;
      const durPct = Math.round((durDelta / d.before.duration_ms) * 100);
      if (Math.abs(durPct) >= 20 && Math.abs(durDelta) >= 5000) {
        if (durDelta < 0) {
          insights.push(`${Math.round(Math.abs(durDelta) / 1000)}s faster`);
        } else {
          insights.push(`${Math.round(durDelta / 1000)}s slower`);
        }
      }
    }

    // Detection rate
    if (d.before.detection_rate !== undefined && d.after.detection_rate !== undefined) {
      const detDelta = d.after.detection_rate - d.before.detection_rate;
      if (detDelta !== 0) {
        if (detDelta > 0) {
          insights.push(`detecting ${detDelta} more bug${detDelta > 1 ? 's' : ''}`);
        } else {
          insights.push(`detecting ${Math.abs(detDelta)} fewer bug${Math.abs(detDelta) > 1 ? 's' : ''} — check prompt quality`);
        }
      }
    }

    // Cost
    if (d.before.cost_usd > 0) {
      const costDelta = d.after.cost_usd - d.before.cost_usd;
      const costPct = Math.round((costDelta / d.before.cost_usd) * 100);
      if (Math.abs(costPct) >= 30 && Math.abs(costDelta) >= 0.05) {
        if (costDelta < 0) {
          insights.push(`${Math.abs(costPct)}% cheaper`);
        } else {
          insights.push(`${costPct}% more expensive`);
        }
      }
    }

    if (insights.length > 0) {
      notes.push(`"${d.name}": ${insights.join(', ')}.`);
    }
  }

  // 4. Overall summary
  if (c.deltas.length >= 3 && regressions.length === 0) {
    const overallParts: string[] = [];

    // Total cost
    const totalBefore = c.deltas.reduce((s, d) => s + d.before.cost_usd, 0);
    if (totalBefore > 0) {
      const costPct = Math.round((c.total_cost_delta / totalBefore) * 100);
      if (Math.abs(costPct) >= 10) {
        overallParts.push(`${Math.abs(costPct)}% ${costPct < 0 ? 'cheaper' : 'more expensive'} overall`);
      }
    }

    // Total duration
    const totalDurBefore = c.deltas.reduce((s, d) => s + (d.before.duration_ms || 0), 0);
    if (totalDurBefore > 0) {
      const durPct = Math.round((c.total_duration_delta / totalDurBefore) * 100);
      if (Math.abs(durPct) >= 10) {
        overallParts.push(`${Math.abs(durPct)}% ${durPct < 0 ? 'faster' : 'slower'}`);
      }
    }

    // Total turns
    const turnsBefore = c.deltas.reduce((s, d) => s + (d.before.turns_used || 0), 0);
    const turnsAfter = c.deltas.reduce((s, d) => s + (d.after.turns_used || 0), 0);
    if (turnsBefore > 0) {
      const turnsPct = Math.round(((turnsAfter - turnsBefore) / turnsBefore) * 100);
      if (Math.abs(turnsPct) >= 10) {
        overallParts.push(`${Math.abs(turnsPct)}% ${turnsPct < 0 ? 'fewer' : 'more'} turns`);
      }
    }

    if (overallParts.length > 0) {
      notes.push(`Overall: ${overallParts.join(', ')}. ${regressions.length === 0 ? 'No regressions.' : ''}`);
    } else if (regressions.length === 0) {
      notes.push('Stable run — no significant efficiency changes, no regressions.');
    }
  }

  return notes;
}
