import type { Frame } from './data';
import { palettes } from './data';
import { specialBackground,specialSlot,specialFinishing } from './specialFrames';
type Context=CanvasRenderingContext2D;
type Theme=typeof palettes[number];
function heart(c:Context,x:number,y:number,r:number,color:string){c.save();c.translate(x,y);c.beginPath();c.moveTo(0,r*.8);c.bezierCurveTo(-r*1.6,-r*.2,-r*.8,-r*1.3,0,-r*.5);c.bezierCurveTo(r*.8,-r*1.3,r*1.6,-r*.2,0,r*.8);c.fillStyle=color;c.fill();c.restore()}
function star(c:Context,x:number,y:number,r:number,color:string){c.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,rad=i%2?r*.24:r;c.lineTo(x+Math.cos(a)*rad,y+Math.sin(a)*rad)}c.closePath();c.fillStyle=color;c.fill()}
function flower(c:Context,x:number,y:number,r:number,color:string){c.fillStyle=color;for(let i=0;i<5;i++){const a=i*Math.PI*2/5;c.beginPath();c.ellipse(x+Math.cos(a)*r*.5,y+Math.sin(a)*r*.5,r*.48,r*.34,a,0,Math.PI*2);c.fill()}c.fillStyle='#d8ac60';c.beginPath();c.arc(x,y,r*.23,0,Math.PI*2);c.fill()}
function bow(c:Context,x:number,y:number,r:number,color:string){c.save();c.translate(x,y);c.strokeStyle=color;c.fillStyle=color;c.lineWidth=r*.1;for(const s of [-1,1]){c.beginPath();c.moveTo(0,0);c.bezierCurveTo(s*r*1.7,-r*1.5,s*r*1.8,r*.9,0,0);c.stroke();c.beginPath();c.moveTo(s*r*.1,r*.05);c.quadraticCurveTo(s*r*.25,r*.7,s*r*.8,r*1.15);c.lineTo(s*r*.5,r*1.1);c.stroke()}c.beginPath();c.arc(0,0,r*.16,0,Math.PI*2);c.fill();c.restore()}
function gingham(c:Context,w:number,h:number,color:string){c.save();c.fillStyle=color;c.globalAlpha=.17;for(let x=0;x<w;x+=44)c.fillRect(x,0,22,h);for(let y=0;y<h;y+=44)c.fillRect(0,y,w,22);c.restore()}

export function frameBackground(c:Context,f:Frame,p:Theme){
 if(specialBackground(c,f,p))return;
 const w=f.width,h=f.height;
 c.fillStyle=p.background;c.fillRect(0,0,w,h);
 if(p.id==='blush')gingham(c,w,h,p.accent);
 if(p.id==='cherry'){
  c.fillStyle='#e8a8b43d';for(let y=45;y<h;y+=100)for(let x=35;x<w;x+=100){c.beginPath();c.arc(x+(Math.floor(y/100)%2)*35,y,6,0,Math.PI*2);c.fill()}
 }
 if(p.id==='cream'){
  for(const x of [48,w-48]){
   c.strokeStyle='#8f9c7466';c.lineWidth=3;c.beginPath();c.moveTo(x,185);
   for(let y=185;y<h-200;y+=130){c.quadraticCurveTo(x+23,y+35,x,y+65);c.quadraticCurveTo(x-23,y+95,x,y+130)}c.stroke();
   c.fillStyle='#aab890';for(let y=225;y<h-210;y+=65){c.beginPath();c.ellipse(x+(Math.floor(y/65)%2?9:-9),y,13,5,Math.floor(y/65)%2?-.6:.6,0,Math.PI*2);c.fill()}
  }
 }
 if(p.id==='midnight'){
  const glow=c.createLinearGradient(0,0,0,h);glow.addColorStop(0,'#1d111c');glow.addColorStop(.65,'#432037');glow.addColorStop(1,'#bd5c89');c.fillStyle=glow;c.fillRect(0,0,w,h);
  for(let i=0;i<110;i++){const x=(i*317.17)%w,y=(i*541.31)%h;star(c,x,y,i%7===0?9:3,i%3?'#ffd7ea':'#fff8e4')}
 }
 if(p.id==='vintage'){
  c.strokeStyle='#ad90602b';c.lineWidth=1;for(let y=35;y<h;y+=36){c.beginPath();c.moveTo(30,y);c.lineTo(w-30,y);c.stroke()}
 }
 c.strokeStyle=p.line;c.lineWidth=3;c.strokeRect(27,27,w-54,h-54);
 c.setLineDash([3,10]);c.strokeRect(40,40,w-80,h-80);c.setLineDash([]);
 if(p.id==='blush'){
  c.fillStyle='#fffafa';for(let y=195;y<h-190;y+=25)for(const x of [46,w-46]){c.beginPath();c.arc(x,y,11,0,Math.PI*2);c.fill()}
 }
 // The outer rail stays outside the photo openings, including dense layouts.
 for(let y=190;y<h-200;y+=145){
  if(p.id==='cream'){flower(c,49,y,25,'#f0cfcd');flower(c,w-49,y+42,23,'#e4cd90')}
  else if(p.id==='midnight'){star(c,49,y,25,p.accent);star(c,w-49,y+35,20,'#fff0f5')}
  else if(p.id==='cherry'){for(const x of [45,w-45]){c.strokeStyle='#7a8d63';c.lineWidth=3;c.beginPath();c.moveTo(x-9,y+7);c.quadraticCurveTo(x,y-25,x+12,y-15);c.lineTo(x+13,y+10);c.stroke();heart(c,x-9,y+13,10,p.accent);heart(c,x+13,y+16,10,p.accent)}}
  else {heart(c,49,y,12,p.accent);star(c,w-49,y+30,13,p.accent)}
 }
 c.textAlign='center';c.fillStyle=p.accent;
 c.font=p.id==='vintage'?`bold ${Math.min(57,w*.052)}px monospace`:p.id==='cherry'?`bold ${Math.min(66,w*.056)}px "Be Vietnam Pro",sans-serif`:`italic bold ${Math.min(84,w*.066)}px Georgia,serif`;
 const title=p.id==='vintage'?'OUR MEMORY JOURNAL':p.id==='cherry'?'SWEET LITTLE MOMENTS':p.id==='midnight'?'Written in the stars':"Happy Women's Day";
 if(p.id==='blush'){c.strokeStyle='#fffafc';c.lineWidth=8;c.lineJoin='round';c.strokeText(title,w/2,127,w-230)}
 c.fillText(title,w/2,127,w-230);
 c.font='600 25px "Be Vietnam Pro",sans-serif';c.fillText('20 / 10  ·  FOR YOU',w/2,178,w-180);
 if(p.id==='blush'||p.id==='midnight'){bow(c,91,111,39,p.accent);bow(c,w-91,111,39,p.accent)}
 else {flower(c,91,109,34,p.accent);flower(c,w-91,109,34,p.accent)}
 c.strokeStyle=p.line;c.lineWidth=2;c.beginPath();c.moveTo(w*.20,205);c.lineTo(w*.80,205);c.stroke();
 heart(c,w/2,205,11,p.accent);
}

export function slotBorder(c:Context,x:number,y:number,w:number,h:number,p:Theme){
 if(specialSlot(c,x,y,w,h,p))return;
 c.fillStyle=p.id==='midnight'?'#fff1f7':'#fffdf7';c.fillRect(x-11,y-11,w+22,h+22);
 c.strokeStyle=p.accent;c.lineWidth=3;c.strokeRect(x-7,y-7,w+14,h+14);
 if(p.id==='blush'){
  c.fillStyle='#fffdfb';c.strokeStyle=p.line;c.lineWidth=1.5;
  for(let xx=x;xx<x+w;xx+=20)for(const yy of [y-10,y+h+10]){c.beginPath();c.arc(xx,yy,7,0,Math.PI*2);c.fill();c.stroke()}
 }else if(p.id==='vintage'){
  c.save();c.globalAlpha=.7;c.fillStyle='#cfb58c';c.translate(x+w*.17,y-7);c.rotate(-.12);c.fillRect(-w*.1,-11,w*.2,25);c.restore();
 }
}

export function frameFinishing(c:Context,f:Frame,p:Theme){
 if(specialFinishing(c,f,p))return;
 // Small corner embellishments never obscure the center of a photo.
 f.slots.forEach((s,i)=>{if(s.shape&&s.shape!=='rect')return;c.save();c.translate(s.x+s.width/2,s.y+s.height/2);c.rotate(s.rotation??0);const x=s.width/2,y=-s.height/2;
  if(p.id==='blush')bow(c,x,y,14,p.accent);
  if(p.id==='cream')flower(c,x,y,13,i%2?'#f0cfcd':'#e1c984');
  if(p.id==='midnight')star(c,x,y,16,p.accent);
  if(p.id==='cherry')heart(c,x,y,13,p.accent);
  c.restore()});
 const y=f.height-158;
 if(p.id==='blush'||p.id==='midnight')bow(c,f.width/2,y,19,p.accent);
 else {c.strokeStyle=p.line;c.lineWidth=2;c.beginPath();c.moveTo(f.width/2-90,y);c.lineTo(f.width/2+90,y);c.stroke();heart(c,f.width/2,y,13,p.accent)}
}
