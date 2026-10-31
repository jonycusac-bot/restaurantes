import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import InchMenu from "../src/app/inch/InchMenu";
import type { AdminDish } from "../src/lib/inch-draft";

const dishes:AdminDish[]=[
 {id:"entrantes-3",categoryId:"entrantes",name:"Gyozas · Verduras",description:"Empanadillas",price:9.6,hidden:false,imageSrc:"",imageName:"Sin imagen"},
 {id:"entrantes-2",categoryId:"entrantes",name:"Gyozas · Pollo",description:"Empanadillas",price:10,hidden:false,imageSrc:"",imageName:"Sin imagen"},
 {id:"carta-gyozas-gambas",categoryId:"entrantes",name:"Gyozas · Gambas",description:"Empanadillas",price:10.3,hidden:false,imageSrc:"",imageName:"Sin imagen"},
];
function render(input=dishes){return renderToStaticMarkup(createElement<{publishedDishes?:AdminDish[];publicOnly?:boolean}>(InchMenu,{publishedDishes:input,publicOnly:true}));}
test("las gyozas tienen una sola ficha, descripción común y precio por variante",()=>{
 const html=render();
 assert.equal([...html.matchAll(/<h3>Gyozas<\/h3>/g)].length,1);
 assert.match(html,/class="inch-variants"/);
 assert.match(html,/9,60/);assert.match(html,/10,00/);assert.match(html,/10,30/);
 assert.equal([...html.matchAll(/<p>Empanadillas<\/p>/g)].length,1);
 assert.match(html,/6 unidades/);
 assert.deepEqual([...html.matchAll(/data-dish-id="([^"]+)"/g)].map(m=>m[1]),dishes.map(d=>d.id));
});
