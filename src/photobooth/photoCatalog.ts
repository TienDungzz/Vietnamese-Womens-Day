import photoCatalog from './photos.json';
export type Photo={id:string;src:string;thumb:string;label:{vi:string;en:string}};
export const photoSource=photoCatalog.mode;
export const photos:Photo[]=photoCatalog.photos.map((photo,i)=>{const n=String(i+1).padStart(2,'0');return {...photo,label:{vi:`Khoảnh khắc ${n}`,en:`Memory ${n}`}}});
