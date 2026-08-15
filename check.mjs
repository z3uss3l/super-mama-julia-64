
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const src = path.join(root, 'src');

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && full.endsWith('.js')) out.push(full);
  }
  return out;
}

const files = walk(src);
let failed = false;

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], {encoding:'utf8'});
  if (result.status !== 0) {
    failed = true;
    process.stderr.write(`Syntaxfehler: ${path.relative(root,file)}\n`);
    process.stderr.write(result.stderr || '');
  }
}

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const importRe = /from\s*['"](\.[^'"]+)['"]/g;
  let match;
  while ((match = importRe.exec(text))) {
    const spec = match[1];
    const resolved = path.resolve(path.dirname(file), spec);
    if (!fs.existsSync(resolved) && !fs.existsSync(`${resolved}.js`)) {
      failed = true;
      process.stderr.write(`Fehlender lokaler Import: ${path.relative(root,file)} -> ${spec}\n`);
    }
  }
}

if (failed) process.exit(1);
console.log(`check: PASS (${files.length} JavaScript-Dateien)`);
