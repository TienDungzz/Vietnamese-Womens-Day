import { useLayoutEffect, useMemo, useRef } from 'react';
import { BufferGeometry, Color, DoubleSide, Float32BufferAttribute, InstancedMesh, Object3D } from 'three';

// Front boundary only. Openings align with the entrance and the bridge lane.
const segments=[[-10,-1.45],[1.65,5.35],[7.25,11]] as const;
const fenceZ=4.55;
type Instance={position:[number,number,number];scale:[number,number,number];rotation?:[number,number,number];color:string};

function bractGeometry(){
 // A pointed, cupped, papery bougainvillea bract rather than a round blossom.
 const points=[0,0,.025,-.32,.16,.01,-.58,.48,0,-.39,.76,.015,0,1,.055,.39,.76,.015,.58,.48,0,.32,.16,.01,0,.48,.13];
 const indices:number[]=[];
 for(let i=0;i<8;i++)indices.push(8,i,(i+1)%8);
 const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(points,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}

function Instances({items,kind}:{items:Instance[];kind:'leaf'|'flower'|'stem'|'iron'}){
 const ref=useRef<InstancedMesh>(null);
 const bract=useMemo(()=>kind==='flower'?bractGeometry():undefined,[kind]);
 useLayoutEffect(()=>{
  const object=new Object3D(),color=new Color(),mesh=ref.current!;
  items.forEach((item,index)=>{
   object.position.set(...item.position);object.scale.set(...item.scale);object.rotation.set(...(item.rotation??[0,0,0]));object.updateMatrix();
   mesh.setMatrixAt(index,object.matrix);mesh.setColorAt(index,color.set(item.color));
  });
  mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();
 },[items]);
 return <instancedMesh name={`front-fence-${kind}`} ref={ref} args={[bract,undefined,items.length]} castShadow={kind==='iron'||kind==='leaf'} receiveShadow>
  {kind==='leaf'&&<sphereGeometry args={[1,6,4]}/>}
  {(kind==='stem'||kind==='iron')&&<cylinderGeometry args={[1,1,1,6]}/>}
  <meshStandardMaterial roughness={kind==='iron'?.75:.92} side={DoubleSide}/>
 </instancedMesh>;
}

export function FlowerFence(){
 const data=useMemo(()=>{
  let seed=201020;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
  const leaves:Instance[]=[],flowers:Instance[]=[],stems:Instance[]=[],iron:Instance[]=[];
  segments.forEach(([start,end],segment)=>{
   const width=end-start,posts=Math.ceil(width/1.4);
   for(let i=0;i<=posts;i++)iron.push({position:[start+width*i/posts,.64,fenceZ],scale:[.028,1.24,.028],color:'#596453'});
   for(let x=start+.12;x<end;x+=.19)iron.push({position:[x,.64,fenceZ],scale:[.009,1.05,.009],color:'#69735e'});
   for(const y of [.33,1.08])iron.push({position:[(start+end)/2,y,fenceZ],scale:[.016,width,.016],rotation:[0,0,Math.PI/2],color:'#596453'});
   const bushes=Math.ceil(width/.55);
   for(let bush=0;bush<bushes;bush++){
    const x=start+.23+(width-.46)*(bush+.5)/bushes;
    const crown=.94+.18*Math.sin(x*1.8)+random()*.15;
    const palette=[['#d94996','#e774b5','#c83687'],['#d94f73','#e96b85','#c93968'],['#d56aa4','#eb93c1','#c74c97']][(Math.floor((x-start)/2.2)+segment)%3];
    stems.push({position:[x,.5,fenceZ],scale:[.018,.95,.018],rotation:[0,0,(random()-.5)*.3],color:'#7d7350'});
    for(let i=0;i<90;i++){
     const y=.18+random()*crown,a=random()*Math.PI*2;
     const px=x+Math.cos(a)*random()*.25,pz=fenceZ+Math.sin(a)*(.07+random()*.15);
     leaves.push({position:[px,y,pz],scale:[.045+random()*.025,.075+random()*.025,.018],rotation:[random()*2,random()*6,random()*3],color:['#587340','#6a8647','#829654','#47663a'][i%4]});
    }
    for(let cluster=0;cluster<18;cluster++){
     const cx=x+(random()-.5)*.43,cy=.38+random()*crown,cz=fenceZ+(cluster%2?1:-1)*(.14+random()*.045);
     for(let bloom=0;bloom<4;bloom++){
      const angle=random()*Math.PI*2,bx=cx+Math.cos(angle)*.07,by=cy+Math.sin(angle)*.075;
      for(let petal=0;petal<3;petal++){
       const size=.055+random()*.025;
       flowers.push({position:[bx,by,cz+(random()-.5)*.055],scale:[size,size,size],rotation:[(random()-.5)*.65+(cluster%2?0:Math.PI),random()*.8,petal*Math.PI*2/3+angle],color:palette[(bloom+petal)%3]});
      }
     }
    }
   }
  });
  return {leaves,flowers,stems,iron};
 },[]);
 return <group name="front-flowering-fence">
  {segments.map(([start,end],index)=><mesh key={index} name={`front-fence-base-${index}`} position={[(start+end)/2,.065,fenceZ]} receiveShadow><boxGeometry args={[end-start,.13,.29]}/><meshStandardMaterial color="#cfcbb9" roughness={1}/></mesh>)}
  <Instances items={data.iron} kind="iron"/><Instances items={data.stems} kind="stem"/><Instances items={data.leaves} kind="leaf"/><Instances items={data.flowers} kind="flower"/>
 </group>;
}
