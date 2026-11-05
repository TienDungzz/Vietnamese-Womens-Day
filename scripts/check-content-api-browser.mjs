import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
// Run a dedicated Vite with VITE_CONTENT_API_URL=http://127.0.0.1:8792/content.
// Override the frontend URL if another local project already owns port 5174.
const frontendUrl=process.env.CONTENT_API_QA_URL??'http://127.0.0.1:5174/';
let mode='held',held,requests=0;const images=new Map();
const wishes=Array.from({length:10},(_,i)=>{const n=String(i+1).padStart(2,'0');return {id:`rose-${n}`,title:{vi:`API lời chúc ${n}`,en:`API wish ${n}`},text:{vi:`Nội dung từ API ${n}`,en:`API message ${n}`}}});
const photos=Array.from({length:20},(_,i)=>{const n=String(i+1).padStart(2,'0');return {id:`photo-${n}`,src:`images/${n}.png`,thumb:`images/${n}.png?thumb=1`,label:{vi:`API ảnh ${n}`,en:`API photo ${n}`}}});
for(let i=1;i<=20;i++)images.set(String(i).padStart(2,'0'),await sharp({create:{width:600,height:450,channels:3,background:{r:120+i*5,g:150,b:165}}}).png().toBuffer());
const payload={wishes:[...wishes].reverse(),photos:[...photos].reverse()};
const server=createServer((request,response)=>{response.setHeader('Access-Control-Allow-Origin','*');const url=new URL(request.url,'http://127.0.0.1:8792');if(url.pathname==='/content'){requests++;response.setHeader('Content-Type','application/json');if(mode==='held'){held=response;return}if(mode==='invalid'){response.end('{"wishes":[],"photos":[]}');return}response.end(JSON.stringify(payload));return}const image=images.get(url.pathname.match(/^\/images\/(\d{2})\.png$/)?.[1]);if(image){response.setHeader('Content-Type','image/png');response.end(image)}else{response.statusCode=404;response.end()}});
await new Promise(resolve=>server.listen(8792,'127.0.0.1',resolve));
const pages=await(await fetch('http://127.0.0.1:9222/json')).json(),socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await new Promise(resolve=>socket.onopen=resolve);
let id=0,initialization;const pending=new Map(),errors=[];
socket.onmessage=event=>{const message=JSON.parse(event.data);if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails.text);if(message.id){const job=pending.get(message.id);if(job){pending.delete(message.id);message.error?job.reject(message.error):job.resolve(message.result)}}};
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});socket.send(JSON.stringify({id:n,method,params}))});
const ev=async expression=>{const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));return result.result.value};
const wait=expression=>ev(`new Promise((resolve,reject)=>{const start=Date.now(),timer=setInterval(()=>{if(${expression}){clearInterval(timer);resolve()}else if(Date.now()-start>20000){clearInterval(timer);reject(Error(${JSON.stringify(expression)}))}},50)})`);
try{
 await send('Page.enable');await send('Runtime.enable');
 initialization=await send('Page.addScriptToEvaluateOnNewDocument',{source:"const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl2'?null:original.call(this,type,...args)};localStorage.setItem('rose-language','vi');sessionStorage.removeItem('rose-photobooth');const originalURL=URL.createObjectURL;URL.createObjectURL=function(blob){window.__apiBlob=blob;return originalURL.call(this,blob)}"});
 let navigation=await send('Page.navigate',{url:frontendUrl});if(navigation.errorText)await send('Page.navigate',{url:frontendUrl});
 await wait("!!document.querySelector('.scene-loading')");assert.equal(await ev("!!document.querySelector('main')"),false);
 await new Promise(resolve=>setTimeout(resolve,200));assert.equal(requests,1,'One startup request under StrictMode');assert(held);mode='valid';held.end(JSON.stringify(payload));
 await wait("document.querySelector('main')?.dataset.contentSource==='api'");await ev("document.querySelector('.app__skip-intro').click()");await wait("document.querySelectorAll('.rose-picker button').length===10");
 for(let i=0;i<10;i++){await ev(`document.querySelectorAll('.rose-picker button')[${i}].click()`);await wait(`document.querySelector('#wish-title')?.innerText==='API lời chúc ${String(i+1).padStart(2,'0')}'`)}
 await ev("document.querySelector('.site-header__actions .language-select__trigger').click()");await wait("!!document.querySelector('[role=option][lang=en]')");await ev("document.querySelector('[role=option][lang=en]').click()");await wait("document.querySelector('#wish-title').innerText==='API wish 10'");assert.equal(requests,1);
 await ev("document.querySelector('.photo-stack__button').click()");await wait("!!document.querySelector('.photobooth')");assert.equal(await ev("document.querySelector('.photobooth__photo').getAttribute('aria-label')"),'API photo 01');assert.equal(await ev("document.querySelector('.photobooth__photo img').src"),'http://127.0.0.1:8792/images/01.png?thumb=1');
 await ev("document.querySelector('[data-frame=grid-20]').click()");await ev("(async()=>{for(let i=0;i<20;i++){document.querySelectorAll('.photobooth__slot')[i].click();await new Promise(r=>setTimeout(r,0));document.querySelectorAll('.photobooth__photo')[i].click();await new Promise(r=>setTimeout(r,0))}})()");await wait("!document.querySelector('.photobooth__download').disabled");
 await mkdir('.qa/content-api',{recursive:true});await send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:path.resolve('.qa/content-api')});await ev("document.querySelector('.photobooth__download').click()");await wait("!!window.__apiBlob");assert.deepEqual(await ev("(async()=>{const bitmap=await createImageBitmap(__apiBlob);const size=[bitmap.width,bitmap.height];bitmap.close();return size})()"),[2000,2800]);
 mode='invalid';await send('Page.reload');await new Promise(resolve=>setTimeout(resolve,500));await wait("document.querySelector('main')?.dataset.contentSource==='local'");assert.equal(requests,2);
 assert.equal(errors.length,0,errors.join('\n'));
 console.log('PASS: real HTTP API startup gate, one StrictMode GET, 10 API wishes VI/EN, API image labels/relative URLs, all 20 API images and PNG export, invalid payload fallback.');
}finally{if(initialization)await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:initialization.identifier});socket.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve))}
