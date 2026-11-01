import { useLayoutEffect, useMemo, useRef } from 'react';
import { isFrontLawn, entranceFlowerPots, blossomTreeSites } from './gardenLayout';
import { BufferGeometry, Color, Float32BufferAttribute, InstancedMesh, Object3D } from 'three';

// Fixed exclusions keep the flowers off the house, entrance, tree roots and swing clearance.
export function canPlant(x:number,z:number){
 if(x< -23.5-.6*Math.sin(z*.7)||x>13.65+.3*Math.sin(z*.8)||z< -9.55||z>4.8)return false;
 if(isFrontLawn(x,z))return false;
 if(entranceFlowerPots.some(([px,pz])=>Math.hypot(x-px,z-pz)<.4))return false;
 if(blossomTreeSites.some(([px,pz])=>Math.hypot(x-px,z-pz)<.36))return false;
 if(Math.abs(x-6.3)<.72&&z<6.8&&z>-9.7)return false;
 if(Math.hypot(x-1.05,z-5.05)<.4)return false;
 if(Math.abs(x)<.83&&z> -2.3)return false;
 if(Math.abs(x)<3.55&&z< -1.35&&z> -5.9)return false;
 if(Math.abs(x)<1.8&&z< -1.0&&z> -2.3)return false;
 if(x< -2.62&&x> -5.3&&z>-.65&&z<1.75)return false;
 if(x<-.7&&x>-3.65&&z>.35&&z<1.7)return false;
 if(Math.hypot(x+4.85,z+.45)<.4||Math.hypot(x-4.5,z+3)<.38)return false;
 return true;
}
export function bloomGeometry(){
 const p=[0,.01,0],indices:number[]=[];
 for(let ring=1;ring<=3;ring++)for(let j=0;j<30;j++){
  const a=j/30*Math.PI*2,r=ring/3*(.73+.27*Math.cos(a*5));p.push(Math.sin(a)*r,Math.pow(r,2)*.16,Math.cos(a)*r);
 }
 for(let j=0;j<30;j++)indices.push(0,1+j,1+(j+1)%30);
 for(let ring=0;ring<2;ring++)for(let j=0;j<30;j++){const a=1+ring*30+j,b=1+ring*30+(j+1)%30;indices.push(a,a+30,b,b,a+30,b+30)}
 const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(p,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function FlowerGarden(){
 const leaves=useRef<InstancedMesh>(null),stems=useRef<InstancedMesh>(null),blooms=useRef<InstancedMesh>(null),centers=useRef<InstancedMesh>(null);
 const plants=useMemo(()=>{
  let seed=47;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
  const result:{x:number;z:number;height:number;size:number;angle:number;color:string}[]=[];
  for(let x=-7.9;x<8;x+=.19)for(let z=-9.45;z<4.8;z+=.19){
   const px=x+(random()-.5)*.13,pz=z+(random()-.5)*.13;if(!canPlant(px,pz))continue;
   const palette=['#d88dba','#f3c5cc','#eee0be','#b8a4d9','#eac183','#a9608a'];
   const patch=Math.floor((px+5.5)/1.5)+Math.floor((pz+6)/1.7)*3;
   result.push({x:px,z:pz,height:.22+random()*.28,size:.075+random()*.03,angle:random()*Math.PI*2,color:palette[((patch+(random()>.78?1:0))%palette.length+palette.length)%palette.length]});
  }
  for(let x=-23.8;x<13.9;x+=.26)for(let z=-9.45;z<4.8;z+=.26){
   if(Math.abs(x)<8)continue;const px=x+(random()-.5)*.13,pz=z+(random()-.5)*.13;if(!canPlant(px,pz))continue;
   const palette=['#db9eb9','#f1d8b5','#c2afd9','#f1c1d0'];const patch=Math.floor((px+14)/1.6)+Math.floor((pz+10)/1.9);
   result.push({x:px,z:pz,height:.25+random()*.34,size:.09+random()*.035,angle:random()*Math.PI*2,color:palette[(patch%4+4)%4]});
  }
  return result;
 },[]);
 const geometry=useMemo(bloomGeometry,[]);
 useLayoutEffect(()=>{
  const o=new Object3D(),color=new Color();
  plants.forEach((p,i)=>{
   o.position.set(p.x,p.height/2,p.z);o.rotation.set(0,0,0);o.scale.set(.009,p.height,.009);o.updateMatrix();stems.current!.setMatrixAt(i,o.matrix);
   o.position.y=p.height;o.rotation.set(Math.sin(i)*.15,p.angle,Math.cos(i)*.15);o.scale.setScalar(p.size);o.updateMatrix();blooms.current!.setMatrixAt(i,o.matrix);blooms.current!.setColorAt(i,color.set(p.color));
   o.position.y=p.height+.011;o.rotation.set(0,0,0);o.scale.set(.014,.008,.014);o.updateMatrix();centers.current!.setMatrixAt(i,o.matrix);
   for(let j=0;j<2;j++){o.position.set(p.x+(j?-.025:.025),p.height*(.36+j*.2),p.z);o.rotation.set(.3,p.angle+j, j?-.7:.7);o.scale.set(.025,.09,.009);o.updateMatrix();leaves.current!.setMatrixAt(i*2+j,o.matrix);leaves.current!.setColorAt(i*2+j,color.set(i%3?'#668d40':'#4d7837'))}
  });
  for(const ref of [leaves,stems,blooms,centers]){ref.current!.instanceMatrix.needsUpdate=true;if(ref.current!.instanceColor)ref.current!.instanceColor.needsUpdate=true;ref.current!.computeBoundingSphere()}
 },[plants]);
 return <group name="Full flower garden">
 <instancedMesh ref={stems} args={[undefined,undefined,plants.length]}><cylinderGeometry args={[1,1,1,5]}/><meshStandardMaterial color="#537b38" roughness={1}/></instancedMesh>
 <instancedMesh ref={leaves} args={[undefined,undefined,plants.length*2]}><sphereGeometry args={[1,6,4]}/><meshStandardMaterial roughness={.9}/></instancedMesh>
 <instancedMesh ref={blooms} args={[geometry,undefined,plants.length]}><meshStandardMaterial roughness={.8} side={2}/></instancedMesh>
 <instancedMesh ref={centers} args={[undefined,undefined,plants.length]}><sphereGeometry args={[1,8,5]}/><meshStandardMaterial color="#b18a38" roughness={.9}/></instancedMesh>
 </group>;
}
