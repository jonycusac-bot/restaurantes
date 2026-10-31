import type { Category } from "../app/inch/menu";
import type { CartaCategory } from "./carta-original";

export function buildCartaCategories(definitions:CartaCategory[]):Category[] {
 return definitions.map(category=>({
  id:category.id,name:category.name,note:category.note,
  dishes:category.items.flatMap(item=>{
   const common={description:item.description,note:item.note,role:item.role,pricePrefix:item.pricePrefix};
   if(item.variants?.length) return item.variants.map(variant=>({
    ...common,id:variant.legacyId??variant.id,name:`${item.name} · ${variant.label}`,price:variant.price,
    familyId:item.id,familyName:item.name,variantLabel:variant.label,
    image:variant.image,imageAlt:variant.imageAlt,
   }));
   if(typeof item.price!=="number") throw new Error(`Precio ausente: ${item.id}`);
   return [{...common,id:item.legacyId??item.id,name:item.name,price:item.price,image:item.image,imageAlt:item.imageAlt}];
  }),
 }));
}
