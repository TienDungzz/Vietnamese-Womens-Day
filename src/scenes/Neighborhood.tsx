import { useSurface } from './useSurface';
export function Neighborhood(){
 const asphalt=useSurface('asphalt'),stone=useSurface('stone');
 return <group name="Front street">
 <mesh receiveShadow position={[0,-.012,8.85]}><boxGeometry args={[90,.035,4.4]}/><meshStandardMaterial map={asphalt} bumpMap={asphalt} bumpScale={.008} roughness={.94}/></mesh>
 {[-1,1].map(side=><group key={side}>
 <mesh receiveShadow position={[0,.005,8.85+side*3.1]}><boxGeometry args={[90,.045,1.65]}/><meshStandardMaterial map={stone} color="#e1d9ca" roughness={.9}/></mesh>
 <mesh position={[0,.035,8.85+side*2.25]}><boxGeometry args={[90,.12,.12]}/><meshStandardMaterial color="#c5c3b8" roughness={.88}/></mesh>
 {Array.from({length:46},(_,i)=><mesh key={i} position={[-44+i*1.95,.03,8.85+side*3.1]}><boxGeometry args={[.012,.005,1.65]}/><meshStandardMaterial color="#b6b3a9"/></mesh>)}
 </group>)}
 {Array.from({length:24},(_,i)=><mesh key={i} position={[-43+i*3.7,.009,8.85]}><boxGeometry args={[1.6,.008,.065]}/><meshStandardMaterial color="#f3e7b1" roughness={1}/></mesh>)}
 </group>;
}
