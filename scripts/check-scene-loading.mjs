import fs from 'node:fs';
const screenshots=process.argv.includes('--screenshots');
if(screenshots)fs.mkdirSync('.qa',{recursive:true});
import assert from 'node:assert/strict';
const response=await fetch('http://127.0.0.1:5173/');assert(response.ok,'Dev server is unavailable');
const pages=await(await fetch('http://127.0.0.1:9222/json')).json();
const socket=new WebSocket(pages[0].webSocketDebuggerUrl);await new Promise(r=>socket.onopen=r);
let id=0,phase='desktop',held=null;const heldRequests=new Set();const pending=new Map(),models=new Set(),errors=[];
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});socket.send(JSON.stringify({id:n,method,params}))});
socket.onmessage=e=>{const v=JSON.parse(e.data);
 if(v.method==='Fetch.requestPaused'){
  if(phase==='failure')void send('Fetch.failRequest',{requestId:v.params.requestId,errorReason:'Failed'});
  else if(phase==='desktop'){held=v.params.requestId;heldRequests.add(held)}
  else void send('Fetch.continueRequest',{requestId:v.params.requestId});
 }
 if(v.method==='Network.requestWillBeSent'&&v.params.request.url.includes('/models/')&&v.params.request.url.includes('.glb'))models.add(v.params.request.url);
 if(v.method==='Runtime.exceptionThrown')errors.push(v.params.exceptionDetails.exception?.description||v.params.exceptionDetails.text);
 if(v.method==='Runtime.consoleAPICalled'&&v.params.type==='error')errors.push(JSON.stringify(v.params.args));
 if(v.id){const p=pending.get(v.id);pending.delete(v.id);if(p)v.error?p.reject(v.error):p.resolve(v.result)}
};
socket.onclose=()=>{for(const p of pending.values())p.reject(Error('Browser closed'));pending.clear()};
const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
const wait=(expression,timeout=120000)=>ev(`new Promise((resolve,reject)=>{const start=Date.now(),t=setInterval(()=>{if(${expression}){clearInterval(t);resolve(true)}else if(Date.now()-start>${timeout}){clearInterval(t);reject(Error('Timeout waiting: '+${JSON.stringify(expression)}))}},120)})`);
const store=()=>ev(`(async()=>{const url=performance.getEntriesByType('resource').find(r=>r.name.includes('@react-three_fiber.js')).name;window.__qa=(await import(url))._roots.get(document.querySelector('canvas')).store})()`);
async function shot(file){if(!screenshots)return;const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(file,Buffer.from(r.data,'base64'))}
try{
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
 await send('Emulation.setDeviceMetricsOverride',{width:1100,height:950,deviceScaleFactor:1,mobile:false});
 await send('Fetch.enable',{patterns:[{urlPattern:'*models/bouquet/rose-4-high.glb*'}]});
 await send('Page.navigate',{url:'http://127.0.0.1:5173/'});errors.length=0;
 for(let n=0;n<80&&!held;n++)await new Promise(r=>setTimeout(r,200));
 assert(held,'Expected held studio asset request: '+errors.join('\n'));
 await ev('new Promise(r=>setTimeout(r,2500))');
 assert.equal(await ev("!!document.querySelector('.scene-loading')&&document.querySelector('main').inert&&getComputedStyle(document.querySelector('canvas')).visibility==='hidden'"),true);
 await ev("document.querySelector('.app__intro .button--primary').click();document.querySelector('.app__intro .button--text').click()");
 assert.equal(await ev("!!document.querySelector('.app__intro .button--primary')&&document.querySelector('main').classList.contains('app--story')"),true,'Loading actions must not start or skip');
 assert.equal(models.size,17,'Every story and studio model must start preloading in parallel');
 await store();assert.equal(await ev("!!__qa.getState().scene.getObjectByName('story-man')"),false,'No placeholder actor while an asset is pending');
 await shot('.qa/loading-held.png');
 console.log('PASS: delayed studio asset keeps the canvas hidden, all 17 loads started, start/skip blocked, no placeholder actor.');
 phase='released';for(const requestId of heldRequests)await send('Fetch.continueRequest',{requestId});held=null;
 await wait("!document.querySelector('.scene-loading')",180000);await send('Fetch.disable');
 assert.equal(await ev("!document.querySelector('main').inert&&getComputedStyle(document.querySelector('canvas')).visibility==='visible'"),true);
 const actor=await ev("__qa.getState().scene.getObjectByName('story-man').uuid");
 assert.equal(await ev("!!__qa.getState().scene.getObjectByName('story-man').getObjectByName('RW_Soft_73_fringe')"),true);
 await ev("document.querySelector('.app__intro .button--primary').click()");await ev('new Promise(r=>setTimeout(r,300))');
 assert.equal(await ev("__qa.getState().scene.getObjectByName('story-man').uuid"),actor,'Starting must not rebuild the scene');
 await ev("document.querySelector('.app__intro .button--text').click()");
 await wait("!!document.querySelector('.rose-picker')&&!document.querySelector('.scene-loading')");
 assert.equal(models.size,17,'Switching to studio must use preloaded assets');
 assert.equal(await ev("document.querySelectorAll('.rose-picker button').length"),10);
 await ev("document.querySelector('.rose-picker button').click()");await wait("!!document.querySelector('#wish-title')");
 assert.equal(await ev('document.documentElement.scrollWidth<=innerWidth'),true);
 assert.equal(errors.length,0,errors.join('\n'));
 console.log('PASS: complete scene revealed, actor preserved on start, studio uses cache and all 10 wishes remain available.');

 phase='failure';await send('Fetch.enable',{patterns:[{urlPattern:'*models/plants/potted-plant.glb*'}]});
 await send('Page.navigate',{url:'http://127.0.0.1:5173/'});
 await wait("!!document.querySelector('.scene-loading[role=alert]')",90000);
 assert.equal(await ev("document.querySelector('main').inert&&!document.querySelector('.fallback')&&!!document.querySelector('.scene-loading button')&&!document.querySelector('.scene-loading button').closest('[inert]')"),true);
 await shot('.qa/loading-error.png');
 console.log('PASS: failed model shows a retry message, without a substitute model.');
 phase='recover';await send('Fetch.disable');errors.length=0;
 await ev("document.querySelector('.scene-loading button').click()");
 await wait("!!document.querySelector('canvas')&&!document.querySelector('.scene-loading')",120000);
 assert.equal(await ev("!document.querySelector('main').inert"),true);
 console.log('PASS: retry reloads and reveals the complete scene.');

 if(process.argv.includes('--mobile')){
 phase='mobile';models.clear();errors.length=0;
 await send('Emulation.setDeviceMetricsOverride',{width:430,height:932,deviceScaleFactor:1,mobile:true});
 await send('Page.navigate',{url:'http://127.0.0.1:5173/'});
 await wait("!!document.querySelector('canvas')&&!document.querySelector('.scene-loading')",120000);
 assert.equal(models.size,17);assert.equal([...models].filter(u=>/rose-\d-balanced/.test(u)).length,5);assert.equal([...models].some(u=>/rose-\d-high/.test(u)),false);
 assert.equal(await ev('document.documentElement.scrollWidth<=innerWidth'),true);
 await ev("document.querySelector('.app__intro .button--text').click()");await wait("!!document.querySelector('.rose-picker')&&!document.querySelector('.scene-loading')");
 assert.equal(models.size,17);await shot('.qa/loading-mobile-ready.png');
 assert.equal(errors.length,0,errors.join('\n'));
 console.log('PASS: mobile loads its complete detail level, remains within viewport and opens the cached bouquet.');
 }
}catch(error){
 await shot('.qa/loading-test-failure.png').catch(()=>{});
 console.error(error);console.error(errors);console.error(await ev("JSON.stringify({status:document.querySelector('.scene-loading')?.textContent,modelResponses:performance.getEntriesByType('resource').filter(r=>r.name.includes('.glb')).length})").catch(()=>null));process.exitCode=1;
}finally{
 await send('Fetch.disable').catch(()=>{});await send('Browser.close').catch(()=>{});socket.close();
}
