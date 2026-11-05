import { useEffect, useState } from 'react';
import { Edges,Html } from '@react-three/drei';
import { SRGBColorSpace, Texture,TextureLoader } from 'three';
import { useContent } from '../content/ContentProvider';
import { useLanguage } from '../i18n';

import { FrameHitArea } from './FrameHitArea';
export function PhotoStack({onOpen}:{onOpen:()=>void}){
 const {photos}=useContent();
 const {t}=useLanguage();
 const [highlight,setHighlight]=useState(false);
 const [texture,setTexture]=useState<Texture|null>(null);
 useEffect(()=>{let cancelled=false;const loader=new TextureLoader();let owned:Texture|undefined;loader.load(photos[0].thumb,map=>{owned=map;map.colorSpace=SRGBColorSpace;if(cancelled)map.dispose();else setTexture(map)},undefined,()=>{});return()=>{cancelled=true;owned?.dispose()}},[photos]);
 return <group name="photobooth-photo-stack" position={[1.35,-1.15,-.55]} rotation={[-1.02,.12,-.15]} onClick={event=>{event.stopPropagation();if(event.delta<5)onOpen()}} onPointerOver={event=>{event.stopPropagation();setHighlight(true);document.body.style.cursor='pointer'}} onPointerOut={()=>{setHighlight(false);document.body.style.cursor='auto'}}>
  {[-2,-1,0].map((layer,i)=><mesh key={layer} position={[layer*.045,layer*.015,layer*.018]} rotation={[0,0,layer*.12]} castShadow><boxGeometry args={[.86,1.04,.012]}/><meshStandardMaterial color={i===2?'#fff6e8':'#eadccb'} roughness={.88}/>{i===2&&<Edges name="photo-stack-outline" raycast={()=>{}} color="#ffd2e1" transparent opacity={highlight?1:.25} toneMapped={false}/>}</mesh>)}
  <mesh position={[0,.07,.009]}><planeGeometry args={[.72,.73]}/>{texture?<meshBasicMaterial map={texture}/>:<meshStandardMaterial color="#c99eac" roughness={.9}/>}</mesh>
  <mesh position={[0,-.39,.012]}><planeGeometry args={[.25,.015]}/><meshBasicMaterial color="#ac6e7d"/></mesh>
  <Html transform occlude distanceFactor={1} position={[0,0,.025]} zIndexRange={[2,1]}><FrameHitArea inScene label={t('20 khoảnh khắc')} onOpen={onOpen} onHighlight={setHighlight}/></Html>
 </group>;
}
