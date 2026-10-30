import React, { Component, Suspense, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3 } from 'three';
import { Bouquet } from './components/Bouquet';
import { Story } from './scenes/Story';
import { useSceneFlow } from './hooks/useSceneFlow';
import { roses } from './data/roses';
import './styles/global.css';

function readSeen():string[]{try{return JSON.parse(sessionStorage.getItem('rose-seen')||'[]')}catch{return []}}
function App(){
 const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');const change=()=>setReduced(media.matches);media.addEventListener('change',change);return()=>media.removeEventListener('change',change)},[]);
 const flow=useSceneFlow(reduced), explore=flow.scene==='BOUQUET_EXPLORE';
 const [selected,setSelected]=useState<string|null>(null),[seen,setSeen]=useState<string[]>(readSeen),[reset,setReset]=useState(0),[audio,setAudio]=useState(false),[webgl]=useState(()=>{try{return !!document.createElement('canvas').getContext('webgl2')}catch{return false}});
 const sound=useRef<AudioContext|null>(null),card=useRef<HTMLElement>(null),lastFocus=useRef<HTMLElement|null>(null);
 const select=(id:string)=>{lastFocus.current=document.activeElement as HTMLElement;setSelected(id);setSeen(s=>s.includes(id)?s:[...s,id])};
 const close=()=>{setSelected(null);lastFocus.current?.focus()};
 useEffect(()=>{try{sessionStorage.setItem('rose-seen',JSON.stringify(seen))}catch{}},[seen]);
 useEffect(()=>{if(selected)card.current?.focus()},[selected]);
 useEffect(()=>{if(!audio)return;let n=0;const play=()=>{const ctx=sound.current;if(!ctx)return;const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=[261.63,329.63,392,493.88,440,392,329.63,293.66][n++%8];gain.gain.setValueAtTime(0,ctx.currentTime);gain.gain.linearRampToValueAtTime(.035,ctx.currentTime+.05);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+1.8);osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+2)};play();const t=setInterval(play,1100);return()=>{clearInterval(t);void sound.current?.suspend()}},[audio]);
 useEffect(()=>()=>{void sound.current?.close()},[]);
 useEffect(()=>{if(flow.scene!=='KNOCKING'||!audio||!sound.current)return;const ctx=sound.current;[0,.6].forEach(delay=>{const osc=ctx.createOscillator(),g=ctx.createGain();osc.frequency.value=110;g.gain.setValueAtTime(.12,ctx.currentTime+delay);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+delay+.12);osc.connect(g);g.connect(ctx.destination);osc.start(ctx.currentTime+delay);osc.stop(ctx.currentTime+delay+.15)})},[flow.scene,audio]);
 const toggleSound=()=>{if(!audio){sound.current??=new AudioContext();void sound.current.resume()}setAudio(!audio)};
 const wish=roses.find(r=>r.id===selected),index=roses.findIndex(r=>r.id===selected);
 const replay=()=>{setSelected(null);flow.replay()};
 return <main className={explore?'app explore':'app story'}>
 <header><a className="brand" href="./" aria-label="Rose Wishes, trang chủ"><span className="brand-icon">✳</span> ROSE WISHES<span className="brand-sub">A LITTLE LOVE, JUST FOR YOU</span></a><div className="header-actions"><span className="occasion">NGÀY PHỤ NỮ VIỆT NAM · 20/10</span><button onClick={toggleSound} aria-pressed={audio} aria-label={audio?'Tắt âm thanh':'Bật âm thanh'}>{audio?'♫':'♪'} <span>{audio?'Âm thanh bật':'Âm thanh tắt'}</span></button></div></header>
 <section className="heading"><div className="eyebrow"><span/> {explore?'MƯỜI MỘT ĐÓA HỒNG · MƯỜI MỘT LỜI THƯƠNG':'MỘT MÓN QUÀ DÀNH RIÊNG CHO EM'} <span/></div><h1>{explore?<>Mỗi đóa hoa,<br/><em>một lời thương.</em></>:<>Có một điều anh<br/>muốn gửi đến <em>em…</em></>}</h1><p>{explore?'Có những điều dịu dàng, anh đã giấu trong từng cánh hoa.':'Một hành trình nhỏ. Một bó hoa. Và những lời chưa nói.'}</p></section>
 <div className="stage" onClick={!explore?flow.start:undefined} aria-label={explore?'Bó hoa hồng 3D tương tác':'Khung cảnh chàng trai mang hoa đến ngôi nhà'}>
 <RenderBoundary fallback={<Fallback explore={explore} start={flow.start} finish={flow.skip}/>}>
 {webgl?<Canvas dpr={[1,1.5]} camera={{position:[7,5,10],fov:42}} gl={{antialias:true}}><Suspense fallback={null}><ambientLight intensity={.8}/><directionalLight position={[3,6,5]} color="#ffe3c6" intensity={3}/><directionalLight position={[-4,2,-2]} color="#e891b6" intensity={2}/>{explore?<><Bouquet selected={selected} interactive onSelect={select}/><OrbitControls key={reset} makeDefault target={[0,.5,0]} minDistance={3.4} maxDistance={7} minPolarAngle={.65} maxPolarAngle={1.9} enablePan={false}/></>:<Story key={flow.scene==='INTRO_READY'?'ready':'running'} scene={flow.scene} reach={flow.reach} reduced={reduced}/>}<CameraRig explore={explore} transition={flow.scene==='BOUQUET_TRANSITION'} reset={reset} reduced={reduced}/></Suspense></Canvas>:<Fallback explore={explore} start={flow.start} finish={flow.skip}/>}
 </RenderBoundary></div>
 {!explore?<div className="intro-actions"><p aria-live="polite">{flow.scene==='INTRO_READY'?'Chạm vào màn hình để anh bước đến bên em ♡':flow.scene==='WALKING'?'Anh đang đến, mang theo một chút yêu thương…':flow.scene==='KNOCKING'?'Cốc, cốc… Có một món quà dành cho em.':flow.scene==='HANDOVER'?'Chúc mừng ngày Phụ nữ Việt Nam 20/10 ♡':'Một điều dịu dàng đang chờ em…'}</p>{flow.scene==='INTRO_READY'&&<button className="primary" onClick={flow.start}>Tiến đến ngôi nhà <span>↗</span></button>}{['AT_DOOR','KNOCKING'].includes(flow.scene)&&<button onClick={()=>flow.setScene('DOOR_OPENING')}>Mở cửa</button>}<button className="text-button" onClick={flow.skip}>Bỏ qua phần mở đầu →</button></div>:<>
 <div className="explore-help"><span className="tiny-rose">✧</span><p>Kéo để xoay <span>·</span> Cuộn / chụm để thu phóng<br/><small>Chạm vào một bông hoa để mở lời chúc</small></p></div>
 <nav className="rose-picker" aria-label="Chọn một trong 11 bông hoa">{roses.map((r,i)=><button key={r.id} className={`${seen.includes(r.id)?'seen ':''}${selected===r.id?'active':''}`} style={{'--rose':r.color} as React.CSSProperties} onClick={()=>select(r.id)} aria-label={`Bông ${i+1}: ${r.title}`} aria-pressed={selected===r.id}>{String(i+1).padStart(2,'0')}</button>)}</nav>
 <div className="explore-tools"><button onClick={replay}>↶ Xem lại câu chuyện</button><button onClick={()=>setReset(v=>v+1)}>⟳ Góc nhìn ban đầu</button></div>
 {wish&&<aside className="wish-card" ref={card} tabIndex={-1} role="dialog" aria-modal="false" aria-labelledby="wish-title" onKeyDown={e=>{if(e.key==='Escape')close()}}><button className="close" onClick={close} aria-label="Đóng thiệp">×</button><div className="eyebrow">LỜI THƯƠNG {String(index+1).padStart(2,'0')} / 11</div><div className="card-flower">❦</div><h2 id="wish-title">{wish.title}</h2><p>{wish.text}</p><div className="signature">Gửi em, bằng tất cả dịu dàng ♡</div><div className="card-nav"><button onClick={()=>select(roses[(index+10)%11].id)}>← Bông trước</button><button onClick={()=>select(roses[(index+1)%11].id)}>Bông tiếp →</button></div><button className="text-button" onClick={close}>Trở lại bó hoa</button></aside>}
 </>}
 <footer><span>GỬI EM, BẰNG TẤT CẢ DỊU DÀNG ♡</span><span>{explore?`Đã khám phá ${seen.length}/11 bông`:'01 — MỘT HÀNH TRÌNH YÊU THƯƠNG'}</span></footer>
 </main>
}
function CameraRig({explore,transition,reset,reduced}:{explore:boolean;transition:boolean;reset:number;reduced:boolean}){const previous=useRef('');useFrame(({camera},dt)=>{const key=`${explore}-${reset}`;if(explore){if(previous.current!==key){camera.position.set(0,2.2,5.2);camera.lookAt(0,.5,0);previous.current=key}}else{const target=transition?new Vector3(.25,1.5,.1):new Vector3(6,4.4,8);camera.position.lerp(target,reduced?1:Math.min(1,dt*1.5));camera.lookAt(0,1,-.4);previous.current=key}});return null}
function Fallback({explore,start,finish}:{explore:boolean;start:()=>void;finish:()=>void}){return <div className="fallback"><img src="/images/bouquet.svg" alt="Bó hoa hồng bọc giấy kem, thắt nơ hồng"/>{!explore&&<><p>Hành trình yêu thương — chế độ không có WebGL.</p><button onClick={e=>{e.stopPropagation();start();finish()}}>Nhận bó hoa và khám phá lời chúc →</button></>} {explore&&<small>Chọn các nút đánh số bên dưới để đọc đủ 11 lời chúc.</small>}</div>}
class RenderBoundary extends Component<{children:React.ReactNode;fallback:React.ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true}}render(){return this.state.failed?this.props.fallback:this.props.children}}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
