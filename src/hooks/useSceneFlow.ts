import { useEffect, useState } from 'react';
export type Scene = 'INTRO_READY'|'WALKING'|'AT_DOOR'|'KNOCKING'|'DOOR_OPENING'|'HANDOVER'|'BOUQUET_TRANSITION'|'BOUQUET_EXPLORE';
export function useSceneFlow(reduced:boolean,receiverReady=true,paused=false){
 const [scene,setScene]=useState<Scene>('INTRO_READY');
 useEffect(()=>{if(paused)return;const next:Partial<Record<Scene,[Scene,number]>>={AT_DOOR:['KNOCKING',400],KNOCKING:['DOOR_OPENING',1800],DOOR_OPENING:['HANDOVER',400],HANDOVER:['BOUQUET_TRANSITION',3200],BOUQUET_TRANSITION:['BOUQUET_EXPLORE',1600]};const transition=next[scene];if(!transition)return;const delay=scene==='DOOR_OPENING'&&!receiverReady?15000:reduced?200:transition[1];const t=setTimeout(()=>setScene(transition[0]),delay);return()=>clearTimeout(t)},[scene,reduced,receiverReady,paused]);
 return {scene,setScene,start:()=>setScene(s=>s==='INTRO_READY'?'WALKING':s),reach:()=>setScene(s=>s==='WALKING'?'AT_DOOR':s),skip:()=>setScene('BOUQUET_EXPLORE'),replay:()=>setScene('INTRO_READY')};
}
