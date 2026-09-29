import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  EvalCollector,
  findPreviousRun,
  judgePassed,
} from './eval-store';
import type { EvalResult, EvalTestEntry } from './eval-store';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eval-store-test-'));
});

afterEach(() => {
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
});

// --- Helper to make a minimal test entry ---

function makeEntry(overrides?: Partial<EvalTestEntry>): EvalTestEntry {
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

function makeResult(overrides?: Partial<EvalResult>): EvalResult {
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

// --- EvalCollector tests ---

describe('EvalCollector', () => {
  test('addTest accumulates entries', () => {
    const collector = new EvalCollector('e2e', tmpDir);
    collector.addTest(makeEntry({ name: 'a' }));
    collector.addTest(makeEntry({ name: 'b' }));
    collector.addTest(makeEntry({ name: 'c' }));
    // We can't inspect tests directly, but finalize will write them
  });

  test('finalize writes JSON file to eval dir', async () => {
    const collector = new EvalCollector('e2e', tmpDir);
    collector.addTest(makeEntry());
    const filepath = await collector.finalize();

    expect(filepath).toBeTruthy();
    expect(fs.existsSync(filepath)).toBe(true);

    const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    expect(data.tests).toHaveLength(1);
    expect(data.tests[0].name).toBe('test-1');
  });

  test('written JSON has correct schema fields', async () => {
    const collector = new EvalCollector('e2e', tmpDir);
    collector.addTest(makeEntry({ passed: true, cost_usd: 0.10, duration_ms: 2000 }));
    collector.addTest(makeEntry({ name: 'test-2', passed: false, cost_usd: 0.05, duration_ms: 1000 }));
    const filepath = await collector.finalize();

    const data: EvalResult = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    expect(data.schema_version).toBe(1);
    expect(data.tier).toBe('e2e');
    expect(data.total_tests).toBe(2);
    expect(data.passed).toBe(1);
    expect(data.failed).toBe(1);
    expect(data.total_cost_usd).toBe(0.15);
    expect(data.total_duration_ms).toBe(3000);
    expect(data.timestamp).toBeTruthy();
    expect(data.hostname).toBeTruthy();
  });

  test('finalize creates directory if missing', async () => {
    const nestedDir = path.join(tmpDir, 'nested', 'deep', 'evals');
    const collector = new EvalCollector('e2e', nestedDir);
    collector.addTest(makeEntry());
    const filepath = await collector.finalize();
    expect(fs.existsSync(filepath)).toBe(true);
  });

  test('double finalize does not write twice', async () => {
    const collector = new EvalCollector('e2e', tmpDir);
    collector.addTest(makeEntry());
    const filepath1 = await collector.finalize();
    const filepath2 = await collector.finalize();

    expect(filepath1).toBeTruthy();
    expect(filepath2).toBe(''); // second call returns empty
    expect(fs.readdirSync(tmpDir).filter(f => f.endsWith('.json') && !f.startsWith('_partial'))).toHaveLength(1);
  });

  test('empty collector writes valid file', async () => {
    const collector = new EvalCollector('llm-judge', tmpDir);
    const filepath = await collector.finalize();

    const data: EvalResult = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    expect(data.total_tests).toBe(0);
    expect(data.passed).toBe(0);
    expect(data.tests).toHaveLength(0);
    expect(data.tier).toBe('llm-judge');
  });
});

// --- judgePassed tests ---

describe('judgePassed', () => {
  test('passes when all thresholds met', () => {
    expect(judgePassed(
      { detection_rate: 3, false_positives: 1, evidence_quality: 3 },
      { minimum_detection: 2, max_false_positives: 2 },
    )).toBe(true);
  });

  test('fails when detection rate below minimum', () => {
    expect(judgePassed(
      { detection_rate: 1, false_positives: 0, evidence_quality: 3 },
      { minimum_detection: 2, max_false_positives: 2 },
    )).toBe(false);
  });

  test('fails when too many false positives', () => {
    expect(judgePassed(
      { detection_rate: 3, false_positives: 3, evidence_quality: 3 },
      { minimum_detection: 2, max_false_positives: 2 },
    )).toBe(false);
  });

  test('fails when evidence quality below 2', () => {
    expect(judgePassed(
      { detection_rate: 3, false_positives: 0, evidence_quality: 1 },
      { minimum_detection: 2, max_false_positives: 2 },
    )).toBe(false);
  });

  test('passes at exact thresholds', () => {
    expect(judgePassed(
      { detection_rate: 2, false_positives: 2, evidence_quality: 2 },
      { minimum_detection: 2, max_false_positives: 2 },
    )).toBe(true);
  });
});

// --- findPreviousRun tests ---

describe('findPreviousRun', () => {
  test('finds correct file — same branch preferred, most recent', () => {
    // Write three eval files
    const files = [
      { name: '0.3.5-main-e2e-20260312-100000.json', data: makeResult({ branch: 'main', timestamp: '2026-03-12T10:00:00Z' }) },
      { name: '0.3.5-feature-e2e-20260313-100000.json', data: makeResult({ branch: 'feature', timestamp: '2026-03-13T10:00:00Z' }) },
      { name: '0.3.6-feature-e2e-20260314-100000.json', data: makeResult({ branch: 'feature', timestamp: '2026-03-14T10:00:00Z' }) },
    ];
    for (const f of files) {
      fs.writeFileSync(path.join(tmpDir, f.name), JSON.stringify(f.data));
    }

    // Should prefer feature branch (most recent on same branch)
    const result = findPreviousRun(tmpDir, 'e2e', 'feature', path.join(tmpDir, 'current.json'));
    expect(result).toContain('0.3.6-feature-e2e-20260314');
  });

  test('falls back to different branch when no same-branch match', () => {
    const files = [
      { name: '0.3.5-main-e2e-20260312-100000.json', data: makeResult({ branch: 'main', timestamp: '2026-03-12T10:00:00Z' }) },
    ];
    for (const f of files) {
      fs.writeFileSync(path.join(tmpDir, f.name), JSON.stringify(f.data));
    }

    const result = findPreviousRun(tmpDir, 'e2e', 'new-branch', path.join(tmpDir, 'current.json'));
    expect(result).toContain('0.3.5-main-e2e');
  });

  test('returns null when no prior runs exist', () => {
    const result = findPreviousRun(tmpDir, 'e2e', 'main', path.join(tmpDir, 'current.json'));
    expect(result).toBeNull();
  });

  test('returns null when directory does not exist', () => {
    const result = findPreviousRun('/nonexistent/path', 'e2e', 'main', 'current.json');
    expect(result).toBeNull();
  });

  test('excludes the current file from results', () => {
    const filename = '0.3.6-main-e2e-20260314-100000.json';
    fs.writeFileSync(
      path.join(tmpDir, filename),
      JSON.stringify(makeResult({ branch: 'main', timestamp: '2026-03-14T10:00:00Z' })),
    );

    const result = findPreviousRun(tmpDir, 'e2e', 'main', path.join(tmpDir, filename));
    expect(result).toBeNull(); // only file is excluded
  });

  test('filters by tier', () => {
    fs.writeFileSync(
      path.join(tmpDir, '0.3.6-main-llm-judge-20260314-100000.json'),
      JSON.stringify(makeResult({ tier: 'llm-judge', branch: 'main', timestamp: '2026-03-14T10:00:00Z' })),
    );

    const result = findPreviousRun(tmpDir, 'e2e', 'main', 'current.json');
    expect(result).toBeNull(); // only llm-judge file, looking for e2e
  });
});
