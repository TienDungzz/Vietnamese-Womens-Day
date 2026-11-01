import { useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { BackSide, Color, Group, MeshBasicMaterial, ShaderMaterial, Vector3 } from 'three';

export function SkyCycle({reduced,night}:{reduced:boolean;night:RefObject<number>}){
 const clouds=useRef<Group>(null),celestial=useRef<Group>(null),sun=useRef<Group>(null),moon=useRef<Group>(null),stars=useRef<Group>(null);
 const sky=useRef<ShaderMaterial>(null),sunMaterial=useRef<MeshBasicMaterial>(null),moonMaterial=useRef<MeshBasicMaterial>(null);
 const direction=useMemo(()=>new Vector3(),[]),cloudDay=useMemo(()=>new Color('#fffdf8'),[]),cloudNight=useMemo(()=>new Color('#63769b'),[]);
 const uniforms=useMemo(()=>({night:{value:0}}),[]);
 useFrame(({clock,camera,size,gl})=>{
  const n=night.current;if(sky.current)sky.current.uniforms.night.value=n;
  if(clouds.current){clouds.current.position.x=reduced?0:Math.sin(clock.elapsedTime*.025)*3;clouds.current.traverse(o=>{if('material' in o){const m=o.material as MeshBasicMaterial;m.color.copy(cloudDay).lerp(cloudNight,n);m.opacity=.88-.45*n}})}
  // Keep the sun/moon in the upper corner even when the house fills the frame.
  if(celestial.current){const h=Math.tan(20*Math.PI/180)*35,rect=gl.domElement.getBoundingClientRect(),right=Math.min(window.innerWidth,rect.right)-Math.min(90,window.innerWidth*.12),corner=Math.min(.73,((right-rect.left)/rect.width)*2-1);direction.set(h*(size.width/size.height)*corner,h*.78,-35).applyQuaternion(camera.quaternion);celestial.current.position.copy(camera.position).add(direction);celestial.current.quaternion.copy(camera.quaternion)}
  if(sun.current){sun.current.position.y=-n*2.2;sun.current.scale.setScalar(1-n*.4)}
  if(moon.current){moon.current.position.y=(1-n)*2.2;moon.current.scale.setScalar(.6+n*.4)}
  if(sunMaterial.current)sunMaterial.current.opacity=1-n;
  moon.current?.traverse(o=>{if('material' in o)(o.material as MeshBasicMaterial).opacity=o.name==='crater'?n*.2:n});
  stars.current?.traverse(o=>{if('material' in o)(o.material as MeshBasicMaterial).opacity=Math.max(0,(n-.35)/.65)*.75});
 });
 return <>
 <mesh><sphereGeometry args={[120,32,24]}/><shaderMaterial ref={sky} uniforms={uniforms} side={BackSide} depthWrite={false} vertexShader={`varying vec3 skyDirection;void main(){skyDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`} fragmentShader={`uniform float night;varying vec3 skyDirection;void main(){float h=clamp(normalize(skyDirection).y*3.,0.,1.);vec3 day=mix(vec3(.73,.89,.96),vec3(.28,.63,.90),h);vec3 dusk=mix(vec3(.80,.74,.76),vec3(.36,.43,.60),h);vec3 dark=mix(vec3(.16,.20,.33),vec3(.025,.045,.12),h);vec3 color=night<.5?mix(day,dusk,smoothstep(0.,.5,night)):mix(dusk,dark,smoothstep(.5,1.,night));gl_FragColor=vec4(color,1.);}`}/></mesh>
 <group ref={celestial} name="sun-moon"><group ref={sun} name="sun"><mesh><sphereGeometry args={[.85,32,24]}/><meshBasicMaterial ref={sunMaterial} color="#ffdf77" transparent fog={false} toneMapped={false} depthWrite={false}/></mesh></group>
 <group ref={moon} name="moon"><mesh><sphereGeometry args={[.75,32,24]}/><meshBasicMaterial ref={moonMaterial} color="#e4edff" transparent opacity={0} fog={false} toneMapped={false} depthWrite={false}/></mesh>{[[-.22,.24,.65],[.25,-.14,.65],[-.1,-.35,.62]].map((p,i)=><mesh name="crater" key={i} position={p as [number,number,number]} scale={[.1+i*.025,.08+i*.025,.02]}><sphereGeometry args={[1,12,8]}/><meshBasicMaterial color="#9daec8" transparent opacity={0} fog={false} depthWrite={false}/></mesh>)}</group></group>
 <group ref={stars} name="night-stars">{Array.from({length:65},(_,i)=><mesh key={i} position={[Math.sin(i*12.7)*65,12+(i%11)*3,-40-Math.cos(i*7.1)*15]}><sphereGeometry args={[i%4?.045:.075,6,4]}/><meshBasicMaterial color="#e8ecff" transparent opacity={0} fog={false} toneMapped={false} depthWrite={false}/></mesh>)}</group>
 <group ref={clouds}>{[[-12,7.5,-21],[0,8,-25],[11,7,-24],[-4,6.5,-18]].map((p,i)=><group key={i} position={p as [number,number,number]} scale={i%2?1.25:1}>{Array.from({length:7},(_,j)=><mesh key={j} position={[(j-3)*.65,Math.sin(j*2+i)*.22,j%2*.25]} scale={[1.1,.35+(j%3)*.12,.55]}><sphereGeometry args={[1,16,12]}/><meshBasicMaterial color="#fffdf8" toneMapped={false} transparent opacity={.88} depthWrite={false} fog={false}/></mesh>)}</group>)}</group>
 </>;
}
