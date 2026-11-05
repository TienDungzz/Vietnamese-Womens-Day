/// <reference types="vite/client" />
import React, { Component, Suspense, lazy, useEffect, useRef, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { useDayNight } from './hooks/useDayNight';
import { useSceneFlow } from './hooks/useSceneFlow';
import { roses } from './data/roses';
import './styles/global.css';
import { LanguageProvider, useLanguage } from './i18n';
import { SiteHeader } from './components/SiteHeader';
import { StableText, TranslatedText, StableHeading } from './components/StableText';
const Photobooth=lazy(()=>import('./photobooth/Photobooth').then(module=>({default:module.Photobooth})));
const Scene3D=lazy(()=>import('./components/Scene3D'));
import { PhotoFrameFallback } from './photobooth/PhotoFrameFallback';
import { ContentProvider,useContent } from './content/ContentProvider';
import { sceneAssetUrls, bouquetDetail } from './sceneAssets';
import { SceneLoadingOverlay } from './components/SceneLoadingOverlay';

function readSeen():string[]{try{const saved:unknown=JSON.parse(sessionStorage.getItem('rose-seen')||'[]');return Array.isArray(saved)?Array.from(new Set(saved.filter((id):id is string=>typeof id==='string'&&roses.some(rose=>rose.id===id)))):[]}catch{return []}}
function App(){
 const {language,t}=useLanguage();
 const content=useContent();
 const localizedRoses=roses.map((rose,i)=>({...rose,title:content.wishes[i].title[language],text:content.wishes[i].text[language]}));
 const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');const change=()=>setReduced(media.matches);media.addEventListener('change',change);return()=>media.removeEventListener('change',change)},[]);
 const {dark,night,toggle:toggleTheme}=useDayNight(reduced);
 const [receiverReady,setReceiverReady]=useState(false);
 const [boothOpen,setBoothOpen]=useState(false),boothReturn=useRef<HTMLElement|null>(null);

 const [selected,setSelected]=useState<string|null>(null),[seen,setSeen]=useState<string[]>(readSeen),[reset,setReset]=useState(0),[audio,setAudio]=useState(false),[webgl]=useState(()=>{try{return !!document.createElement('canvas').getContext('webgl2')}catch{return false}});
 const [assetUrls]=useState(sceneAssetUrls),[assetsReady,setAssetsReady]=useState(false),[assetError,setAssetError]=useState(false);
 const [readyMode,setReadyMode]=useState<string|null>(null);
 const flow=useSceneFlow(reduced,receiverReady,webgl&&!assetsReady), explore=flow.scene==='BOUQUET_EXPLORE';
 const sceneMode=explore?'studio:'+bouquetDetail():'story';
 const loading=webgl&&(!assetsReady||readyMode!==sceneMode);
 const onPending=useCallback(()=>setAssetsReady(false),[]);
 const onReady=useCallback((mode:string)=>{setAssetError(false);setReadyMode(mode);setAssetsReady(true)},[]);
 const onFailure=useCallback(()=>{setAssetsReady(false);setAssetError(true)},[]);
 const sound=useRef<AudioContext|null>(null),card=useRef<HTMLElement>(null),lastFocus=useRef<HTMLElement|null>(null);
 const select=(id:string)=>{if(loading)return;lastFocus.current=document.activeElement as HTMLElement;setSelected(id);setSeen(s=>s.includes(id)?s:[...s,id])};
 const close=()=>{setSelected(null);lastFocus.current?.focus()};
 useEffect(()=>{try{sessionStorage.setItem('rose-seen',JSON.stringify(seen))}catch{}},[seen]);
 useEffect(()=>{if(selected&&!loading)card.current?.focus()},[selected,loading]);
 useEffect(()=>{if(!audio)return;let n=0;const play=()=>{const ctx=sound.current;if(!ctx)return;const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=[261.63,329.63,392,493.88,440,392,329.63,293.66][n++%8];gain.gain.setValueAtTime(0,ctx.currentTime);gain.gain.linearRampToValueAtTime(.035,ctx.currentTime+.05);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+1.8);osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+2)};play();const t=setInterval(play,1100);return()=>{clearInterval(t);void sound.current?.suspend()}},[audio]);
 useEffect(()=>()=>{void sound.current?.close()},[]);
 useEffect(()=>{if(flow.scene!=='KNOCKING'||!audio||!sound.current)return;const ctx=sound.current;[0,.6].forEach(delay=>{const osc=ctx.createOscillator(),g=ctx.createGain();osc.frequency.value=110;g.gain.setValueAtTime(.12,ctx.currentTime+delay);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+delay+.12);osc.connect(g);g.connect(ctx.destination);osc.start(ctx.currentTime+delay);osc.stop(ctx.currentTime+delay+.15)})},[flow.scene,audio]);
 const toggleSound=()=>{if(!audio){sound.current??=new AudioContext();void sound.current.resume()}setAudio(!audio)};
 const start=()=>{if(!loading)flow.start()};
 const skip=()=>{if(!loading)flow.skip()};
 const wish=localizedRoses.find(r=>r.id===selected),index=roses.findIndex(r=>r.id===selected);
 const openBooth=()=>{if(loading)return;boothReturn.current=document.activeElement instanceof HTMLElement&&document.activeElement!==document.body?document.activeElement:document.querySelector<HTMLElement>('.photo-stack__button');setBoothOpen(true)};
 const closeBooth=()=>{setBoothOpen(false);requestAnimationFrame(()=>boothReturn.current?.focus({preventScroll:true}))};
 const replay=()=>{if(loading)return;setSelected(null);setReceiverReady(false);flow.replay()};
 return <><main data-content-source={content.source} inert={loading||boothOpen} aria-busy={loading} data-theme={dark?'night':'day'} className={explore?'app app--explore':'app app--story'}>
 <SiteHeader dark={dark} audio={audio} onToggleTheme={toggleTheme} onToggleSound={toggleSound}/>
 <section className="app__heading"><div className="eyebrow app__occasion"><span/> <TranslatedText message="NGÀY PHỤ NỮ VIỆT NAM"/> <strong>20/10</strong> <span/></div><h1 className="app__title"><StableHeading explore={explore}/></h1>{explore&&<p><TranslatedText message={"Có những điều dịu dàng, anh đã giấu trong từng cánh hoa."}/></p>}</section>
 <div className="app__stage" onClick={!explore?start:undefined} aria-label={explore?t('Bó hoa hồng 3D tương tác'):t('Khung cảnh chàng trai mang hoa đến ngôi nhà')}>
 <RenderBoundary fallback={null} onError={onFailure}>
 {webgl?<Suspense fallback={null}><Scene3D loading={loading} boothOpen={boothOpen} explore={explore} assetUrls={assetUrls} sceneMode={sceneMode} scene={flow.scene} night={night} reduced={reduced} reset={reset} selected={selected} select={select} reach={flow.reach} onPending={onPending} onReady={onReady} onReceiverReady={()=>setReceiverReady(true)} onOpenPhotos={openBooth}/></Suspense>:<Fallback explore={explore} start={start} finish={skip} onOpenPhotos={openBooth}/>}
 </RenderBoundary></div>
 {!explore?<div className="app__intro"><p aria-live="polite"><TranslatedText message={flow.scene==='INTRO_READY'?'Chạm vào màn hình để anh bước đến bên em ♡':flow.scene==='WALKING'?'Anh đang đến, mang theo một chút yêu thương…':flow.scene==='KNOCKING'?'Cốc, cốc… Có một món quà dành cho em.':flow.scene==='HANDOVER'?'Chúc mừng ngày Phụ nữ Việt Nam 20/10 ♡':'Một điều dịu dàng đang chờ em…'}/></p>{flow.scene==='INTRO_READY'&&<button className="button button--primary" onClick={start}><TranslatedText message="Tiến đến ngôi nhà"/> <span>↗</span></button>}{['AT_DOOR','KNOCKING'].includes(flow.scene)&&<button onClick={()=>flow.setScene('DOOR_OPENING')}><TranslatedText message="Mở cửa"/></button>}<button className="button button--text app__skip-intro" onClick={skip}><TranslatedText message="Bỏ qua phần mở đầu →"/></button></div>:<>
 <div className="app__help"><span className="app__help-icon">✧</span><p><TranslatedText message="Kéo để xoay"/> <span>·</span> <TranslatedText message="Cuộn / chụm để thu phóng"/><br/><small><TranslatedText message="Chạm vào một bông hoa để mở lời chúc"/></small></p></div>
 <nav className="rose-picker" aria-label={t('Chọn một trong {count} bông hoa',{count:roses.length})}>{localizedRoses.map((r,i)=><button key={r.id} className={`rose-picker__button ${seen.includes(r.id)?'rose-picker__button--seen ':''}${selected===r.id?'rose-picker__button--active':''}`} style={{'--rose':r.color} as React.CSSProperties} onClick={()=>select(r.id)} aria-label={t('Bông {number}: {title}',{number:i+1,title:r.title})} aria-pressed={selected===r.id}>{String(i+1).padStart(2,'0')}</button>)}</nav>
 <div className="app__toolbar"><button onClick={replay} aria-label={t('Xem lại câu chuyện')} title={t('Xem lại câu chuyện')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/></svg><span className="app__tool-label"><TranslatedText message="Xem lại câu chuyện"/></span></button><button onClick={()=>setReset(v=>v+1)} aria-label={t('Góc nhìn ban đầu')} title={t('Góc nhìn ban đầu')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5Z"/><path d="m10.5 10.5 3 3"/></svg><span className="app__tool-label"><TranslatedText message="Góc nhìn ban đầu"/></span></button></div>
 {wish&&<aside className="wish-card" ref={card} tabIndex={-1} role="dialog" aria-modal="false" aria-labelledby="wish-title" onKeyDown={e=>{if(e.key==='Escape')close()}}><button className="wish-card__close" onClick={close} aria-label={t('Đóng thiệp')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button><div className="wish-card__eyebrow"><TranslatedText message="LỜI THƯƠNG"/> <span className="wish-card__count">{String(index+1).padStart(2,'0')} / {roses.length}</span></div><div className="wish-card__ornament" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M32 38c-10-1-17-7-16-16 1-7 7-12 16-12s15 5 16 12c1 9-6 15-16 16Z"/><path d="M32 34c-6-3-11-5-11-11 0-5 5-8 11-6 6-2 11 1 11 6 0 6-5 8-11 11Z"/><path d="M32 28c-5-3-6-8 0-10 6 2 5 7 0 10Zm0 10v17m0-7c-9 1-13-3-14-8 8-1 12 2 14 8Zm0-4c8 0 12-4 13-9-8 0-11 4-13 9Z"/></svg></div><h2 className="wish-card__title" id="wish-title"><StableText content={content.wishes[index].title}/></h2><p className="wish-card__message"><StableText content={content.wishes[index].text}/></p><div className="wish-card__signature"><TranslatedText message="Gửi em, bằng tất cả dịu dàng ♡"/></div><div className="wish-card__nav"><button onClick={()=>select(roses[(index+roses.length-1)%roses.length].id)}><TranslatedText message="← Bông trước"/></button><button onClick={()=>select(roses[(index+1)%roses.length].id)}><TranslatedText message="Bông tiếp →"/></button></div><button className="button button--text wish-card__back" onClick={close}><TranslatedText message="Trở lại bó hoa"/></button></aside>}
 </>}
 <footer className="app__footer"><span><TranslatedText message="GỬI EM, BẰNG TẤT CẢ DỊU DÀNG ♡"/></span><span><TranslatedText message={explore?"Đã khám phá {seen}/{count} bông":"01 — MỘT HÀNH TRÌNH YÊU THƯƠNG"} values={{seen:seen.length,count:roses.length}}/></span></footer>
 </main><RenderBoundary fallback={<SceneLoadingOverlay failed/>}><Suspense fallback={<SceneLoadingOverlay failed={false}/>}>{boothOpen&&<Photobooth open onClose={closeBooth} dark={dark}/>}</Suspense></RenderBoundary>{loading&&<SceneLoadingOverlay failed={assetError}/>}</>
}
function Fallback({explore,start,finish,onOpenPhotos}:{explore:boolean;start:()=>void;finish:()=>void;onOpenPhotos:()=>void}){const {t}=useLanguage();return <div className="fallback"><img src="/images/bouquet.svg" alt={t('Bó hoa hồng bọc giấy kem, thắt nơ hồng')}/>{!explore&&<><p><TranslatedText message="Hành trình yêu thương — chế độ không có WebGL."/></p><button onClick={e=>{e.stopPropagation();start();finish()}}><TranslatedText message="Nhận bó hoa và khám phá lời chúc →"/></button></>} {explore&&<PhotoFrameFallback onOpen={onOpenPhotos}/>} {explore&&<small><TranslatedText message="Chọn các nút đánh số bên dưới để đọc đủ 10 lời chúc."/></small>}</div>}
class RenderBoundary extends Component<{children:React.ReactNode;fallback:React.ReactNode;onError?:()=>void},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true}}componentDidCatch(){this.props.onError?.()}render(){return this.state.failed?this.props.fallback:this.props.children}}
createRoot(document.getElementById('root')!).render(<React.StrictMode><LanguageProvider><ContentProvider><App/></ContentProvider></LanguageProvider></React.StrictMode>);
