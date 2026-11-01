import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useLanguage } from '../i18n';

const options=[{value:'vi',name:'Tiếng Việt',code:'VI'},{value:'en',name:'English',code:'EN'}] as const;

export function LanguageSelect(){
 const {language,setLanguage,t}=useLanguage();
 const [open,setOpen]=useState(false),[active,setActive]=useState(0);
 const root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null);
 const items=useRef<(HTMLLIElement|null)[]>([]),listId=useId();
 const selected=options.findIndex(option=>option.value===language);
 useEffect(()=>{
  if(!open)return;
  items.current[active]?.focus();
 },[open,active]);
 useEffect(()=>{
  if(!open)return;
  const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false)};
  document.addEventListener('pointerdown',outside);
  return()=>document.removeEventListener('pointerdown',outside);
 },[open]);
 const show=(index=selected)=>{setActive(index);setOpen(true)};
 const close=()=>{setOpen(false);trigger.current?.focus()};
 const choose=(index:number)=>{setLanguage(options[index].value);close()};
 const navigate=(event:KeyboardEvent)=>{
  let next:number|undefined;
  if(event.key==='ArrowDown')next=(active+1)%options.length;
  if(event.key==='ArrowUp')next=(active+options.length-1)%options.length;
  if(event.key==='Home')next=0;
  if(event.key==='End')next=options.length-1;
  if(event.key.toLowerCase()==='v'||event.key.toLowerCase()==='t')next=0;
  if(event.key.toLowerCase()==='e')next=1;
  if(next!==undefined){event.preventDefault();setActive(next)}
  if(event.key==='Enter'||event.key===' '){event.preventDefault();choose(active)}
  if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close()}
 };
 return <div className="language-control" ref={root} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))setOpen(false)}}>
  <button ref={trigger} className="language-trigger" type="button" aria-label={`${t('Ngôn ngữ')}: ${options[selected].name}`} aria-haspopup="listbox" aria-expanded={open} aria-controls={open?listId:undefined} onClick={()=>open?setOpen(false):show()} onKeyDown={event=>{if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();show()}else if(event.key==='Escape')setOpen(false)}}>
   <svg className="language-globe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></svg>
   <span>{options[selected].code}</span>
   <svg className="language-chevron" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m3 4.5 3 3 3-3"/></svg>
  </button>
  {open&&<div className="language-menu"><div className="language-caption" aria-hidden="true">{t('Ngôn ngữ')}</div><ul id={listId} role="listbox" aria-label={t('Ngôn ngữ')} onKeyDown={navigate}>
   {options.map((option,index)=><li key={option.value} ref={element=>{items.current[index]=element}} role="option" aria-selected={language===option.value} tabIndex={active===index?0:-1} lang={option.value} onFocus={()=>setActive(index)} onClick={()=>choose(index)}>
    <span className="language-code">{option.code}</span><span className="language-name">{option.name}</span><svg className="language-check" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m3 8 3 3 7-7"/></svg>
   </li>)}
  </ul></div>}
 </div>;
}
