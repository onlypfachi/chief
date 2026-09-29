import { SNAPSHOT_FLAGS } from '../../browse/src/snapshot';
import type { TemplateContext } from './types';

export function generateSnapshotFlags(_ctx: TemplateContext): string {
  const lines: string[] = [
    'The snapshot is your primary tool for understanding and interacting with pages.',
    '',
    '```',
  ];

  for (const flag of SNAPSHOT_FLAGS) {
    const label = flag.valueHint ? `${flag.short} ${flag.valueHint}` : flag.short;
    lines.push(`${label.padEnd(10)}${flag.long.padEnd(24)}${flag.description}`);
  }

  lines.push('```');
  lines.push('');
  lines.push('All flags can be combined freely. `-o` only applies when `-a` is also used.');
  lines.push('Example: `$B snapshot -i -a -C -o /tmp/annotated.png`');
  lines.push('');
  lines.push('**Ref numbering:** @e refs are assigned sequentially (@e1, @e2, ...) in tree order.');
  lines.push('@c refs from `-C` are numbered separately (@c1, @c2, ...).');
  lines.push('');
  lines.push('After snapshot, use @refs as selectors in any command:');
  lines.push('```bash');
  lines.push('$B click @e3       $B fill @e4 "value"     $B hover @e1');
  lines.push('$B html @e2        $B css @e5 "color"      $B attrs @e6');
  lines.push('$B click @c1       # cursor-interactive ref (from -C)');
  lines.push('```');
  lines.push('');
  lines.push('**Output format:** indented accessibility tree with @ref IDs, one element per line.');
  lines.push('```');
  lines.push('  @e1 [heading] "Welcome" [level=1]');
  lines.push('  @e2 [textbox] "Email"');
  lines.push('  @e3 [button] "Submit"');
  lines.push('```');
  lines.push('');
  lines.push('Refs are invalidated on navigation — run `snapshot` again after `goto`.');

  return lines.join('\n');
}
