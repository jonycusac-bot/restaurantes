import { initialDraft, type AdminDish } from "./inch-draft";
import { menuSections } from "../app/inch/menu";

// Only the isolated local preview imports this helper. Never an automatic D1 migration.
export function prepareLocalCartaPreview(previous:AdminDish[],catalog:AdminDish[]=initialDraft):AdminDish[] {
 const cartaCategories=new Set(menuSections.find(section=>section.id==="carta")!.categoryIds);
 const existing=new Map(previous.map(dish=>[dish.id,dish]));
 const catalogIds=new Set(catalog.map(dish=>dish.id));
 const updated=catalog.map(dish=>{
  const old=existing.get(dish.id);
  if(!old) return {...dish};
  if(!cartaCategories.has(dish.categoryId)) return {...old};
  return {...dish,hidden:old.hidden,imageSrc:old.imageSrc,imageName:old.imageName};
 });
 return [...updated,...previous.filter(dish=>!catalogIds.has(dish.id)).map(dish=>({...dish}))];
}
