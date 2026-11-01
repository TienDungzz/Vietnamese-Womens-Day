import { useLayoutEffect, useRef } from 'react';
import { Color, InstancedMesh, Object3D } from 'three';

const count=240;
export function Forest(){
 const trunks=useRef<InstancedMesh>(null),crowns=useRef<InstancedMesh>(null);
 useLayoutEffect(()=>{
  let seed=401;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
  const o=new Object3D(),c=new Color();
  for(let i=0;i<count;i++){
   const row=i%6;let x=(Math.floor(i/6)/39-.5)*120+(random()-.5)*2.1;const z=-19-row*6.8+(random()-.5)*2,h=3.7+random()*2.7+row*.1,width=1.35+random()*.65;
   if(Math.abs(x-6.3)<2.1&&z>-25)x+=4.4;
   o.position.set(x,h*.38,z);o.rotation.set(0,random()*6,(random()-.5)*.07);o.scale.set(.12+random()*.1,h*.76,.12+random()*.1);o.updateMatrix();trunks.current!.setMatrixAt(i,o.matrix);trunks.current!.setColorAt(i,c.set(['#776b55','#6b604d','#82745f'][i%3]));
   for(let j=0;j<9;j++){
    const a=j/6*Math.PI*2+random()*.5,r=j===0||j>6?0:width*(.4+random()*.22);
    const level=j===0?.43:j===7?.89:j===8?.31:.57+(j%3)*.1;
    o.position.set(x+Math.cos(a)*r,h*level,z+Math.sin(a)*r);o.rotation.set(random(),random()*6,random());
    const taper=j===7?.69:j===8?.8:1;
    o.scale.set(width*taper*(.85+random()*.25),width*taper*(.72+random()*.2),width*taper*(.8+random()*.3));o.updateMatrix();
    const k=i*9+j;crowns.current!.setMatrixAt(k,o.matrix);crowns.current!.setColorAt(k,c.set(['#3e643a','#4d7342','#5f804a','#355c37','#6b874f','#466e3e'][(i+j)%6]));
   }
  }
  for(const mesh of [trunks.current!,crowns.current!]){mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere()}
 },[]);
 return <group name="forest-beyond-river">
  <mesh receiveShadow rotation={[-Math.PI/2,0,0]} position={[0,.015,-39]}><planeGeometry args={[150,47.3]}/><meshStandardMaterial color="#5d744d" roughness={1}/></mesh>
  <instancedMesh name="forest-trunks" ref={trunks} args={[undefined,undefined,count]}><cylinderGeometry args={[.65,1,1,8]}/><meshStandardMaterial roughness={1}/></instancedMesh>
  <instancedMesh name="forest-canopies" ref={crowns} args={[undefined,undefined,count*9]}><icosahedronGeometry args={[1,1]}/><meshStandardMaterial roughness={.95}/></instancedMesh>
 </group>;
}
