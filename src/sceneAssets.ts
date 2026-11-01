export const maleModelUrl='/models/characters/male-cardigan.glb?v=soft73-straight-v4-final';
export const femaleModelUrl='/models/characters/female-grey-jeans.glb?v=straight-bangs-v2';
export const plantModelUrl='/models/plants/potted-plant.glb';
export const bouquetDetail=()=>window.matchMedia('(max-width: 760px)').matches?'balanced':'high';
export const roseModelUrl=(variant:number,story=false,detail=bouquetDetail())=>story?`/models/bouquet/story/rose-${variant}.glb`:`/models/bouquet/rose-${variant}-${detail}.glb`;
export const bouquetPartUrl=(part:'accessories'|'fillers',story=false)=>`/models/bouquet/${story?'story/':''}${part}.glb?v=natural-ten-v1`;
export function sceneAssetUrls(){
 const detail=bouquetDetail();
 return [maleModelUrl,femaleModelUrl,plantModelUrl,
  ...Array.from({length:5},(_,i)=>roseModelUrl(i,true,detail)),
  ...Array.from({length:5},(_,i)=>roseModelUrl(i,false,detail)),
  ...(['accessories','fillers'] as const).flatMap(part=>[bouquetPartUrl(part,true),bouquetPartUrl(part)])];
}
