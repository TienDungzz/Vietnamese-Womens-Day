import type { Frame,Slot } from './data';

export const shapeOptions=[
 {id:'layout',name:{vi:'Theo bố cục',en:'As designed'}},
 {id:'heart',name:{vi:'Trái tim',en:'Hearts'}},
 {id:'cloud',name:{vi:'Đám mây',en:'Clouds'}},
 {id:'oval',name:{vi:'Tròn',en:'Circles'}},
 {id:'arch',name:{vi:'Vòm',en:'Arches'}},
 {id:'flower',name:{vi:'Cánh hoa',en:'Petals'}},
] as const;
export type ShapeChoice=typeof shapeOptions[number]['id'];
export type PhotoShape=Exclude<ShapeChoice,'layout'>|'rect';
type Point=[number,number];
const cache=new Map<PhotoShape,Point[]>();

function curves(start:Point,segments:number[][]):Point[]{
 const points:Point[]=[start];let from=start;
 for(const [x1,y1,x2,y2,x,y] of segments){
  for(let i=1;i<=24;i++){const t=i/24,u=1-t;points.push([u*u*u*from[0]+3*u*u*t*x1+3*u*t*t*x2+t*t*t*x,u*u*u*from[1]+3*u*u*t*y1+3*u*t*t*y2+t*t*t*y])}
  from=[x,y];
 }
 return points;
}
export function shapePoints(shape:PhotoShape='rect'):Point[]{
 if(cache.has(shape))return cache.get(shape)!;
 let p:Point[];
 if(shape==='heart')p=curves([.5,.96],[[.40,.84,.04,.61,.04,.32],[.04,.04,.35,-.02,.5,.22],[.65,-.02,.96,.04,.96,.32],[.96,.61,.60,.84,.5,.96]]);
 else if(shape==='cloud')p=curves([.23,.86],[[.04,.89,-.01,.60,.13,.49],[.05,.28,.26,.17,.41,.29],[.46,.04,.79,.06,.81,.34],[.99,.27,1.02,.58,.88,.65],[.96,.86,.77,.97,.64,.85],[.49,.98,.32,.98,.23,.86]]);
 else if(shape==='arch')p=[[.04,.97],[.04,.44],...curves([.04,.44],[[.04,-.10,.96,-.10,.96,.44]]).slice(1),[.96,.97]];
 else if(shape==='oval'||shape==='flower')p=Array.from({length:160},(_,i)=>{const a=i/160*Math.PI*2,r=shape==='flower'?.43+.055*Math.cos(a*8):.48;return [.5+Math.cos(a)*r,.5+Math.sin(a)*r]});
 else p=[[0,0],[1,0],[1,1],[0,1]];
 cache.set(shape,p);return p;
}
export function slotPathData(slot:Slot){
 return shapePoints(slot.shape).map(([x,y],i)=>`${i?'L':'M'}${(slot.x+x*slot.width).toFixed(3)} ${(slot.y+y*slot.height).toFixed(3)}`).join(' ')+' Z';
}
export function slotClipPath(slot:Slot){
 return `polygon(${shapePoints(slot.shape).map(([x,y])=>`${(x*100).toFixed(3)}% ${(y*100).toFixed(3)}%`).join(',')})`;
}
export function resolveSlot(slot:Slot,choice:ShapeChoice='layout'):Slot{
 const shape=choice==='layout'?slot.shape??'rect':choice;
 if(shape==='rect')return {...slot,shape};
 const ratio=shape==='cloud'?1.45:shape==='arch'?.82:1;
 const width=Math.min(slot.width,slot.height*ratio),height=width/ratio;
 return {...slot,shape,x:slot.x+(slot.width-width)/2,y:slot.y+(slot.height-height)/2,width,height};
}
export function shapeFrame(frame:Frame,choice:ShapeChoice='layout'):Frame{
 return {...frame,slots:frame.slots.map(s=>resolveSlot(s,choice))};
}
