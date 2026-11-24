/**
 * Tests for bin/chief-pr-screenshots.
 *
 * Each test builds a throwaway repo with a local bare "origin", so the script's
 * fetch/push run for real without touching the network.
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const SCRIPT = join(import.meta.dir, '..', 'bin', 'chief-pr-screenshots');

const GIT_ENV = {
  GIT_AUTHOR_NAME: 'Test',
  GIT_AUTHOR_EMAIL: 'test@example.com',
  GIT_COMMITTER_NAME: 'Test',
  GIT_COMMITTER_EMAIL: 'test@example.com',
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
};

let root: string;
let work: string;
let origin: string;

function sh(cmd: string[], cwd: string, extraEnv: Record<string, string> = {}) {
  const r = Bun.spawnSync(cmd, {
    cwd,
    env: { ...process.env, ...GIT_ENV, ...extraEnv },
    stdout: 'pipe',
    stderr: 'pipe',
  });
  return { exitCode: r.exitCode, stdout: r.stdout.toString().trim(), stderr: r.stderr.toString().trim() };
}

function run(args: string[], extraEnv: Record<string, string> = {}) {
  return sh(['bash', SCRIPT, ...args], work, { CHIEF_REPO_SLUG: 'acme/app', ...extraEnv });
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'chief-pr-shots-'));
  origin = join(root, 'origin.git');
  work = join(root, 'work');
  sh(['git', 'init', '-q', '--bare', origin], root);
  sh(['git', 'init', '-q', '-b', 'main', work], root);
  writeFileSync(join(work, 'app.css'), 'body {}\n');
  sh(['git', 'add', 'app.css'], work);
  sh(['git', 'commit', '-q', '-m', 'init'], work);
  sh(['git', 'remote', 'add', 'origin', origin], work);
  sh(['git', 'checkout', '-q', '-b', 'me/new-header'], work);
  writeFileSync(join(work, 'home-desktop.png'), 'PNG-A');
  writeFileSync(join(work, 'home-mobile.png'), 'PNG-B');
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('chief-pr-screenshots', () => {
  test('no args prints usage and exits 2', () => {
    const r = run([]);
    expect(r.exitCode).toBe(2);
    expect(r.stderr).toContain('usage');
  });

  test('missing file fails before pushing anything', () => {
    const r = run(['nope.png']);
    expect(r.exitCode).toBe(1);
    expect(sh(['git', 'ls-remote', origin], root).stdout).toBe('');
  });

  test('publishes images to the screenshot branch and prints pinned markdown', () => {
    const r = run(['home-desktop.png', 'home-mobile.png']);
    expect(r.exitCode).toBe(0);

    const commit = sh(['git', 'rev-parse', 'refs/heads/chief-screenshots'], origin).stdout;
    const sha = sh(['git', 'rev-parse', '--short', 'HEAD'], work).stdout;
    const lines = r.stdout.split('\n');
    expect(lines).toEqual([
      `![home-desktop](https://github.com/acme/app/blob/${commit}/me-new-header/${sha}/home-desktop.png?raw=true)`,
      `![home-mobile](https://github.com/acme/app/blob/${commit}/me-new-header/${sha}/home-mobile.png?raw=true)`,
    ]);

    const blob = sh(['git', 'show', `${commit}:me-new-header/${sha}/home-desktop.png`], origin).stdout;
    expect(blob).toBe('PNG-A');
  });

  test('leaves the working tree, index, and current branch untouched', () => {
    sh(['git', 'add', 'home-mobile.png'], work);
    const before = sh(['git', 'status', '--porcelain'], work).stdout;
    const headBefore = sh(['git', 'rev-parse', 'HEAD'], work).stdout;

    expect(run(['home-desktop.png']).exitCode).toBe(0);

    expect(sh(['git', 'status', '--porcelain'], work).stdout).toBe(before);
    expect(sh(['git', 'rev-parse', 'HEAD'], work).stdout).toBe(headBefore);
    expect(sh(['git', 'branch', '--show-current'], work).stdout).toBe('me/new-header');
    expect(readFileSync(join(work, 'app.css'), 'utf8')).toBe('body {}\n');
  });

  test('second run appends to the existing screenshot branch', () => {
    expect(run(['home-desktop.png']).exitCode).toBe(0);
    const first = sh(['git', 'rev-parse', 'refs/heads/chief-screenshots'], origin).stdout;

    writeFileSync(join(work, 'next.css'), 'a {}\n');
    sh(['git', 'add', 'next.css'], work);
    sh(['git', 'commit', '-q', '-m', 'more'], work);
    expect(run(['home-mobile.png']).exitCode).toBe(0);

    const second = sh(['git', 'rev-parse', 'refs/heads/chief-screenshots'], origin).stdout;
    expect(sh(['git', 'rev-parse', `${second}^`], origin).stdout).toBe(first);
    const files = sh(['git', 'ls-tree', '-r', '--name-only', second], origin).stdout.split('\n');
    expect(files.length).toBe(2);
  });

  test('derives owner/repo from a GitHub origin URL', () => {
    sh(['git', 'remote', 'set-url', 'origin', 'git@github.com:acme/app.git'], work);
    // fetch still points at GitHub; route it to the local bare repo instead
    sh(['git', 'config', `url.${origin}.insteadOf`, 'git@github.com:acme/app.git'], work);
    const r = run(['home-desktop.png'], { CHIEF_REPO_SLUG: '' });
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('https://github.com/acme/app/blob/');
  });

  test('parses owner/repo from an https GitHub URL with .git suffix', () => {
    sh(['git', 'remote', 'set-url', 'origin', 'https://github.com/acme/app.git'], work);
    sh(['git', 'config', `url.${origin}.insteadOf`, 'https://github.com/acme/app.git'], work);
    const r = run(['home-desktop.png'], { CHIEF_REPO_SLUG: '' });
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toMatch(/^!\[home-desktop\]\(https:\/\/github\.com\/acme\/app\/blob\/[0-9a-f]{40}\//);
  });

  test('fails with a clear message and prints no links when the push fails', () => {
    sh(['git', 'remote', 'set-url', 'origin', join(root, 'does-not-exist.git')], work);
    const r = run(['home-desktop.png']);
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toContain('push to chief-screenshots failed');
    expect(r.stdout).not.toContain('![');
  });

  test('refuses a non-GitHub origin when no slug is given', () => {
    const r = run(['home-desktop.png'], { CHIEF_REPO_SLUG: '' });
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toContain('not a GitHub remote');
  });
});
