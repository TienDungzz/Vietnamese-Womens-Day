import { useLayoutEffect, useRef } from 'react';
import { Color, InstancedMesh, Object3D } from 'three';

const trees=[[-12.1,.2,2.25],[12.3,.1,2.2],[11.7,-7.3,2.75]];
const shrubs=[[-8.6,2.5],[-10.7,2.8],[-12.6,-2],[-9.6,-6.3],[-7.9,-8.2],[8.8,2.8],[11,2.9],[13,-2],[9.4,-6.7],[12.8,-5.4]];

export function GardenBorder(){
 const leaves=useRef<InstancedMesh>(null),bushes=useRef<InstancedMesh>(null);
 useLayoutEffect(()=>{
  let seed=871;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
  const o=new Object3D(),c=new Color();
  trees.forEach(([x,z,h],tree)=>{
   for(let j=0;j<420;j++){
    const a=random()*Math.PI*2,v=random()*2-1,r=Math.cbrt(random()),w=Math.sqrt(1-v*v)*r;
    o.position.set(x+Math.cos(a)*w*1.12,h+v*r*.9,z+Math.sin(a)*w*1.05);
    o.rotation.set(random()*3,random()*3,random()*3);o.scale.set(.1+random()*.07,.15+random()*.08,.04);o.updateMatrix();
    const i=tree*420+j;leaves.current!.setMatrixAt(i,o.matrix);leaves.current!.setColorAt(i,c.set(['#668644','#73974d','#8ba45b','#577c3e'][j%4]));
   }
  });
  shrubs.forEach(([x,z],bush)=>{
   for(let j=0;j<9;j++){
    const a=j/9*Math.PI*2,r=j%3*.16;
    o.position.set(x+Math.cos(a)*r,.3+(j%3)*.12,z+Math.sin(a)*r);o.rotation.set(random(),random()*3,random());o.scale.set(.3+random()*.12,.28+random()*.16,.3+random()*.12);o.updateMatrix();
    const i=bush*9+j;bushes.current!.setMatrixAt(i,o.matrix);bushes.current!.setColorAt(i,c.set(j%4===0?['#b7a8c3','#d0aac0'][bush%2]:['#67864a','#7d9453','#597c42'][j%3]));
   }
  });
  for(const mesh of [leaves.current!,bushes.current!]){mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere()}
 },[]);
 return <group name="Outer garden trees and flowering shrubs">
  {trees.map(([x,z,h],i)=><group key={i} position={[x,0,z]}><mesh castShadow position={[0,(h-.2)/2,0]}><cylinderGeometry args={[.065,.12,h-.2,10]}/><meshStandardMaterial color="#79644b" roughness={1}/></mesh>{[-1,1].map(side=><mesh key={side} castShadow position={[side*.18,h-.6,0]} rotation={[0,0,-side*.5]}><cylinderGeometry args={[.025,.05,.9,8]}/><meshStandardMaterial color="#79644b" roughness={1}/></mesh>)}</group>)}
  <instancedMesh ref={leaves} args={[undefined,undefined,trees.length*420]} castShadow><sphereGeometry args={[1,6,5]}/><meshStandardMaterial roughness={.9}/></instancedMesh>
  <instancedMesh ref={bushes} args={[undefined,undefined,90]} castShadow receiveShadow><icosahedronGeometry args={[1,2]}/><meshStandardMaterial roughness={.96}/></instancedMesh>
 </group>;
}
