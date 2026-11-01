import { useEffect, useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { AnimationMixer, Bone, Group, Mesh, Quaternion, Vector3 } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { maleModelUrl, femaleModelUrl } from '../sceneAssets';

type Props={female?:boolean;walking?:boolean;arm?:RefObject<Group|null>;reduced?:boolean;holding?:boolean;knocking?:boolean;grip?:RefObject<Group|null>;holdWeight?:RefObject<number>;pace?:RefObject<number>;onReady?:()=>void};
export function Person(props:Props){return <RiggedPerson {...props}/>;}

function RiggedPerson({female=false,walking=false,reduced=false,holding=true,knocking=false,grip,holdWeight,pace,onReady}:Props){
 const gltf=useGLTF(female?femaleModelUrl:maleModelUrl),group=useRef<Group>(null);
 const scene=useMemo(()=>{
  const copy=clone(gltf.scene);
  copy.traverse(o=>{if(o instanceof Mesh){o.castShadow=true;o.receiveShadow=false;if(/Phone|Original held accessory/i.test(o.name))o.visible=false;
   for(const material of Array.isArray(o.material)?o.material:[o.material])if(material.name.startsWith('RW Soft hair cards')){material.alphaToCoverage=true;material.needsUpdate=true}
  }});
  return copy;
 },[gltf.scene]);
 const mixer=useMemo(()=>new AnimationMixer(scene),[scene]);
 const actions=useMemo(()=>Object.fromEntries(gltf.animations.map(clip=>[clip.name,mixer.clipAction(clip)])),[mixer,gltf.animations]);
 // StrictMode replays effects with the same memoized actions. Uncaching their
 // root here invalidates those action bindings before the replayed .play().
 // The local mixer and bindings are garbage-collected with this character.
 useEffect(()=>()=>{mixer.stopAllAction()},[mixer]);
 const bones=useMemo(()=>({left:[scene.getObjectByName('upperarm_l'),scene.getObjectByName('lowerarm_l'),scene.getObjectByName('hand_l')],right:[scene.getObjectByName('upperarm_r'),scene.getObjectByName('lowerarm_r'),scene.getObjectByName('hand_r')]}),[scene]);
 const solver=useMemo(()=>({target:new Vector3(),offset:new Vector3(),orient:new Quaternion(),joint:new Vector3(),end:new Vector3(),from:new Vector3(),to:new Vector3(),turn:new Quaternion(),world:new Quaternion(),parent:new Quaternion()}),[]);
 const pose=useRef(holdWeight?.current??(holding?1:0)),knockPose=useRef(0);
 useEffect(()=>{onReady?.()},[onReady]);
 useEffect(()=>{
  const action=actions[walking&&!reduced?'Walk_Relaxed':'Idle_Standing'];
  action?.reset().fadeIn(reduced?0:.5).play();
  return()=>{action?.fadeOut(reduced?0:.5)};
 },[actions,walking,reduced]);
 useFrame(({clock},dt)=>{
  if(!group.current)return;
  // Apply the authored animation first, then IK in the same callback; the mixer
  // must never overwrite the solved arms later in the frame.
  const step=Math.min(dt,.05);
  // Measured forward foot excursion for the revised rig at the actor's 0.96 scale.
  if(walking&&pace&&actions.Walk_Relaxed)actions.Walk_Relaxed.timeScale+=(Math.max(.25,pace.current/.7065)-actions.Walk_Relaxed.timeScale)*(1-Math.exp(-dt*7));
  mixer.update(dt);
  const desired=knocking?1:holdWeight?.current??(holding?1:0);
  pose.current+=(desired-pose.current)*(1-Math.exp(-step*(reduced?100:6)));
  knockPose.current+=((knocking?1:0)-knockPose.current)*(1-Math.exp(-step*7));
  // Keep the authored leg/spine animation; solve both arms toward the bouquet.
  const strength=pose.current;if(strength<.001)return;
  for(const [side,chain] of [[1,bones.left],[-1,bones.right]] as const){
   if(chain.some(b=>!b))continue;
   const [upper,lower,hand]=chain as Bone[];
   const knock=side===-1?knockPose.current:0;
   if(grip?.current){
    grip.current.updateWorldMatrix(true,false);
    solver.target.set(0,-.49,0);grip.current.localToWorld(solver.target);
    group.current.getWorldQuaternion(solver.orient);
    solver.offset.set(side*.075,0,0).applyQuaternion(solver.orient);solver.target.add(solver.offset);
    if(knock>.001){solver.offset.set(side*.23,1.48,.53+Math.sin(clock.elapsedTime*7)*.025);group.current.localToWorld(solver.offset);solver.target.lerp(solver.offset,knock)}
   }else{
    solver.target.set(knock?side*.23:side*.10,knock?1.48:1.13,knock?.53+Math.sin(clock.elapsedTime*9)*.035:.34);
    group.current.localToWorld(solver.target);
   }
   for(let pass=0;pass<4;pass++)for(const joint of [lower,upper]){
    joint.updateWorldMatrix(true,true);joint.getWorldPosition(solver.joint);hand.getWorldPosition(solver.end);
    solver.from.copy(solver.end).sub(solver.joint).normalize();solver.to.copy(solver.target).sub(solver.joint).normalize();
    solver.turn.setFromUnitVectors(solver.from,solver.to);joint.getWorldQuaternion(solver.world);solver.world.premultiply(solver.turn);joint.parent!.getWorldQuaternion(solver.parent).invert();solver.world.premultiply(solver.parent);
    joint.quaternion.slerp(solver.world,strength*.75);
   }
  }
 });
 return <group ref={group} name="rigged-character"><primitive object={scene} scale={female?.94:.96}/></group>;
}
