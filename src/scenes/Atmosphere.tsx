import type { RefObject } from 'react';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { AgXToneMapping, Group, HemisphereLight, DirectionalLight, Color, Fog } from 'three';
import { GardenTrees } from './GardenTrees';
import { SkyCycle } from './SkyCycle';

export function Atmosphere({studio,reduced,night}:{studio:boolean;reduced:boolean;night:RefObject<number>}){
 const ambient=useRef<HemisphereLight>(null),key=useRef<DirectionalLight>(null),fill=useRef<DirectionalLight>(null);
 const colors=useMemo(()=>({day:new Color('#fff0cc'),night:new Color('#a6bcff'),fogDay:new Color('#c9e8ed'),fogNight:new Color('#19243c')}),[]);
 const gl=useThree(s=>s.gl);
 const lanterns=useRef<Group>(null);
 useFrame(()=>{lanterns.current?.children.forEach(light=>{if('intensity' in light)(light as import('three').PointLight).intensity=.1+night.current*2.4})});
 useEffect(()=>{if(!studio)return;const previous=gl.toneMapping;gl.toneMapping=AgXToneMapping;return()=>{gl.toneMapping=previous}},[gl,studio]);
 const dust=useRef<Group>(null);
 useFrame(({clock,scene})=>{const n=night.current;if(ambient.current)ambient.current.intensity=studio?1.2-n*.35:1.8-n*1.32;if(key.current){key.current.intensity=studio?2.3-n*.5:3.2-n*2.65;key.current.color.copy(colors.day).lerp(colors.night,n)}if(fill.current)fill.current.intensity=studio?1.6:.75-n*.4;if(scene.fog instanceof Fog)scene.fog.color.copy(colors.fogDay).lerp(colors.fogNight,n);if(dust.current&&!reduced){dust.current.rotation.y=Math.sin(clock.elapsedTime*.07)*.1;dust.current.position.y=Math.sin(clock.elapsedTime*.2)*.06}});
 return <>
 {!studio&&<group ref={lanterns}>{[-1.45,1.45].map(x=><pointLight key={x} position={[x,2.25,-1.55]} color="#ffc58a" intensity={.1} distance={5} decay={2}/>)}</group>}
 {!studio&&<><SkyCycle reduced={reduced} night={night}/><fog attach="fog" args={['#c9e8ed',22,65]}/></>}
 <hemisphereLight ref={ambient} args={studio?['#f5e9e3','#b8a7a2',1.2]:['#e0f4ff','#8d9d65',1.8]}/>
 {studio&&<directionalLight position={[0,1,5]} color="#fff1e6" intensity={1.2}/>}
 <directionalLight ref={key} castShadow position={studio?[3,7,5]:[-8,12,6]} color={studio?"#ffdfbc":"#fff0cc"} intensity={studio?2.3:3.2} shadow-mapSize={[1024,1024]} shadow-bias={-.001} shadow-normalBias={.035} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} shadow-radius={3}/>
 <directionalLight ref={fill} position={[-4,3,-2]} color={studio?"#d4e4ff":"#c5e6ff"} intensity={studio?1.6:.75}/>
 {studio&&<spotLight position={[0,5,-4]} color="#ffcf9e" intensity={25} angle={.7} penumbra={1}/>}
 <group ref={dust}>{Array.from({length:24},(_,i)=><mesh key={i} position={[Math.sin(i*12.7)*(studio?2.4:5),.2+(i%7)*.43,Math.cos(i*7.3)*2]}><sphereGeometry args={[i%3?.008:.013,6,4]}/><meshBasicMaterial color="#e8c39d" transparent opacity={i%3?.25:.5}/></mesh>)}</group>
 {studio&&<group position={[0,-1.45,0]}><mesh receiveShadow rotation={[-Math.PI/2,0,0]}><circleGeometry args={[8,64]}/><meshStandardMaterial color="#301a26" roughness={.86}/></mesh><mesh position={[0,.015,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[1.65,1.66,96]}/><meshBasicMaterial color="#98705b" transparent opacity={.25}/></mesh></group>}
 </>;
}

export function GardenDetails(){
 return <>
 {/* Porch steps, timber posts and the horizontal lintel. */}
 {[0,1,2].map(i=><mesh key={'step'+i} receiveShadow position={[0,.055+i*.065,-1.35-i*.28]}><boxGeometry args={[3.25, .11+i*.13,.6]}/><meshStandardMaterial color="#b4a394" roughness={.9}/></mesh>)}
 {[-1.35,1.35].map(x=><mesh key={x} castShadow position={[x,1.6,-1.85]}><boxGeometry args={[.12,3.2,.12]}/><meshStandardMaterial color="#d4beab"/></mesh>)}
 <mesh castShadow position={[0,3.1,-1.85]}><boxGeometry args={[3,.16,.3]}/><meshStandardMaterial color="#d4beab"/></mesh>
 {[-1.45,1.45].map(x=><group key={'lamp'+x} position={[x,2.25,-1.7]}><mesh><boxGeometry args={[.16,.28,.16]}/><meshStandardMaterial color="#f5d299" emissive="#ffc883" emissiveIntensity={.12}/></mesh>{[-.15,.15].map(y=><mesh key={y} position={[0,y,0]}><boxGeometry args={[.22,.035,.22]}/><meshStandardMaterial color="#493633" metalness={.5} roughness={.5}/></mesh>)}<pointLight color="#ffc990" intensity={.1} distance={3}/></group>)}
 <GardenTrees/>
 </>;
}
