import { wishes } from './wishes';
const colors = ['#a92846','#efa6b8','#f4e7d7','#71152f','#edb1c2','#9e2441','#ed9b8c','#f4e7d7','#ce557e','#b32449','#efa6b8'];
export const roses = wishes.map((wish,i)=>({ ...wish, color:colors[i], variant:i%5, size: .82+(i%3)*.12, position: (i===0 ? [0,1.35,.3] : [Math.cos((i-1)*Math.PI/5)*(i<7?.68:.98),1.3+Math.sin((i-1)*Math.PI/5)*.63,(i<7?.15:-.28)]) as [number,number,number] }));
