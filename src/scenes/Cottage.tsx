import { Shape } from 'three';
import { RoundedBox } from '@react-three/drei';
import { useSurface } from './useSurface';
import { FlowerGarden } from './FlowerGarden';
const gable=new Shape();gable.moveTo(-3.3,0);gable.lineTo(0,1.1);gable.lineTo(3.3,0);gable.closePath();

export function Cottage(){
 const plaster=useSurface('plaster'),wood=useSurface('wood');
 return <group name="cottage">
 {/* Build around the doorway so the open door reveals a real recess. */}
 {[[-2,1.85,2.6],[2,1.85,2.6],[0,3.17,1.4]].map(([x,y,w],i)=><mesh key={i} castShadow receiveShadow position={[x,y,-3.95]}><boxGeometry args={[w,i===2?1.1:3.7,3.6]}/><meshStandardMaterial map={plaster} bumpMap={plaster} bumpScale={.025} roughness={.95}/></mesh>)}
 <mesh position={[0,1.25,-3.6]}><boxGeometry args={[1.45,2.5,.15]}/><meshStandardMaterial color="#4b332b"/></mesh>
 <mesh position={[0,3.7,-2.14]}><shapeGeometry args={[gable]}/><meshStandardMaterial map={plaster} roughness={.95}/></mesh>
 <mesh position={[0,.12,-3.85]} receiveShadow><boxGeometry args={[6.85,.24,4]}/><meshStandardMaterial color="#807362" roughness={1}/></mesh>
 {[-1,1].map(side=><group key={side} position={[0,4.8,-3.95]} scale={[1.32,1,1.25]} rotation={[0,0,-side*.4]}><mesh castShadow position={[side*1.43,0,0]}><boxGeometry args={[3.15,.13,3.2]}/><meshStandardMaterial color="#695145" roughness={.9}/></mesh>{Array.from({length:7},(_,row)=>Array.from({length:18},(_,col)=><mesh key={row+'-'+col} position={[side*(.16+row*.42),.09,col*.174-1.48]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.115,.115,.48,8,1,false,0,Math.PI]}/><meshStandardMaterial color={['#694b43','#765247','#805a4c','#60473e'][(col+row*3)%4]} roughness={.95}/></mesh>))}</group>)}
 <mesh position={[0,4.85,-3.95]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.12,.12,4.1,12,1,false,0,Math.PI]}/><meshStandardMaterial color="#79584a"/></mesh>
 <mesh castShadow position={[2.15,4.8,-4.65]}><boxGeometry args={[.5,1.15,.5]}/><meshStandardMaterial color="#866551" map={plaster} roughness={1}/></mesh>
 <mesh position={[2.15,5.4,-4.65]}><boxGeometry args={[.65,.12,.65]}/><meshStandardMaterial color="#5e5045"/></mesh>
 {[-.76,.76].map(x=><mesh key={x} position={[x,1.32,-2.06]}><boxGeometry args={[.12,2.64,.22]}/><meshStandardMaterial color="#d8c6ab" map={wood}/></mesh>)}
 <mesh position={[0,2.62,-2.06]}><boxGeometry args={[1.65,.14,.22]}/><meshStandardMaterial color="#d8c6ab"/></mesh>
 {[-2.25,2.25].map(x=><group key={x} position={[x,1.65,-2.1]}>
 <mesh position={[0,0,-.06]}><boxGeometry args={[.86,1.18,.12]}/><meshStandardMaterial color="#e3be87" emissive="#e9b56b" emissiveIntensity={.04} roughness={.24}/></mesh>
 {[-.46,.46].map(dx=><mesh key={dx} position={[dx,0,.04]}><boxGeometry args={[.09,1.35,.12]}/><meshStandardMaterial color="#e0cfb8"/></mesh>)}
 {[-.63,0,.63].map(y=><mesh key={y} position={[0,y,.05]}><boxGeometry args={[.98,.07,.12]}/><meshStandardMaterial color="#e0cfb8"/></mesh>)}
 <mesh position={[0,0,.06]}><boxGeometry args={[.045,1.25,.1]}/><meshStandardMaterial color="#d8c4ac"/></mesh>
 {[-.31,.31].map(dx=><mesh key={dx} position={[dx,0,.01]}><boxGeometry args={[.17,1.1,.035]}/><meshStandardMaterial color="#c9b6a1" roughness={1}/></mesh>)}
 <mesh position={[0,-.71,.12]}><boxGeometry args={[1.12,.12,.36]}/><meshStandardMaterial color="#c5b59c"/></mesh>
 <mesh position={[0,-.9,.17]}><boxGeometry args={[.85,.26,.27]}/><meshStandardMaterial map={wood} roughness={.9}/></mesh>
 </group>)}
 </group>;
}
export function Landscape(){
 const grass=useSurface('grass'),stone=useSurface('stone');
 return <>
 <mesh receiveShadow rotation={[-Math.PI/2,0,0]} position={[0,-.035,0]}><planeGeometry args={[240,240]}/><meshStandardMaterial map={grass} bumpMap={grass} bumpScale={.025} roughness={1}/></mesh>
 {Array.from({length:19},(_,i)=><RoundedBox key={i} name={`entrance-stone-${i}`} args={[1.22,.07,.31]} radius={.045} smoothness={2} position={[Math.sin(i*.7)*.06,.013,4.33-i*.32]} rotation={[0,Math.sin(i)*.035,0]} receiveShadow><meshStandardMaterial map={stone} bumpMap={stone} bumpScale={.018} roughness={.94} color={i%3?'#d7ccba':'#b7b0a0'}/></RoundedBox>)}
 <FlowerGarden/>{Array.from({length:7},(_,i)=><RoundedBox key={i} name={`swing-stone-${i}`} args={[.31,.05,.58]} radius={.03} smoothness={2} position={[-.95-i*.4,.015,.7+Math.sin(i/6*Math.PI*.8)*.65]} rotation={[0,-.12,0]} receiveShadow><meshStandardMaterial map={stone} roughness={.95}/></RoundedBox>)}
 </>;
}
