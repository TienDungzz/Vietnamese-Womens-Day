import React, { Component, Suspense, useEffect, useRef, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { Vector3 } from 'three';
import { Bouquet } from './components/Bouquet';
import { Story } from './scenes/Story';
import { Atmosphere } from './scenes/Atmosphere';
import { useDayNight } from './hooks/useDayNight';
import { useSceneFlow } from './hooks/useSceneFlow';
import { roses } from './data/roses';
import './styles/global.css';
import { LanguageProvider, useLanguage } from './i18n';
import { LanguageSelect } from './components/LanguageSelect';
import { StableText, TranslatedText, StableHeading } from './components/StableText';
import { englishWishes } from './data/wishes.en';
import { sceneAssetUrls, bouquetDetail } from './sceneAssets';
import { SceneAssets, ScenePending, SceneLoadingOverlay } from './components/SceneLoading';

function readSeen():string[]{try{const saved:unknown=JSON.parse(sessionStorage.getItem('rose-seen')||'[]');return Array.isArray(saved)?Array.from(new Set(saved.filter((id):id is string=>typeof id==='string'&&roses.some(rose=>rose.id===id)))):[]}catch{return []}}
function App(){
 const {language,t}=useLanguage();
 const localizedRoses=roses.map(rose=>({...rose,...(language==='en'?englishWishes[rose.id]:{})}));
 const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');const change=()=>setReduced(media.matches);media.addEventListener('change',change);return()=>media.removeEventListener('change',change)},[]);
 const {dark,night,toggle:toggleTheme}=useDayNight(reduced);
 const [receiverReady,setReceiverReady]=useState(false);

 const [selected,setSelected]=useState<string|null>(null),[seen,setSeen]=useState<string[]>(readSeen),[reset,setReset]=useState(0),[audio,setAudio]=useState(false),[webgl]=useState(()=>{try{return !!document.createElement('canvas').getContext('webgl2')}catch{return false}});
 const [assetUrls]=useState(sceneAssetUrls),[assetsReady,setAssetsReady]=useState(false),[assetError,setAssetError]=useState(false);
 const [readyMode,setReadyMode]=useState<string|null>(null);
 const flow=useSceneFlow(reduced,receiverReady,webgl&&!assetsReady), explore=flow.scene==='BOUQUET_EXPLORE';
 const sceneMode=explore?'studio:'+bouquetDetail():'story';
 const loading=webgl&&(!assetsReady||readyMode!==sceneMode);
 const onPending=useCallback(()=>setAssetsReady(false),[]);
 const onReady=useCallback((mode:string)=>{setAssetError(false);setReadyMode(mode);setAssetsReady(true)},[]);
 const onFailure=useCallback(()=>{setAssetsReady(false);setAssetError(true)},[]);
 useEffect(()=>{if(webgl)assetUrls.forEach(url=>useGLTF.preload(url))},[assetUrls,webgl]);
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
 const replay=()=>{if(loading)return;setSelected(null);flow.replay()};
 return <><main inert={loading} aria-busy={loading} data-theme={dark?'night':'day'} className={explore?'app explore':'app story'}>
 <header><a className="brand" href="./" aria-label={t('Rose Wishes, trang chủ')}><img className="brand-icon" src="/images/logo.png" width="34" height="40" alt="" decoding="async"/> ROSE WISHES<span className="brand-sub">A LITTLE LOVE, JUST FOR YOU</span></a><div className="header-actions"><LanguageSelect/><button className="theme-toggle" onClick={toggleTheme} aria-pressed={dark} aria-label={dark?t('Chuyển sang ban ngày'):t('Chuyển sang ban đêm')} title={dark?t('Chuyển sang ban ngày'):t('Chuyển sang ban đêm')}><span className="theme-orbit" aria-hidden="true"><svg className="toggle-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4.2 4.2l2 2m11.6 11.6 2 2M4.2 19.8l2-2M17.8 6.2l2-2"/></svg><svg className="toggle-moon" viewBox="0 0 24 24"><path d="M20 15.3A9 9 0 0 1 8.7 4a9 9 0 1 0 11.3 11.3Z"/></svg></span><span><TranslatedText message={dark?"Ban đêm":"Ban ngày"}/></span></button><button className="sound-toggle" onClick={toggleSound} aria-pressed={audio} aria-label={audio?t('Tắt âm thanh'):t('Bật âm thanh')}><svg className="sound-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/>{audio?<><path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/></>:<path d="m16 9 6 6m0-6-6 6"/>}</svg><span className="control-label"><TranslatedText message={audio?"Âm thanh bật":"Âm thanh tắt"}/></span></button></div></header>
 <section className="heading"><div className="eyebrow occasion-heading"><span/> <TranslatedText message="NGÀY PHỤ NỮ VIỆT NAM"/> <strong>20/10</strong> <span/></div><h1><StableHeading explore={explore}/></h1><p><TranslatedText message={explore?"Có những điều dịu dàng, anh đã giấu trong từng cánh hoa.":"Một hành trình nhỏ. Một bó hoa. Và những lời chưa nói."}/></p></section>
 <div className="stage" onClick={!explore?start:undefined} aria-label={explore?t('Bó hoa hồng 3D tương tác'):t('Khung cảnh chàng trai mang hoa đến ngôi nhà')}>
 <RenderBoundary fallback={null} onError={onFailure}>
 {webgl?<Canvas frameloop={loading?'demand':'always'} style={{visibility:loading?'hidden':'visible'}} shadows dpr={[1,1.5]} camera={{position:[9,6.3,12.8],fov:40}} gl={{antialias:true}}><Suspense fallback={<ScenePending onPending={onPending}/>}><SceneAssets urls={assetUrls} mode={sceneMode} onPending={onPending} onReady={onReady}><Atmosphere studio={explore} reduced={reduced} night={night}/>{explore?<><Bouquet selected={selected} interactive onSelect={select}/><OrbitControls key={reset} makeDefault target={[0,.5,0]} minDistance={3.4} maxDistance={7} minPolarAngle={.65} maxPolarAngle={1.9} enablePan={false} enableDamping dampingFactor={.075} rotateSpeed={.65} zoomSpeed={.7}/></>:<Story paused={loading} scene={flow.scene} reach={flow.reach} reduced={reduced} onReceiverReady={()=>setReceiverReady(true)}/>}<CameraRig approaching={!["INTRO_READY","WALKING"].includes(flow.scene)} explore={explore} transition={flow.scene==='BOUQUET_TRANSITION'} reset={reset} reduced={reduced}/></SceneAssets></Suspense></Canvas>:<Fallback explore={explore} start={start} finish={skip}/>}
 </RenderBoundary></div>
 {!explore?<div className="intro-actions"><p aria-live="polite"><TranslatedText message={flow.scene==='INTRO_READY'?'Chạm vào màn hình để anh bước đến bên em ♡':flow.scene==='WALKING'?'Anh đang đến, mang theo một chút yêu thương…':flow.scene==='KNOCKING'?'Cốc, cốc… Có một món quà dành cho em.':flow.scene==='HANDOVER'?'Chúc mừng ngày Phụ nữ Việt Nam 20/10 ♡':'Một điều dịu dàng đang chờ em…'}/></p>{flow.scene==='INTRO_READY'&&<button className="primary" onClick={start}><TranslatedText message="Tiến đến ngôi nhà"/> <span>↗</span></button>}{['AT_DOOR','KNOCKING'].includes(flow.scene)&&<button onClick={()=>flow.setScene('DOOR_OPENING')}><TranslatedText message="Mở cửa"/></button>}<button className="text-button skip-intro" onClick={skip}><TranslatedText message="Bỏ qua phần mở đầu →"/></button></div>:<>
 <div className="explore-help"><span className="tiny-rose">✧</span><p><TranslatedText message="Kéo để xoay"/> <span>·</span> <TranslatedText message="Cuộn / chụm để thu phóng"/><br/><small><TranslatedText message="Chạm vào một bông hoa để mở lời chúc"/></small></p></div>
 <nav className="rose-picker" aria-label={t('Chọn một trong {count} bông hoa',{count:roses.length})}>{localizedRoses.map((r,i)=><button key={r.id} className={`${seen.includes(r.id)?'seen ':''}${selected===r.id?'active':''}`} style={{'--rose':r.color} as React.CSSProperties} onClick={()=>select(r.id)} aria-label={t('Bông {number}: {title}',{number:i+1,title:r.title})} aria-pressed={selected===r.id}>{String(i+1).padStart(2,'0')}</button>)}</nav>
 <div className="explore-tools"><button onClick={replay}><TranslatedText message="↶ Xem lại câu chuyện"/></button><button onClick={()=>setReset(v=>v+1)}><TranslatedText message="⟳ Góc nhìn ban đầu"/></button></div>
 {wish&&<aside className="wish-card" ref={card} tabIndex={-1} role="dialog" aria-modal="false" aria-labelledby="wish-title" onKeyDown={e=>{if(e.key==='Escape')close()}}><button className="close" onClick={close} aria-label={t('Đóng thiệp')}>×</button><div className="eyebrow"><TranslatedText message="LỜI THƯƠNG"/> {String(index+1).padStart(2,'0')} / {roses.length}</div><div className="card-flower">❦</div><h2 id="wish-title"><StableText content={{vi:roses[index].title,en:englishWishes[wish.id]?.title??roses[index].title}}/></h2><p><StableText content={{vi:roses[index].text,en:englishWishes[wish.id]?.text??roses[index].text}}/></p><div className="signature"><TranslatedText message="Gửi em, bằng tất cả dịu dàng ♡"/></div><div className="card-nav"><button onClick={()=>select(roses[(index+roses.length-1)%roses.length].id)}><TranslatedText message="← Bông trước"/></button><button onClick={()=>select(roses[(index+1)%roses.length].id)}><TranslatedText message="Bông tiếp →"/></button></div><button className="text-button" onClick={close}><TranslatedText message="Trở lại bó hoa"/></button></aside>}
 </>}
 <footer><span><TranslatedText message="GỬI EM, BẰNG TẤT CẢ DỊU DÀNG ♡"/></span><span><TranslatedText message={explore?"Đã khám phá {seen}/{count} bông":"01 — MỘT HÀNH TRÌNH YÊU THƯƠNG"} values={{seen:seen.length,count:roses.length}}/></span></footer>
 </main>{loading&&<SceneLoadingOverlay failed={assetError}/>}</>
}
function CameraRig({explore,transition,reset,reduced,approaching}:{explore:boolean;transition:boolean;reset:number;reduced:boolean;approaching:boolean}){const previous=useRef('');useFrame(({camera},dt)=>{const key=`${explore}-${reset}`;if(explore){if(previous.current!==key){camera.position.set(0,2.2,5.2);camera.lookAt(0,.5,0);previous.current=key}}else{const target=transition?new Vector3(.15,2.1,.5):approaching?new Vector3(3.8,3,4.3):new Vector3(9,6.3,12.8);camera.position.lerp(target,reduced?1:Math.min(1,dt*.85));transition?camera.lookAt(.15,1.85,-1.46):camera.lookAt(0,1.7,-.45);previous.current=key}});return null}
function Fallback({explore,start,finish}:{explore:boolean;start:()=>void;finish:()=>void}){const {t}=useLanguage();return <div className="fallback"><img src="/images/bouquet.svg" alt={t('Bó hoa hồng bọc giấy kem, thắt nơ hồng')}/>{!explore&&<><p><TranslatedText message="Hành trình yêu thương — chế độ không có WebGL."/></p><button onClick={e=>{e.stopPropagation();start();finish()}}><TranslatedText message="Nhận bó hoa và khám phá lời chúc →"/></button></>} {explore&&<small><TranslatedText message="Chọn các nút đánh số bên dưới để đọc đủ 10 lời chúc."/></small>}</div>}
class RenderBoundary extends Component<{children:React.ReactNode;fallback:React.ReactNode;onError?:()=>void},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true}}componentDidCatch(){this.props.onError?.()}render(){return this.state.failed?this.props.fallback:this.props.children}}
createRoot(document.getElementById('root')!).render(<React.StrictMode><LanguageProvider><App/></LanguageProvider></React.StrictMode>);
