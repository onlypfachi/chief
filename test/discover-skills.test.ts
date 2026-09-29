import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { discoverSkillDirs, discoverTemplates } from '../scripts/discover-skills';

let root: string;

function touch(rel: string) {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, '');
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'discover-skills-test-'));
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe('discoverSkillDirs', () => {
  test('finds the root skill and top-level skill dirs, sorted', () => {
    touch('SKILL.md');
    touch('review/SKILL.md');
    touch('browse/SKILL.md');
    expect(discoverSkillDirs(root)).toEqual(['.', 'browse', 'review']);
  });

  test('skips dirs without SKILL.md, node_modules, and hidden dirs', () => {
    touch('scripts/gen.ts');
    touch('node_modules/pkg/SKILL.md');
    touch('.claude/SKILL.md');
    touch('qa/SKILL.md');
    expect(discoverSkillDirs(root)).toEqual(['qa']);
  });

  test('ignores nested SKILL.md files and plain files at the top level', () => {
    touch('qa/templates/SKILL.md');
    touch('NOTES.md');
    expect(discoverSkillDirs(root)).toEqual([]);
  });

  test('follows symlinked skill dirs, like setup does', () => {
    const target = fs.mkdtempSync(path.join(os.tmpdir(), 'discover-skills-target-'));
    try {
      fs.writeFileSync(path.join(target, 'SKILL.md'), '');
      fs.symlinkSync(target, path.join(root, 'linked'));
      expect(discoverSkillDirs(root)).toEqual(['linked']);
    } finally {
      fs.rmSync(target, { recursive: true, force: true });
    }
  });

  test('skips broken symlinks', () => {
    fs.symlinkSync(path.join(root, 'missing'), path.join(root, 'dangling'));
    expect(discoverSkillDirs(root)).toEqual([]);
  });
});

describe('discoverTemplates', () => {
  test('returns absolute template paths, not SKILL.md-only dirs', () => {
    touch('SKILL.md.tmpl');
    touch('qa/SKILL.md.tmpl');
    touch('legacy/SKILL.md');
    expect(discoverTemplates(root)).toEqual([
      path.join(root, 'SKILL.md.tmpl'),
      path.join(root, 'qa', 'SKILL.md.tmpl'),
    ]);
  });
});
