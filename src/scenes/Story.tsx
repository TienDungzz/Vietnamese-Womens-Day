import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box3, Group, Vector3 } from 'three';
import { Bouquet } from '../components/Bouquet';
import type { Scene } from '../hooks/useSceneFlow';
const trigger=new Box3(new Vector3(-.35,0,-1.2),new Vector3(.35,3,-.5));
export function Story({scene,reach,reduced}:{scene:Scene;reach:()=>void;reduced:boolean}){
 const man=useRef<Group>(null),door=useRef<Group>(null),arm=useRef<Group>(null),gift=useRef<Group>(null);
 const open=['DOOR_OPENING','HANDOVER','BOUQUET_TRANSITION'].includes(scene);
 useFrame((state,dt)=>{if(!man.current)return;
 if(scene==='WALKING'){man.current.position.z=Math.max(-.75,man.current.position.z-dt*(reduced?15:.95));if(trigger.containsPoint(man.current.position))reach()}
 if(door.current)door.current.rotation.y += ((open?-1.8:0)-door.current.rotation.y)*Math.min(1,dt*(reduced?20:2));
 if(arm.current)arm.current.rotation.x=scene==='KNOCKING'?-.8+Math.sin(state.clock.elapsedTime*9)*.2:-.35;
 if(gift.current){const target=scene==='HANDOVER'||scene==='BOUQUET_TRANSITION'?new Vector3(.15,1.2,-1.5):new Vector3(man.current.position.x,1.2,man.current.position.z-.35);gift.current.position.lerp(target,Math.min(1,dt*2))}
 });
 return <group>
 <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.04,0]}><planeGeometry args={[40,40]}/><meshStandardMaterial color="#26332c"/></mesh>
 {Array.from({length:14},(_,i)=><mesh key={i} position={[Math.sin(i)*.06,0,4-i*.43]} rotation={[-Math.PI/2,0,i*.025]}><boxGeometry args={[1.25,.39,.045]}/><meshStandardMaterial color={i%2?'#8b7c78':'#a18f85'} roughness={1}/></mesh>)}
 <mesh position={[0,1.7,-3.4]}><boxGeometry args={[5,3.4,2.4]}/><meshStandardMaterial color="#b7998a"/></mesh>
 <mesh position={[0,3.65,-3.4]} rotation={[0,Math.PI/4,0]}><coneGeometry args={[3.9,1.6,4]}/><meshStandardMaterial color="#4d363d"/></mesh>
 <mesh position={[0,1.2,-2.17]}><boxGeometry args={[1.3,2.4,.1]}/><meshStandardMaterial color="#f3c98b" emissive="#f3c98b" emissiveIntensity={open?.8:.1}/></mesh>
 <group ref={door} position={[-.65,0,-2.06]}><mesh position={[.65,1.2,0]}><boxGeometry args={[1.3,2.4,.12]}/><meshStandardMaterial color="#523a37"/></mesh><mesh position={[1.15,1.15,.1]}><sphereGeometry args={[.045,12,8]}/><meshStandardMaterial color="#d7b57b" metalness={.8} roughness={.25}/></mesh></group>
 {[-1.7,1.7].map(x=><group key={x}><mesh position={[x,1.65,-2.16]}><boxGeometry args={[.8,1.1,.08]}/><meshStandardMaterial color="#efc48d" emissive="#efc48d" emissiveIntensity={.65}/></mesh><mesh position={[x,1.65,-2.09]}><boxGeometry args={[.04,1.1,.04]}/><meshStandardMaterial color="#59413e"/></mesh></group>)}
 {Array.from({length:18},(_,i)=><group key={i} position={[(i%2?1:-1)*(1.5+Math.sin(i)*.25),0,3-Math.floor(i/2)*.7]}><mesh position={[0,.42,0]} scale={[.45,.55,.4]}><sphereGeometry args={[1,12,8]}/><meshStandardMaterial color={i%3?'#2c4938':'#405b3e'}/></mesh><mesh position={[.1,.86,0]}><sphereGeometry args={[.09,10,8]}/><meshStandardMaterial color={i%2?'#bd687f':'#dfa0aa'}/></mesh></group>)}
 {Array.from({length:13},(_,i)=><mesh key={i} position={[-3+i*.5,3.05-Math.sin(i/12*Math.PI)*.55,-1.9]}><sphereGeometry args={[.04,8,6]}/><meshStandardMaterial color="#ffe1aa" emissive="#ffc77e" emissiveIntensity={3}/></mesh>)}
 <group ref={man} position={[0,0,3]} rotation={[0,Math.PI,0]}><Person walking={scene==='WALKING'} arm={arm}/></group>
 {open&&<group position={[.25,0,-1.8]}><Person female/></group>}
 <group ref={gift} position={[0,1.2,2.65]} scale={.26}><Bouquet/></group>
 <pointLight position={[0,2.7,-1.5]} color="#ffd5a0" intensity={14} distance={8}/>
 </group>
}
function Person({female=false,walking=false,arm}:{female?:boolean;walking?:boolean;arm?:React.RefObject<Group|null>}){
 const legs=useRef<Group>(null);useFrame(s=>{if(legs.current)legs.current.children.forEach((leg,i)=>leg.rotation.x=walking?Math.sin(s.clock.elapsedTime*7+i*Math.PI)*.32:0)});
 return <group><mesh position={[0,1.76,0]}><sphereGeometry args={[.15,16,12]}/><meshStandardMaterial color="#c99c82"/></mesh><mesh position={[0,1.86,-.025]} scale={[1,.6,1]}><sphereGeometry args={[.16,16,12]}/><meshStandardMaterial color="#362b2a"/></mesh><mesh position={[0,1.28,0]}><cylinderGeometry args={[.22,female?.4:.18,female?.8:.65,16]}/><meshStandardMaterial color={female?'#ead6c9':'#e9dfd1'}/></mesh><group ref={legs} position={[0,.95,0]}>{[-1,1].map(i=><group key={i} position={[i*.11,0,0]}><mesh position={[0,-.45,0]}><capsuleGeometry args={[.075,.7,4,8]}/><meshStandardMaterial color={female?'#be9c89':'#33313c'}/></mesh></group>)}</group>{[-1,1].map(i=><group key={i} ref={i===1?arm:undefined} position={[i*.24,1.55,0]} rotation={[-.35,0,i*.15]}><mesh position={[0,-.25,0]}><capsuleGeometry args={[.06,.45,4,8]}/><meshStandardMaterial color={female?'#d7b9a6':'#e9dfd1'}/></mesh></group>)}</group>
}
