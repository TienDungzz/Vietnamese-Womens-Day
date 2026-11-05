import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const modules=new Map();
function readModule(name){if(modules.has(name))return modules.get(name);const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(`src/content/${name}.ts`,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(code,{module,exports:module.exports,require:specifier=>readModule(specifier.replace('./','')),URL,AbortController,setTimeout,clearTimeout,fetch});modules.set(name,module.exports);return module.exports}
const {loadContent}=readModule('client'),{parsePhotos,parseWishes}=readModule('schema');
const wishes=Array.from({length:10},(_,i)=>({id:`rose-${String(i+1).padStart(2,'0')}`,title:{vi:`VI ${i}`,en:`EN ${i}`},text:`Text ${i}`}));
const photos=Array.from({length:20},(_,i)=>({id:`photo-${String(i+1).padStart(2,'0')}`,src:`images/${i}.jpg`}));
const fallback={wishes:parseWishes(wishes),photos:parsePhotos(photos,'https://local.test/'),source:'local',photoSource:'demo'};
let calls=0;
const result=await loadContent({contentUrl:'/api/content'},fallback,'https://api.test/',async url=>{calls++;assert.equal(url,'https://api.test/api/content');return new Response(JSON.stringify({wishes:[...wishes].reverse(),photos:[...photos].reverse()}),{status:200})});
assert.equal(calls,1,'One shared GET for combined endpoint');assert.equal(result.content.source,'api');assert.equal(result.content.wishes[0].id,'rose-01');assert.equal(result.content.wishes[0].title.en,'EN 0');assert.equal(result.content.wishes[0].text.en,'Text 0');assert.equal(result.content.photos[0].src,'https://api.test/api/images/0.jpg');assert.equal(result.content.photos[0].thumb,result.content.photos[0].src);
const partial=await loadContent({wishesUrl:'/wishes',photosUrl:'/photos'},fallback,'https://api.test/',async url=>url.endsWith('/wishes')?new Response(JSON.stringify(wishes)):new Response('error',{status:503}));
assert.equal(partial.content.source,'mixed');assert.equal(partial.content.photos,fallback.photos);assert.equal(partial.errors.length,1);
for(const body of [{wishes:wishes.slice(1),photos},{wishes:[wishes[0],...wishes.slice(0,9)],photos},{wishes,photos:photos.slice(1)},{wishes,photos:photos.map((p,i)=>i===0?{...p,src:'javascript:alert(1)'}:p)}]){
 const invalid=await loadContent({contentUrl:'/content'},fallback,'https://api.test/',async()=>new Response(JSON.stringify(body)));assert(invalid.errors.length>0);assert.notEqual(invalid.content.source,'api');
}
const malformed=await loadContent({contentUrl:'/content'},fallback,'https://api.test/',async()=>new Response('<html>error</html>'));assert.equal(malformed.content.source,'local');assert.equal(malformed.errors.length,2);
const timeout=await loadContent({contentUrl:'/content',timeoutMs:10},fallback,'https://api.test/',async(_url,{signal})=>new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('Timed out')))));assert.equal(timeout.content.source,'local');assert.equal(timeout.errors.length,2);
const unchanged=await loadContent({},fallback,'https://api.test/',async()=>{throw Error('Unexpected request')});assert.equal(unchanged.content.source,'local');assert.equal(unchanged.errors.length,0);
console.log('PASS: shared/separate endpoints, ID ordering, VI/EN/plain strings, relative image URLs, partial fallback, malformed/duplicate/missing content, unsafe URLs, timeout and unconfigured mode.');
