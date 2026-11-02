import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { correctedCartaDishes } from "../src/lib/carta-price-correction";
import { categories, menuSections } from "../src/app/inch/menu";
import { dishTranslations } from "../src/app/inch/translations";
import { groupMenuDishes } from "../src/lib/menu-presentation";
import { cartaActualizada } from "../src/lib/carta-actualizada";
import { cartaOriginal } from "../src/lib/carta-original";
import { buildCartaCategories } from "../src/lib/carta-menu";
import { initialDraft, type AdminDish } from "../src/lib/inch-draft";

const source = readFileSync("design/inch/carta-precios-actualizados-2026-11-01.txt", "utf8");
const mapping = JSON.parse(readFileSync("design/inch/carta-price-mapping-2026-11-01.json", "utf8")) as {matched:{id:string;category:string;oldName:string;old:number;newLabel:string;new:number;sourceLine:number}[];oldOnly:string[];newOnly:string[]};
const sushi = new Set(menuSections.find(s=>s.id==="sushi")!.categoryIds);
const oldCarta:AdminDish[] = buildCartaCategories(cartaOriginal).flatMap(category => category.dishes.map(dish => ({
  id:dish.id!, categoryId:category.id, name:dish.name, description:dish.description, price:dish.id==="entrantes-0"?7.5:dish.id==="carta-pollo-sesamo"?13.13:dish.price,
  hidden:false, imageSrc:dish.id==="entrantes-0"?"/inch/fideos.webp":"", imageName:dish.id==="entrantes-0"?"fideos.webp":"Sin imagen",
})));
const oldSushi = initialDraft.filter(dish=>sushi.has(dish.categoryId));
const archivedSushi:AdminDish[] = ["Inch Roll", "Tartar Shushi", "Poke Bowls"].map((name,index)=>({id:`old-sushi-${index}`,categoryId:"uramaki",name,description:"",price:10,hidden:true,imageSrc:"",imageName:"Sin imagen"}));
const published:AdminDish[] = [...oldCarta,...oldSushi,...archivedSushi];
const snapshot = {draft: published};

function parsePrices() {
 const rows = source.split(/\r?\n/);
 return rows.flatMap((line,index)=>{const m=line.match(/^(.+?): (\+ )?(\d+,\d{2}) €$/);return m?[{line:index+1,label:m[1],price:Number(m[3].replace(",",".")),supplement:!!m[2]}]:[];});
}

test("fuente literal: 72 importes, 68 correspondencias únicas con categoría, línea e importe exactos",()=>{
 const prices=parsePrices();
 assert.equal(prices.length,72);assert.equal(mapping.matched.length,68);
 assert.equal(new Set(mapping.matched.map(m=>m.id)).size,68);
 assert.equal(new Set(mapping.matched.map(m=>m.sourceLine)).size,68);
 assert.deepEqual(mapping.newOnly,["Poke Bowl Vegano [Shiitake y Tofu]","Poke Bowl de Salmón","Poke Bowl de Atún","Acompañamiento: Arroz al Vapor"]);
 const next=correctedCartaDishes(snapshot.draft,published,source,mapping);
 assert.equal(next.length,130);
 for(const match of mapping.matched){
  const literal=prices.find(row=>row.line===match.sourceLine)!;
  assert.ok(literal,`Falta línea ${match.sourceLine}`);
  assert.equal(literal.label,match.newLabel,`Etiqueta línea ${match.sourceLine}`);
  assert.equal(literal.price,match.new,`Precio línea ${match.sourceLine}`);
  const dish=next.find(d=>d.id===match.id)!;
  assert.ok(dish,match.id);assert.equal(dish.categoryId,match.category,match.id);
  assert.equal(dish.price,literal.price,match.id);
  assert.equal(dish.name,match.newLabel.replace(/ \[[^\]]+\]/g,"").replace(/ \(\d+ uds\)$/,""),match.id);
  assert.equal(dish.hidden,published.find(d=>d.id===match.id)!.hidden);
  const template=categories.find(c=>c.id===dish.categoryId)?.dishes.find(d=>d.id===dish.id);
  assert.ok(template,`Plantilla ${dish.id}`);
  assert.equal(template.price,literal.price,`Precio plantilla ${dish.id}`);
  assert.equal(template.name,dish.name,`Nombre plantilla ${dish.id}`);
  assert.equal(template.description,dish.description,`Texto plantilla ${dish.id}`);
  assert.equal(literal.supplement,match.category==="salteados"&&match.id.startsWith("carta-salteados-arroz-"),`Suplemento línea ${match.sourceLine}`);
  assert.equal(template.role==="supplement",literal.supplement,`Rol suplemento ${match.id}`);
  const definitions=cartaActualizada.find(c=>c.id===match.category)!.items.flatMap(item=>item.variants?.map(v=>({id:v.legacyId??v.id,sourceLine:v.sourceLine}))??[{id:item.legacyId??item.id,sourceLine:item.sourceLine}]);
  assert.equal(definitions.find(item=>item.id===match.id)?.sourceLine,match.sourceLine,`Origen plantilla ${match.id}`);
 }
 assert.deepEqual(prices.filter(row=>!mapping.matched.some(m=>m.sourceLine===row.line)).map(row=>row.label),mapping.newOnly);
});

test("Sushi, Poke, tres antiguas, orden, fotos e IDs se preservan exactamente",()=>{
 const next=correctedCartaDishes(snapshot.draft,published,source,mapping);
 assert.deepEqual(next.map(d=>d.id),published.map(d=>d.id));
 assert.deepEqual(next.filter(d=>sushi.has(d.categoryId)),published.filter(d=>sushi.has(d.categoryId)));
 const matched=new Set(mapping.matched.map(m=>m.id));
 assert.deepEqual(next.filter(d=>!matched.has(d.id)),published.filter(d=>!matched.has(d.id)));
 assert.deepEqual(next.map(d=>[d.id,d.imageSrc,d.imageName,d.hidden,d.categoryId]),published.map(d=>[d.id,d.imageSrc,d.imageName,d.hidden,d.categoryId]));
 for(const name of mapping.oldOnly) assert.equal(next.find(d=>d.name===name)?.hidden,false,name);
 assert.equal(next.find(d=>d.id==="carta-curry-arroz-frito")!.price,published.find(d=>d.id==="carta-curry-arroz-frito")!.price);
});

test("textos explícitos prevalecen sobre ingredientes antiguos contradictorios; ninguna receta nueva inferida",()=>{
 const next=correctedCartaDishes(snapshot.draft,published,source,mapping);
 const get=(id:string)=>next.find(d=>d.id===id)!;
 assert.equal(get("carta-yam-woonsen").description,"Fideos de Arroz y Gambas");
 assert.equal(get("sopas-3").description,"Tallarines de Arroz, Pollo, Gambas, Tofu y Huevo en Sopa de Coco");
 assert.equal(get("curry-3").description,"Pollo Crujiente con Curry Japonés");
 assert.equal(get("carta-pollo-sesamo").description,"Pollo Frito con Sésamo");
 assert.equal(get("carta-sopa-miso").description,"");
 assert.equal(get("carta-menu-infantil").description,"Noodles o Arroz con Pollo / Ternera / Langostinos");
});

test("una identidad o un borrador divergente bloquea la corrección antes de generar SQL",()=>{
 const wrong=published.map(d=>d.id===mapping.matched[0].id?{...d,name:"Plato cambiado por el dueño"}:d);
 assert.throws(()=>correctedCartaDishes(wrong,wrong,source,mapping),/identidad|nombre/i);
 const changed=snapshot.draft.map(d=>d.id===mapping.matched[0].id?{...d,price:99}:d);
 assert.throws(()=>correctedCartaDishes(changed,published,source,mapping),/borrador|publicaci[oó]n|divergente/i);
 const changedBoth=published.map(d=>d.id===mapping.matched[0].id?{...d,price:99}:d);
 assert.throws(()=>correctedCartaDishes(changedBoth,changedBoth,source,mapping),/precio anterior/i);
});

test("nombres nuevos traducidos sin ingredientes contradictorios; agrupación y Curry sin prometer arroz",()=>{
 const next=correctedCartaDishes(snapshot.draft,published,source,mapping);
 for(const match of mapping.matched){
  const name=next.find(d=>d.id===match.id)!.name;
  assert.ok(dishTranslations[name]?.en[0],`English ${name}`);
  assert.ok(dishTranslations[name]?.de[0],`Deutsch ${name}`);
 }
 assert.match(dishTranslations["Ensalada Yam Woonsen"].en[1],/rice noodles/i);
 assert.doesNotMatch(dishTranslations["Ensalada Yam Woonsen"].en[1],/pea noodles/i);
 assert.doesNotMatch(dishTranslations["Laksa Lemak"].en[1],/fish tofu/i);
 assert.match(dishTranslations["Katsu Kare"].de[1],/japanisch/i);
 assert.equal(categories.find(c=>c.id==="curry")!.note,undefined);
 const gyozas=groupMenuDishes(categories.find(c=>c.id==="entrantes")!.dishes);
 assert.equal(gyozas.find(c=>c.familyId==="carta-gyozas-okonomiyaki")?.items.length,2);
 assert.equal(gyozas.find(c=>c.familyId==="carta-gyozas-okonomiyaki")?.items[1].name,"Gyozas Okonomiyaki · Gambas");
 assert.equal(groupMenuDishes(categories.find(c=>c.id==="sopas")!.dishes).find(c=>c.familyId==="carta-tom-yum")?.name,"Sopa Tom Yum");
 assert.equal(groupMenuDishes(categories.find(c=>c.id==="salteados")!.dishes).find(c=>c.familyId==="carta-salteados-acompanamientos")?.name,"Guarnición");
 assert.equal(groupMenuDishes(categories.find(c=>c.id==="curry")!.dishes).find(c=>c.familyId==="carta-massaman")?.name,"Curry Mussa Man");
});
