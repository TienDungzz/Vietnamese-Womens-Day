import { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { FrontSide, Mesh, MeshStandardMaterial, Texture } from 'three';
import { bouquetDetail, roseModelUrl } from '../sceneAssets';

// The five shapes use the same maps; upload each map once per detail level.
const sharedTextures=new Map<string,Texture>();

export function ModelRose({color,variant,highlight,story=false}:{color:string;variant:number;highlight:number;story?:boolean}){
 const quality=story?'story':bouquetDetail();
 const {scene}=useGLTF(roseModelUrl(variant,story));
 const model=useMemo(()=>{
  const copy=scene.clone(true),petals:MeshStandardMaterial[]=[],owned:MeshStandardMaterial[]=[];
  copy.traverse(o=>{if(o instanceof Mesh){o.castShadow=true;o.receiveShadow=false;
   const cloneMaterial=(m:MeshStandardMaterial)=>{const material=m.clone();material.side=FrontSide;owned.push(material);
    for(const slot of ['map','normalMap','roughnessMap','metalnessMap','aoMap'] as const){const texture=material[slot];if(texture?.name){const key=quality+':'+texture.name;const shared=sharedTextures.get(key);if(shared)material[slot]=shared;else sharedTextures.set(key,texture)}}
    if(/RW_Petal/i.test(material.name)){material.color.set(color);material.emissive.set(color);petals.push(material)}return material};
   o.material=Array.isArray(o.material)?o.material.map(cloneMaterial):cloneMaterial(o.material);
  }});
  return {copy,petals,owned};
 },[scene,color,quality]);
 useEffect(()=>{model.petals.forEach(m=>{m.emissiveIntensity=highlight})},[model,highlight]);
 useEffect(()=>()=>model.owned.forEach(m=>m.dispose()),[model]);
 return <primitive object={model.copy} dispose={null}/>;
}
