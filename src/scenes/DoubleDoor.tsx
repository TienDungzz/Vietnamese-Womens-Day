import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { useSurface } from './useSurface';

export function DoubleDoor({open,reduced,paused}:{open:boolean;reduced:boolean;paused:boolean}){
 const left=useRef<Group>(null),right=useRef<Group>(null),progress=useRef(0);
 const wood=useSurface('wood');
 useFrame((_,dt)=>{
  if(paused)return;
  progress.current+=((open?1:0)-progress.current)*(1-Math.exp(-dt*(reduced?100:3.8)));
  // Both leaves move behind the facade, leaving the handover space clear.
  if(left.current)left.current.rotation.y=progress.current*1.42;
  if(right.current)right.current.rotation.y=-progress.current*1.42;
 });
 return <group name="double-entry-door">
  <mesh receiveShadow position={[0,.32,-2.92]}><boxGeometry args={[1.37,.1,1.5]}/><meshStandardMaterial color="#c2b19c" roughness={.9}/></mesh>
  <mesh position={[0,1.43,-3.51]}><boxGeometry args={[1.34,2.13,.025]}/><meshStandardMaterial color="#e6d6b9" emissive="#ffd8a3" emissiveIntensity={open?.35:.05} roughness={.9}/></mesh>
  {([1,-1] as const).map(side=><group key={side} ref={side===1?left:right} name={side===1?'door-left-hinge':'door-right-hinge'} position={[-side*.65,.39,-2.06]}>
   <group name={side===1?'door-left-leaf':'door-right-leaf'} position={[side*.3225,0,0]}>
    {[-.2925,.2925].map(x=><mesh key={x} castShadow position={[x,1.07,0]}><boxGeometry args={[.06,2.14,.032]}/><meshStandardMaterial map={wood} color="#dac5a6" bumpMap={wood} bumpScale={.004} roughness={.78}/></mesh>)}
    {[.035,1.02,2.105].map(y=><mesh key={y} castShadow position={[0,y,0]}><boxGeometry args={[.645,.07,.032]}/><meshStandardMaterial map={wood} color="#dac5a6" roughness={.78}/></mesh>)}
    <mesh castShadow position={[0,.53,0]}><boxGeometry args={[.53,.93,.015]}/><meshStandardMaterial map={wood} color="#c7b392" bumpMap={wood} bumpScale={.003} roughness={.84}/></mesh>
    <mesh position={[0,1.56,0]}><boxGeometry args={[.53,1.04,.01]}/><meshStandardMaterial color="#dce6df" roughness={.48} metalness={.04} transparent opacity={.8}/></mesh>
    <mesh castShadow position={[side*.23,1.01,.029]}><boxGeometry args={[.018,.12,.022]}/><meshStandardMaterial color="#c3a16a" metalness={.65} roughness={.35}/></mesh>
   </group>
  </group>)}
 </group>;
}
