import { useLayoutEffect, useMemo, useRef } from 'react';
import { BufferGeometry, Color, Float32BufferAttribute, InstancedMesh, Matrix4, Object3D, Vector3 } from 'three';
import { createTreeBranch } from './GardenTrees';
import { blossomTreeSites } from './gardenLayout';
import { useSurface } from './useSurface';

const lobes=[[-.9,2.15,.25,.85,.65,.7],[.65,2.65,-.1,.95,.6,.7],[1.35,2.25,.55,.7,.6,.7],[.1,2.3,-.8,.9,.6,.7]];
const flowersPerTree=700,leavesPerTree=220;
function blossomGeometry(){
 const positions=[0,0,0],indices:number[]=[];
 for(let i=0;i<30;i++){const a=i/30*Math.PI*2,r=.76+.24*Math.cos(a*5);positions.push(Math.cos(a)*r,.08*r*r,Math.sin(a)*r);indices.push(0,i+1,(i+1)%30+1)}
 const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function BlossomTrees(){
 const flowers=useRef<InstancedMesh>(null),pollen=useRef<InstancedMesh>(null),leaves=useRef<InstancedMesh>(null),wood=useSurface('wood');
 const petals=useMemo(blossomGeometry,[]);
 const branches=useMemo(()=>{
  const result=[
   createTreeBranch([[0,0,0],[.1,.65,.06],[.33,1.3,.02],[.65,2.35,-.1]],.14,.035),
   createTreeBranch([[.14,.8,.04],[-.2,1.3,.1],[-.7,1.8,.22],[-1.25,2.2,.25]],.09,.018),
   createTreeBranch([[.22,1.12,.03],[.65,1.55,.2],[1.2,1.95,.4],[1.75,2.25,.65]],.085,.018),
   createTreeBranch([[.3,1.25,0],[.1,1.7,-.4],[.1,2.1,-.8],[-.3,2.55,-1]],.07,.016),
  ];
  for(let i=0;i<24;i++){
   const [x,y,z]=lobes[i%4],a=i*2.399,dx=Math.cos(a)*.65,dz=Math.sin(a)*.6;
   result.push(createTreeBranch([[x*.65,y-.7,z*.6],[x,y-.25,z],[x+dx*.55,y-.08,dz*.55+z],[x+dx,y+.08*Math.sin(i),z+dz]],.018,.003));
  }
  return result;
 },[]);
 useLayoutEffect(()=>{
  let seed=704;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
  const o=new Object3D(),basis=new Object3D(),matrix=new Matrix4(),c=new Color(),normal=new Vector3();
  blossomTreeSites.forEach(([x,z,scale,rotation],tree)=>{
   basis.position.set(x,0,z);basis.rotation.set(0,rotation,0);basis.scale.setScalar(scale);basis.updateMatrix();
   for(let j=0;j<flowersPerTree+leavesPerTree;j++){
    const [cx,cy,cz,rx,ry,rz]=lobes[j%4],a=random()*Math.PI*2,v=random()*2-1,r=Math.cbrt(random()),w=Math.sqrt(1-v*v)*r;
    o.position.set(cx+Math.cos(a)*w*rx,cy+v*r*ry,cz+Math.sin(a)*w*rz);o.rotation.set(random()*Math.PI,random()*Math.PI*2,random()*Math.PI);
    if(j<flowersPerTree){
     const i=tree*flowersPerTree+j;o.scale.setScalar(.04+random()*.025);o.updateMatrix();matrix.multiplyMatrices(basis.matrix,o.matrix);flowers.current!.setMatrixAt(i,matrix);flowers.current!.setColorAt(i,c.set(['#fff9ee','#f0eee2','#f4e8df','#e5eadc'][j%4]));
     normal.set(0,.009,0).applyQuaternion(o.quaternion);o.position.add(normal);o.scale.set(.007,.004,.007);o.updateMatrix();matrix.multiplyMatrices(basis.matrix,o.matrix);pollen.current!.setMatrixAt(i,matrix);
    }else{
     const i=tree*leavesPerTree+j-flowersPerTree;o.scale.set(.027,.072,.012);o.updateMatrix();matrix.multiplyMatrices(basis.matrix,o.matrix);leaves.current!.setMatrixAt(i,matrix);leaves.current!.setColorAt(i,c.set(j%3?'#748f49':'#9ba660'));
    }
   }
  });
  for(const mesh of [flowers.current!,pollen.current!,leaves.current!]){mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere()}
 },[]);
 return <group name="White flowering garden trees">
  {blossomTreeSites.map(([x,z,scale,rotation],tree)=><group name={`white-blossom-tree-${tree}`} key={tree} position={[x,0,z]} scale={scale} rotation={[0,rotation,0]}>{branches.map((geometry,i)=><mesh key={i} geometry={geometry} castShadow receiveShadow><meshStandardMaterial map={wood} color="#9c8b78" roughness={.98} bumpMap={wood} bumpScale={.008}/></mesh>)}</group>)}
  <instancedMesh name="white-tree-blossoms" ref={flowers} args={[petals,undefined,blossomTreeSites.length*flowersPerTree]}><meshStandardMaterial roughness={.93} side={2}/></instancedMesh>
  <instancedMesh ref={pollen} args={[undefined,undefined,blossomTreeSites.length*flowersPerTree]}><sphereGeometry args={[1,6,4]}/><meshStandardMaterial color="#d1b876" roughness={1}/></instancedMesh>
  <instancedMesh ref={leaves} args={[undefined,undefined,blossomTreeSites.length*leavesPerTree]}><sphereGeometry args={[1,6,4]}/><meshStandardMaterial roughness={.95}/></instancedMesh>
 </group>;
}
