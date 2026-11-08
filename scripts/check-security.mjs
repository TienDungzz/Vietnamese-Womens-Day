import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync, spawnSync } from 'node:child_process';
import ts from 'typescript';

function inspectSource(text, file = 'fixture.tsx') {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const errors = [];
  const report = node => {
    const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
    errors.push(file + ':' + line + ': dynamic code or unsafe HTML sink');
  };
  function visit(node) {
    if (ts.isJsxAttribute(node) && node.name.getText(source) === 'dangerouslySetInnerHTML') report(node);
    if ((ts.isCallExpression(node) || ts.isNewExpression(node))) {
      const callee = node.expression;
      if (ts.isIdentifier(callee) && ['eval', 'Function'].includes(callee.text)) report(node);
      if (ts.isPropertyAccessExpression(callee) && (
        ['eval', 'Function'].includes(callee.name.text) ||
        (callee.expression.getText(source) === 'document' && ['write', 'writeln'].includes(callee.name.text))
      )) report(node);
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isPropertyAccessExpression(node.left) && ['innerHTML', 'outerHTML'].includes(node.left.name.text)) report(node);
    ts.forEachChild(node, visit);
  }
  visit(source);
  return errors;
}
function forbiddenFile(file) {
  const normalized = file.replaceAll('\\', '/');
  return normalized.split('/').some(part =>
    ['.git', '.qa', '.codex', '.agents', 'node_modules', 'art', 'scripts'].includes(part) ||
    (part.startsWith('.env') && part !== '.env.example')) ||
    /\.(?:blend\d*|py|pem|key|p12|pfx)$/i.test(normalized);
}
if (process.argv.includes('--self-test')) {
  for (const code of [
    'eval("x")', 'new Function("x")', 'window.eval("x")',
    'document.write("x")', 'el.innerHTML = html', 'el.outerHTML = html',
    'const view = <div dangerouslySetInnerHTML={{__html: value}} />;',
  ]) assert(inspectSource(code).length > 0, 'Checker missed unsafe fixture');
  for (const code of ['const view = <div>{text}</div>;', '// eval("x")', 'const text = "innerHTML";']) {
    assert.equal(inspectSource(code).length, 0, 'False positive on safe fixture');
  }
  for (const file of ['.env', '.env.production', 'models/test.blend', '.git/config', '.qa/log.txt']) assert(forbiddenFile(file));
  for (const file of ['.env.example', 'models/rose.glb', 'assets/app.js']) assert(!forbiddenFile(file));
  console.log('PASS: security checker rejects unsafe fixtures and accepts safe fixtures.');
} else {
  const errors = [];
  for (const file of fs.readdirSync('src', { recursive: true }).filter(file => /\.tsx?$/.test(file))) {
    errors.push(...inspectSource(fs.readFileSync(path.join('src', file), 'utf8'), path.join('src', file)));
  }
  // Only tracked private configuration is a Git leak; local ignored .env files are expected.
  const tracked = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
  for (const file of tracked) {
    if (file.split('/').some(part => part.startsWith('.env') && part !== '.env.example') ||
      /\.(?:pem|key|p12|pfx)$/i.test(file)) errors.push(file + ': private configuration tracked in Git');
  }
  assert(fs.existsSync('package-lock.json'), 'Missing dependency lockfile');
  for (const root of ['public', 'dist']) {
    if (!fs.existsSync(root)) continue;
    for (const file of fs.readdirSync(root, { recursive: true })) {
      if (forbiddenFile(file)) errors.push(root + '/' + file + ': internal/private artifact must not ship');
    }
  }
  assert.equal(errors.length, 0, errors.join('\n'));
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync('src/content/schema.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, URL });
  const photos = Array.from({ length: 20 }, (_, i) => ({ id: 'photo-' + String(i + 1).padStart(2, '0'), src: '/safe.jpg' }));
  for (const src of ['javascript:alert(1)', 'data:image/png;base64,AAAA', 'file:///private', 'blob:https://site.test/id', 'https://user:pass@site.test/a.jpg', 'ftp://site.test/a.jpg']) {
    for (const field of ['src', 'thumb']) {
      assert.throws(() => module.exports.parsePhotos(photos.map((photo, i) => i ? photo : { ...photo, [field]: src }), 'https://site.test/'));
    }
  }
  const result = spawnSync(process.execPath, ['scripts/check-content-api.mjs'], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
  console.log('PASS: source sinks, tracked private files, public/dist artifacts and unsafe API image URLs.');
}
