import { useRef } from 'react';
import './photo-stack.css';
export function FrameHitArea({onOpen,onHighlight,label,inScene=false}:{onOpen:()=>void;onHighlight?:(value:boolean)=>void;label:string;inScene?:boolean}){
 const down=useRef({x:0,y:0});
 return <button className="photo-stack__button" data-in-scene={inScene||undefined} aria-label={label} onPointerDown={event=>{event.stopPropagation();down.current={x:event.clientX,y:event.clientY}}} onClick={event=>{event.stopPropagation();if(event.detail===0||Math.hypot(event.clientX-down.current.x,event.clientY-down.current.y)<5)onOpen()}} onPointerEnter={()=>onHighlight?.(true)} onPointerLeave={()=>onHighlight?.(false)} onFocus={()=>onHighlight?.(true)} onBlur={()=>onHighlight?.(false)}/>;
}
