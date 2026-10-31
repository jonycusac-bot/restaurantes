import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {cartaOriginal} from "../src/lib/carta-original";

test("CARTA respeta las ocho categorías originales y su orden",()=>{
 assert.deepEqual(cartaOriginal.map(c=>c.id),["entrantes","ensaladas","sopas","salteados","curry","arroces","noodles","infantil"]);
});

test("cada importe de la fuente aparece exactamente una vez con categoría, precio y suplemento correctos",()=>{
 const block=readFileSync(new URL("../design/inch/carta-original-precios-2026-10-31.md",import.meta.url),"utf8").split("```text\n")[1].split("\n```")[0];
 const headers:Record<string,string>={ENTRANTES:"entrantes",ENSALADAS:"ensaladas",SOPA:"sopas",SALTEADOS:"salteados",CURRY:"curry",ARROCES:"arroces",TALLARINES:"noodles"};
 let categoryId="";
 const expected=block.split("\n").flatMap((line,index)=>{
  if(headers[line]) categoryId=headers[line];
  if(line.startsWith("MENÚ INFANTIL")) categoryId="infantil";
  const match=line.match(/— (\+ )?(\d+,\d{2}) €$/);
  return match?[{categoryId,sourceLine:index+1,price:Number(match[2].replace(",",".")),supplement:!!match[1]}]:[];
 });
 const actual=cartaOriginal.flatMap(category=>category.items.flatMap(item=>(item.variants??[item]).map(leaf=>({categoryId:category.id,sourceLine:leaf.sourceLine,price:leaf.price,supplement:item.role==="supplement"}))));
 assert.deepEqual(actual,expected);
 const ids=cartaOriginal.flatMap(category=>category.items.flatMap(item=>[item.id,...(item.variants??[]).map(v=>v.id)]));
 assert.equal(new Set(ids).size,ids.length);
 assert.ok(ids.every(id=>id.startsWith("carta-")));
});
