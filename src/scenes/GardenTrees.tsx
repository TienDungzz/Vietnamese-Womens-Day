import { useLayoutEffect, useMemo, useRef } from 'react';
import { BufferGeometry, CatmullRomCurve3, Color, Float32BufferAttribute, InstancedMesh, Object3D, Quaternion, Vector3 } from 'three';
import { useSurface } from './useSurface';

// Low, overlapping crown lobes leave the spreading branch structure visible.
const crowns=[
 [0,4.95,0,1.9,1.6,.32],[-1.7,4.55,-.55,1.7,1.5,.34],
 [1.65,4.6,.3,1.75,1.45,.32],[-2.8,4.05,.4,1.3,1.25,.3],
 [2.7,4.05,.6,1.45,1.3,.3],[.1,4.45,1.9,1.85,1.3,.32],
 [-1.6,4.05,2,1.5,1.2,.3],[2,4.0,1.8,1.4,1.2,.3],
 [.1,4.65,-1.65,1.6,1.15,.32],[-2,4.2,-1.8,1.4,1.2,.3],
 [1.4,4.5,-1.6,1.15,1,.3],
];

export function createTreeBranch(points:number[][],base:number,tip:number){
 const curve=new CatmullRomCurve3(points.map(p=>new Vector3(...p))),vertices:number[]=[],uv:number[]=[],indices:number[]=[];
 const axis=new Vector3(0,1,0),q=new Quaternion(),v=new Vector3();
 for(let j=0;j<=20;j++){
  const t=j/20,p=curve.getPoint(t),radius=base+(tip-base)*t;
  q.setFromUnitVectors(axis,curve.getTangent(t).normalize());
  for(let i=0;i<10;i++){
   const a=i/10*Math.PI*2;v.set(Math.cos(a)*radius,0,Math.sin(a)*radius).applyQuaternion(q).add(p);vertices.push(v.x,v.y,v.z);uv.push(i/10,t*3);
   if(j<20){const a=j*10+i,b=j*10+(i+1)%10;indices.push(a,a+10,b,b,a+10,b+10)}
  }
 }
 const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(vertices,3));g.setAttribute('uv',new Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}

function sprig(){
 const vertices:number[]=[],indices:number[]=[];
 for(let pair=0;pair<6;pair++)for(const side of [-1,1]){
  const x=side*(.016+pair*.001),y=-.08+pair*.029,start=vertices.length/3;
  for(let k=0;k<6;k++){const a=k/6*Math.PI*2;vertices.push(x+Math.cos(a)*.012,y+Math.sin(a)*.024,Math.sin(a)*.002)}
  for(let k=1;k<5;k++)indices.push(start,start+k,start+k+1);
 }
 const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
}

export function GardenTrees(){
 const wood=useSurface('wood'),leaves=useRef<InstancedMesh>(null),small=useRef<InstancedMesh>(null);
 const geometry=useMemo(sprig,[]);
 const branches=useMemo(()=>{
  const paths=[
   createTreeBranch([[0,0,0],[.03,.9,.04],[.16,1.7,.06],[.02,2.6,.1],[.2,4.5,.1]],.22,.055),
   createTreeBranch([[.1,1.25,.04],[-.3,2.2,-.1],[-.9,3.3,-.35],[-2.8,3.85,.4]],.16,.035),
   createTreeBranch([[.15,1.6,.05],[.6,2.5,.2],[1.4,3.3,.5],[2.9,3.85,.6]],.14,.03),
   createTreeBranch([[.05,2.2,.06],[-.3,3,.7],[-.7,3.65,1.5],[-1.6,3.9,2.1]],.11,.025),
   createTreeBranch([[.08,2.55,.1],[.65,3.25,1],[1.3,3.65,1.6],[2.2,3.85,1.9]],.1,.025),
   createTreeBranch([[.02,2.5,.05],[-.25,3.3,-.7],[-1,3.8,-1.5],[-2,4,-1.9]],.1,.025),
  ];
  crowns.forEach(([x,y,z])=>paths.push(createTreeBranch([[.12,2.8,.1],[x*.35,3.5,z*.35],[x*.75,y-.4,z*.8],[x,y-.1,z]],.065,.012)));
  return paths;
 },[]);
 useLayoutEffect(()=>{
  let seed=371;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
  const o=new Object3D(),c=new Color();
  for(let i=0;i<7600;i++){
   const [x,y,z,rx,rz,ry]=crowns[i%crowns.length],a=random()*Math.PI*2,r=Math.sqrt(random());
   o.position.set(x+Math.cos(a)*r*rx,y+(random()-.5)*ry*2+.08*(1-r*r),z+Math.sin(a)*r*rz);
   o.rotation.set(Math.PI/2+(random()-.5)*.85,random()*Math.PI*2,(random()-.5)*.5);o.scale.setScalar(1.45+random()*.8);o.updateMatrix();leaves.current!.setMatrixAt(i,o.matrix);leaves.current!.setColorAt(i,c.set(['#466933','#587b39','#6c8b43','#7b964e','#3e622e'][i%5]));
  }
  for(let i=0;i<900;i++){
   const a=random()*Math.PI*2,v=random()*2-1,r=Math.cbrt(random()),w=Math.sqrt(1-v*v)*r;
   o.position.set(4.5+Math.cos(a)*w*1.2,3.1+v*r*.92,-3+Math.sin(a)*w);o.rotation.set(random()*3,random()*3,random()*3);o.scale.set(.08,.15,.025);o.updateMatrix();small.current!.setMatrixAt(i,o.matrix);small.current!.setColorAt(i,c.set(['#537a36','#638a3e','#7a9847'][i%3]));
  }
  for(const mesh of [leaves.current!,small.current!]){mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere()}
 },[]);
 return <group name="Garden shade trees">
  <group name="spreading-umbrella-tree" position={[-4.85,0,-.45]}>
   {branches.map((g,i)=><mesh key={i} geometry={g} castShadow receiveShadow><meshStandardMaterial map={wood} bumpMap={wood} bumpScale={.015} color="#8b8173" roughness={.98}/></mesh>)}
   <instancedMesh name="layered-shade-canopy" ref={leaves} args={[geometry,undefined,7600]} castShadow receiveShadow><meshStandardMaterial roughness={.92} side={2}/></instancedMesh>
  </group>
  <mesh castShadow position={[4.5,1.5,-3]}><cylinderGeometry args={[.11,.22,3,14]}/><meshStandardMaterial color="#67513b" roughness={.95}/></mesh>
  <instancedMesh ref={small} args={[undefined,undefined,900]} castShadow><sphereGeometry args={[1,8,6]}/><meshStandardMaterial roughness={.9}/></instancedMesh>
 </group>;
}
