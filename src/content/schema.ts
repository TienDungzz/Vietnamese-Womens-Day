export type Localized={vi:string;en:string};
export type ApiWish={id:string;title:Localized;text:Localized};
export type ApiPhoto={id:string;src:string;thumb:string;label:Localized};
export type Content={wishes:ApiWish[];photos:ApiPhoto[];photoSource:string;source:'local'|'api'|'mixed'};
function object(value:unknown):Record<string,unknown>{if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Expected a JSON object');return value as Record<string,unknown>}
function string(value:unknown,name:string){if(typeof value!=='string'||!value.trim())throw Error(`Missing ${name}`);return value.trim()}
function localized(value:unknown,name:string):Localized{
 if(typeof value==='string'){const text=string(value,name);return {vi:text,en:text}}
 const record=object(value),vi=string(record.vi,`${name}.vi`);return {vi,en:record.en===undefined?vi:string(record.en,`${name}.en`)};
}
function rows(value:unknown,key:string,count:number){const items=Array.isArray(value)?value:object(value)[key];if(!Array.isArray(items)||items.length!==count)throw Error(`Expected exactly ${count} ${key}`);return items.map(object)}
function ordered<T extends {id:string}>(items:T[],prefix:string,count:number){
 const byId=new Map(items.map(item=>[item.id,item]));if(byId.size!==count)throw Error('Duplicate content IDs');
 return Array.from({length:count},(_,i)=>{const id=`${prefix}-${String(i+1).padStart(2,'0')}`,item=byId.get(id);if(!item)throw Error(`Missing ${id}`);return item});
}
export function parseWishes(value:unknown):ApiWish[]{return ordered(rows(value,'wishes',10).map(row=>({id:string(row.id,'id'),title:localized(row.title,'title'),text:localized(row.text,'text')})),'rose',10)}
function imageUrl(value:unknown,base:string){const url=new URL(string(value,'image URL'),base);if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw Error('Image URLs must use HTTP(S) without embedded credentials');return url.href}
export function parsePhotos(value:unknown,base:string):ApiPhoto[]{return ordered(rows(value,'photos',20).map(row=>{const id=string(row.id,'id'),src=imageUrl(row.src,base);return {id,src,thumb:row.thumb===undefined?src:imageUrl(row.thumb,base),label:row.label===undefined?{vi:`Khoảnh khắc ${id.slice(-2)}`,en:`Memory ${id.slice(-2)}`}:localized(row.label,'label')}}),'photo',20)}
