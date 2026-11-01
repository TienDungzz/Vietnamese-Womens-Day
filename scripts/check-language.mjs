import assert from 'node:assert/strict';
const pages=await(await fetch('http://127.0.0.1:9222/json')).json();
const socket=new WebSocket(pages.find(page=>page.type==='page').webSocketDebuggerUrl);
await new Promise(resolve=>socket.onopen=resolve);
let id=0;const pending=new Map(),errors=[];
socket.onmessage=event=>{const message=JSON.parse(event.data);if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails.text);if(message.id){const task=pending.get(message.id);pending.delete(message.id);message.error?task.reject(message.error):task.resolve(message.result)}};
const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});socket.send(JSON.stringify({id:key,method,params}))});
const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));return result.result.value};
const wait=expression=>evaluate(`new Promise((resolve,reject)=>{const start=Date.now(),timer=setInterval(()=>{if(${expression}){clearInterval(timer);resolve()}else if(Date.now()-start>15000){clearInterval(timer);reject(Error('Timed out'))}},50)})`);
try{
 await send('Page.enable');await send('Runtime.enable');
 await send('Emulation.setDeviceMetricsOverride',{width:360,height:820,deviceScaleFactor:1,mobile:true});
 await send('Page.addScriptToEvaluateOnNewDocument',{source:"const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl2'?null:original.call(this,type,...args)}"});
 const navigate=async()=>{const result=await send('Page.navigate',{url:'http://127.0.0.1:5173/'});if(result.errorText)await send('Page.navigate',{url:'http://127.0.0.1:5173/'});await wait("!!document.querySelector('.language-trigger')")};
 await navigate();
 const language=async value=>{await evaluate("document.querySelector('.language-trigger').click()");await wait("!!document.querySelector('[role=listbox]')");await evaluate(`document.querySelector('[role=option][lang="${value}"]').click()`);await wait(`document.documentElement.lang==='${value}'`)};
 await language('vi');
 await evaluate("document.querySelector('.skip-intro').click()");await wait("document.querySelectorAll('.rose-picker button').length===10");
 await evaluate("document.querySelectorAll('.rose-picker button')[2].click()");await wait("!!document.querySelector('#wish-title')");
 const vietnamese=await evaluate("document.querySelector('#wish-title').innerText");
 await language('en');
 assert.equal(await evaluate("document.querySelector('#wish-title').innerText"),'New beginnings');
 assert.equal(await evaluate("document.querySelectorAll('.rose-picker button')[2].getAttribute('aria-pressed')"),'true');
 assert.match(await evaluate("document.querySelector('.heading').textContent"),/Every flower/);
 assert.equal(await evaluate("document.querySelector('.theme-toggle').getAttribute('aria-label')"),'Switch to nighttime');
 for(let i=0;i<10;i++){
  await evaluate(`document.querySelectorAll('.rose-picker button')[${i}].click()`);
  await wait(`document.querySelectorAll('.rose-picker button')[${i}].getAttribute('aria-pressed')==='true'`);
  assert.equal(await evaluate("/[ĂăĐđĨĩŨũƠơƯư\\u1ea0-\\u1ef9]/.test(document.querySelector('.wish-card').innerText)"),false);
 }
 assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth"),true);
 await send('Page.reload');await wait("!!document.querySelector('.language-trigger')");
 assert.equal(await evaluate("document.documentElement.lang"),'en');
 assert.equal(await evaluate("document.querySelector('.language-trigger').textContent.trim()"),'EN');
 assert.match(await evaluate('document.title'),/tenderness/);
 await language('vi');await evaluate("document.querySelector('.skip-intro').click()");await wait("document.querySelectorAll('.rose-picker button').length===10");
 await evaluate("document.querySelectorAll('.rose-picker button')[2].click()");await wait("!!document.querySelector('#wish-title')");
 assert.equal(await evaluate("document.querySelector('#wish-title').innerText"),vietnamese);
 // Use actual browser keyboard events to validate listbox navigation and focus.
 const key=async value=>{await send('Input.dispatchKeyEvent',{type:'keyDown',key:value});await send('Input.dispatchKeyEvent',{type:'keyUp',key:value})};
 await evaluate("document.querySelector('.language-trigger').focus()");await key('ArrowDown');
 await wait("document.activeElement?.getAttribute('role')==='option'");
 await key('End');await key('Enter');await wait("document.documentElement.lang==='en'");
 assert.equal(await evaluate("document.activeElement.className"),'language-trigger');
 assert.equal(await evaluate("!!document.querySelector('[role=listbox]')"),false);
 await key('ArrowUp');await wait("!!document.querySelector('[role=listbox]')");await key('Home');await key('Escape');
 assert.equal(await evaluate('document.documentElement.lang'),'en');
 assert.equal(await evaluate("document.activeElement.className"),'language-trigger');
 await key('ArrowDown');await wait("!!document.querySelector('[role=listbox]')");await key('Tab');
 await wait("!document.querySelector('[role=listbox]')");
 await evaluate("document.querySelector('.language-trigger').click()");await wait("!!document.querySelector('.language-menu')");
 assert.equal(await evaluate("(()=>{const r=document.querySelector('.language-menu').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth})()"),true);
 await send('Input.dispatchMouseEvent',{type:'mousePressed',x:10,y:160,button:'left',clickCount:1});
 await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:10,y:160,button:'left',clickCount:1});
 await wait("!document.querySelector('[role=listbox]')");
 assert.equal(errors.length,0,errors.join('\n'));
 console.log('PASS: VI/EN, 10 wishes, saved language, metadata, 360px layout; custom dropdown keyboard selection, Escape, Tab, outside click and focus restoration; no runtime errors.');
}finally{socket.close()}
