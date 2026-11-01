import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshStandardMaterial } from 'three';
import { Forest } from './Forest';

export function Countryside({reduced}:{reduced:boolean}){
 const time=useMemo(()=>({value:0}),[]);
 const water=useMemo(()=>{
  const m=new MeshStandardMaterial({color:'#559c9f',roughness:.3,metalness:.18});
  m.onBeforeCompile=shader=>{
   shader.uniforms.riverTime=time;
   shader.vertexShader='varying vec3 riverPosition;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nriverPosition=position;');
   shader.fragmentShader='uniform float riverTime;varying vec3 riverPosition;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    float wave=sin(riverPosition.x*2.4+riverPosition.y*7.0-riverTime*.8)*sin(riverPosition.x*.37-riverPosition.y*3.0+riverTime*.22);
    float glint=pow(max(0.,wave),12.);diffuseColor.rgb*=.85+.12*wave;diffuseColor.rgb+=vec3(.11,.17,.16)*glint;`);
  };return m;
 },[time]);
 useFrame(({clock})=>{time.value=reduced?0:clock.elapsedTime});
 return <group name="River and forest" position={[0,0,-3.2]}>
  <mesh name="river-water" receiveShadow rotation={[-Math.PI/2,0,0]} position={[0,.008,-10.05]} material={water}><planeGeometry args={[150,6.3]}/></mesh>
  {[-6.65,-13.45].map(z=><mesh key={z} receiveShadow position={[0,.015,z]}><boxGeometry args={[150,.13,.55]}/><meshStandardMaterial color="#8b9c65" roughness={1}/></mesh>)}
  <mesh name="far-bank-lane" receiveShadow position={[0,.045,-14.3]}><boxGeometry args={[150,.1,1.4]}/><meshStandardMaterial color="#b9ad8b" roughness={.96}/></mesh>
  <mesh name="forest-path-landing" receiveShadow position={[6.3,.05,-16.2]}><boxGeometry args={[1.15,.1,4.3]}/><meshStandardMaterial color="#b3aa80" roughness={1}/></mesh>
  <Forest/>
 </group>;
}
