import { Suspense,useEffect,useMemo,useRef } from 'react';
import type { RefObject } from 'react';
import { Canvas,useFrame } from '@react-three/fiber';
import { OrbitControls,useGLTF } from '@react-three/drei';
import { Vector3 } from 'three';
import { Bouquet } from './Bouquet';
import { Story } from '../scenes/Story';
import { Atmosphere } from '../scenes/Atmosphere';
import { PhotoStack } from '../photobooth/PhotoStack';
import { SceneAssets,ScenePending } from './SceneLoading';
import type { Scene } from '../hooks/useSceneFlow';
type Props={loading:boolean;boothOpen:boolean;explore:boolean;assetUrls:string[];sceneMode:string;scene:Scene;night:RefObject<number>;reduced:boolean;reset:number;selected:string|null;select:(id:string)=>void;reach:()=>void;onPending:()=>void;onReady:(mode:string)=>void;onReceiverReady:()=>void;onOpenPhotos:()=>void};
export default function Scene3D({loading,boothOpen,explore,assetUrls,sceneMode,scene,night,reduced,reset,selected,select,reach,onPending,onReady,onReceiverReady,onOpenPhotos}:Props){
 useEffect(()=>{assetUrls.forEach(url=>useGLTF.preload(url))},[assetUrls]);
 return <Canvas frameloop={loading||boothOpen?'demand':'always'} style={{visibility:loading?'hidden':'visible'}} shadows dpr={[1,1.5]} camera={{position:[9,6.3,12.8],fov:40}} gl={{antialias:true}}><Suspense fallback={<ScenePending onPending={onPending}/>}><SceneAssets urls={assetUrls} mode={sceneMode} onPending={onPending} onReady={onReady}><Atmosphere studio={explore} reduced={reduced} night={night}/>{explore?<><Bouquet selected={selected} interactive onSelect={select}/><PhotoStack onOpen={onOpenPhotos}/><OrbitControls enabled={!boothOpen} key={reset} makeDefault target={[0,.5,0]} minDistance={3.4} maxDistance={7} minPolarAngle={.65} maxPolarAngle={1.9} enablePan={false} enableDamping dampingFactor={.075} rotateSpeed={.65} zoomSpeed={.7}/></>:<Story paused={loading} scene={scene} reach={reach} reduced={reduced} onReceiverReady={onReceiverReady}/>}<CameraRig approaching={!["INTRO_READY","WALKING"].includes(scene)} explore={explore} transition={scene==='BOUQUET_TRANSITION'} reset={reset} reduced={reduced}/></SceneAssets></Suspense></Canvas>;
}
function CameraRig({explore,transition,reset,reduced,approaching}:{explore:boolean;transition:boolean;reset:number;reduced:boolean;approaching:boolean}){
 const previous=useRef(''),key=useMemo(()=>`${explore}-${reset}`,[explore,reset]);
 const targets=useMemo(()=>({transition:new Vector3(.15,2.1,.5),near:new Vector3(3.8,3,4.3),wide:new Vector3(9,6.3,12.8)}),[]);
 useFrame(({camera},dt)=>{if(explore){if(previous.current!==key){camera.position.set(0,2.2,5.2);camera.lookAt(0,.5,0);previous.current=key}}else{camera.position.lerp(transition?targets.transition:approaching?targets.near:targets.wide,reduced?1:Math.min(1,dt*.85));transition?camera.lookAt(.15,1.85,-1.46):camera.lookAt(0,1.7,-.45);previous.current=key}});return null;
}
