import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';

const config = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
assert(!config.error, 'Cannot read tsconfig.json');
for (const flag of ['strict', 'noUnusedLocals', 'noUnusedParameters']) {
  assert.equal(config.config.compilerOptions?.[flag], true, 'Required TypeScript option: ' + flag);
}
for (const file of ['coding', 'performance', 'security'].map(name => 'docs/' + name + '-standards.md')) {
  const content = fs.readFileSync(file);
  assert.equal(content.toString('utf8').includes('\uFFFD'), false, file + ': invalid UTF-8');
  assert.equal(content[0] === 0xef && content[1] === 0xbb && content[2] === 0xbf, false, file + ': unexpected BOM');
  assert.equal(content.toString('utf8').endsWith('\n'), true, file + ': missing final newline');
}
for (const args of [['node_modules/typescript/bin/tsc', '--noEmit', '--pretty', 'false'], ['scripts/check-styles.mjs']]) {
  const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log('PASS: required TypeScript flags, compiler, BEM and standards document encoding.');
