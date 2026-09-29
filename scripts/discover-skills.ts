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
  for (const name of fs.readdirSync(root).sort((a, b) => a.localeCompare(b))) {
    if (IGNORED_DIRS.has(name) || name.startsWith('.')) continue;
    const dir = path.join(root, name);
    // statSync follows symlinks, matching setup's `*/` glob
    if (!fs.statSync(dir, { throwIfNoEntry: false })?.isDirectory()) continue;
    if (fs.existsSync(path.join(dir, file))) dirs.push(name);
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
