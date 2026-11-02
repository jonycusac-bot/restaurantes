import type { AdminDish } from "./inch-draft";
import { canonicalEqual } from "./live-menu";

export type PriceMatch = {id:string;category:string;oldName:string;old:number;newLabel:string;new:number;sourceLine:number};
export type PriceComparison = {matched:PriceMatch[];oldOnly:string[];newOnly:string[]};
const oldOnly = ["Gyozas Okonomiyaki · Gambas", "Gyozas Pato", "Suplemento por arroz frito"];
const newOnly = ["Poke Bowl Vegano [Shiitake y Tofu]", "Poke Bowl de Salmón", "Poke Bowl de Atún", "Acompañamiento: Arroz al Vapor"];
const cartaCategories = new Set(["entrantes","ensaladas","sopas","salteados","curry","arroces","noodles","infantil"]);

export function correctedCartaDishes(draft:AdminDish[], published:AdminDish[], source:string, comparison:PriceComparison):AdminDish[] {
 if (!canonicalEqual(draft,published)) throw new Error("Borrador y publicación divergentes: detener la corrección.");
 if (draft.length!==130 || published.length!==130 || new Set(published.map(d=>d.id)).size!==130) throw new Error("Inventario de fichas inesperado.");
 if (comparison.matched.length!==68 || new Set(comparison.matched.map(m=>m.id)).size!==68 || new Set(comparison.matched.map(m=>m.sourceLine)).size!==68 || !canonicalEqual(comparison.oldOnly,oldOnly) || !canonicalEqual(comparison.newOnly,newOnly)) throw new Error("Correspondencias de precios incompletas.");
 const lines=source.split(/\r?\n/);
 const prices=lines.flatMap((line,index)=>{const m=line.match(/^(.+?): (\+ )?(\d+,\d{2}) €$/);return m?[{line:index+1,label:m[1],price:Number(m[3].replace(",","."))}]:[];});
 if(prices.length!==72 || !canonicalEqual(prices.filter(p=>!comparison.matched.some(m=>m.sourceLine===p.line)).map(p=>p.label),newOnly)) throw new Error("La lista literal cambió o contiene importes sin identificar.");
 const existing=new Map(published.map(d=>[d.id,d]));
 for(const old of oldOnly) if(!published.some(d=>cartaCategories.has(d.categoryId)&&d.name===old&&!d.hidden)) throw new Error(`Ficha anterior ausente u oculta: ${old}`);
 const corrections=new Map<string,AdminDish>();
 for(const match of comparison.matched){
  const row=prices.find(p=>p.line===match.sourceLine);
  const previous=existing.get(match.id);
  if(!previous || previous.categoryId!==match.category || !cartaCategories.has(match.category) || previous.name!==match.oldName || previous.price!==match.old) throw new Error(`Identidad, nombre o precio anterior inesperado: ${match.id}`);
  if(!row || row.label!==match.newLabel || row.price!==match.new) throw new Error(`Fuente literal distinta en línea ${match.sourceLine}`);
  const name=row.label.replace(/ \[[^\]]+\]/g,"").replace(/ \(\d+ uds\)$/ ,"");
  const description=row.label.match(/\[([^\]]+)\]/)?.[1] ?? (match.id==="carta-menu-infantil" ? row.label.match(/\(([^)]+)\)$/)?.[1] : undefined) ?? previous.description;
  corrections.set(match.id,{...previous,name,description,price:row.price});
 }
 return published.map(d=>corrections.get(d.id)??{...d});
}
