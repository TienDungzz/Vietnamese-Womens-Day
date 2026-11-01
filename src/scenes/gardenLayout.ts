export const entranceFlowerPots=([-1,1] as const).flatMap(side=>
 [3.8,2.65,1.5,.35].map(z=>[side*1.03,z] as const));

export const blossomTreeSites=[
 [-9.8,-3.8,1,0.3],[-16.3,-6.1,.9,-.5],[-20,-1.8,1.05,.6],[10.2,-4.5,.92,-.3],
 [3.65,1.6,.78,Math.PI/2],
] as const;

export function isFrontLawn(x:number,z:number){
 return Math.abs(x)<5.25&&z> -1.05&&z<4.85;
}
