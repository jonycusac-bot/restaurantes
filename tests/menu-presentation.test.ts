import assert from "node:assert/strict";
import test from "node:test";
import { groupMenuDishes } from "../src/lib/menu-presentation";

const variants=[
  {id:"pad-verduras",name:"Pad Thai Original · Verduras",description:"Tallarines anchos de arroz.",price:12,familyId:"pad",familyName:"Pad Thai Original",variantLabel:"Verduras"},
  {id:"pad-pollo",name:"Pad Thai Original · Pollo",description:"Tallarines anchos de arroz.",price:13.2,familyId:"pad",familyName:"Pad Thai Original",variantLabel:"Pollo",imageSrc:"/inch/fideos.webp"},
];
test("una ficha visual agrupa las variantes y mantiene el orden y los precios",()=>{
 const cards=groupMenuDishes(variants);
 assert.equal(cards.length,1);
 assert.equal(cards[0].name,"Pad Thai Original");
 assert.deepEqual(cards[0].items.map(d=>[d.label,d.price]),[["Verduras",12],["Pollo",13.2]]);
 assert.equal(cards[0].description,"Tallarines anchos de arroz.");
 assert.equal(cards[0].imageSrc,"/inch/fideos.webp");
 assert.equal(cards[0].imageVariant,"Pollo");
});
