import type { Frame,FrameStyle } from './data';
import type { Language } from '../i18n';
type Context=CanvasRenderingContext2D;

function line(c:Context,x:number,y:number,x2:number,y2:number,color:string,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke()}
function tape(c:Context,x:number,y:number,w:number,angle:number,color:string){
 c.save();c.translate(x,y);c.rotate(angle);c.fillStyle=color;c.beginPath();
 c.moveTo(-w/2,-15);for(let i=0;i<5;i++)c.lineTo(-w/2+(i%2?4:0),-15+i*7);
 c.lineTo(w/2,15);for(let i=0;i<5;i++)c.lineTo(w/2-(i%2?4:0),15-i*7);
 c.closePath();c.fill();c.restore();
}
function postmark(c:Context,x:number,y:number,color:string){
 c.save();c.translate(x,y);c.rotate(-.18);c.strokeStyle=color;c.lineWidth=2;
 for(const r of [37,44]){c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.stroke()}
 c.fillStyle=color;c.font='bold 18px Georgia,serif';c.textAlign='center';c.fillText('20 OCT',0,6);
 for(let i=0;i<3;i++){c.beginPath();c.moveTo(40,-15+i*14);c.bezierCurveTo(60,-30+i*14,78,i*14,100,-15+i*14);c.stroke()}
 c.restore();
}

/** Dedicated artwork: these styles have their own borders, headers and footer. */
export function specialBackground(c:Context,f:Frame,p:FrameStyle):boolean{
 const w=f.width,h=f.height;
 if(p.id==='film'){
  c.fillStyle=p.background;c.fillRect(0,0,w,h);
  for(let y=32;y<h-30;y+=76)for(const x of [25,w-55]){
   c.fillStyle='#080807';c.beginPath();c.roundRect(x,y,30,44,6);c.fill();
   c.strokeStyle='#5a5042';c.lineWidth=2;c.stroke();
  }
  line(c,76,25,76,h-25,p.line);line(c,w-76,25,w-76,h-25,p.line);
  c.fillStyle=p.accent;c.textAlign='center';c.font=`bold ${Math.min(76,w*.065)}px monospace`;
  c.fillText('OUR LITTLE FILM',w/2,110,w-220);
  c.font='22px monospace';c.fillText('20 OCT  /  LOVE IN EVERY FRAME',w/2,157,w-220);
  line(c,110,194,w-110,194,p.line);
  c.textAlign='left';c.font='17px monospace';c.fillText('RW  •  COLOR NEGATIVE 400',112,h-180,w-224);
  c.textAlign='right';c.fillText('20:10',w-112,h-180);
  return true;
 }
 if(p.id==='scrapbook'){
  c.fillStyle=p.background;c.fillRect(0,0,w,h);
  c.strokeStyle='#bac7d644';c.lineWidth=1;
  for(let x=34;x<w;x+=35)line(c,x,0,x,h,'#bac7d644',1);
  for(let y=25;y<h;y+=35)line(c,0,y,w,y,'#bac7d644',1);
  c.fillStyle='#e6e1d5';c.fillRect(0,0,22,h);
  for(let y=75;y<h-55;y+=110){
   c.fillStyle='#ccc8bb';c.beginPath();c.arc(45,y,12,0,Math.PI*2);c.fill();
   c.strokeStyle='#8a8e94';c.lineWidth=5;c.beginPath();c.ellipse(28,y-5,24,12,-.2,Math.PI*.1,Math.PI*1.9);c.stroke();
  }
  line(c,84,0,84,h,'#d5a3a3',2);
  c.save();c.translate(w/2,104);c.rotate(-.025);c.fillStyle='#e5ebf1';c.fillRect(-w*.32,-58,w*.64,116);
  tape(c,-w*.27,-45,92,-.2,'#e9d3b2dd');tape(c,w*.27,45,92,-.2,'#e9d3b2dd');
  c.fillStyle=p.ink;c.textAlign='center';c.font=`italic bold ${Math.min(71,w*.061)}px Georgia,serif`;c.fillText('Little things, big love',0,7,w*.60);
  c.restore();c.fillStyle=p.accent;c.font='23px monospace';c.textAlign='center';c.fillText('MEMORY NOTES  /  20.10',w/2,192,w-220);
  c.strokeStyle=p.accent;c.lineWidth=3;
  for(const [x,y] of [[w-46,215],[w-46,h-195]]){c.beginPath();c.moveTo(x-15,y-20);c.lineTo(x+7,y+20);c.moveTo(x+15,y-20);c.lineTo(x-7,y+20);c.stroke()}
  return true;
 }
 if(p.id==='postcard'){
  c.fillStyle=p.background;c.fillRect(0,0,w,h);
  // Alternating airmail chevrons run around the page, outside all photo slots.
  c.save();c.beginPath();c.rect(0,0,w,h);c.rect(28,28,w-56,h-56);c.clip('evenodd');
  for(let x=-h;x<w+h;x+=96){c.fillStyle=Math.round(x/96)%2?'#b46a71':'#809ba9';c.beginPath();c.moveTo(x,0);c.lineTo(x+40,0);c.lineTo(x+h+40,h);c.lineTo(x+h,h);c.closePath();c.fill()}
  c.restore();c.strokeStyle='#d3c6b1';c.lineWidth=2;c.strokeRect(40,40,w-80,h-80);
  c.fillStyle=p.ink;c.textAlign='left';c.font=`${Math.min(75,w*.066)}px Georgia,serif`;c.fillText('To you, with love',100,117,w-340);
  c.font='21px monospace';c.fillText('A LITTLE LETTER  •  20 / 10',104,166,w-340);
  c.strokeStyle=p.accent;c.setLineDash([5,5]);c.strokeRect(w-189,63,91,108);c.setLineDash([]);
  c.fillStyle='#ead4d3';c.fillRect(w-179,73,71,88);c.fillStyle=p.accent;c.font='italic bold 33px Georgia,serif';c.textAlign='center';c.fillText('20',w-143,112);c.font='17px monospace';c.fillText('OCT',w-143,142);
  postmark(c,w-255,159,'#806f6380');
  line(c,100,201,w-100,201,'#c7b9a2');
  c.fillStyle=p.accent;c.textAlign='left';c.font='italic 25px Georgia,serif';c.fillText('Special delivery, just for you.',100,h-176,w-200);
  return true;
 }
 return false;
}

export function specialSlot(c:Context,x:number,y:number,w:number,h:number,p:FrameStyle):boolean{
 if(p.id==='film'){
  c.fillStyle='#070706';c.fillRect(x-10,y-10,w+20,h+20);c.strokeStyle=p.accent;c.lineWidth=2;c.strokeRect(x-5,y-5,w+10,h+10);return true;
 }
 if(p.id==='scrapbook'){
  c.fillStyle='#51453320';c.fillRect(x-6,y-5,w+22,h+23);c.fillStyle='#fffdfa';c.fillRect(x-11,y-11,w+22,h+22);return true;
 }
 if(p.id==='postcard'){
  c.fillStyle='#e3d6c0';c.fillRect(x-11,y-11,w+22,h+22);c.strokeStyle='#988c75';c.lineWidth=2;c.setLineDash([5,7]);c.strokeRect(x-6,y-6,w+12,h+12);c.setLineDash([]);return true;
 }
 return false;
}

export function specialFinishing(c:Context,f:Frame,p:FrameStyle):boolean{
 if(!['film','scrapbook','postcard'].includes(p.id))return false;
 f.slots.forEach((s,i)=>{
  if(s.shape&&s.shape!=='rect')return;
  c.save();c.translate(s.x+s.width/2,s.y+s.height/2);c.rotate(s.rotation??0);
  if(p.id==='scrapbook'){
   const size=Math.min(130,s.width*.30);
   tape(c,-s.width*.20,-s.height/2,size,-.10,i%2?'#d6dfebdd':'#ead5b4dd');
   tape(c,s.width*.25,s.height/2,size,.09,'#e2cbd5dd');
  }
  if(p.id==='film'){
   c.fillStyle='#18130edc';c.fillRect(-s.width/2+7,s.height/2-32,66,25);c.fillStyle=p.accent;c.textAlign='left';c.font='17px monospace';c.fillText(String(i+1).padStart(2,'0')+' ▷',-s.width/2+14,s.height/2-14);
  }
  c.restore();
 });
 return true;
}

export function specialCaption(c:Context,f:Frame,p:FrameStyle,language:Language){
 const special=['film','scrapbook','postcard'].includes(p.id);
 if(!special)return false;
 c.textAlign='center';c.fillStyle=p.ink;
 c.font=p.id==='film'?'29px monospace':p.id==='postcard'?'italic 38px Georgia,serif':'italic 35px Georgia,serif';
 c.fillText(language==='vi'?'20 khoảnh khắc, 10 lời thương':'20 memories, 10 wishes',f.width/2,f.height-100,f.width-190);
 c.fillStyle=p.accent;c.font='20px monospace';c.fillText(p.id==='film'?'EXPOSED WITH LOVE  /  20.10':p.id==='scrapbook'?'A PAGE WORTH KEEPING  ♡':'SENT WITH ALL MY HEART',f.width/2,f.height-55,f.width-190);
 return true;
}
