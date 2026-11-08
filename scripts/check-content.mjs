import assert from 'node:assert/strict';
import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync('src/data/wishes.ts','utf8').replace('export const wishes = ','').replace(/;\s*$/, ''));
const rows=fs.readFileSync('docs/product-spec.md','utf8').split(/\r?\n/).filter(s=>s.startsWith('| rose-')).map(row=>row.split('|').map(s=>s.trim()));
assert.equal(data.length,10);assert.equal(new Set(data.map(w=>w.id)).size,10);
// The current specification documents all ten wishes directly.
assert.equal(rows.length,10);
for(let i=0;i<data.length;i++){assert.equal(data[i].id,rows[i][1]);assert.equal(data[i].kind,rows[i][2]);assert.equal(data[i].title,rows[i][3]);assert.equal(data[i].text,rows[i][4]);}
const layout=JSON.parse(fs.readFileSync('src/data/bouquet-layout.json','utf8'));assert.equal(layout.length,data.length);assert.equal(new Set(layout.map(f=>f.position.join(','))).size,10);
console.log('PASS: 10 unique wishes, retained original content and shared 10-flower layout.');
