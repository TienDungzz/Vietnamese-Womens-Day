import { useMemo, useState } from 'react';
import { Quaternion, Vector3 } from 'three';
import { roses } from '../data/roses';
import { ModelRose } from './ModelRose';
import { useGLTF } from '@react-three/drei';
import { bouquetPartUrl } from '../sceneAssets';
const ignoreDecorativeRaycast=()=>{};
export function Bouquet({selected,onSelect,interactive=false,detailed=false}:{selected?:string|null;onSelect?:(id:string)=>void;interactive?:boolean;detailed?:boolean}){
 const story=!interactive&&!detailed;
 return <group>
 {roses.map(r=><group key={r.id} position={r.position} quaternion={new Quaternion().setFromUnitVectors(new Vector3(0,0,1),new Vector3(...r.direction).normalize())} scale={r.size} onPointerOver={interactive?e=>{e.stopPropagation();document.body.style.cursor='pointer'}:undefined} onPointerOut={()=>{document.body.style.cursor='auto'}} onClick={interactive?e=>{e.stopPropagation();if(e.delta<5)onSelect?.(r.id)}:undefined}><group rotation={[0,0,r.twist]}><Rose color={r.color} variant={r.variant} active={selected===r.id} story={story}/></group></group>)}
 <ModelAccessories story={story}/><DecorativeFillers story={story}/>
 </group>;
}
function ModelAccessories({story}:{story:boolean}){
 const {scene}=useGLTF(bouquetPartUrl('accessories',story));
 const model=useMemo(()=>scene.clone(true),[scene]);
 return <primitive object={model} dispose={null}/>;
}
function DecorativeFillers({story}:{story:boolean}){
 const {scene}=useGLTF(bouquetPartUrl('fillers',story));
 const model=useMemo(()=>{const copy=scene.clone(true);copy.name='decorative-meadow-fillers';copy.traverse(o=>{o.raycast=ignoreDecorativeRaycast;o.userData.decorative=true});return copy},[scene]);
 return <primitive object={model} dispose={null}/>;
}
function Rose({color,variant,active,story}:{color:string;variant:number;active:boolean;story:boolean}){
 const [hover,setHover]=useState(false);
 return <group onPointerOver={()=>setHover(true)} onPointerOut={()=>setHover(false)}><ModelRose color={color} variant={variant} story={story} highlight={active?.16:hover?.06:0}/></group>;
}
