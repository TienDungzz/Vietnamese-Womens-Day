import { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, InstancedMesh, Object3D } from 'three';
import { bloomGeometry } from './FlowerGarden';
import { entranceFlowerPots } from './gardenLayout';

const count=entranceFlowerPots.length*13;
export function EntranceFlowerPots(){
 const stems=useRef<InstancedMesh>(null),leaves=useRef<InstancedMesh>(null),blooms=useRef<InstancedMesh>(null),centers=useRef<InstancedMesh>(null);
 const geometry=useMemo(bloomGeometry,[]);
 useLayoutEffect(()=>{
  const o=new Object3D(),c=new Color();let seed=206;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
  entranceFlowerPots.forEach(([x,z],pot)=>{
   for(let j=0;j<13;j++){
    const a=j/13*Math.PI*2,r=j===0?0:.06+random()*.14,px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r,h=.2+random()*.22,i=pot*13+j;
    o.position.set(px,.39+h/2,pz);o.rotation.set(0,0,0);o.scale.set(.009,h,.009);o.updateMatrix();stems.current!.setMatrixAt(i,o.matrix);
    o.position.y=.39+h;o.rotation.set((random()-.5)*.4,a,(random()-.5)*.35);o.scale.setScalar(.068+random()*.025);o.updateMatrix();blooms.current!.setMatrixAt(i,o.matrix);blooms.current!.setColorAt(i,c.set(['#e7a8bb','#fff0d4','#b8a2cf','#edc3d1'][pot%4]));
    o.position.y+=.009;o.rotation.set(0,0,0);o.scale.set(.014,.009,.014);o.updateMatrix();centers.current!.setMatrixAt(i,o.matrix);
    for(let k=0;k<2;k++){o.position.set(px+(k?-.025:.025),.4+h*(.25+k*.28),pz);o.rotation.set(.35,a,k?-.7:.7);o.scale.set(.035,.085,.014);o.updateMatrix();leaves.current!.setMatrixAt(i*2+k,o.matrix)}
   }
  });
  for(const mesh of [stems.current!,leaves.current!,blooms.current!,centers.current!]){mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere()}
 },[]);
 return <group name="Entrance flower pots">
  {entranceFlowerPots.map(([x,z],i)=><group key={i} name={`entrance-flower-pot-${i}`} position={[x,0,z]}>
   <mesh castShadow receiveShadow position={[0,.2,0]}><cylinderGeometry args={[.255,.18,.4,24]}/><meshStandardMaterial color={i%2?'#bd947b':'#cda68e'} roughness={.92}/></mesh>
   <mesh castShadow position={[0,.4,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.245,.025,8,24]}/><meshStandardMaterial color="#d7b39a" roughness={.9}/></mesh>
   <mesh rotation={[-Math.PI/2,0,0]} position={[0,.398,0]}><circleGeometry args={[.23,24]}/><meshStandardMaterial color="#514435" roughness={1}/></mesh>
  </group>)}
  <instancedMesh ref={stems} args={[undefined,undefined,count]}><cylinderGeometry args={[1,1,1,6]}/><meshStandardMaterial color="#4e7745" roughness={.95}/></instancedMesh>
  <instancedMesh ref={leaves} args={[undefined,undefined,count*2]}><sphereGeometry args={[1,8,6]}/><meshStandardMaterial color="#66854d" roughness={.9}/></instancedMesh>
  <instancedMesh ref={blooms} args={[geometry,undefined,count]} castShadow><meshStandardMaterial roughness={.87} side={2}/></instancedMesh>
  <instancedMesh ref={centers} args={[undefined,undefined,count]}><sphereGeometry args={[1,8,6]}/><meshStandardMaterial color="#d2b267" roughness={.92}/></instancedMesh>
 </group>;
}
