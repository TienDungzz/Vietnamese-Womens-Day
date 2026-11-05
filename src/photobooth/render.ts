import { cropRect, palettes, photos } from './data';
import type { Draft,Entry,Frame,Slot,Photo } from './data';
import type { Language } from '../i18n';
import { frameBackground,slotBorder,frameFinishing } from './decorations';
import { specialCaption } from './specialFrames';
import { shapeFrame,slotPathData } from './shapes';
const cache=new Map<string,Promise<HTMLImageElement>>();
const paths=new WeakMap<Slot,Path2D>();
function photoPath(slot:Slot){let path=paths.get(slot);if(!path){path=new Path2D(slotPathData(slot));paths.set(slot,path)}return path}
export function releasePhotos(){cache.clear()}
export function loadPhoto(id:string,catalog:Photo[]=photos){
 const photo=catalog.find(p=>p.id===id);if(!photo)return Promise.reject(Error('Unknown photo'));
 const key=photo.src;
 if(!cache.has(key))cache.set(key,new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();image.crossOrigin='anonymous';image.onload=()=>{if(image.naturalWidth)resolve(image);else{cache.delete(key);reject(Error(photo.id))}};image.onerror=()=>{cache.delete(key);reject(Error(photo.id))};image.src=photo.src}));
 return cache.get(key)!;
}
export function drawPhoto(ctx:CanvasRenderingContext2D,image:HTMLImageElement,slot:Slot,entry:Entry){
 const r=cropRect(image.naturalWidth,image.naturalHeight,slot.width,slot.height,entry);
 ctx.save();ctx.clip(photoPath(slot));
 ctx.drawImage(image,r.x,r.y,r.width,r.height,slot.x,slot.y,slot.width,slot.height);
 ctx.restore();
}
export function drawFrame(canvas:HTMLCanvasElement,frame:Frame,draft:Draft,images:Map<string,HTMLImageElement>,language:Language,width:number){
 frame=shapeFrame(frame,draft.shapeId);
 canvas.width=width;canvas.height=Math.round(width*frame.height/frame.width);
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas is unavailable');
 ctx.scale(width/frame.width,width/frame.width);
 const palette=palettes.find(p=>p.id===draft.paletteId)??palettes[0];
 frameBackground(ctx,frame,palette);
 ctx.textAlign='center';
 frame.slots.forEach((slot,index)=>{
  ctx.save();if(slot.rotation){ctx.translate(slot.x+slot.width/2,slot.y+slot.height/2);ctx.rotate(slot.rotation);ctx.translate(-slot.x-slot.width/2,-slot.y-slot.height/2)}
  if(!slot.shape||slot.shape==='rect')slotBorder(ctx,slot.x,slot.y,slot.width,slot.height,palette);
  else {
   const path=photoPath(slot);ctx.fillStyle=palette.background;ctx.fill(path);
   ctx.strokeStyle=palette.id==='film'?'#080807':'#fffdf7';ctx.lineWidth=20;ctx.lineJoin='round';ctx.stroke(path);
   ctx.strokeStyle=palette.accent;ctx.lineWidth=3;ctx.stroke(path);
  }
  const entry=draft.entries[index],image=entry?images.get(entry.photoId):undefined;
  if(entry&&image)drawPhoto(ctx,image,slot,entry);else{ctx.save();ctx.clip(photoPath(slot));ctx.fillStyle=palette.background;ctx.fillRect(slot.x,slot.y,slot.width,slot.height);ctx.fillStyle=palette.line;ctx.font='42px Georgia,serif';ctx.fillText(String(index+1).padStart(2,'0'),slot.x+slot.width/2,slot.y+slot.height/2+15);ctx.restore()}
  ctx.restore();
 });
 frameFinishing(ctx,frame,palette);
 if(specialCaption(ctx,frame,palette,language))return;
 ctx.fillStyle=palette.ink;ctx.font='italic 40px Georgia,serif';ctx.fillText(language==='vi'?'20 khoảnh khắc, 10 lời thương':'20 memories, 10 wishes',frame.width/2,frame.height-100,frame.width-150);
 ctx.fillStyle=palette.accent;ctx.font='24px "Be Vietnam Pro",sans-serif';ctx.fillText(language==='vi'?'Gửi em, bằng tất cả dịu dàng':'For you, with all my tenderness',frame.width/2,frame.height-55,frame.width-150);
}
export async function exportFrame(frame:Frame,draft:Draft,language:Language,catalog:Photo[]=photos){
 await document.fonts.ready;
 const entries=draft.entries.slice(0,frame.count);if(entries.some(e=>!e))throw Error('Incomplete frame');
 const ids=[...new Set(entries.map(e=>e!.photoId))],images=new Map(await Promise.all(ids.map(async id=>[id,await loadPhoto(id,catalog)] as const)));
 const canvas=document.createElement('canvas');
 try{drawFrame(canvas,frame,draft,images,language,frame.width);return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('PNG export failed')),'image/png'))}
 finally{canvas.width=1;canvas.height=1}
}
