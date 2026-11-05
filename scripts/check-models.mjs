import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import ts from 'typescript';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {MeshoptDecoder} from 'meshoptimizer';

// Check both device detail levels against the URLs actually used by the app.
let compact=false;
const module={exports:{}};
const code=ts.transpileModule(await fs.readFile('src/sceneAssets.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
vm.runInNewContext(code,{module,exports:module.exports,window:{matchMedia:()=>({matches:compact})}});
const required=new Set();
for(const mobile of [false,true]){compact=mobile;for(const url of module.exports.sceneAssetUrls())required.add('public'+url.split('?')[0]);}
const bundled=(await fs.readdir('public/models',{recursive:true})).filter(p=>p.endsWith('.glb')).map(p=>'public/models/'+p.replaceAll('\\','/'));
assert.deepEqual([...required].filter(p=>!bundled.includes(p)),[],'Missing runtime models');
assert.deepEqual(bundled.filter(p=>!required.has(p)),[],'Unused models must not be shipped');

const sources=JSON.parse(await fs.readFile('public/models/sources.json','utf8'));
const male=JSON.parse(await fs.readFile('public/models/characters/male-cardigan.json','utf8'));
for(const record of [...sources.map(r=>({...r,file:'public/models/'+r.file})),male]){
 const bytes=await fs.readFile(record.file);
 assert.equal(bytes.length,record.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),record.sha256);
}
await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
for(const file of required){
 const bytes=await fs.readFile(file);assert.equal(bytes.toString('ascii',0,4),'glTF');
 const doc=await io.read(file),root=doc.getRoot();
 for(const mesh of root.listMeshes())for(const primitive of mesh.listPrimitives())assert(primitive.getAttribute('POSITION').getArray().every(Number.isFinite),file);
 if(file.includes('/characters/')){
  assert(root.listSkins().length>0,file);for(const name of ['Idle_Standing','Walk_Relaxed'])assert(root.listAnimations().some(a=>a.getName()===name),file+': '+name);
  for(const bone of ['head','upperarm_l','lowerarm_l','hand_l','upperarm_r','lowerarm_r','hand_r'])assert(root.listNodes().some(n=>n.getName()===bone),file+': '+bone);
 }
 const json=JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12)));
 assert((json.images||[]).every(image=>image.bufferView!==undefined||image.uri?.startsWith('data:')),file+': textures must be embedded');
}

// Imported source files must be reachable from the entry point.
const reached=new Set();
async function visit(file){
 file=path.resolve(file);if(reached.has(file))return;reached.add(file);
 if(!/\.tsx?$/.test(file))return;
 const source=ts.createSourceFile(file,await fs.readFile(file,'utf8'),ts.ScriptTarget.Latest,true);
 const imports=[];
 function collect(node){
  if((ts.isImportDeclaration(node)||ts.isExportDeclaration(node))&&node.moduleSpecifier)imports.push(node.moduleSpecifier.text);
  if(ts.isCallExpression(node)&&node.expression.kind===ts.SyntaxKind.ImportKeyword&&ts.isStringLiteral(node.arguments[0]))imports.push(node.arguments[0].text);
  ts.forEachChild(node,collect);
 }
 collect(source);
 for(const name of imports){
  if(!name.startsWith('.'))continue;
  const base=path.resolve(path.dirname(file),name);
  for(const candidate of [base,base+'.ts',base+'.tsx',base+'.json',path.join(base,'index.ts'),path.join(base,'index.tsx')]){
   if(await fs.stat(candidate).then(s=>s.isFile()).catch(()=>false)){await visit(candidate);break;}
  }
 }
}
await visit('src/main.tsx');
const unused=(await fs.readdir('src',{recursive:true})).filter(p=>/\.tsx?$/.test(p)).filter(p=>!reached.has(path.resolve('src',p)));
assert.deepEqual(unused,[],'Unused application modules');
console.log('PASS: '+required.size+' runtime models; no unused GLBs or source modules; integrity, geometry, embedded textures and character rigs verified.');
