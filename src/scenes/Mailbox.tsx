import { Line, RoundedBox } from '@react-three/drei';
import { useSurface } from './useSurface';

export function Mailbox(){
 const wood=useSurface('wood');
 return <group name="front-door-mailbox" position={[1.05,0,5.05]} rotation={[0,.08,0]}>
  <mesh castShadow receiveShadow position={[0,.08,0]}><boxGeometry args={[.26,.16,.26]}/><meshStandardMaterial color="#b8afa0" roughness={1}/></mesh>
  <mesh castShadow position={[0,.61,0]}><boxGeometry args={[.095,1.08,.095]}/><meshStandardMaterial map={wood} color="#c5a582" roughness={.9}/></mesh>
  <mesh castShadow position={[0,1.07,0]}><boxGeometry args={[.52,.055,.56]}/><meshStandardMaterial map={wood} color="#b59574" roughness={.9}/></mesh>
  <RoundedBox castShadow args={[.45,.35,.53]} radius={.065} smoothness={4} position={[0,1.26,0]}><meshStandardMaterial color="#a45f70" metalness={.25} roughness={.48}/></RoundedBox>
  <RoundedBox args={[.39,.27,.018]} radius={.03} smoothness={3} position={[0,1.25,.269]}><meshStandardMaterial color="#b77685" metalness={.25} roughness={.48}/></RoundedBox>
  <mesh position={[0,1.32,.284]}><boxGeometry args={[.26,.022,.008]}/><meshStandardMaterial color="#423332" roughness={.85}/></mesh>
  <mesh position={[0,1.19,.284]}><boxGeometry args={[.13,.075,.008]}/><meshStandardMaterial color="#f0dfc6" roughness={.7}/></mesh>
  <Line points={[[-.06,1.225,.29],[0,1.185,.29],[.06,1.225,.29]]} color="#a27a69" lineWidth={1}/>
  <mesh position={[.24,1.37,0]}><boxGeometry args={[.018,.28,.024]}/><meshStandardMaterial color="#d2b27d" metalness={.55} roughness={.4}/></mesh>
  <mesh position={[.24,1.49,.055]}><boxGeometry args={[.022,.085,.13]}/><meshStandardMaterial color="#d2b27d" metalness={.55} roughness={.4}/></mesh>
 </group>;
}
