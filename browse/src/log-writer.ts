/**
 * Log writer — appends new console/network/dialog buffer entries to their log files.
 *
 * Each target keeps a cursor (the buffer's totalAdded at the last flush), so every
 * flush writes only entries added since the previous one.
 */

import * as fs from 'fs';
import type { CircularBuffer } from './buffers';

export interface LogTarget<T> {
  buffer: CircularBuffer<T>;
  path: string;
  format: (entry: T) => string;
}

export function createLogWriter(targets: LogTarget<any>[]): () => Promise<void> {
  const flushed = targets.map(() => 0);
  let flushInProgress = false;

  return async function flush() {
    if (flushInProgress) return; // Guard against concurrent flush
    flushInProgress = true;

    try {
      targets.forEach((target, i) => {
        const newCount = target.buffer.totalAdded - flushed[i];
        if (newCount > 0) {
          const entries = target.buffer.last(Math.min(newCount, target.buffer.length));
          const lines = entries.map(target.format).join('\n') + '\n';
          fs.appendFileSync(target.path, lines);
          flushed[i] = target.buffer.totalAdded;
        }
      });
    } catch {
      // Flush failures are non-fatal — buffers are in memory
    } finally {
      flushInProgress = false;
    }
  };
}
