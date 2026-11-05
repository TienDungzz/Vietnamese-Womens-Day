import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box3, Group, Quaternion, Vector3 } from 'three';
import { Bouquet } from '../components/Bouquet';
import { GardenDetails } from './Atmosphere';
import { Cottage, Landscape } from './Cottage';
import { Person } from './Person';
import { DoubleDoor } from './DoubleDoor';
import { EntranceFlowerPots } from './EntranceFlowerPots';
import { BlossomTrees } from './BlossomTrees';
import { GardenBorder } from './GardenBorder';
import { FlowerFence } from './FlowerFence';
import { Mailbox } from './Mailbox';
import { PorchPlants } from './PorchPlants';
import { Neighborhood } from './Neighborhood';
import { WoodenBridge } from './WoodenBridge';
import { Countryside } from './Countryside';
import { GardenSwing } from './GardenBoundary';
import { Line } from '@react-three/drei';
import type { Scene } from '../hooks/useSceneFlow';
const trigger=new Box3(new Vector3(-.35,0,-1.1),new Vector3(.35,3,-.88));
export function Story({scene,reach,reduced,onReceiverReady,paused=false}:{scene:Scene;reach:()=>void;reduced:boolean;onReceiverReady:()=>void;paused?:boolean}){
 const man=useRef<Group>(null),arm=useRef<Group>(null),gift=useRef<Group>(null);
 const root=useRef<Group>(null),manCarry=useRef<Group>(null),girlCarry=useRef<Group>(null);
 const phase=useRef(0),manWeight=useRef(1),girlWeight=useRef(0),pace=useRef(0);
 const phaseScene=useRef(scene);
 const frames=useMemo(()=>({a:new Vector3(),b:new Vector3(),qa:new Quaternion(),qb:new Quaternion(),inverse:new Quaternion()}),[]);
 const open=['DOOR_OPENING','HANDOVER','BOUQUET_TRANSITION'].includes(scene);
 useFrame((state,dt)=>{if(paused||!man.current||!root.current)return;
 // Reset before reading progress. A passive effect can leave one frame using
 // the previous scene's elapsed time, briefly transferring the bouquet early.
 if(phaseScene.current!==scene){phase.current=0;phaseScene.current=scene}else phase.current+=dt;
 if(scene==='WALKING'){
  const remaining=Math.max(0,man.current.position.z+.92);
  const desired=reduced?15:.95*Math.min(1,Math.max(.18,remaining/.7));
  pace.current+=(desired-pace.current)*(1-Math.exp(-dt*4));
  man.current.position.z=Math.max(-.92,man.current.position.z-dt*pace.current);
  if(trigger.containsPoint(man.current.position))reach();
 }else pace.current*=Math.exp(-dt*8);
 if(arm.current)arm.current.rotation.x=scene==='KNOCKING'?-.8+Math.sin(state.clock.elapsedTime*9)*.2:-.35;
 const handing=scene==='HANDOVER',received=scene==='BOUQUET_TRANSITION';
 const t=received?1:handing?Math.min(1,phase.current/(reduced?.15:2.4)):0;
 const p=t*t*t*(10+t*(-15+6*t));
 const smooth=(value:number)=>{const x=Math.min(1,Math.max(0,value));return x*x*(3-2*x)};
 manWeight.current=1-smooth((p-.45)/.4);
 // Start reaching as the door opens and keep the same continuous weight
 // across scene boundaries, including slow frames and reduced motion.
 const receiverTarget=received?1:handing?.75+.25*smooth(p):scene==='DOOR_OPENING'?.75:0;
 girlWeight.current=reduced?receiverTarget:girlWeight.current+(receiverTarget-girlWeight.current)*(1-Math.exp(-dt*4));
 root.current.userData.handover={scene,elapsed:phase.current,progress:p,receiverWeight:girlWeight.current};
 if(gift.current&&manCarry.current){
  root.current.updateWorldMatrix(true,true);
  manCarry.current.getWorldPosition(frames.a);manCarry.current.getWorldQuaternion(frames.qa);
  if(girlCarry.current){girlCarry.current.getWorldPosition(frames.b);girlCarry.current.getWorldQuaternion(frames.qb);frames.a.lerp(frames.b,p);frames.qa.slerp(frames.qb,p)}
  gift.current.position.copy(root.current.worldToLocal(frames.a));
  root.current.getWorldQuaternion(frames.inverse).invert();gift.current.quaternion.copy(frames.inverse.multiply(frames.qa));
 }
 },-1);
 return <group ref={root} name="story-root"><GardenDetails/>
 <Neighborhood/><Cottage/><Landscape/><GardenBorder/><FlowerFence/><BlossomTrees/><EntranceFlowerPots/><PorchPlants/><Mailbox/><Countryside reduced={reduced}/><WoodenBridge/><GardenSwing reduced={reduced}/>
 <DoubleDoor open={open} reduced={reduced} paused={paused}/>
 <Line points={Array.from({length:41},(_,i)=>[-3+i*.15,3.05-Math.sin(i/40*Math.PI)*.55,-1.9] as [number,number,number])} color="#514639" lineWidth={1}/>
 {Array.from({length:13},(_,i)=><mesh key={i} position={[-3+i*.5,3.05-Math.sin(i/12*Math.PI)*.55,-1.9]}><sphereGeometry args={[.04,8,6]}/><meshStandardMaterial color="#ffe1aa" emissive="#ffc77e" emissiveIntensity={.15}/></mesh>)}
 <group ref={man} name="story-man" position={[0,0,5.6]} rotation={[0,Math.PI,0]}><Person walking={scene==='WALKING'} pace={pace} arm={arm} reduced={reduced} holding={!["HANDOVER","BOUQUET_TRANSITION"].includes(scene)} knocking={scene==="KNOCKING"} grip={gift} holdWeight={manWeight}/><group ref={manCarry} name="carry-anchor-man" position={[0,1.257,.34]}/></group>
 <group visible={open} name="story-girl" position={[.15,.37,-1.8]}><Person female reduced={reduced} holding={["HANDOVER","BOUQUET_TRANSITION"].includes(scene)} grip={gift} holdWeight={girlWeight} onReceiveReady={onReceiverReady}/><group ref={girlCarry} name="carry-anchor-girl" position={[0,1.1,.32]}/></group>
 <group ref={gift} name="story-bouquet" position={[0,1.257,5.26]} rotation={[0,Math.PI,0]} scale={.26}><Bouquet detailed={scene==='BOUQUET_TRANSITION'}/></group>
 <pointLight position={[0,2.7,-1.5]} color="#ffd5a0" intensity={.35} distance={8}/>
 </group>
}
