import { readdir,mkdir,writeFile,copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
const source=new URL('../art/photos/originals/',import.meta.url),stage=new URL('../.qa/photos-prepared/',import.meta.url),output=new URL('../public/photos/',import.meta.url);
await mkdir(source,{recursive:true});
const files=(await readdir(source)).filter(name=>/\.(jpe?g|png|webp|avif)$/i.test(name));
const jobs=Array.from({length:20},(_,i)=>{const number=String(i+1).padStart(2,'0'),matches=files.filter(name=>name.replace(/\.[^.]+$/,'')===number);if(matches.length!==1)throw Error(`Expected exactly one image named ${number}.jpg/.png/.webp/.avif in art/photos/originals`);return {number,file:matches[0]}});
if(files.length!==20)throw Error('Expected exactly 20 source images; remove duplicate or extra image files.');
await mkdir(new URL('thumbs/',stage),{recursive:true});
const records=[];
for(const {number,file} of jobs){
 const input=fileURLToPath(new URL(file,source)),name=`photo-${number}.webp`;
 const full=await sharp(input).rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).webp({quality:94}).toBuffer({resolveWithObject:true});
 await writeFile(new URL(name,stage),full.data);
 await sharp(input).rotate().resize({width:320,height:320,fit:'inside',withoutEnlargement:true}).webp({quality:82}).toFile(fileURLToPath(new URL(`thumbs/${name}`,stage)));
 records.push({id:`photo-${number}`,source:file,width:full.info.width,height:full.info.height,bytes:full.data.length,sha256:createHash('sha256').update(full.data).digest('hex')});
}
// Publish only after every source image has decoded and been prepared.
await mkdir(new URL('thumbs/',output),{recursive:true});
for(const {number} of jobs){const name=`photo-${number}.webp`;await copyFile(new URL(name,stage),new URL(name,output));await copyFile(new URL(`thumbs/${name}`,stage),new URL(`thumbs/${name}`,output))}
await writeFile(new URL('catalog.json',output),JSON.stringify({count:20,records},null,2)+'\n');
await writeFile(new URL('../src/photobooth/photos.json',import.meta.url),JSON.stringify({mode:'fixed',provider:'Project photos',photos:records.map(record=>({id:record.id,src:`/photos/${record.id}.webp`,thumb:`/photos/thumbs/${record.id}.webp`}))},null,2)+'\n');
console.log('Prepared 20 local photos (max 1600px) and 20 thumbnails (max 320px). Source metadata is omitted from exported images.');
