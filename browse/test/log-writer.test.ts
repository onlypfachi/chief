import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { CircularBuffer } from '../src/buffers';
import { createLogWriter } from '../src/log-writer';

let dir: string;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'log-writer-test-'));
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

function readLines(file: string): string[] {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf-8').split('\n').filter(Boolean);
}

describe('createLogWriter', () => {
  it('writes nothing when no entries were added', async () => {
    const file = path.join(dir, 'a.log');
    const flush = createLogWriter([{ buffer: new CircularBuffer<string>(10), path: file, format: e => e }]);
    await flush();
    expect(fs.existsSync(file)).toBe(false);
  });

  it('writes only entries added since the previous flush', async () => {
    const file = path.join(dir, 'a.log');
    const buffer = new CircularBuffer<string>(10);
    const flush = createLogWriter([{ buffer, path: file, format: e => `line ${e}` }]);

    buffer.push('1');
    buffer.push('2');
    await flush();
    buffer.push('3');
    await flush();
    await flush();

    expect(readLines(file)).toEqual(['line 1', 'line 2', 'line 3']);
  });

  it('does not duplicate entries after the buffer wraps around', async () => {
    const file = path.join(dir, 'a.log');
    const buffer = new CircularBuffer<string>(3);
    const flush = createLogWriter([{ buffer, path: file, format: e => e }]);

    buffer.push('1');
    await flush();
    for (const e of ['2', '3', '4', '5']) buffer.push(e);
    await flush();

    // '2' was overwritten before the flush; it is lost, but nothing is written twice
    expect(readLines(file)).toEqual(['1', '3', '4', '5']);
  });

  it('keeps a separate cursor per target', async () => {
    const a = path.join(dir, 'a.log');
    const b = path.join(dir, 'b.log');
    const bufA = new CircularBuffer<string>(10);
    const bufB = new CircularBuffer<string>(10);
    const flush = createLogWriter([
      { buffer: bufA, path: a, format: e => `a:${e}` },
      { buffer: bufB, path: b, format: e => `b:${e}` },
    ]);

    bufA.push('1');
    await flush();
    bufB.push('1');
    bufB.push('2');
    await flush();

    expect(readLines(a)).toEqual(['a:1']);
    expect(readLines(b)).toEqual(['b:1', 'b:2']);
  });

  it('swallows write errors and recovers on the next flush', async () => {
    const good = path.join(dir, 'a.log');
    const buffer = new CircularBuffer<string>(10);
    const target = { buffer, path: path.join(dir, 'missing', 'a.log'), format: (e: string) => e };
    const flush = createLogWriter([target]);

    buffer.push('1');
    await expect(flush()).resolves.toBeUndefined();

    target.path = good;
    await flush();
    expect(readLines(good)).toEqual(['1']);
  });
});
