import { useLanguage } from '../i18n';
import { useLayoutEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Group, Material, Mesh, Texture } from 'three';
type Signals={onPending:()=>void;onReady:(mode:string)=>void};
export function ScenePending({onPending}:{onPending:()=>void}){
 useLayoutEffect(onPending,[onPending]);return null;
}
export function SceneAssets({urls,mode,children,...signals}:{urls:string[];mode:string;children:ReactNode}&Signals){
 // Individual preloads share exactly the same suspense cache keys as consumers.
 const loaded=urls.map(url=>useGLTF(url));
 // Rose variants share their maps through ModelRose's per-detail texture cache.
 // Warming variant 0 and the separate bouquet parts avoids duplicate GPU uploads.
 const models=useMemo(()=>loaded.filter((_,i)=>! /\/rose-[1-4](?:-|\.glb)/.test(urls[i])),[urls]);
 return <>{children}<PrepareScene key={mode} mode={mode} models={models} {...signals}/></>;
}
function PrepareScene({models,mode,onPending,onReady}:{models:{scene:Group}[];mode:string}&Signals){
 const {gl,scene,camera,invalidate}=useThree();
 const [error,setError]=useState<unknown>(null);
 useLayoutEffect(()=>{
  let cancelled=false,frame=0;onPending();
  async function prepare(){
   const textures=new Set<Texture>();
   const collect=(root:Group|typeof scene)=>root.traverse(o=>{
    if(!(o instanceof Mesh))return;
    for(const material of (Array.isArray(o.material)?o.material:[o.material]) as Material[])
     for(const value of Object.values(material))if(value instanceof Texture)textures.add(value);
   });
   // Prepare the shared maps for the later close-up while the overlay is visible.
   models.forEach(model=>collect(model.scene));collect(scene);
   textures.forEach(texture=>gl.initTexture(texture));
   // Keep compilation and the warm-up draw in one task. Async material polling
   // can outlive StrictMode's material cleanup and leave its promise pending.
   gl.compile(scene,camera);
   const context=gl.getContext();
   for(const program of gl.info.programs??[]){
    if(program.program&&!context.getProgramParameter(program.program,context.LINK_STATUS))throw new Error('Scene shader linking failed');
   }
   gl.render(scene,camera);
   if(cancelled)return;
   if(gl.info.programs?.some(program=>(program as unknown as {diagnostics?:{runnable?:boolean}}).diagnostics?.runnable===false))throw new Error('Scene shader compilation failed');
   invalidate();
   // Wait through a complete frame, rather than only waiting for the network.
   frame=requestAnimationFrame(()=>{frame=requestAnimationFrame(()=>{if(!cancelled)onReady(mode)})});
  }
  // Let StrictMode's effect cleanup finish before creating GPU resources.
  frame=requestAnimationFrame(()=>{void prepare().catch(reason=>{if(!cancelled)setError(reason)})});
  return()=>{cancelled=true;cancelAnimationFrame(frame)};
 },[models,mode,gl,scene,camera,invalidate,onPending,onReady]);
 if(error)throw error;
 return null;
}
export function SceneLoadingOverlay({failed}:{failed:boolean}){
 const {t}=useLanguage();
 return <div className="scene-loading" role={failed?'alert':'status'} aria-live="polite" aria-busy={!failed}>
  {!failed&&<span className="scene-loading-ring" aria-hidden="true"/>}
  <p>{failed?t('Chưa thể tải đầy đủ cảnh.'):t('Chờ một chút nhé, có điều bất ngờ dành cho em…')}</p>
  <small>{failed?t('Bạn có thể thử tải lại.'):t('Những điều đẹp đẽ luôn đáng để chờ đợi.')}</small>
  {failed&&<button onClick={()=>window.location.reload()}>{t('Tải lại')}</button>}
 </div>;
}
