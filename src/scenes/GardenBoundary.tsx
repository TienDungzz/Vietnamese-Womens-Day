import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { RoundedBox } from '@react-three/drei';

export function GardenSwing({reduced}:{reduced:boolean}){
 const seat=useRef<Group>(null);
 useFrame(({clock})=>{if(seat.current)seat.current.rotation.x=reduced?0:Math.sin(clock.elapsedTime*.9)*.045});
 return <group name="garden-swing" position={[-3.95,0,.55]} rotation={[0,.22,0]}>
 {[-1,1].map(side=><group key={side} position={[side*.95,0,0]}>{[-1,1].map(leg=><mesh key={leg} castShadow position={[0,1.16,leg*.35]} rotation={[-leg*.28,0,0]}><cylinderGeometry args={[.065,.08,2.45,12]}/><meshStandardMaterial color="#95734d" roughness={.9}/></mesh>)}</group>)}
 <mesh castShadow position={[0,2.32,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.075,.075,2.25,12]}/><meshStandardMaterial color="#98784f" roughness={.85}/></mesh>
 <group ref={seat} position={[0,2.23,0]}>{[-.65,.65].map(x=><group key={x}><mesh position={[x,-.81,0]}><cylinderGeometry args={[.012,.012,1.62,8]}/><meshStandardMaterial color="#c9b18a" roughness={1}/></mesh><mesh position={[x,-.81,.35]}><cylinderGeometry args={[.012,.012,1.62,8]}/><meshStandardMaterial color="#c9b18a" roughness={1}/></mesh></group>)}
 <RoundedBox castShadow args={[1.55,.1,.65]} radius={.035} smoothness={2} position={[0,-1.65,.16]}><meshStandardMaterial color="#ad8964" roughness={.9}/></RoundedBox>
 <RoundedBox castShadow args={[1.55,.52,.07]} radius={.035} smoothness={2} position={[0,-1.39,-.15]} rotation={[.1,0,0]}><meshStandardMaterial color="#b69772" roughness={.88}/></RoundedBox>
 <mesh position={[0,-1.57,.14]}><boxGeometry args={[1.3,.08,.48]}/><meshStandardMaterial color="#d9b5ac" roughness={1}/></mesh>
 </group>
 </group>;
}
