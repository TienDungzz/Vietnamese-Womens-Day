import { useMemo } from 'react';
import { CatmullRomCurve3, Vector3 } from 'three';
import { RoundedBox } from '@react-three/drei';
import { useSurface } from './useSurface';

export function WoodenBridge(){
 const wood=useSurface('wood'),stone=useSurface('stone');
 const rise=(t:number)=>.16+.26*Math.sin(t*Math.PI);
 const rails=useMemo(()=>[-1,1].flatMap(side=>[.46,.88].map(height=>new CatmullRomCurve3(Array.from({length:13},(_,i)=>new Vector3(side*.82,rise(i/12)+height,-6.45-i/12*7.25))))),[]);
 return <group name="wooden-river-bridge">
  <group position={[6.3,0,-3.2]}>
   {Array.from({length:30},(_,i)=>{const t=i/29;return <mesh key={i} castShadow receiveShadow position={[0,rise(t),-6.45-t*7.25]} rotation={[Math.atan(.26*Math.PI/7.25*Math.cos(t*Math.PI)),0,0]}><boxGeometry args={[1.78,.11,.235]}/><meshStandardMaterial map={wood} color={i%3?'#d4b58b':'#b89a73'} roughness={.86}/></mesh>})}
   {[-1,1].map(side=>Array.from({length:7},(_,i)=>{const t=i/6,y=rise(t);return <group key={side+'-'+i}>
    <mesh castShadow position={[side*.82,y+.44,-6.45-t*7.25]}><boxGeometry args={[.09,.98,.09]}/><meshStandardMaterial map={wood} color="#b6936e" roughness={.9}/></mesh>
    <mesh castShadow position={[side*.82,y+.96,-6.45-t*7.25]}><sphereGeometry args={[.065,10,8]}/><meshStandardMaterial color="#bd9c75" roughness={.85}/></mesh>
   </group>}))}
   {rails.map((curve,i)=><mesh key={i} castShadow><tubeGeometry args={[curve,40,.035,8,false]}/><meshStandardMaterial map={wood} color="#c3a17b" roughness={.85}/></mesh>)}
   {[-7.2,-10,-12.9].map(z=>[-.65,.65].map(x=><mesh key={z+'-'+x} castShadow position={[x,-.1,z]}><boxGeometry args={[.16,.8,.17]}/><meshStandardMaterial map={wood} color="#8c7358" roughness={1}/></mesh>))}
   {[-6.14,-14].map(z=><RoundedBox key={z} args={[1.8,.12,.42]} radius={.035} smoothness={2} position={[0,.055,z]} receiveShadow><meshStandardMaterial map={stone} color="#d0c4aa" roughness={.95}/></RoundedBox>)}
  </group>
  {/* A separate lane branches directly from the main street to the bridge. */}
  {Array.from({length:41},(_,i)=><RoundedBox key={i} name={`bridge-path-side-${i}`} args={[1.15,.06,.38]} radius={.035} smoothness={2} position={[6.3,.025,6.45-i*.4]} receiveShadow><meshStandardMaterial map={stone} color={i%3?'#d3c8b3':'#bdb59e'} roughness={.95}/></RoundedBox>)}
 </group>;
}
