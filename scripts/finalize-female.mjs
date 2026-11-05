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
for(const material of doc.getRoot().listMaterials())if(material.getName().startsWith('RW Soft hair cards female fringe')){material.setAlphaMode('MASK').setAlphaCutoff(.28).setDoubleSided(true);material.setExtension('KHR_materials_sheen',null)}
for(const texture of doc.getRoot().listTextures())if(/Female straight fiber atlas/i.test(texture.getName()))texture.setImage(await readFile(new URL('../art/characters/textures/female-straight-strands.png',import.meta.url))).setMimeType('image/png');
for(const texture of doc.getRoot().listTextures())if(/female[- ]fringe[- ](?:strand atlas|strands)/i.test(texture.getName()))texture.setImage(await readFile(new URL('../art/characters/textures/female-fringe-strands.png',import.meta.url))).setMimeType('image/png');
for(const texture of doc.getRoot().listTextures())if(/female[- ]fringe[- ](?:fiber[- ]normal|normal)/i.test(texture.getName()))texture.setImage(await readFile(new URL('../art/characters/textures/female-fringe-normal.png',import.meta.url))).setMimeType('image/png');
// Compression filters test both name and URI. An empty URI would match the
// general filter and downsample fringe maps before their lossless pass.
for(const texture of doc.getRoot().listTextures())texture.setURI(texture.getName().replace(/[^a-z0-9-]/gi,'-')+'.png');
await doc.transform(dedup(),prune({keepLeaves:true}),resample(),
 textureCompress({encoder:sharp,targetFormat:'webp',resize:[1024,1024],quality:94,pattern:/^(?!.*(?:straight|fiber|fringe)).*$/i}),
 textureCompress({encoder:sharp,targetFormat:'webp',resize:[1024,1024],lossless:true,pattern:/^(?!.*fringe).*(?:straight|fiber)/i}),
 textureCompress({encoder:sharp,targetFormat:'webp',resize:[2048,2048],lossless:true,pattern:/fringe/i}),
 meshopt({encoder:MeshoptEncoder,level:'medium'}));
await io.write(decodeURIComponent(path),doc);
console.log('Female animations:',doc.getRoot().listAnimations().map(a=>a.getName()).join(', '));
