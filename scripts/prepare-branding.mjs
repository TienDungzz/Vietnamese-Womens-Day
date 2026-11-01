import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Transparent cutout of the supplied logo; all runtime sizes share this source.
const source=fileURLToPath(new URL('../art/branding/logo-source.png',import.meta.url));
const output=new URL('../public/',import.meta.url);
await mkdir(new URL('images/',output),{recursive:true});
await sharp(source).resize(128,128).png().toFile(fileURLToPath(new URL('images/logo.png',output)));
const icons=[];
for(const size of [16,32,48]){
 const png=await sharp(source).resize(size,size).png().toBuffer();
 icons.push({size,png});
 if(size!==48)await writeFile(new URL(`favicon-${size}x${size}.png`,output),png);
}
// ICO directory with PNG-compressed images for browser compatibility.
const header=Buffer.alloc(6+icons.length*16);header.writeUInt16LE(1,2);header.writeUInt16LE(icons.length,4);
let offset=header.length;
icons.forEach(({size,png},index)=>{const entry=6+index*16;header[entry]=size;header[entry+1]=size;header.writeUInt16LE(1,entry+4);header.writeUInt16LE(32,entry+6);header.writeUInt32LE(png.length,entry+8);header.writeUInt32LE(offset,entry+12);offset+=png.length});
await writeFile(new URL('favicon.ico',output),Buffer.concat([header,...icons.map(icon=>icon.png)]));
await sharp(source).resize(156,156).extend({top:12,bottom:12,left:12,right:12,background:'#fffaf0'}).flatten({background:'#fffaf0'}).png().toFile(fileURLToPath(new URL('apple-touch-icon.png',output)));
console.log('Prepared header logo, 16/32px PNG favicons, 16/32/48px ICO and 180px Apple touch icon.');
