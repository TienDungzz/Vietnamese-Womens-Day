import { wishes } from './wishes';
import layout from './bouquet-layout.json';
const colors = ['#a92846','#efa6b8','#f4e7d7','#71152f','#edb1c2','#9e2441','#ed9b8c','#f4e7d7','#ce557e','#b32449'];
// Hand-arranged clusters: varied crown heights, bloom sizes, lean and petal rotation.
export const roses = wishes.map((wish,i)=>{
 const flower=layout[i];
 return {...wish,color:colors[i],variant:i%5,size:flower.size,twist:flower.twist,
  position:flower.position as [number,number,number],direction:flower.direction as [number,number,number]};
});
