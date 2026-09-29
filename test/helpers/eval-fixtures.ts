/** Minimal eval fixtures shared by the eval-store and eval-comparison tests. */

import type { EvalResult, EvalTestEntry } from './eval-store';

// --- Helper to make a minimal test entry ---

export function makeEntry(overrides?: Partial<EvalTestEntry>): EvalTestEntry {
  return {
    name: 'test-1',
    suite: 'suite-1',
    tier: 'e2e',
    passed: true,
    duration_ms: 1000,
    cost_usd: 0.05,
    ...overrides,
  };
}

// --- Helper to make a minimal EvalResult ---

export function makeResult(overrides?: Partial<EvalResult>): EvalResult {
  return {
    schema_version: 1,
    version: '0.3.6',
    branch: 'main',
    git_sha: 'abc1234',
    timestamp: '2026-03-14T12:00:00.000Z',
    hostname: 'test-host',
    tier: 'e2e',
    total_tests: 1,
    passed: 1,
    failed: 0,
    total_cost_usd: 0.05,
    total_duration_ms: 1000,
    tests: [makeEntry()],
    ...overrides,
  };
}
