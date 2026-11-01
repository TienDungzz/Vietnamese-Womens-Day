import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {MeshoptDecoder} from 'three-stdlib';
const decoder=typeof MeshoptDecoder==='function'?MeshoptDecoder():MeshoptDecoder;
await decoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':decoder});
const {records}=JSON.parse(await fs.readFile('public/models/bouquet/manifest.json','utf8'));
assert.equal(records.length,12);
for(const record of records){
 const path=`public/models/bouquet/${record.file}`,bytes=await fs.readFile(path);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),record.sha256);
 const doc=await io.read(path),root=doc.getRoot();
 for(const mesh of root.listMeshes())for(const p of mesh.listPrimitives()){
  assert(p.getAttribute('NORMAL'));
  assert([...p.getAttribute('POSITION').getArray()].every(Number.isFinite));
 }
 assert(root.listMaterials().some(m=>m.getNormalTexture()));
 if(record.file.startsWith('rose-'))assert(root.listMaterials().some(m=>/RW_Petal/.test(m.getName())&&m.getBaseColorTexture()&&m.getMetallicRoughnessTexture()));
 for(const t of root.listTextures())assert(t.getSize().every(n=>n<=(record.quality==='high'?2048:1024)));
}
for(let i=0;i<5;i++)assert(records.find(r=>r.file===`rose-${i}-high.glb`).triangles>records.find(r=>r.file===`rose-${i}-balanced.glb`).triangles);
console.log(`PASS: all ${records.length} assets decode with the runtime Meshopt decoder; hashes, finite geometry, normals, PBR maps and detail budgets verified.`);
