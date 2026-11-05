import { parsePhotos,parseWishes } from './schema';
import type { Content } from './schema';
export type ApiConfig={contentUrl?:string;wishesUrl?:string;photosUrl?:string;timeoutMs?:number};
export type ContentResult={content:Content;errors:string[]};
export function hasApi(config:ApiConfig){return !!(config.contentUrl||config.wishesUrl||config.photosUrl)}
export async function loadContent(config:ApiConfig,fallback:Content,base:string,request:typeof fetch=fetch):Promise<ContentResult>{
 const errors:string[]=[],requests=new Map<string,Promise<{body:unknown;url:string}>>();
 const get=(path:string)=>{
  const url=new URL(path,base);if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw Error('API URL must use HTTP(S) without embedded credentials');
  if(!requests.has(url.href))requests.set(url.href,(async()=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),config.timeoutMs??8000);
   try{const response=await request(url.href,{headers:{Accept:'application/json'},credentials:'same-origin',signal:controller.signal});if(!response.ok)throw Error(`HTTP ${response.status}`);return {body:await response.json() as unknown,url:response.url||url.href}}
   finally{clearTimeout(timer)}
  })());return requests.get(url.href)!;
 };
 let wishes=fallback.wishes,photos=fallback.photos,wishesFromApi=false,photosFromApi=false;
 await Promise.all([
  (async()=>{const url=config.wishesUrl||config.contentUrl;if(!url)return;try{const result=await get(url);wishes=parseWishes(result.body);wishesFromApi=true}catch(error){errors.push(`wishes: ${error instanceof Error?error.message:String(error)}`)}})(),
  (async()=>{const url=config.photosUrl||config.contentUrl;if(!url)return;try{const result=await get(url);photos=parsePhotos(result.body,result.url);photosFromApi=true}catch(error){errors.push(`photos: ${error instanceof Error?error.message:String(error)}`)}})(),
 ]);
 return {content:{wishes,photos,photoSource:photosFromApi?'api':fallback.photoSource,source:wishesFromApi&&photosFromApi?'api':wishesFromApi||photosFromApi?'mixed':'local'},errors};
}
