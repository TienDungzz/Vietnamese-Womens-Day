// Optional, manual asset refresh. Requires network; never runs during npm install/build.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, resample, textureCompress, weld, simplify } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';

const cache='.qa/assets';
await fs.mkdir(cache,{recursive:true});
async function download(url,file){
 try{await fs.access(file);return}catch{}
 const response=await fetch(url);if(!response.ok)throw Error(`${response.status}: ${url}`);
 await fs.mkdir(path.dirname(file),{recursive:true});
 await fs.writeFile(file,Buffer.from(await response.arrayBuffer()));
}
const records=[{file:'plants/potted-plant.glb',input:cache+'/potted/potted.gltf',author:'Rico Cilliers / Poly Haven',source:'https://polyhaven.com/a/potted_plant_01',download:'https://api.polyhaven.com/files/potted_plant_01'}];
await download(records[0].download,cache+'/potted_plant_01.json');
const metadata=JSON.parse(await fs.readFile(cache+'/potted_plant_01.json','utf8'));
const plant=metadata.gltf['1k'].gltf;
await download(plant.url,records[0].input);
await Promise.all(Object.entries(plant.include).map(([file,entry])=>download(entry.url,cache+'/potted/'+file)));
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);
for(const record of records){
 const doc=await io.read(record.input),root=doc.getRoot();
 if(record.file.startsWith('plants/'))await doc.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio:.45,error:.001}));
 await doc.transform(dedup(),prune(),resample(),textureCompress({encoder:sharp,targetFormat:'webp',resize:[1024,1024],quality:82}));
 const out=`public/models/${record.file}`;await fs.mkdir(path.dirname(out),{recursive:true});await io.write(out,doc);
 const bytes=await fs.readFile(out);record.bytes=bytes.length;record.sha256=createHash('sha256').update(bytes).digest('hex');
 record.license='CC0-1.0';record.licenseUrl='https://creativecommons.org/publicdomain/zero/1.0/';
 record.modifications='Textures resized to max 1024px and converted to WebP; duplicate/unused data pruned; plant mesh simplified with bounded geometric error.';
 delete record.input;
 console.log(`${record.file}: ${(bytes.length/1024/1024).toFixed(2)} MiB`);
}
await fs.writeFile('public/models/sources.json',JSON.stringify(records,null,2)+'\n');
