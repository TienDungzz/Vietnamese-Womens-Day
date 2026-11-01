// Small in the garden: keep the detailed master for the dedicated bouquet view.
import fs from 'node:fs/promises';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {weld,simplify,textureCompress,meshopt,prune} from '@gltf-transform/functions';
import {MeshoptDecoder,MeshoptEncoder,MeshoptSimplifier} from 'meshoptimizer';
import sharp from 'sharp';
await Promise.all([MeshoptDecoder.ready,MeshoptEncoder.ready,MeshoptSimplifier.ready]);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder,'meshopt.encoder':MeshoptEncoder});
await fs.mkdir('public/models/bouquet/story',{recursive:true});
const requested=new Set(process.argv.slice(2));
for(const name of [...Array.from({length:5},(_,i)=>`rose-${i}`),'accessories','fillers'].filter(name=>!requested.size||requested.has(name))){
 const source=`public/models/bouquet/${name}${name.startsWith('rose')?'-balanced':''}.glb`;
 const d=await io.read(source);
 await d.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio:.20,error:.003}),prune(),textureCompress({encoder:sharp,targetFormat:'webp',resize:[512,512],quality:82}),meshopt({encoder:MeshoptEncoder,level:'medium'}));
 await io.write(`public/models/bouquet/story/${name}.glb`,d);
 console.log(name,d.getRoot().listMeshes().reduce((n,m)=>n+m.listPrimitives().reduce((s,p)=>s+(p.getIndices()?.getCount()??0)/3,0),0),'triangles');
}
