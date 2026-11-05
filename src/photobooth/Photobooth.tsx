import { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../i18n';
import { useContent } from '../content/ContentProvider';
import { SiteHeader } from '../components/SiteHeader';
import { frames,palettes,readDraft,cropRect } from './data';
import type { Entry,Frame } from './data';
import { drawFrame,drawPhoto,exportFrame,loadPhoto,releasePhotos } from './render';
import './photobooth.css';
import { shapeOptions,shapeFrame,slotPathData,slotClipPath } from './shapes';

const stylePreviewFrame:Frame={id:'style-preview',count:0,width:1600,height:2000,slots:[]};
function FrameStylePreview({id}:{id:string}){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{if(ref.current)drawFrame(ref.current,stylePreviewFrame,{frameId:stylePreviewFrame.id,paletteId:id,entries:[]},new Map(),'vi',240)},[id]);
 return <canvas ref={ref} aria-hidden="true"/>;
}

function ChoiceToggle({label,summary,expanded,controls,onClick,className}:{label:string;summary:string;expanded:boolean;controls:string;onClick:()=>void;className:string}){
 return <button className={`photobooth__choice-toggle ${className}`} aria-expanded={expanded} aria-controls={controls} onClick={onClick}><span><strong>{label}</strong><small>{summary}</small></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>;
}

export function Photobooth({open,onClose,dark}:{open:boolean;onClose:()=>void;dark:boolean}){
 const {photos}=useContent();
 const {language}=useLanguage(),text=(vi:string,en:string)=>language==='vi'?vi:en;
 const [draft,setDraft]=useState(()=>readDraft(photos)),[active,setActive]=useState(0),[filter,setFilter]=useState(0),[editor,setEditor]=useState(false);
 const [stylesOpen,setStylesOpen]=useState(false),[layoutsOpen,setLayoutsOpen]=useState(false);
 const [images,setImages]=useState(new Map<string,HTMLImageElement>()),[failures,setFailures]=useState<string[]>([]),[thumbErrors,setThumbErrors]=useState<string[]>([]),[retry,setRetry]=useState(0);
 const [exporting,setExporting]=useState(false),[notice,setNotice]=useState<'error'|'saved'|null>(null);
 const dialog=useRef<HTMLDivElement>(null),preview=useRef<HTMLCanvasElement>(null),cropCanvas=useRef<HTMLCanvasElement>(null),drag=useRef<{x:number;y:number;entry:Entry}|null>(null);
 const mounted=useRef(true),exportLock=useRef(false),downloadUrls=useRef(new Set<string>());
 const layout=frames.find(f=>f.id===draft.frameId)!;
 const frame=useMemo(()=>shapeFrame(layout,draft.shapeId),[layout,draft.shapeId]);
 const palette=palettes.find(p=>p.id===draft.paletteId)??palettes[0],entry=draft.entries[active];
 const ids=[...new Set(draft.entries.slice(0,frame.count).flatMap(e=>e?[e.photoId]:[]))],idsKey=ids.join(',');
 const filled=draft.entries.slice(0,frame.count).filter(Boolean).length;
 const ready=filled===frame.count&&ids.every(id=>images.has(id))&&failures.length===0;
 const updateEntry=(value:Entry|null)=>setDraft(d=>({...d,entries:d.entries.map((e,i)=>i===active?value:e)}));
 useEffect(()=>{try{sessionStorage.setItem('rose-photobooth',JSON.stringify(draft))}catch{}},[draft]);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;releasePhotos();for(const url of downloadUrls.current)URL.revokeObjectURL(url)}},[]);
 useEffect(()=>{if(!open){setImages(new Map());setFailures([]);releasePhotos()}},[open]);
 useEffect(()=>{
  if(!open)return;const previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.current?.querySelector<HTMLButtonElement>('.site-header__close')?.focus();
  return()=>{document.body.style.overflow=previousOverflow};
 },[open]);
 useEffect(()=>{if(open&&editor)cropCanvas.current?.focus()},[open,editor]);
 useEffect(()=>{
  if(!open)return;
  const root=dialog.current,footer=root?.querySelector<HTMLElement>('.photobooth__footer');
  if(!root||!footer)return;
  const update=()=>root.style.setProperty('--photobooth-footer-height',`${footer.getBoundingClientRect().height}px`);
  const observer=new ResizeObserver(update);observer.observe(footer);update();
  return()=>observer.disconnect();
 },[open]);
 useEffect(()=>{
  if(!open)return;let cancelled=false;setFailures([]);
  void Promise.allSettled(ids.map(id=>loadPhoto(id,photos))).then(results=>{if(cancelled)return;const next=new Map<string,HTMLImageElement>(),errors:string[]=[];results.forEach((result,i)=>{if(result.status==='fulfilled')next.set(ids[i],result.value);else errors.push(ids[i])});setImages(next);setFailures(errors)});
  return()=>{cancelled=true};
 },[open,idsKey,retry,photos]);
 useEffect(()=>{
  if(!open)return;
  const tick=requestAnimationFrame(()=>{if(preview.current)drawFrame(preview.current,frame,draft,images,language,Math.min(840,frame.width))});
  return()=>cancelAnimationFrame(tick);
 },[open,frame,draft,images,language]);
 useEffect(()=>{
  if(!editor||!entry||!cropCanvas.current)return;const c=cropCanvas.current,image=images.get(entry.photoId);c.width=700;c.height=Math.round(700*frame.slots[active].height/frame.slots[active].width);const ctx=c.getContext('2d')!;ctx.fillStyle=palette.background;ctx.fill(new Path2D(slotPathData({x:0,y:0,width:c.width,height:c.height,shape:frame.slots[active].shape})));if(image)drawPhoto(ctx,image,{x:0,y:0,width:c.width,height:c.height,shape:frame.slots[active].shape},entry);
 },[editor,entry,images,frame,active,palette]);
 function choosePhoto(id:string){
  setNotice(null);setDraft(d=>({...d,entries:d.entries.map((e,i)=>i===active?{photoId:id,x:0,y:0,zoom:1}:e)}));
  const next=Array.from({length:frame.count},(_,i)=>(active+1+i)%frame.count).find(i=>i!==active&&!draft.entries[i]);if(next!==undefined)setActive(next);
 }
 function chooseSlot(index:number){
  setActive(index);
  if(draft.entries[index])setEditor(true);
 }
 function closeEditor(){
  setEditor(false);drag.current=null;
  requestAnimationFrame(()=>dialog.current?.querySelector<HTMLButtonElement>(`.photobooth__slot[data-slot="${active}"]`)?.focus());
 }
 async function download(){
  if(!ready||exportLock.current)return;exportLock.current=true;setExporting(true);setNotice(null);
  try{const blob=await exportFrame(frame,draft,language,photos);if(!mounted.current)return;const url=URL.createObjectURL(blob);downloadUrls.current.add(url);const a=document.createElement('a');a.href=url;a.download='rose-wishes-20-10.png';document.body.append(a);a.click();a.remove();setTimeout(()=>{URL.revokeObjectURL(url);downloadUrls.current.delete(url)},60000);setNotice('saved')}
  catch{if(mounted.current)setNotice('error')}
  finally{exportLock.current=false;if(mounted.current)setExporting(false)}
 }
 if(!open)return null;
 const selectedImage=entry?images.get(entry.photoId):undefined;
 const crop=entry&&selectedImage?cropRect(selectedImage.naturalWidth,selectedImage.naturalHeight,frame.slots[active].width,frame.slots[active].height,entry):null;
 const lowResolution=crop&&(crop.width<frame.slots[active].width||crop.height<frame.slots[active].height);
 const trap=(event:React.KeyboardEvent)=>{
  if(event.key==='Escape'){event.preventDefault();event.stopPropagation();if(editor)closeEditor();else onClose()}
  if(event.key==='Tab'){const nodes=Array.from(dialog.current!.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),[tabindex="0"]')).filter(n=>n.getClientRects().length>0&&!n.closest('[inert]'));const first=nodes[0],last=nodes[nodes.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}}
 };
 return <div className="photobooth" role="dialog" aria-modal="true" aria-labelledby="pb-title" ref={dialog} onKeyDown={trap} data-theme={dark?'night':'day'}>
  <div className="photobooth__body" inert={editor}>
   <SiteHeader onClose={onClose}/><div className="photobooth__heading"><p className="photobooth__kicker">20/10</p><h2 id="pb-title">{text('Những điều mình giữ lại','Moments we keep')}</h2><p>{text('20 khoảnh khắc, 10 lời thương','20 memories, 10 wishes')}</p></div>
   <div className="photobooth__workspace">
    <section className="photobooth__design" data-styles-open={stylesOpen} data-layouts-open={layoutsOpen} aria-label={text('Chọn khung','Choose a frame')}>
     <ChoiceToggle className="photobooth__choice-toggle--style" label={text('Chọn phong cách frame','Choose a frame style')} summary={palette.name[language]} expanded={stylesOpen} controls="pb-style-options" onClick={()=>setStylesOpen(v=>!v)}/>
     <ChoiceToggle className="photobooth__choice-toggle--layout" label={text('Chọn bố cục','Choose a layout')} summary={`${frame.count} ${text('ảnh','photos')}`} expanded={layoutsOpen} controls="pb-layout-options" onClick={()=>setLayoutsOpen(v=>!v)}/>

     <div id="pb-layout-options" className="photobooth__layout-options">
     <div className="photobooth__filters" aria-label={text('Số ảnh trong khung','Photos per frame')}>{[0,3,6,12,20].map((value,i)=><button key={value} aria-pressed={filter===value} onClick={()=>setFilter(value)}>{i===0?text('Tất cả','All'):['','2–3','4–6','8–12','16–20'][i]}</button>)}</div>
     <div className="photobooth__shape-options" role="group" aria-label={text('Hình dạng ô ảnh','Photo shapes')}>{shapeOptions.map(option=><button key={option.id} className="photobooth__shape-choice" data-photo-shape={option.id} aria-label={option.name[language]} title={option.name[language]} aria-pressed={(draft.shapeId??'layout')===option.id} onClick={()=>setDraft(d=>({...d,shapeId:option.id}))}><svg viewBox="0 0 100 100" aria-hidden="true"><path d={slotPathData({x:3,y:3,width:94,height:94,shape:option.id==='layout'?'rect':option.id})}/></svg><span>{option.name[language]}</span></button>)}</div>
     <div className="photobooth__layouts">{frames.filter(f=>filter===0||(filter===3?f.count<=3:filter===6?f.count>=4&&f.count<=6:filter===12?f.count>=8&&f.count<=12:f.count>=16)).map(f=><button className="photobooth__layout" key={f.id} data-frame={f.id} aria-pressed={frame.id===f.id} onClick={()=>{setDraft(d=>({...d,frameId:f.id}));setActive(Math.max(0,draft.entries.slice(0,f.count).findIndex(e=>!e)));setEditor(false);setLayoutsOpen(false)}}><svg className="photobooth__layout-preview" viewBox={`0 0 ${f.width} ${f.height}`} style={{aspectRatio:`${f.width}/${f.height}`}} aria-hidden="true">{shapeFrame(f,draft.shapeId).slots.map((s,i)=><path key={i} d={slotPathData(s)} transform={s.rotation?`rotate(${s.rotation*180/Math.PI} ${s.x+s.width/2} ${s.y+s.height/2})`:undefined}/>)}</svg><small>{f.count} {text('ảnh','photos')}</small></button>)}</div>
     </div>

     <div id="pb-style-options" className="photobooth__styles" aria-label={text('Phong cách khung ảnh','Frame styles')}>{palettes.map(p=><button key={p.id} data-style={p.id} aria-pressed={p.id===draft.paletteId} onClick={()=>{setDraft(d=>({...d,paletteId:p.id}));setStylesOpen(false)}}><FrameStylePreview id={p.id}/><span>{p.name[language]}</span><small>{p.id===draft.paletteId?text('Đang chọn','Selected'):text('Xem frame','Try frame')}</small></button>)}</div>
    </section>
    <section className="photobooth__preview" aria-label={text('Xem trước thành phẩm','Your print preview')}><div className="photobooth__paper-wrap"><div className="photobooth__paper" style={{aspectRatio:`${frame.width}/${frame.height}`,maxWidth:frame.width/frame.height<.5?260:480}}><canvas ref={preview} aria-hidden="true"/>{frame.slots.map((s,i)=><button key={i} className="photobooth__slot" data-slot={i} data-shape={s.shape} aria-pressed={i===active} aria-label={`${text('Ô','Slot')} ${i+1}: ${draft.entries[i]?photos.find(p=>p.id===draft.entries[i]?.photoId)?.label[language]:text('Trống','Empty')}`} style={{left:`${s.x/frame.width*100}%`,top:`${s.y/frame.height*100}%`,width:`${s.width/frame.width*100}%`,height:`${s.height/frame.height*100}%`,transform:`rotate(${s.rotation??0}rad)`,clipPath:slotClipPath(s)}} onClick={()=>chooseSlot(i)} draggable={!!draft.entries[i]} onDragStart={event=>{event.dataTransfer.setData('text/plain',String(i));event.dataTransfer.effectAllowed='move'}} onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();const payload=event.dataTransfer.getData('text/plain');if(!/^\d+$/.test(payload))return;const from=Number(payload);if(!Number.isInteger(from)||from<0||from>=frame.count)return;setDraft(d=>{const entries=[...d.entries];[entries[from],entries[i]]=[entries[i],entries[from]];return {...d,entries}});setActive(i)}}><svg className="photobooth__slot-outline" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d={slotPathData({x:1,y:1,width:98,height:98,shape:s.shape})}/></svg><span>{String(i+1).padStart(2,'0')}</span>{draft.entries[i]&&failures.includes(draft.entries[i]!.photoId)&&<small>{text('Ảnh lỗi','Unavailable')}</small>}</button>)}</div></div>
     <p className="photobooth__selection-hint" aria-live="polite">{text(entry?'Nhấn ảnh trong khung để chỉnh hoặc xóa.':'Chọn một ảnh để điền vào ô đang sáng.',entry?'Tap a framed photo to edit or remove it.':'Choose a photo to fill the highlighted slot.')}</p>
    </section>
    <section className="photobooth__library" aria-label={text('Thư viện 20 ảnh','Twenty memories')}><div className="photobooth__photos">{photos.map((p,i)=>{const used=draft.entries.slice(0,frame.count).filter(e=>e?.photoId===p.id).length;return <button key={p.id} className="photobooth__photo" onClick={()=>choosePhoto(p.id)} aria-label={`${p.label[language]}${used?text(` · đã dùng ${used} lần`,` · used ${used} times`):''}`}><img src={p.thumb} alt="" loading="lazy" onError={()=>setThumbErrors(errors=>errors.includes(p.id)?errors:[...errors,p.id])}/><span className="photobooth__photo-number">{String(i+1).padStart(2,'0')}</span>{thumbErrors.includes(p.id)&&<span className="photobooth__photo-missing">{text('Chưa có ảnh','Not available')}</span>}{used>0&&<span className="photobooth__photo-used">✓ {used>1?used:''}</span>}</button>})}</div>
     {(failures.length>0||thumbErrors.length>0)&&<div className="photobooth__error" role="status"><p>{text('Một số ảnh chưa sẵn sàng. Bạn có thể chọn ảnh khác hoặc thử lại.','Some memories are unavailable. Choose another photo or retry.')}</p><button onClick={()=>{setRetry(n=>n+1);setThumbErrors([]);document.querySelectorAll<HTMLImageElement>('.photobooth__photo img').forEach(img=>{img.src=img.src.split('?')[0]+'?retry='+Date.now()})}}>{text('Thử lại','Retry')}</button></div>}
    </section>
   </div>
   <footer className="photobooth__footer"><div><strong aria-live="polite">{text(`Đã chọn ${filled}/${frame.count} ảnh`,`${filled}/${frame.count} photos selected`)}</strong><small>{notice==='error'?text('Chưa thể xuất ảnh. Hãy thử lại; bản nháp vẫn được giữ.','Export failed. Please retry; your draft is safe.'):notice==='saved'?text('Ảnh đã sẵn sàng để lưu ♡','Your memory is ready to save ♡'):text('Một chút yêu thương, mang theo bên mình.','A little love to take with you.')}</small></div><button className="photobooth__download" disabled={!ready||exporting} aria-label={exporting?text('Đang tạo ảnh…','Preparing…'):text('Tải ảnh xuống','Download print')} title={exporting?text('Đang tạo ảnh…','Preparing…'):text('Tải ảnh xuống','Download print')} aria-busy={exporting} onClick={()=>void download()}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{exporting?<path d="M20 12a8 8 0 1 1-8-8"/>:<><path d="M12 3v12m-5-5 5 5 5-5"/><path d="M4 15v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5"/></>}</svg><span>{exporting?text('Đang tạo ảnh…','Preparing…'):text('Tải ảnh xuống','Download print')}</span></button></footer>
  </div>
  {editor&&<div className="photo-editor" role="dialog" aria-modal="true" aria-label={text(`Chỉnh ảnh · ô ${active+1}`,`Adjust photo · slot ${active+1}`)}><div className="photo-editor__card"><p>{text('Kéo ảnh hoặc dùng thanh trượt để giữ lại phần bạn thích.','Drag or use the sliders to find your favorite crop.')}</p><canvas ref={cropCanvas} tabIndex={0} aria-label={text('Vùng cắt ảnh, dùng các thanh trượt phía dưới để điều chỉnh','Photo crop; use the sliders below to adjust')} onPointerDown={event=>{if(!entry)return;event.currentTarget.setPointerCapture(event.pointerId);drag.current={x:event.clientX,y:event.clientY,entry:{...entry}}}} onPointerMove={event=>{if(!drag.current)return;const r=event.currentTarget.getBoundingClientRect(),d=drag.current;updateEntry({...d.entry,x:Math.max(-1,Math.min(1,d.entry.x-(event.clientX-d.x)/r.width*2)),y:Math.max(-1,Math.min(1,d.entry.y-(event.clientY-d.y)/r.height*2))})}} onPointerUp={()=>drag.current=null} onPointerCancel={()=>drag.current=null}/>{entry&&<div className="photo-editor__sliders">{(['zoom','x','y'] as const).map(key=><label key={key}>{key==='zoom'?text('Phóng ảnh','Zoom'):key==='x'?text('Vị trí ngang','Horizontal'):text('Vị trí dọc','Vertical')}<input type="range" min={key==='zoom'?1:-1} max={key==='zoom'?3:1} step="0.01" value={entry[key]} onChange={event=>updateEntry({...entry,[key]:Number(event.target.value)})}/></label>)}</div>}{lowResolution&&<p className="photo-editor__resolution" role="status">{text('Ảnh có thể hơi mềm ở kích thước in này.','This crop may look soft at the export size.')}</p>}<div className="photo-editor__actions"><button onClick={()=>entry&&updateEntry({...entry,x:0,y:0,zoom:1})}>{text('Đặt lại','Reset')}</button><div className="photo-editor__finish"><button className="photo-editor__remove" onClick={()=>{updateEntry(null);setNotice(null);closeEditor()}}>{text('Xóa ảnh','Remove photo')}</button><button className="photo-editor__done" onClick={closeEditor}>{text('Xong','Done')}</button></div></div></div></div>}
 </div>;
}
