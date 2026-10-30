import { useState } from 'react';
import { DoubleSide } from 'three';
import { roses } from '../data/roses';
export function Bouquet({selected,onSelect,interactive=false}:{selected?:string|null;onSelect?:(id:string)=>void;interactive?:boolean}){
 return <group rotation={[.25,0,0]}>
 {roses.map((r,i)=><group key={r.id} position={r.position} rotation={[i*.035,(i*.9),.12*Math.sin(i)]} scale={r.size} onPointerOver={interactive?e=>{e.stopPropagation();document.body.style.cursor='pointer'}:undefined} onPointerOut={()=>{document.body.style.cursor='auto'}} onClick={interactive?e=>{e.stopPropagation();if(e.delta<5)onSelect?.(r.id)}:undefined}>
 <Rose color={r.color} variant={r.variant} active={selected===r.id}/>
 </group>)}
 {roses.map((r,i)=><group key={'stem'+r.id}><mesh position={[r.position[0]/2,.05,r.position[2]/2]} rotation={[0,0,-r.position[0]*.55]}><cylinderGeometry args={[.018,.025,2,6]}/><meshStandardMaterial color="#33523d"/></mesh><mesh position={[r.position[0]*.9,.55,r.position[2]-.1]} rotation={[.3,i,Math.PI/3]} scale={[.16,.38,.035]}><sphereGeometry args={[1,10,8]}/><meshStandardMaterial color="#3d6046" roughness={.8}/></mesh></group>)}
 <mesh position={[0,-.24,0]} rotation={[0,0,Math.PI]}><coneGeometry args={[1.05,1.85,7,1,true]}/><meshStandardMaterial color="#dfb9a8" side={DoubleSide} roughness={.9}/></mesh>
 <mesh position={[0,-.45,.47]} rotation={[0,0,.22]} scale={[.55,.2,.06]}><torusGeometry args={[.36,.1,8,24]}/><meshStandardMaterial color="#a3465b" roughness={.35}/></mesh>
 <mesh position={[.3,-.45,.47]} rotation={[0,0,-.22]} scale={[.55,.2,.06]}><torusGeometry args={[.36,.1,8,24]}/><meshStandardMaterial color="#a3465b" roughness={.35}/></mesh>
 </group>
}
function Rose({color,variant,active}:{color:string;variant:number;active:boolean}){
 const [hover,setHover]=useState(false);
 const layers=variant===2?3:variant===1?4:5;
 return <group onPointerOver={()=>setHover(true)} onPointerOut={()=>setHover(false)} rotation={[.5,0,0]}>
 {Array.from({length:layers},(_,layer)=>Array.from({length:5+layer},(_,p)=>{const a=p/(5+layer)*Math.PI*2+layer*.7;const radius=.035+layer*(variant===2?.035:.055);return <mesh key={layer+'-'+p} position={[Math.cos(a)*radius,Math.sin(a)*radius, .14-layer*.045]} rotation={[Math.sin(a)*.5,Math.cos(a)*-.5,a+(variant===3?.24:0)]} scale={[.11+layer*.027,.15+layer*.017,.045]}><sphereGeometry args={[1,12,8]}/><meshStandardMaterial color={color} roughness={.58} emissive={color} emissiveIntensity={active?.32:hover?.14:0} metalness={.02}/></mesh>}))}
 </group>
}
