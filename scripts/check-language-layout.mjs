import assert from 'node:assert/strict';
const pages=await(await fetch('http://127.0.0.1:9222/json')).json();
const socket=new WebSocket(pages.find(page=>page.type==='page').webSocketDebuggerUrl);
await new Promise(resolve=>socket.onopen=resolve);
let id=0;const pending=new Map();
socket.onmessage=event=>{const message=JSON.parse(event.data);if(message.id){const task=pending.get(message.id);pending.delete(message.id);message.error?task.reject(message.error):task.resolve(message.result)}};
const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});socket.send(JSON.stringify({id:key,method,params}))});
const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));return result.result.value};
const wait=expression=>evaluate(`new Promise((resolve,reject)=>{const start=Date.now(),timer=setInterval(()=>{if(${expression}){clearInterval(timer);resolve()}else if(Date.now()-start>15000){clearInterval(timer);reject(Error('Timed out'))}},30)})`);
let initialization;
try{
 await send('Page.enable');await send('Runtime.enable');
 initialization=await send('Page.addScriptToEvaluateOnNewDocument',{source:"const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl2'?null:original.call(this,type,...args)};try{localStorage.setItem('rose-language','vi')}catch{}"});
 let navigation=await send('Page.navigate',{url:'http://127.0.0.1:5173/'});if(navigation.errorText)await send('Page.navigate',{url:'http://127.0.0.1:5173/'});
 await wait("!!document.querySelector('.language-select__trigger')");await evaluate('document.fonts.ready');
 const language=async value=>{await evaluate("document.querySelector('.language-select__trigger').click()");await wait("!!document.querySelector('[role=listbox]')");await evaluate(`document.querySelector('[role=option][lang="${value}"]').click()`);await wait(`document.documentElement.lang==='${value}'`)};
 const selectors=['header','.site-header__actions','.language-select__trigger','.theme-toggle','.sound-toggle','.app__heading','.app__occasion','.app__occasion strong','.app__heading h1','.app__heading>p','.app__stage','.app__intro','.app__intro p','.button--primary','.app__skip-intro','.app__help','.rose-picker','.app__toolbar','.app__toolbar button','.wish-card','#wish-title','.wish-card p','.wish-card__signature','.wish-card__nav','.wish-card>.button--text','footer','footer>span'];
 const snapshot=()=>evaluate(`(()=>{const result={};for(const selector of ${JSON.stringify(selectors)})document.querySelectorAll(selector).forEach((node,index)=>{const r=node.getBoundingClientRect();result[selector+index]=[r.x,r.y,r.width,r.height]});return result})()`);
 let largest=0;
 const compare=(before,after,label)=>{for(const [selector,rect] of Object.entries(before)){assert(after[selector],selector);rect.forEach((value,index)=>{const delta=Math.abs(value-after[selector][index]);largest=Math.max(largest,delta);assert(delta<1,`${label} ${selector}[${index}]: ${value} -> ${after[selector][index]}`)})}};
 for(const width of [360,800,1440]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<801});
  if(await evaluate("!!document.querySelector('.app__toolbar')")){await evaluate("document.querySelector('.app__toolbar button').click()");await wait("!!document.querySelector('.app__skip-intro')")}
  await language('vi');const intro=await snapshot();await language('en');compare(intro,await snapshot(),`${width}px intro`);
  await evaluate("document.querySelector('.app__skip-intro').click()");await wait("document.querySelectorAll('.rose-picker button').length===10");
  for(let i=0;i<10;i++){
   await evaluate(`document.querySelectorAll('.rose-picker button')[${i}].click()`);await wait("!!document.querySelector('.wish-card')");
   await evaluate('new Promise(resolve=>setTimeout(resolve,450))');
   await language('vi');const card=await snapshot();await language('en');compare(card,await snapshot(),`${width}px flower ${i+1}`);
   assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
   assert.equal(await evaluate("document.querySelector('.wish-card').scrollWidth<=document.querySelector('.wish-card').clientWidth"),true);
  }
 }
 console.log(`PASS: intro, header, stage, tools and all 10 cards at 360/800/1440px; largest position/size change ${largest.toFixed(3)}px; no horizontal overflow.`);
}finally{if(initialization)await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:initialization.identifier});socket.close()}
