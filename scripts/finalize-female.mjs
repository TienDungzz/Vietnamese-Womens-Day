import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dedup,prune,resample,textureCompress,meshopt} from '@gltf-transform/functions';
import {MeshoptEncoder,MeshoptDecoder} from 'meshoptimizer';
import sharp from 'sharp';
import {readFile} from 'node:fs/promises';
const path=new URL('../public/models/characters/female-grey-jeans.glb',import.meta.url).pathname.replace(/^\/(\w:)/,'$1');
await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready]);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder}),doc=await io.read(decodeURIComponent(path));
for(const animation of doc.getRoot().listAnimations())if(/^Idle_Standing\./.test(animation.getName()))animation.dispose();
for(const material of doc.getRoot().listMaterials())if(material.getName().startsWith('RW Female straight'))material.setExtension('KHR_materials_sheen',null);
for(const texture of doc.getRoot().listTextures())if(/Female straight fiber atlas/i.test(texture.getName()))texture.setImage(await readFile(new URL('../art/characters/textures/female-straight-strands.png',import.meta.url))).setMimeType('image/png');
await doc.transform(dedup(),prune({keepLeaves:true}),resample(),
 textureCompress({encoder:sharp,targetFormat:'webp',resize:[1024,1024],quality:94,pattern:/^(?!.*(?:straight|fiber)).*$/i}),
 textureCompress({encoder:sharp,targetFormat:'webp',resize:[1024,1024],lossless:true,pattern:/straight|fiber/i}),
 meshopt({encoder:MeshoptEncoder,level:'medium'}));
await io.write(decodeURIComponent(path),doc);
console.log('Female animations:',doc.getRoot().listAnimations().map(a=>a.getName()).join(', '));
