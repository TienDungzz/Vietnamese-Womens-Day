import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {getBounds} from '@gltf-transform/functions';
import {MeshoptDecoder} from 'three-stdlib';
const decoder=typeof MeshoptDecoder==='function'?MeshoptDecoder():MeshoptDecoder;await decoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':decoder});
const meta=JSON.parse(await fs.readFile('public/models/characters/male-cardigan.json','utf8'));
const bytes=await fs.readFile(meta.file);assert.equal(createHash('sha256').update(bytes).digest('hex'),meta.sha256);
const doc=await io.read(meta.file),root=doc.getRoot();
assert(root.listSkins().length>0);
for(const name of ['Idle_Standing','Walk_Relaxed'])assert(root.listAnimations().some(a=>a.getName()===name));
for(const name of ['RW Oversized open charcoal cardigan','RW Relaxed cream trousers','RW Side part 73 cap','RW Side part 73 sweep','RW Soft 73 fringe'])assert(root.listNodes().some(n=>n.getName()===name),name);
assert(root.listMaterials().some(m=>m.getName().startsWith('RW Soft hair cards')&&m.getAlphaMode()==='MASK'&&m.getBaseColorTexture()),'Hair must retain strand opacity texture');
assert(!root.listNodes().some(n=>/Filler|rose-|Bouquet/i.test(n.getName())));
for(const node of root.listNodes()){
 const allowed=node.getName()==='RW Oversized open charcoal cardigan'?['spine_01','spine_03']:node.getName()==='RW Dropped knit sleeve l'?['upperarm_l','lowerarm_l']:node.getName()==='RW Dropped knit sleeve r'?['upperarm_r','lowerarm_r']:null;
 if(!allowed)continue;
 const joints=node.getSkin().listJoints();
 for(const p of node.getMesh().listPrimitives()){
  const ids=p.getAttribute('JOINTS_0').getArray(),weights=p.getAttribute('WEIGHTS_0').getArray();
  for(let i=0;i<ids.length;i++)if(weights[i]>.001)assert(allowed.includes(joints[ids[i]].getName()),'Unexpected arm/hand influence on garment');
 }
}
for(const mesh of root.listMeshes())for(const p of mesh.listPrimitives()){
 assert([...p.getAttribute('POSITION').getArray()].every(Number.isFinite));
 const weights=p.getAttribute('WEIGHTS_0');if(weights){const a=weights.getArray(),scale=weights.getNormalized()?(a instanceof Uint8Array?255:65535):1;for(let i=0;i<a.length;i+=4)assert(Math.abs((a[i]+a[i+1]+a[i+2]+a[i+3])/scale-1)<.015)}
}
const bounds=getBounds(root.listScenes()[0]);assert(bounds.max[1]-bounds.min[1]<2.2);
for(const clip of root.listAnimations()){
 let seam=0;
 for(const channel of clip.listChannels())if(channel.getTargetPath()==='rotation'){
  const a=channel.getSampler().getOutput().getArray();let dot=0;for(let i=0;i<4;i++)dot+=a[i]*a[a.length-4+i];seam=Math.max(seam,2*Math.acos(Math.min(1,Math.abs(dot))));
 }
 console.log(clip.getName(),'maximum loop seam:',(seam*180/Math.PI).toFixed(2),'degrees');
}
console.log('PASS: runtime Meshopt decoding, skinned garments/hair, normalized weights, clips, finite geometry and provenance hash.');
