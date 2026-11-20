// Verifies loader.js script list and all data/*.json sets.
// Usage: node tools/check-data.mjs
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const loader = fs.readFileSync(path.join(root, 'loader.js'), 'utf8');
const files = [...loader.matchAll(/^\s*'(js\/[^']+\.js)',?$/gm)].map(m => m[1]);
const dataNames = [...loader.match(/var DATA_FILES = \[([^\]]*)\]/)[1].matchAll(/'([^']+)'/g)].map(m => m[1]);

const problems = [];
for (const f of files) {
  if (!fs.existsSync(path.join(root, f))) problems.push(`missing script ${f}`);
}

const YOUTH_RE = /\b(child(ren|like|ish)?|kids?|loli(ta|con)?|shota(con)?|toddlers?|infants?|bab(y|ies)|pre-?teens?|teens?|teenag(er|e)|underage|minors?|school ?girls?|middle ?school|high ?school|elementary|little girls?|young girls?|girlish|tiny body|(1[0-7]|[1-9]) ?(yo|y\/o|years? old))\b/i;

for (const n of dataNames) {
  const p = path.join(root, 'data', `${n}.json`);
  if (!fs.existsSync(p)) {
    problems.push(`missing data/${n}.json`);
    continue;
  }
  try {
    const raw = fs.readFileSync(p, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') problems.push(`data/${n}.json must be an object`);
    if (['people', 'scenes', 'services', 'snippets'].includes(n)) {
      const m = raw.match(YOUTH_RE);
      if (m) problems.push(`data/${n}.json contains youth-coded term: "${m[0]}"`);
    }
  } catch (e) {
    problems.push(`data/${n}.json: ${e.message}`);
  }
}

if (problems.length) {
  console.error('Problems:\n  ' + problems.join('\n  '));
  process.exit(1);
}
console.log(`OK: ${files.length} scripts, ${dataNames.length} data sets`);
