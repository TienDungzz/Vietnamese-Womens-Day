import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, join, textureCompress, meshopt, getBounds } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';

await MeshoptEncoder.ready;await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
await fs.mkdir('public/models/bouquet',{recursive:true});
const requested=process.argv.slice(2);
const records=requested.length?JSON.parse(await fs.readFile('public/models/bouquet/manifest.json','utf8')).records.filter(r=>!requested.includes(r.file.replace(/\.glb$/,''))):[];
let jobs=['high','balanced'].flatMap(quality=>Array.from({length:5},(_,i)=>({name:`rose-${i}-${quality}`,quality})));
jobs.push({name:'accessories',quality:'high'});
jobs.push({name:'fillers',quality:'high'});
if(requested.length)jobs=jobs.filter(j=>requested.includes(j.name));
for(const {name,quality} of jobs){
 const doc=await io.read(`.qa/bouquet/raw/${name}.glb`),max=quality==='high'?2048:1024;
 await doc.transform(
  dedup(),prune(),join(),prune(),
  textureCompress({encoder:sharp,targetFormat:'webp',resize:[max,max],quality:92,pattern:/^(?!.*(?:Veins|Weave|Fibers)).*$/i}),
  textureCompress({encoder:sharp,targetFormat:'webp',resize:[max,max],lossless:true,pattern:/Veins|Weave|Fibers/i}),
  meshopt({encoder:MeshoptEncoder,level:'medium'})
 );
 const file=`${name}.glb`,path=`public/models/bouquet/${file}`;await io.write(path,doc);
 const bytes=await fs.readFile(path),root=doc.getRoot();
 const triangles=root.listMeshes().reduce((sum,m)=>sum+m.listPrimitives().reduce((s,p)=>s+(p.getIndices()?.getCount()??p.getAttribute('POSITION').getCount())/3,0),0);
 records.push({file,quality,triangles,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),bounds:getBounds(root.listScenes()[0]),author:'Rose Wishes project',source:['accessories','fillers'].includes(name)?'art/bouquet/rose-wishes-natural.blend':'art/bouquet/rose-wishes-bouquet.blend',recipe:name==='fillers'?'scripts/blender/build_fillers.py':'scripts/blender/build_bouquet.py',license:'project-original',textures:root.listTextures().map(t=>({name:t.getName(),size:t.getSize()}))});
 console.log(`${file}: ${(bytes.length/1024).toFixed(0)} KiB, ${triangles} triangles`);
}
await fs.writeFile('public/models/bouquet/manifest.json',JSON.stringify({description:'Blender-authored bouquet meshes. Every rose ID remains assigned by src/data/roses.ts. Embedded PBR textures, Meshopt geometry. Original project geometry and maps; no third-party model or generated paid API used.',records},null,2)+'\n');
