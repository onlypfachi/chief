/**
 * Skill discovery — finds every skill in the repo so nothing has to keep a hand-written list.
 *
 * A skill is the repo root or any top-level directory containing SKILL.md or SKILL.md.tmpl.
 * Directories are returned relative to the root ('.' for the root skill), sorted.
 */

import * as fs from 'fs';
import * as path from 'path';

const IGNORED_DIRS = new Set(['node_modules', '.git']);

function discover(root: string, file: string): string[] {
  const dirs: string[] = [];
  if (fs.existsSync(path.join(root, file))) dirs.push('.');
  for (const entry of fs.readdirSync(root, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory() || IGNORED_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
    if (fs.existsSync(path.join(root, entry.name, file))) dirs.push(entry.name);
  }
  return dirs;
}

/** Directories with a SKILL.md — what setup installs. */
export function discoverSkillDirs(root: string): string[] {
  return discover(root, 'SKILL.md');
}

/** Absolute paths of every SKILL.md.tmpl — what gen-skill-docs renders. */
export function discoverTemplates(root: string): string[] {
  return discover(root, 'SKILL.md.tmpl').map(dir => path.join(root, dir, 'SKILL.md.tmpl'));
}
