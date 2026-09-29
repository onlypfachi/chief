/**
 * Path validation for commands that read or write local files — prevents path traversal.
 * Files must stay within /tmp or the working directory.
 */

import * as path from 'path';

export const SAFE_DIRECTORIES = ['/tmp', process.cwd()];

export function validateReadPath(filePath: string): void {
  if (path.isAbsolute(filePath)) {
    const resolved = path.resolve(filePath);
    const isSafe = SAFE_DIRECTORIES.some(dir => resolved === dir || resolved.startsWith(dir + '/'));
    if (!isSafe) {
      throw new Error(`Absolute path must be within: ${SAFE_DIRECTORIES.join(', ')}`);
    }
  }
  const normalized = path.normalize(filePath);
  if (normalized.includes('..')) {
    throw new Error('Path traversal sequences (..) are not allowed');
  }
}

export function validateOutputPath(filePath: string): void {
  const resolved = path.resolve(filePath);
  const isSafe = SAFE_DIRECTORIES.some(dir => resolved === dir || resolved.startsWith(dir + '/'));
  if (!isSafe) {
    throw new Error(`Path must be within: ${SAFE_DIRECTORIES.join(', ')}`);
  }
}
