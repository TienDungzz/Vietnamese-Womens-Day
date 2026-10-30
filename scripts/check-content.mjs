import assert from 'node:assert/strict';
import fs from 'node:fs';
const data = JSON.parse(fs.readFileSync('src/data/wishes.ts','utf8').replace('export const wishes = ','').replace(/;\s*$/, ''));
const rows = fs.readFileSync('ROSE_WISHES_20_10_SPEC.md','utf8').split(/\r?\n/).filter(s=>s.startsWith('| rose-'));
assert.equal(data.length,11);
assert.equal(new Set(data.map(w=>w.id)).size,11);
rows.forEach((row,i)=>{const p=row.split('|').map(s=>s.trim());assert.equal(data[i].id,p[1]);assert.equal(data[i].title,p[3]);assert.equal(data[i].text,p[4]);});
console.log('PASS: 11 unique rose IDs; all titles and wishes match the specification.');
