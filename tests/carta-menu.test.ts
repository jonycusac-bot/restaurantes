import assert from "node:assert/strict";
import test from "node:test";
import { buildCartaCategories } from "../src/lib/carta-menu";

test("el catálogo produce opciones editables con IDs antiguos estables y metadatos comunes",()=>{
 const categories=buildCartaCategories([{id:"entrantes",name:"Entrantes",items:[{id:"carta-gyozas",name:"Gyozas",description:"Empanadillas",note:"6 unidades",variants:[{id:"carta-gyozas-verduras",label:"Verduras",price:9.6,sourceLine:9,legacyId:"entrantes-3"},{id:"carta-gyozas-pollo",label:"Pollo",price:10,sourceLine:10,legacyId:"entrantes-2"}]}]}]);
 assert.equal(categories.length,1);
 assert.deepEqual(categories[0].dishes.map(d=>[d.id,d.name,d.price]),[["entrantes-3","Gyozas · Verduras",9.6],["entrantes-2","Gyozas · Pollo",10]]);
 assert.equal(categories[0].dishes[0].familyId,"carta-gyozas");
 assert.equal(categories[0].dishes[0].familyName,"Gyozas");
 assert.equal(categories[0].dishes[0].variantLabel,"Verduras");
 assert.equal(categories[0].dishes[0].note,"6 unidades");
});
