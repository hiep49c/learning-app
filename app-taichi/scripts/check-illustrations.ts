/** Verify every illustration/thumbnail key used in data exists in PoseIllustration POSES. */
import { readFileSync } from 'fs';
import { join } from 'path';
import { FORMS } from '../src/data';

const src = readFileSync(join(__dirname, '..', 'src', 'components', 'PoseIllustration.tsx'), 'utf8');
// crude parse of POSES keys
const block = src.slice(src.indexOf('const POSES'));
const keys = new Set<string>();
for (const m of block.matchAll(/^\s{2}([a-zA-Z0-9]+):\s*\(/gm)) keys.add(m[1]);

const used = new Set<string>();
FORMS.forEach((f) => {
  used.add(f.thumbnail);
  f.sections.forEach((s) => {
    if (s.type === 'image') used.add(s.illustration);
  });
});

let missing = 0;
for (const u of used) {
  const ok = keys.has(u);
  if (!ok) missing++;
  console.log(`${ok ? '✓' : '✗ MISSING'}  ${u}`);
}
console.log(`\nPOSES keys: ${keys.size} | used keys: ${used.size} | missing: ${missing}`);
if (missing > 0) process.exit(1);
