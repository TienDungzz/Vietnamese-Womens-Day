import { useEffect, useMemo } from 'react';
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';
export function useSurface(kind:'plaster'|'stone'|'wood'|'grass'|'asphalt'){
 const map=useMemo(()=>{
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
  const ctx=canvas.getContext('2d')!;
  const base={plaster:[177,156,133],stone:[134,128,117],wood:[97,68,48],grass:[89,123,54],asphalt:[69,73,75]}[kind];
  const image=ctx.createImageData(256,256);let seed=31;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){
   const grain=(random()-.5)*(kind==='grass'?40:23)+(kind==='wood'?Math.sin(x*.35+Math.sin(y*.025)*2)*12:0);
   const i=(y*256+x)*4;for(let c=0;c<3;c++)image.data[i+c]=base[c]+grain;image.data[i+3]=255;
  }
  ctx.putImageData(image,0,0);
  if(kind==='stone'){ctx.strokeStyle='#777267';ctx.lineWidth=1;for(let i=0;i<7;i++){ctx.beginPath();ctx.moveTo(random()*256,random()*256);ctx.lineTo(random()*256,random()*256);ctx.stroke()}}
  const texture=new CanvasTexture(canvas);texture.wrapS=texture.wrapT=RepeatWrapping;texture.repeat.set(kind==='grass'?20:2,kind==='grass'?20:2);texture.colorSpace=SRGBColorSpace;return texture;
 },[kind]);
 useEffect(()=>()=>map.dispose(),[map]);return map;
}
