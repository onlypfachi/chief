import { describe, test, expect } from 'bun:test';
import {
  extractToolSummary,
  compareEvalResults,
  formatComparison,
  generateCommentary,
} from './eval-comparison';
import type { ComparisonResult } from './eval-comparison';
import { makeEntry, makeResult } from './eval-fixtures';

// --- extractToolSummary tests ---

describe('extractToolSummary', () => {
  test('counts tool types from transcript events', () => {
    const transcript = [
      { type: 'system', subtype: 'init' },
      { type: 'assistant', message: { content: [
        { type: 'tool_use', name: 'Bash', input: {} },
      ] } },
      { type: 'user', tool_use_result: { stdout: '' } },
      { type: 'assistant', message: { content: [
        { type: 'text', text: 'ok' },
        { type: 'tool_use', name: 'Read', input: {} },
      ] } },
      { type: 'assistant', message: { content: [
        { type: 'tool_use', name: 'Bash', input: {} },
        { type: 'tool_use', name: 'Write', input: {} },
      ] } },
    ];

    const summary = extractToolSummary(transcript);
    expect(summary).toEqual({ Bash: 2, Read: 1, Write: 1 });
  });

  test('returns empty object for empty transcript', () => {
    expect(extractToolSummary([])).toEqual({});
  });

  test('handles events with no content array', () => {
    const transcript = [
      { type: 'assistant', message: {} },
      { type: 'assistant' },
    ];
    expect(extractToolSummary(transcript)).toEqual({});
  });
});

// --- compareEvalResults tests ---

describe('compareEvalResults', () => {
  test('detects improved/regressed/unchanged per test', () => {
    const before = makeResult({
      tests: [
        makeEntry({ name: 'test-a', passed: false }),
        makeEntry({ name: 'test-b', passed: true }),
        makeEntry({ name: 'test-c', passed: true }),
      ],
      total_tests: 3, passed: 2, failed: 1,
    });
    const after = makeResult({
      tests: [
        makeEntry({ name: 'test-a', passed: true }),   // improved
        makeEntry({ name: 'test-b', passed: false }),  // regressed
        makeEntry({ name: 'test-c', passed: true }),   // unchanged
      ],
      total_tests: 3, passed: 2, failed: 1,
    });

    const result = compareEvalResults(before, after, 'before.json', 'after.json');
    expect(result.improved).toBe(1);
    expect(result.regressed).toBe(1);
    expect(result.unchanged).toBe(1);
    expect(result.deltas.find(d => d.name === 'test-a')?.status_change).toBe('improved');
    expect(result.deltas.find(d => d.name === 'test-b')?.status_change).toBe('regressed');
    expect(result.deltas.find(d => d.name === 'test-c')?.status_change).toBe('unchanged');
  });

  test('handles tests present in one run but not the other', () => {
    const before = makeResult({
      tests: [
        makeEntry({ name: 'old-test', passed: true }),
        makeEntry({ name: 'shared', passed: true }),
      ],
    });
    const after = makeResult({
      tests: [
        makeEntry({ name: 'shared', passed: true }),
        makeEntry({ name: 'new-test', passed: true }),
      ],
    });

    const result = compareEvalResults(before, after, 'before.json', 'after.json');
    expect(result.deltas).toHaveLength(3); // shared + new-test + old-test (removed)
    expect(result.deltas.find(d => d.name.includes('old-test'))?.name).toContain('removed');
  });

  test('computes cost and duration deltas', () => {
    const before = makeResult({ total_cost_usd: 2.00, total_duration_ms: 60000 });
    const after = makeResult({ total_cost_usd: 1.50, total_duration_ms: 45000 });

    const result = compareEvalResults(before, after, 'a.json', 'b.json');
    expect(result.total_cost_delta).toBe(-0.50);
    expect(result.total_duration_delta).toBe(-15000);
  });
});

// --- formatComparison tests ---

describe('formatComparison', () => {
  test('produces readable output with status arrows', () => {
    const comparison: ComparisonResult = {
      before_file: 'before.json',
      after_file: 'after.json',
      before_branch: 'main',
      after_branch: 'feature',
      before_timestamp: '2026-03-13T14:30:00Z',
      after_timestamp: '2026-03-14T14:30:00Z',
      deltas: [
        {
          name: 'browse basic',
          before: { passed: true, cost_usd: 0.07, turns_used: 6, duration_ms: 24000, tool_summary: { Bash: 3 } },
          after: { passed: true, cost_usd: 0.06, turns_used: 5, duration_ms: 19000, tool_summary: { Bash: 4 } },
          status_change: 'unchanged',
        },
        {
          name: 'planted bugs static',
          before: { passed: false, cost_usd: 1.00, detection_rate: 3, tool_summary: {} },
          after: { passed: true, cost_usd: 0.95, detection_rate: 4, tool_summary: {} },
          status_change: 'improved',
        },
      ],
      total_cost_delta: -0.06,
      total_duration_delta: -5000,
      improved: 1,
      regressed: 0,
      unchanged: 1,
      tool_count_before: 3,
      tool_count_after: 4,
    };

    const output = formatComparison(comparison);
    expect(output).toContain('vs previous');
    expect(output).toContain('main');
    expect(output).toContain('1 improved');
    expect(output).toContain('1 unchanged');
    expect(output).toContain('↑'); // improved arrow
    expect(output).toContain('='); // unchanged arrow
    // Turns and duration deltas
    expect(output).toContain('6→5t');
    expect(output).toContain('24→19s');
  });

  test('includes commentary section', () => {
    const comparison: ComparisonResult = {
      before_file: 'a.json', after_file: 'b.json',
      before_branch: 'main', after_branch: 'main',
      before_timestamp: '2026-03-13T14:30:00Z',
      after_timestamp: '2026-03-14T14:30:00Z',
      deltas: [
        {
          name: 'test-a',
          before: { passed: true, cost_usd: 0.50, turns_used: 20, duration_ms: 120000 },
          after: { passed: true, cost_usd: 0.30, turns_used: 10, duration_ms: 60000 },
          status_change: 'unchanged',
        },
        {
          name: 'test-b',
          before: { passed: true, cost_usd: 0.10, turns_used: 5, duration_ms: 20000 },
          after: { passed: true, cost_usd: 0.10, turns_used: 5, duration_ms: 20000 },
          status_change: 'unchanged',
        },
        {
          name: 'test-c',
          before: { passed: true, cost_usd: 0.10, turns_used: 5, duration_ms: 20000 },
          after: { passed: true, cost_usd: 0.10, turns_used: 5, duration_ms: 20000 },
          status_change: 'unchanged',
        },
      ],
      total_cost_delta: -0.20,
      total_duration_delta: -60000,
      improved: 0, regressed: 0, unchanged: 3,
      tool_count_before: 30, tool_count_after: 20,
    };

    const output = formatComparison(comparison);
    expect(output).toContain('Takeaway');
    expect(output).toContain('fewer turns');
    expect(output).toContain('faster');
  });
});

// --- generateCommentary tests ---

describe('generateCommentary', () => {
  test('flags regressions prominently', () => {
    const c: ComparisonResult = {
      before_file: 'a.json', after_file: 'b.json',
      before_branch: 'main', after_branch: 'main',
      before_timestamp: '', after_timestamp: '',
      deltas: [{
        name: 'critical-test',
        before: { passed: true, cost_usd: 0.10 },
        after: { passed: false, cost_usd: 0.10 },
        status_change: 'regressed',
      }],
      total_cost_delta: 0, total_duration_delta: 0,
      improved: 0, regressed: 1, unchanged: 0,
      tool_count_before: 0, tool_count_after: 0,
    };

    const notes = generateCommentary(c);
    expect(notes.some(n => n.includes('REGRESSION'))).toBe(true);
    expect(notes.some(n => n.includes('critical-test'))).toBe(true);
  });

  test('notes improvements', () => {
    const c: ComparisonResult = {
      before_file: 'a.json', after_file: 'b.json',
      before_branch: 'main', after_branch: 'main',
      before_timestamp: '', after_timestamp: '',
      deltas: [{
        name: 'fixed-test',
        before: { passed: false, cost_usd: 0.10 },
        after: { passed: true, cost_usd: 0.10 },
        status_change: 'improved',
      }],
      total_cost_delta: 0, total_duration_delta: 0,
      improved: 1, regressed: 0, unchanged: 0,
      tool_count_before: 0, tool_count_after: 0,
    };

    const notes = generateCommentary(c);
    expect(notes.some(n => n.includes('Fixed'))).toBe(true);
    expect(notes.some(n => n.includes('fixed-test'))).toBe(true);
  });

  test('reports efficiency gains for stable tests', () => {
    const c: ComparisonResult = {
      before_file: 'a.json', after_file: 'b.json',
      before_branch: 'main', after_branch: 'main',
      before_timestamp: '', after_timestamp: '',
      deltas: [{
        name: 'fast-test',
        before: { passed: true, cost_usd: 0.50, turns_used: 20, duration_ms: 120000 },
        after: { passed: true, cost_usd: 0.25, turns_used: 10, duration_ms: 60000 },
        status_change: 'unchanged',
      }],
      total_cost_delta: -0.25, total_duration_delta: -60000,
      improved: 0, regressed: 0, unchanged: 1,
      tool_count_before: 0, tool_count_after: 0,
    };

    const notes = generateCommentary(c);
    expect(notes.some(n => n.includes('fewer turns'))).toBe(true);
    expect(notes.some(n => n.includes('faster'))).toBe(true);
    expect(notes.some(n => n.includes('cheaper'))).toBe(true);
  });

  test('reports detection rate changes', () => {
    const c: ComparisonResult = {
      before_file: 'a.json', after_file: 'b.json',
      before_branch: 'main', after_branch: 'main',
      before_timestamp: '', after_timestamp: '',
      deltas: [{
        name: 'detection-test',
        before: { passed: true, cost_usd: 0.50, detection_rate: 3 },
        after: { passed: true, cost_usd: 0.50, detection_rate: 5 },
        status_change: 'unchanged',
      }],
      total_cost_delta: 0, total_duration_delta: 0,
      improved: 0, regressed: 0, unchanged: 1,
      tool_count_before: 0, tool_count_after: 0,
    };

    const notes = generateCommentary(c);
    expect(notes.some(n => n.includes('detecting 2 more bugs'))).toBe(true);
  });

  test('produces overall summary for 3+ tests with no regressions', () => {
    const c: ComparisonResult = {
      before_file: 'a.json', after_file: 'b.json',
      before_branch: 'main', after_branch: 'main',
      before_timestamp: '', after_timestamp: '',
      deltas: [
        { name: 'a', before: { passed: true, cost_usd: 0.50, turns_used: 10, duration_ms: 60000 },
          after: { passed: true, cost_usd: 0.30, turns_used: 6, duration_ms: 40000 }, status_change: 'unchanged' },
        { name: 'b', before: { passed: true, cost_usd: 0.20, turns_used: 5, duration_ms: 30000 },
          after: { passed: true, cost_usd: 0.15, turns_used: 4, duration_ms: 25000 }, status_change: 'unchanged' },
        { name: 'c', before: { passed: true, cost_usd: 0.10, turns_used: 3, duration_ms: 20000 },
          after: { passed: true, cost_usd: 0.08, turns_used: 3, duration_ms: 18000 }, status_change: 'unchanged' },
      ],
      total_cost_delta: -0.27, total_duration_delta: -27000,
      improved: 0, regressed: 0, unchanged: 3,
      tool_count_before: 0, tool_count_after: 0,
    };

    const notes = generateCommentary(c);
    expect(notes.some(n => n.includes('Overall'))).toBe(true);
    expect(notes.some(n => n.includes('No regressions'))).toBe(true);
  });

  test('returns empty for stable run with no significant changes', () => {
    const c: ComparisonResult = {
      before_file: 'a.json', after_file: 'b.json',
      before_branch: 'main', after_branch: 'main',
      before_timestamp: '', after_timestamp: '',
      deltas: [
        { name: 'a', before: { passed: true, cost_usd: 0.10, turns_used: 5, duration_ms: 20000 },
          after: { passed: true, cost_usd: 0.10, turns_used: 5, duration_ms: 21000 }, status_change: 'unchanged' },
        { name: 'b', before: { passed: true, cost_usd: 0.10, turns_used: 5, duration_ms: 20000 },
          after: { passed: true, cost_usd: 0.10, turns_used: 5, duration_ms: 20000 }, status_change: 'unchanged' },
        { name: 'c', before: { passed: true, cost_usd: 0.10, turns_used: 5, duration_ms: 20000 },
          after: { passed: true, cost_usd: 0.10, turns_used: 5, duration_ms: 20000 }, status_change: 'unchanged' },
      ],
      total_cost_delta: 0, total_duration_delta: 1000,
      improved: 0, regressed: 0, unchanged: 3,
      tool_count_before: 15, tool_count_after: 15,
    };

    const notes = generateCommentary(c);
    expect(notes.some(n => n.includes('Stable run'))).toBe(true);
  });
});
