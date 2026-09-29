/**
 * Eval result persistence.
 *
 * EvalCollector accumulates test results, writes them to
 * ~/.chief-dev/evals/{version}-{branch}-{tier}-{timestamp}.json,
 * prints a summary table, and auto-compares with the previous run
 * (comparison logic lives in eval-comparison.ts).
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawnSync } from 'child_process';
import { compareEvalResults, formatComparison } from './eval-comparison';

const SCHEMA_VERSION = 1;
const DEFAULT_EVAL_DIR = path.join(os.homedir(), '.chief-dev', 'evals');

// --- Interfaces ---

export interface EvalTestEntry {
  name: string;
  suite: string;
  tier: 'e2e' | 'llm-judge';
  passed: boolean;
  duration_ms: number;
  cost_usd: number;

  // E2E
  transcript?: any[];
  prompt?: string;
  output?: string;
  turns_used?: number;
  browse_errors?: string[];

  // LLM judge
  judge_scores?: Record<string, number>;
  judge_reasoning?: string;

  // Machine-readable diagnostics
  exit_reason?: string;       // 'success' | 'timeout' | 'error_max_turns' | 'exit_code_N'
  timeout_at_turn?: number;   // which turn was active when timeout hit
  last_tool_call?: string;    // e.g. "Write(review-output.md)"

  // Outcome eval
  detection_rate?: number;
  false_positives?: number;
  evidence_quality?: number;
  detected_bugs?: string[];
  missed_bugs?: string[];

  error?: string;
}

export interface EvalResult {
  schema_version: number;
  version: string;
  branch: string;
  git_sha: string;
  timestamp: string;
  hostname: string;
  tier: 'e2e' | 'llm-judge';
  total_tests: number;
  passed: number;
  failed: number;
  total_cost_usd: number;
  total_duration_ms: number;
  tests: EvalTestEntry[];
  _partial?: boolean;  // true for incremental saves, absent in final
}

// --- Shared helpers ---

/**
 * Determine if a planted-bug eval passed based on judge results vs ground truth thresholds.
 * Centralizes the pass/fail logic so all planted-bug tests use the same criteria.
 */
export function judgePassed(
  judgeResult: { detection_rate: number; false_positives: number; evidence_quality: number },
  groundTruth: { minimum_detection: number; max_false_positives: number },
): boolean {
  return judgeResult.detection_rate >= groundTruth.minimum_detection
    && judgeResult.false_positives <= groundTruth.max_false_positives
    && judgeResult.evidence_quality >= 2;
}

/**
 * Find the most recent prior eval file for comparison.
 * Prefers same branch, falls back to any branch.
 */
export function findPreviousRun(
  evalDir: string,
  tier: string,
  branch: string,
  excludeFile: string,
): string | null {
  let files: string[];
  try {
    files = fs.readdirSync(evalDir).filter(f => f.endsWith('.json'));
  } catch {
    return null; // dir doesn't exist
  }

  // Parse top-level fields from each file (cheap — no full tests array needed)
  const entries: Array<{ file: string; branch: string; timestamp: string }> = [];
  for (const file of files) {
    if (file === path.basename(excludeFile)) continue;
    const fullPath = path.join(evalDir, file);
    try {
      const raw = fs.readFileSync(fullPath, 'utf-8');
      // Quick parse — only grab the fields we need
      const data = JSON.parse(raw);
      if (data.tier !== tier) continue;
      entries.push({ file: fullPath, branch: data.branch || '', timestamp: data.timestamp || '' });
    } catch { continue; }
  }

  if (entries.length === 0) return null;

  // Sort by timestamp descending
  entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  // Prefer same branch
  const sameBranch = entries.find(e => e.branch === branch);
  if (sameBranch) return sameBranch.file;

  // Fallback: any branch
  return entries[0].file;
}

// --- EvalCollector ---

function getGitInfo(): { branch: string; sha: string } {
  try {
    const branch = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { stdio: 'pipe', timeout: 5000 });
    const sha = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { stdio: 'pipe', timeout: 5000 });
    return {
      branch: branch.stdout?.toString().trim() || 'unknown',
      sha: sha.stdout?.toString().trim() || 'unknown',
    };
  } catch {
    return { branch: 'unknown', sha: 'unknown' };
  }
}

function getVersion(): string {
  try {
    const pkgPath = path.resolve(__dirname, '..', '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    return pkg.version || 'unknown';
  } catch {
    return 'unknown';
  }
}

export class EvalCollector {
  private tier: 'e2e' | 'llm-judge';
  private tests: EvalTestEntry[] = [];
  private finalized = false;
  private evalDir: string;

  constructor(tier: 'e2e' | 'llm-judge', evalDir?: string) {
    this.tier = tier;
    this.evalDir = evalDir || DEFAULT_EVAL_DIR;
  }

  addTest(entry: EvalTestEntry): void {
    this.tests.push(entry);
    this.savePartial();
  }

  /** Write incremental results after each test. Atomic write, non-fatal. */
  savePartial(): void {
    try {
      const git = getGitInfo();
      const version = getVersion();
      const totalCost = this.tests.reduce((s, t) => s + t.cost_usd, 0);
      const totalDuration = this.tests.reduce((s, t) => s + t.duration_ms, 0);
      const passed = this.tests.filter(t => t.passed).length;

      const partial: EvalResult = {
        schema_version: SCHEMA_VERSION,
        version,
        branch: git.branch,
        git_sha: git.sha,
        timestamp: new Date().toISOString(),
        hostname: os.hostname(),
        tier: this.tier,
        total_tests: this.tests.length,
        passed,
        failed: this.tests.length - passed,
        total_cost_usd: Math.round(totalCost * 100) / 100,
        total_duration_ms: totalDuration,
        tests: this.tests,
        _partial: true,
      };

      fs.mkdirSync(this.evalDir, { recursive: true });
      const partialPath = path.join(this.evalDir, '_partial-e2e.json');
      const tmp = partialPath + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(partial, null, 2) + '\n');
      fs.renameSync(tmp, partialPath);
    } catch { /* non-fatal — partial saves are best-effort */ }
  }

  async finalize(): Promise<string> {
    if (this.finalized) return '';
    this.finalized = true;

    const git = getGitInfo();
    const version = getVersion();
    const timestamp = new Date().toISOString();
    const totalCost = this.tests.reduce((s, t) => s + t.cost_usd, 0);
    const totalDuration = this.tests.reduce((s, t) => s + t.duration_ms, 0);
    const passed = this.tests.filter(t => t.passed).length;

    const result: EvalResult = {
      schema_version: SCHEMA_VERSION,
      version,
      branch: git.branch,
      git_sha: git.sha,
      timestamp,
      hostname: os.hostname(),
      tier: this.tier,
      total_tests: this.tests.length,
      passed,
      failed: this.tests.length - passed,
      total_cost_usd: Math.round(totalCost * 100) / 100,
      total_duration_ms: totalDuration,
      tests: this.tests,
    };

    // Write eval file
    fs.mkdirSync(this.evalDir, { recursive: true });
    const dateStr = timestamp.replace(/[:.]/g, '').replace('T', '-').slice(0, 15);
    const safeBranch = git.branch.replace(/[^a-zA-Z0-9._-]/g, '-');
    const filename = `${version}-${safeBranch}-${this.tier}-${dateStr}.json`;
    const filepath = path.join(this.evalDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(result, null, 2) + '\n');

    // Print summary table
    this.printSummary(result, filepath, git);

    // Auto-compare with previous run
    try {
      const prevFile = findPreviousRun(this.evalDir, this.tier, git.branch, filepath);
      if (prevFile) {
        const prevResult: EvalResult = JSON.parse(fs.readFileSync(prevFile, 'utf-8'));
        const comparison = compareEvalResults(prevResult, result, prevFile, filepath);
        process.stderr.write(formatComparison(comparison) + '\n');
      } else {
        process.stderr.write('\nFirst run — no comparison available.\n');
      }
    } catch (err: any) {
      process.stderr.write(`\nCompare error: ${err.message}\n`);
    }

    return filepath;
  }

  private printSummary(result: EvalResult, filepath: string, git: { branch: string; sha: string }): void {
    const lines: string[] = [];
    lines.push('');
    lines.push(`Eval Results — v${result.version} @ ${git.branch} (${git.sha}) — ${this.tier}`);
    lines.push('═'.repeat(70));

    for (const t of this.tests) {
      const status = t.passed ? ' PASS ' : ' FAIL ';
      const cost = `$${t.cost_usd.toFixed(2)}`;
      const dur = t.duration_ms ? `${Math.round(t.duration_ms / 1000)}s` : '';
      const turns = t.turns_used !== undefined ? `${t.turns_used}t` : '';

      let detail = '';
      if (t.detection_rate !== undefined) {
        detail = `${t.detection_rate}/${(t.detected_bugs?.length || 0) + (t.missed_bugs?.length || 0)} det`;
      } else if (t.judge_scores) {
        const scores = Object.entries(t.judge_scores).map(([k, v]) => `${k[0]}:${v}`).join(' ');
        detail = scores;
      }

      const name = t.name.length > 35 ? t.name.slice(0, 32) + '...' : t.name.padEnd(35);
      lines.push(`  ${name}  ${status}  ${cost.padStart(6)}  ${turns.padStart(4)}  ${dur.padStart(5)}  ${detail}`);
    }

    lines.push('─'.repeat(70));
    const totalCost = `$${result.total_cost_usd.toFixed(2)}`;
    const totalDur = `${Math.round(result.total_duration_ms / 1000)}s`;
    lines.push(`  Total: ${result.passed}/${result.total_tests} passed${' '.repeat(20)}${totalCost.padStart(6)}  ${totalDur}`);
    lines.push(`Saved: ${filepath}`);

    process.stderr.write(lines.join('\n') + '\n');
  }
}
