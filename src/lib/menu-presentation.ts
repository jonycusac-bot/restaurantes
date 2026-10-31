export type PresentableDish = {id?:string;name:string;description:string;price:number;note?:string;image?:string;imageSrc?:string;imageAlt?:string;familyId?:string;familyName?:string;variantLabel?:string;role?:"supplement";pricePrefix?:"+"};
export type MenuCard = {id:string;familyId?:string;name:string;description:string;note?:string;role?:"supplement";pricePrefix?:"+";grouped:boolean;items:(PresentableDish&{label:string})[];image?:string;imageSrc?:string;imageAlt?:string;imageVariant?:string};
export function groupMenuDishes(dishes:PresentableDish[]):MenuCard[] {
 const cards:MenuCard[]=[];
 for(const [index,dish] of dishes.entries()) {
  const grouped=!!dish.familyId && dish.variantLabel!==undefined;
  const expectedName=`${dish.familyName} · ${dish.variantLabel}`;
  const label=grouped && dish.name===expectedName ? dish.variantLabel! : dish.name;
  const previous=cards.at(-1);
  const card=grouped && previous?.grouped && previous.familyId===dish.familyId ? previous : undefined;
  if(card) card.items.push({...dish,label});
  else cards.push({id:dish.id??String(index),familyId:dish.familyId,name:grouped?dish.familyName??dish.name:dish.name,description:dish.description,note:dish.note,role:dish.role,pricePrefix:dish.pricePrefix,grouped,items:[{...dish,label}]});
 }
 return cards.map(card=>{
  const image=card.items.find(d=>d.imageSrc||d.image);
  return {...card,description:card.items.every(d=>d.description===card.items[0].description)?card.items[0].description:"",image:image?.image,imageSrc:image?.imageSrc,imageAlt:image?.imageAlt,imageVariant:card.grouped?image?.label:undefined};
 });
}
