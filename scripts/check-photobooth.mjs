import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const live=process.argv.includes('--remote');
const catalog=JSON.parse(await fs.readFile('src/photobooth/photos.json','utf8'));
const urls=new Map(catalog.photos.flatMap(p=>[[p.src,{id:p.id.slice(-2),thumb:false}],[p.thumb,{id:p.id.slice(-2),thumb:true}]]));
const pages=await(await fetch('http://127.0.0.1:9222/json')).json(),socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
await new Promise(resolve=>socket.onopen=resolve);
let id=0;const pending=new Map(),errors=[],fixtures=new Map();let failPhoto=false,initialization;
for(let i=1;i<=20;i++)fixtures.set(String(i).padStart(2,'0'),(await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1200"><rect width="600" height="1200" fill="hsl(${i*17},60%,65%)"/><rect x="600" width="600" height="1200" fill="#e3c6b3"/><rect x="1200" width="600" height="1200" fill="#718d7a"/><text x="900" y="650" text-anchor="middle" font-size="220" fill="#543b46">${i}</text></svg>`)).webp().toBuffer()).toString('base64'));
socket.onmessage=event=>{const m=JSON.parse(event.data);if(m.id){const task=pending.get(m.id);if(task){pending.delete(m.id);m.error?task.reject(m.error):task.resolve(m.result)}}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);else if(m.method==='Fetch.requestPaused'){const r=m.params,entry=urls.get(r.request.url.split('?')[0]),local=r.request.url.match(/photo-(\d+)\.webp/),n=entry?.id??local?.[1],thumb=entry?.thumb??r.request.url.includes('thumbs');if(n&&failPhoto&&!thumb&&n==='20')void send('Fetch.failRequest',{requestId:r.requestId,errorReason:'Failed'});else if(n&&!live)void send('Fetch.fulfillRequest',{requestId:r.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'image/webp'},{name:'Access-Control-Allow-Origin',value:'*'}],body:fixtures.get(n)??''});else void send('Fetch.continueRequest',{requestId:r.requestId})}};
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});socket.send(JSON.stringify({id:n,method,params}))});
const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
const wait=expression=>ev(`new Promise((resolve,reject)=>{const start=Date.now(),timer=setInterval(()=>{if(${expression}){clearInterval(timer);resolve()}else if(Date.now()-start>60000){clearInterval(timer);reject(Error(${JSON.stringify(expression)}))}},50)})`);
const fill=()=>ev(`(async()=>{const {photos}=await import('/src/photobooth/data.ts');for(let i=0;i<document.querySelectorAll('.photobooth__slot').length;i++){const entries=JSON.parse(sessionStorage.getItem('rose-photobooth')).entries;if(entries[i])continue;const used=new Set(entries.filter(Boolean).map(e=>e.photoId)),photoIndex=photos.findIndex(p=>!used.has(p.id));document.querySelectorAll('.photobooth__slot')[i].click();await new Promise(r=>setTimeout(r,0));document.querySelectorAll('.photobooth__photo')[photoIndex].click();await new Promise(r=>setTimeout(r,0))}})()`);
try{
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});await send('Fetch.enable',{patterns:[{urlPattern:'*/photos/*'},{urlPattern:'*picsum.photos/*'}]});
 initialization=await send('Page.addScriptToEvaluateOnNewDocument',{source:"const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl2'?null:original.call(this,type,...args)};sessionStorage.removeItem('rose-photobooth');localStorage.setItem('rose-language','vi');const originalURL=URL.createObjectURL;URL.createObjectURL=function(blob){window.__lastPhotoBlob=blob;return originalURL.call(this,blob)}"});
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 let nav=await send('Page.navigate',{url:'http://127.0.0.1:5173/'});if(nav.errorText)await send('Page.navigate',{url:'http://127.0.0.1:5173/'});
 await wait("!!document.querySelector('.app__skip-intro')");await ev("document.querySelector('.app__skip-intro').click()");await wait("!!document.querySelector('.photo-stack__button')");await ev("document.querySelector('.photo-stack__button').click()");await wait("!!document.querySelector('.photobooth')");await ev('document.fonts.ready');assert.equal(await ev("!!document.querySelector('.photobooth-entry')"),false);assert.equal(await ev("getComputedStyle(document.querySelector('.photobooth__design')).scrollbarWidth"),'thin');assert.equal(await ev("getComputedStyle(document.querySelector('.photobooth__design'),'::-webkit-scrollbar-track').backgroundColor"),'rgba(0, 0, 0, 0)');
 assert.equal(await ev("document.querySelectorAll('.photobooth__layout').length"),16);assert.equal(await ev("document.querySelectorAll('.photobooth__photo').length"),20);
 assert.equal(await ev("(async()=>{const {frames}=await import('/src/photobooth/data.ts');const {shapeFrame,slotPathData}=await import('/src/photobooth/shapes.ts');return frames.every(f=>{const svg=document.querySelector('[data-frame=\"'+f.id+'\"] svg'),slots=shapeFrame(f).slots;return svg?.getAttribute('viewBox')===`0 0 ${f.width} ${f.height}`&&[...svg.querySelectorAll('path')].length===f.count&&[...svg.querySelectorAll('path')].every((r,i)=>r.getAttribute('d')===slotPathData(slots[i]))})})()"),true);
 assert.equal(await ev("document.querySelector('.photobooth__download').disabled"),true);
 await ev("document.querySelector('.photobooth__photo').click()");await wait("document.querySelector('.photobooth__footer strong').textContent.includes('1/4')");assert.equal(await ev("document.querySelectorAll('.photobooth__slot')[1].getAttribute('aria-pressed')"),'true');
 assert.equal(await ev("document.querySelectorAll('.pb-tools').length"),0);
 assert.equal(await ev("[...document.querySelectorAll('.photobooth__layout')].every(b=>/^\\d+ (ảnh|photos)$/.test(b.textContent.trim()))"),true);
 assert.equal(await ev("(()=>{const a=document.querySelector('.photobooth__workspace').getBoundingClientRect(),b=document.querySelector('.photobooth .site-header').getBoundingClientRect();return Math.abs(a.left-b.left)<1&&Math.abs(a.right-b.right)<1})()"),true);
 await fill();await wait("!document.querySelector('.photobooth__download').disabled");
 // Style selection changes the artwork, retaining photos and their crop.
 assert.equal(await ev("document.querySelectorAll('[data-style]').length"),8);
 const entriesBeforeStyle=await ev("JSON.parse(sessionStorage.getItem('rose-photobooth')).entries");
 const artwork=new Set();
 for(const style of ['blush','vintage','midnight','cherry','film','scrapbook','postcard','cream']){
  await ev(`document.querySelector('[data-style=${style}]').click()`);
  await wait(`document.querySelector('[data-style=${style}]').getAttribute('aria-pressed')==='true'`);
  await ev('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
  assert.equal(await ev("JSON.parse(sessionStorage.getItem('rose-photobooth')).paletteId"),style);
  assert.deepEqual(await ev("JSON.parse(sessionStorage.getItem('rose-photobooth')).entries"),entriesBeforeStyle);
  artwork.add(await ev("document.querySelector('.photobooth__paper canvas').toDataURL()"));
 }
 assert.equal(artwork.size,8,'Each frame style must produce distinct artwork');
 // Shape controls preserve photos, expose matching hit masks and clip pixels.
 const styleThumbnails=await ev("[...document.querySelectorAll('.photobooth__styles canvas')].map(c=>c.toDataURL())");
 const shapeDraft=await ev("JSON.parse(sessionStorage.getItem('rose-photobooth')).entries");
 for(const shape of ['heart','cloud','oval','arch','flower']){
  await ev(`document.querySelector('[data-photo-shape=${shape}]').click()`);
  await wait(`document.querySelector('.photobooth__slot').dataset.shape==='${shape}'`);
  assert.deepEqual(await ev("JSON.parse(sessionStorage.getItem('rose-photobooth')).entries"),shapeDraft);
  assert.deepEqual(await ev("[...document.querySelectorAll('.photobooth__styles canvas')].map(c=>c.toDataURL())"),styleThumbnails,'Frame thumbnails must not show the selected photo layout');
  assert.equal(await ev("getComputedStyle(document.querySelector('.photobooth__slot')).clipPath.startsWith('polygon(')"),true);
 }
 const shapePixels=await ev("(async()=>{const {drawPhoto}=await import('/src/photobooth/render.ts');const source=document.createElement('canvas');source.width=source.height=20;source.getContext('2d').fillRect(0,0,20,20);const image=new Image();image.src=source.toDataURL();await image.decode();for(const shape of ['heart','cloud','oval','arch','flower']){const c=document.createElement('canvas');c.width=c.height=200;const x=c.getContext('2d');drawPhoto(x,image,{x:0,y:0,width:200,height:200,shape},{photoId:'test',x:0,y:0,zoom:1});if(x.getImageData(1,1,1,1).data[3]!==0||x.getImageData(100,100,1,1).data[3]!==255)throw Error('Bad clipping '+shape)}return true})()");assert(shapePixels);
 await ev("document.querySelector('[data-photo-shape=heart]').click()");
 await wait("document.querySelector('.photobooth__slot').dataset.shape==='heart'");
 await ev("document.querySelector('.photobooth__slot').click()");await wait("!!document.querySelector('.photo-editor')");
 await ev('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
 assert.equal(await ev("document.querySelector('.photo-editor canvas').getContext('2d').getImageData(1,1,1,1).data[3]"),0,'Crop editor must use the heart mask');
 await ev("document.querySelector('.photo-editor__done').click()");await wait("!document.querySelector('.photo-editor')");
 await ev("document.querySelector('[data-photo-shape=layout]').click()");
 await wait("JSON.parse(sessionStorage.getItem('rose-photobooth')).shapeId==='layout'");
 // Clicking a filled slot opens crop; Escape returns focus to that slot.
 await ev("document.querySelectorAll('.photobooth__slot')[0].click()");await wait("!!document.querySelector('.photo-editor')");
 await ev("(()=>{const input=document.querySelector('.photo-editor__sliders input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'1.7');input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}))})()");
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape'});await wait("!document.querySelector('.photo-editor')");
 const before=await ev("JSON.parse(sessionStorage.getItem('rose-photobooth')).entries.slice(0,4)");
 assert.equal(before[0].zoom,1.7,'Crop slider must update the actual draft');
 assert.equal(await ev("document.activeElement===document.querySelector('.photobooth__slot[data-slot=\"0\"]')"),true);
 await ev("(()=>{const data=new DataTransfer();data.setData('text/plain','0');document.querySelectorAll('.photobooth__slot')[1].dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:data}))})()");
 const swapped=await ev("JSON.parse(sessionStorage.getItem('rose-photobooth')).entries.slice(0,4)");assert.deepEqual(swapped[0],before[1]);assert.deepEqual(swapped[1],before[0]);
 // Preserve surplus slots when switching from 20 -> 2 -> 20.
 await ev("document.querySelectorAll('.photobooth__slot')[1].click()");await wait("!!document.querySelector('.photo-editor')");
 assert.equal(await ev("document.querySelector('.photo-editor__remove').nextElementSibling.classList.contains('photo-editor__done')"),true);
 await ev("document.querySelector('.photo-editor__remove').click()");await wait("!document.querySelector('.photo-editor')");
 assert.equal(await ev("JSON.parse(sessionStorage.getItem('rose-photobooth')).entries[1]"),null);
 assert.equal(await ev("document.querySelector('.photobooth__download').disabled"),true);
 assert.equal(await ev("document.activeElement===document.querySelector('.photobooth__slot[data-slot=\"1\"]')"),true);
 await fill();await wait("!document.querySelector('.photobooth__download').disabled");
 await ev("document.querySelectorAll('.photobooth__slot')[1].click()");await wait("!!document.querySelector('.photo-editor')");await ev("document.querySelector('.photo-editor__done').click()");await wait("!document.querySelector('.photo-editor')");
 await ev("document.querySelector('[data-frame=grid-20]').click()");await fill();await wait("!document.querySelector('.photobooth__download').disabled");
 assert.deepEqual(await ev("[...document.querySelectorAll('.photobooth__styles canvas')].map(c=>c.toDataURL())"),styleThumbnails,'Changing layout must not redraw frame thumbnails');
 assert.equal(await ev("new Set(JSON.parse(sessionStorage.getItem('rose-photobooth')).entries.map(e=>e.photoId)).size"),20);
 const twenty=await ev("sessionStorage.getItem('rose-photobooth')");await ev("document.querySelector('[data-frame=journal-2]').click()");await ev("document.querySelector('[data-frame=grid-20]').click()");assert.deepEqual(await ev("JSON.parse(sessionStorage.getItem('rose-photobooth')).entries"),JSON.parse(twenty).entries);
 // Exercise actual PNG download, decode and preview/export pixel equivalence.
 const downloadDir=path.resolve('.qa/photobooth');await fs.mkdir(downloadDir,{recursive:true});await send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloadDir});
 await ev("document.querySelector('.photobooth__download').click()");await wait("!!window.__lastPhotoBlob&&document.querySelector('.photobooth__footer small').textContent.includes('sẵn sàng')");
 const result=await ev("(async()=>{const bitmap=await createImageBitmap(__lastPhotoBlob);const c=document.createElement('canvas');c.width=bitmap.width;c.height=bitmap.height;const ctx=c.getContext('2d');ctx.drawImage(bitmap,0,0);const preview=document.querySelector('.photobooth__paper canvas'),pctx=preview.getContext('2d'),x=170,y=240,pixel=[...pctx.getImageData(x,y,1,1).data],exportPixel=[...ctx.getImageData(Math.round(x/preview.width*c.width),Math.round(y/preview.height*c.height),1,1).data];return {width:bitmap.width,height:bitmap.height,pixel,exportPixel,type:__lastPhotoBlob.type}})()");
 assert.equal(result.width,2000);assert.equal(result.height,2800);assert.equal(result.type,'image/png');result.pixel.forEach((v,i)=>assert(Math.abs(v-result.exportPixel[i])<8));
 // Validate all frame geometry, palettes, crops and output aspect ratios through shared renderer.
 const exports=await ev("(async()=>{const {frames,palettes,cropRect}=await import('/src/photobooth/data.ts');const {exportFrame}=await import('/src/photobooth/render.ts');const draft=JSON.parse(sessionStorage.getItem('rose-photobooth'));let count=0;for(const frame of frames){if(frame.slots.length!==frame.count)throw Error('Wrong count');for(const s of frame.slots){if(s.x<0||s.y<0||s.x+s.width>frame.width+1||s.y+s.height>frame.height+1)throw Error('Outside '+frame.id)}for(const palette of palettes){const blob=await exportFrame(frame,{...draft,frameId:frame.id,paletteId:palette.id},'en'),bitmap=await createImageBitmap(blob);if(bitmap.width!==frame.width||bitmap.height!==frame.height)throw Error('Size');bitmap.close();count++}}const c=cropRect(1800,1200,300,600,{x:1,y:-1,zoom:2,photoId:'photo-01'});if(c.x<0||c.y<0||c.x+c.width>1800||c.y+c.height>1200)throw Error('Invalid crop');return count})()");assert.equal(exports,128);
 // Close/reopen and locale switch must keep draft and focus.
 const draftBefore=await ev("sessionStorage.getItem('rose-photobooth')");await ev("document.querySelector('.site-header__close').click()");await wait("!document.querySelector('.photobooth')");assert.equal(await ev("document.activeElement===document.querySelector('.photo-stack__button')"),true);await ev("document.querySelector('.photo-stack__button').click()");await wait("!!document.querySelector('.photobooth')");assert.deepEqual(JSON.parse(await ev("sessionStorage.getItem('rose-photobooth')")),JSON.parse(draftBefore));
 await ev("document.querySelector('.site-header__close').click()");await wait("!document.querySelector('.photobooth')");await ev("document.querySelector('.site-header .language-select__trigger').click()");await wait("!!document.querySelector('[role=option][lang=en]')");await ev("document.querySelector('[role=option][lang=en]').click()");await ev("document.querySelector('.photo-stack__button').click()");await wait("document.querySelector('#pb-title')?.textContent==='Moments we keep'");
 assert.equal(await ev("document.querySelectorAll('.photobooth .site-header .site-header__actions>button').length"),1);assert.equal(await ev("!!document.querySelector('.photobooth .theme-toggle,.photobooth .language-select__trigger,.photobooth .sound-toggle')"),false);
 for(const width of [320,360,430,800]){await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:true});assert.equal(await ev("document.querySelector('.photobooth').scrollWidth<=innerWidth"),true,JSON.stringify(await ev("({width:innerWidth,scroll:document.querySelector('.photobooth').scrollWidth,overflow:[...document.querySelectorAll('.photobooth *')].filter(n=>n.getBoundingClientRect().right>innerWidth+1).slice(0,10).map(n=>[n.className,n.getBoundingClientRect().right])})")));assert.equal(await ev("document.querySelector('.photobooth__slot').getAttribute('aria-label').startsWith('Slot')"),true);assert.equal(await ev("(()=>{const b=document.querySelector('.site-header__close').getBoundingClientRect(),i=document.querySelector('.site-header__close svg').getBoundingClientRect();return Math.abs(b.x+b.width/2-i.x-i.width/2)<.1&&Math.abs(b.y+b.height/2-i.y-i.height/2)<.1})()"),true)}
 await send('Emulation.setDeviceMetricsOverride',{width:360,height:900,deviceScaleFactor:1,mobile:true});
 await ev('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
 assert.equal(await ev("document.querySelectorAll('.photobooth__section-heading,.photobooth__style-heading').length"),0);
 assert.equal(await ev("getComputedStyle(document.querySelector('.photobooth__photos')).gridAutoFlow"),'column');
 assert.equal(await ev("(()=>{const strip=document.querySelector('.photobooth__photos');return strip.scrollWidth>strip.clientWidth})()"),true);
 assert.equal(await ev("getComputedStyle(document.querySelector('.photobooth__footer')).display"),'flex');
 await fs.writeFile(path.join(downloadDir,'mobile.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
 // A missing original blocks export, keeps the draft and recovers on retry.
 failPhoto=true;await send('Page.reload');await new Promise(resolve=>setTimeout(resolve,500));await wait("!!document.querySelector('.app__skip-intro')");await ev("document.querySelector('.app__skip-intro').click()");await wait("!!document.querySelector('.photo-stack__button')");await ev("document.querySelector('.photo-stack__button').click()");await wait("!!document.querySelector('.photobooth__layout')");await ev("document.querySelector('[data-frame=grid-20]').click()");await fill();await wait("!!document.querySelector('.photobooth__error')");
 assert.equal(await ev("document.querySelector('.photobooth__download').disabled"),true);const saved=await ev("sessionStorage.getItem('rose-photobooth')");failPhoto=false;await ev("document.querySelector('.photobooth__error button').click()");await wait("!document.querySelector('.photobooth__download').disabled");assert.equal(await ev("sessionStorage.getItem('rose-photobooth')"),saved);
 assert.equal(errors.length,0,errors.join('\n'));
 console.log('PASS: 16 layouts / 20 photos / 128 PNG exports, crop geometry, preview pixels, download, direct photo editing, popup deletion, drag swap, surplus draft, focus restoration, VI/EN and mobile widths. '+(live?'Real configured remote photos loaded with CORS; PNG export verified.':'Fixture images were intercepted in QA, never published.')+'');
}finally{if(initialization)await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:initialization.identifier});await send('Fetch.disable');socket.close()}
