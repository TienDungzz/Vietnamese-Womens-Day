import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

// Run after build. Follow static imports only: dynamic chunks must not be
// pulled into the initial interface or the no-WebGL fallback.
const manifest=JSON.parse(await fs.readFile('dist/.vite/manifest.json','utf8'));
const entry=Object.keys(manifest).find(key=>manifest[key].isEntry);
assert(entry,'Missing entry chunk');
const eager=new Set();
function visit(key){if(eager.has(key))return;eager.add(key);for(const child of manifest[key].imports??[])visit(child)}
visit(entry);
for(const key of ['src/components/Scene3D.tsx','src/photobooth/Photobooth.tsx']){
 assert(manifest[key],`Missing lazy module ${key}`);
 assert(!eager.has(key),`${key} must remain lazy`);
 assert(manifest[entry].dynamicImports.includes(key),`${key} must be loaded on demand`);
}
let bytes=0,gzip=0;
for(const key of eager){const data=await fs.readFile('dist/'+manifest[key].file);bytes+=data.length;gzip+=gzipSync(data).length}
assert(bytes<350_000,`Initial JS exceeded 350 kB: ${bytes}`);
assert(gzip<110_000,`Initial gzipped JS exceeded 110 kB: ${gzip}`);
console.log(`PASS: initial JS ${(bytes/1000).toFixed(2)} kB / gzip ${(gzip/1000).toFixed(2)} kB; 3D and photobooth are lazy.`);

if(process.argv.includes('--browser')){
 const pages=await(await fetch('http://127.0.0.1:9222/json')).json();
 const socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
 await new Promise(r=>socket.onopen=r);let id=0,initialization;const pending=new Map();
 const send=(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});socket.send(JSON.stringify({id,method,params}))});
 socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}};
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
 const wait=expression=>ev(`new Promise((resolve,reject)=>{const start=Date.now(),timer=setInterval(()=>{if(${expression}){clearInterval(timer);resolve()}else if(Date.now()-start>30000){clearInterval(timer);reject(Error(${JSON.stringify(expression)}))}},50)})`);
 try{
  await send('Page.enable');
  initialization=await send('Page.addScriptToEvaluateOnNewDocument',{source:"const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl2'?null:original.call(this,type,...args)}"});
  await send('Page.navigate',{url:process.env.PERFORMANCE_QA_URL??'http://127.0.0.1:5188/'});
  await wait("!!document.querySelector('.app__skip-intro')");
  const loaded=()=>ev("performance.getEntriesByType('resource').map(r=>r.name).filter(n=>n.endsWith('.js'))");
  let resources=await loaded();assert(!resources.some(n=>/Scene3D-|Photobooth-/.test(n)),'Fallback loaded unused features');
  await ev("document.querySelector('.app__skip-intro').click()");await wait("!!document.querySelector('.photo-stack__button')");
  await ev("document.querySelector('.photo-stack__button').click()");await wait("!!document.querySelector('.photobooth')");
  resources=await loaded();assert.equal(resources.filter(n=>n.includes('/Photobooth-')).length,1);assert(!resources.some(n=>n.includes('/Scene3D-')));
  await ev("document.querySelector('.site-header__close').click()");await wait("!document.querySelector('.photobooth')");
  await ev("document.querySelector('.photo-stack__button').click()");await wait("!!document.querySelector('.photobooth')");
  assert.equal((await loaded()).filter(n=>n.includes('/Photobooth-')).length,1);
  console.log('PASS: production fallback downloads no 3D; photobooth JS loads only on open and is reused on reopen.');
 }finally{if(initialization)await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:initialization.identifier});socket.close()}
}
