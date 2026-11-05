import { photos } from './photoCatalog';
import type { Photo } from './photoCatalog';
export { photos,photoSource } from './photoCatalog';
export type { Photo } from './photoCatalog';
import { shapeOptions } from './shapes';
import type { PhotoShape,ShapeChoice } from './shapes';
export type Slot={x:number;y:number;width:number;height:number;rotation?:number;shape?:PhotoShape};
export type Frame={id:string;count:number;width:number;height:number;slots:Slot[]};
function grid(columns:number,rows:number,width=1600,height=2000,gap=28):Slot[]{
 const margin=90,top=145,bottom=190,w=(width-margin*2-gap*(columns-1))/columns,h=(height-top-bottom-gap*(rows-1))/rows;
 return Array.from({length:columns*rows},(_,i)=>({x:margin+(i%columns)*(w+gap),y:top+Math.floor(i/columns)*(h+gap),width:w,height:h}));
}
const frame=(id:string,columns:number,rows:number,width=1600,height=2000,gap=28):Frame=>({id,count:columns*rows,width,height,slots:grid(columns,rows,width,height,gap)});
export const frames:Frame[]=[
 {...frame('journal-2',1,2,1400,2000,85),slots:grid(1,2,1400,2000,85).map((s,i)=>({...s,x:s.x+22,width:s.width-44,rotation:i?-.035:.035}))},
 frame('strip-3',1,3,900,2400,32),
 frame('grid-4',2,2),
 {...frame('highlight-4',2,2),slots:[{x:90,y:145,width:1420,height:995},...Array.from({length:3},(_,i)=>({x:90+i*482.66,y:1168,width:454.66,height:642}))]},
 frame('grid-6',2,3),
 frame('double-strip-6',2,3,1500,2200,85),
 frame('grid-8',2,4,1600,2400),
 {...frame('highlight-8',3,3),count:8,slots:[{x:90,y:145,width:937.33,height:536.33},...Array.from({length:7},(_,i)=>{const cell=i===0?2:i+2;return {x:90+(cell%3)*482.66,y:145+Math.floor(cell/3)*564.33,width:454.66,height:536.33}})]},
 frame('grid-9',3,3),
 frame('grid-12',3,4,1800,2400),
 frame('grid-16',4,4,2000,2400),
 frame('grid-20',4,5,2000,2800),
 // Retain existing IDs so saved photo selections survive layout refinements.
 {...frame('hearts-6',2,3,1800,2400),slots:[
  {x:90,y:145,width:980,height:1120,shape:'arch'},
  {x:1150,y:180,width:560,height:560,shape:'oval'},
  {x:1150,y:810,width:560,height:560,shape:'oval'},
  {x:90,y:1430,width:500,height:780,rotation:-.025},
  {x:650,y:1430,width:500,height:780,shape:'arch'},
  {x:1210,y:1430,width:500,height:780,rotation:.025},
 ]},
 {...frame('clouds-6',3,2,2000,2400),slots:[
  {x:105,y:160,width:540,height:800,rotation:-.035},
  {x:730,y:350,width:540,height:800,rotation:.025},
  {x:1355,y:210,width:540,height:800,rotation:.035},
  {x:105,y:1100,width:540,height:800,rotation:.025},
  {x:730,y:1300,width:540,height:800,rotation:-.025},
  {x:1355,y:1150,width:540,height:800,rotation:-.035},
 ]},
 {...frame('petals-8',2,4,1800,2800,60),slots:grid(2,4,1800,2800,60).map((s,i)=>({...s,shape:i%3===0?'flower':i%3===1?'heart':'oval'}))},
 {...frame('collage-10',2,5,2000,2800),slots:[
  {x:90,y:145,width:1820,height:540},
  ...Array.from({length:3},(_,i)=>({x:90+i*625,y:760,width:570,height:740,shape:'arch' as const})),
  ...Array.from({length:6},(_,i)=>({x:90+(i%3)*625,y:1600+Math.floor(i/3)*480,width:570,height:400,rotation:(i%2?1:-1)*.02})),
 ]},
];
// Reserve room for illustrated headers and side ornaments in every layout.
for(const f of frames){
 const rail=Math.max(70,f.width*.075),sx=(f.width-rail*2)/(f.width-180),sy=(f.height-470)/(f.height-335);
 f.slots=f.slots.map(s=>({...s,x:rail+(s.x-90)*sx,y:235+(s.y-145)*sy,width:s.width*sx,height:s.height*sy}));
}
export const palettes=[
 {id:'cream',name:{vi:'Vườn thư tình',en:'Love letter garden'},background:'#fff8eb',ink:'#514c3d',accent:'#818c64',line:'#c3c9aa'},
 {id:'blush',name:{vi:'Nơ hồng & ren',en:'Ribbons & lace'},background:'#fff0f5',ink:'#79334f',accent:'#d35c91',line:'#edacc9'},
 {id:'vintage',name:{vi:'Nhật ký yêu thương',en:'Love scrapbook'},background:'#f2e5cf',ink:'#594331',accent:'#98694e',line:'#c9ac86'},
 {id:'midnight',name:{vi:'Đêm lấp lánh',en:'Starlit celebration'},background:'#24131f',ink:'#fff0f5',accent:'#ff9ecb',line:'#a96486'},
 {id:'cherry',name:{vi:'Cherry ngọt ngào',en:'Sweet cherry'},background:'#fff6ed',ink:'#843643',accent:'#cd526a',line:'#e7a9ac'},
 {id:'film',name:{vi:'Cuộn phim 20/10',en:'October film roll'},background:'#211e1b',ink:'#f7ebd7',accent:'#e7b568',line:'#71634e'},
 {id:'scrapbook',name:{vi:'Sổ tay kỷ niệm',en:'Memory notebook'},background:'#f9f4e9',ink:'#4b5564',accent:'#7188a3',line:'#bac7d6'},
 {id:'postcard',name:{vi:'Bưu thiếp gửi em',en:'A postcard for you'},background:'#fbf5e9',ink:'#624b4a',accent:'#ae555d',line:'#8fa8b5'},
] as const;
export type FrameStyle=typeof palettes[number];
export type Entry={photoId:string;x:number;y:number;zoom:number};
export type Draft={frameId:string;paletteId:string;shapeId?:ShapeChoice;entries:(Entry|null)[]};
export const blankDraft=():Draft=>({frameId:'grid-4',paletteId:'cream',shapeId:'layout',entries:Array(20).fill(null)});
export function readDraft(catalog:Photo[]=photos):Draft{
 try{const d=JSON.parse(sessionStorage.getItem('rose-photobooth')||'null');if(!d)return blankDraft();
  return {shapeId:shapeOptions.find(s=>s.id===d.shapeId)?.id??'layout',frameId:frames.some(f=>f.id===d.frameId)?d.frameId:'grid-4',paletteId:palettes.some(p=>p.id===d.paletteId)?d.paletteId:'cream',entries:Array.from({length:20},(_,i)=>{const e=d.entries?.[i];return e&&catalog.some(p=>p.id===e.photoId)?{photoId:e.photoId,x:Number.isFinite(e.x)?Math.max(-1,Math.min(1,e.x)):0,y:Number.isFinite(e.y)?Math.max(-1,Math.min(1,e.y)):0,zoom:Number.isFinite(e.zoom)?Math.max(1,Math.min(3,e.zoom)):1}:null})};
 }catch{return blankDraft()}
}
export function cropRect(imageWidth:number,imageHeight:number,width:number,height:number,entry:Entry){
 const scale=Math.max(width/imageWidth,height/imageHeight)*entry.zoom,w=width/scale,h=height/scale;
 return {x:(imageWidth-w)/2*(1+entry.x),y:(imageHeight-h)/2*(1+entry.y),width:w,height:h};
}
