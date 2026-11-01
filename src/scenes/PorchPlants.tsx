import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { Mesh } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { plantModelUrl } from '../sceneAssets';
function Plant(){
 const {scene}=useGLTF(plantModelUrl);
 const object=useMemo(()=>{const copy=clone(scene);copy.traverse(o=>{if(o instanceof Mesh){o.castShadow=true;o.receiveShadow=true}});return copy},[scene]);
 return <primitive object={object} scale={.7}/>;
}
export function PorchPlants(){return <>{[-1.08,1.08].map(x=><group key={x} position={[x,.22,-1.55]}><Plant/></group>)}</>}
