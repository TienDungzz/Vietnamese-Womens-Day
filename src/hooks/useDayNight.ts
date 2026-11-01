import { useEffect, useRef, useState } from 'react';
export function useDayNight(reduced:boolean){
 const [dark,setDark]=useState(false),night=useRef(0);
 useEffect(()=>{
  let frame=0;const from=night.current,to=dark?1:0,start=performance.now();
  const animate=(now:number)=>{
   const t=Math.min(1,(now-start)/(reduced?200:3200)),ease=t*t*(3-2*t);
   night.current=from+(to-from)*ease;
   document.documentElement.style.setProperty('--night',`${night.current*100}%`);
   if(t<1)frame=requestAnimationFrame(animate);
  };
  frame=requestAnimationFrame(animate);return()=>cancelAnimationFrame(frame);
 },[dark,reduced]);
 return {dark,night,toggle:()=>setDark(value=>!value)};
}
