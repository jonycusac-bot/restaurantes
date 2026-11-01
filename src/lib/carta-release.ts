import {initialDraft,type AdminDish} from "./inch-draft";
import {menuSections} from "../app/inch/menu";
import {canonicalEqual} from "./live-menu";
import {parseCloudDishes} from "./cloud-draft";
export type CartaReleaseBaseline={draft:{dishes:string;revision:number};publication:{html:string;revision:number;source_revision:number}};
export function cartaReleaseStatements(before:CartaReleaseBaseline,dishes:AdminDish[],html:string):string[]{
 if(![before.draft.revision,before.publication.revision,before.publication.source_revision].every(value=>Number.isSafeInteger(value)&&value>=1))throw new Error("Revisión inválida.");
 if(!parseCloudDishes(dishes)||new TextEncoder().encode(html).byteLength>1_800_000)throw new Error("Publicación inválida.");
 const quote=(value:string)=>`'${value.replace(/'/g,"''")}'`;
 const revision=before.draft.revision+1;
 const publicationRevision=before.publication.revision+1;
 const trigger=`inch_release_carta_${revision}`;
 const payload=JSON.stringify(dishes);
 const publicationGuard=`id='inch' AND revision=${before.publication.revision} AND source_revision=${before.publication.source_revision} AND html=${quote(before.publication.html)}`;
 const stamp="strftime('%Y-%m-%dT%H:%M:%fZ','now')";
 // A narrowly matched, temporary trigger makes the one guarded catalogue UPDATE
 // publish its HTML in the same SQLite statement/transaction. Never drop images.
 // OLD.dishes is checked by the guarded UPDATE below; repeating it in the
 // trigger would exceed D1's SQL statement length for the expanded catalogue.
 return [
  `CREATE TRIGGER ${trigger} AFTER UPDATE OF dishes ON inch_draft WHEN NEW.id='inch' AND OLD.revision=${before.draft.revision} AND NEW.revision=${revision} AND NEW.dishes=${quote(payload)} BEGIN UPDATE inch_publication SET html=${quote(html)},revision=${publicationRevision},source_revision=${revision},updated_at=${stamp} WHERE ${publicationGuard}; SELECT CASE WHEN changes()!=1 THEN RAISE(ABORT,'La publicación cambió después del respaldo') END; END`,
  `UPDATE inch_draft SET dishes=${quote(payload)},revision=${revision},updated_at=${stamp} WHERE id='inch' AND revision=${before.draft.revision} AND dishes=${quote(before.draft.dishes)} AND EXISTS(SELECT 1 FROM inch_publication WHERE ${publicationGuard})`,
  `DROP TRIGGER ${trigger}`,
 ];
}
export function approvedCartaDishes(draft:AdminDish[],published:AdminDish[]):AdminDish[]{
 if(!parseCloudDishes(draft)||!parseCloudDishes(published))throw new Error("El respaldo del catálogo no es válido.");
 const carta=new Set(menuSections.find(section=>section.id==="carta")!.categoryIds);
 const sushi=(dishes:AdminDish[])=>dishes.filter(dish=>!carta.has(dish.categoryId));
 if(!canonicalEqual(sushi(draft),sushi(published)))throw new Error("Hay cambios de Sushi sin publicar: necesitan una decisión explícita.");
 const known=new Set(initialDraft.map(dish=>dish.id));
 if([...draft,...published].some(dish=>carta.has(dish.categoryId)&&!known.has(dish.id)))throw new Error("Hay platos adicionales de CARTA: no se eliminan automáticamente.");
 const currentDraft=new Map(draft.map(dish=>[dish.id,dish]));
 if(published.some(dish=>{
  const old=currentDraft.get(dish.id);
  return old&&(old.imageSrc!==dish.imageSrc||old.imageName!==dish.imageName);
 }))throw new Error("Hay fotos distintas entre borrador y publicación: revisar antes de sustituir.");
 const previous=new Map(published.map(dish=>[dish.id,dish]));
 const next=initialDraft.filter(dish=>carta.has(dish.categoryId)).map(dish=>{
  const old=previous.get(dish.id);
  return old?{...dish,hidden:old.hidden,imageSrc:old.imageSrc,imageName:old.imageName}:{...dish};
 });
 return [...next,...published.filter(dish=>!carta.has(dish.categoryId)).map(dish=>({...dish}))];
}
