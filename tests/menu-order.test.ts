import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import InchMenu from "../src/app/inch/InchMenu";
import { initialDraft, type AdminDish } from "../src/lib/inch-draft";
import worker from "../src/cloudflare/worker";
import type { Env, Statement } from "../src/cloudflare/types";

function displayed(dishes:AdminDish[]) {
  const html=renderToStaticMarkup(createElement<{publishedDishes?:AdminDish[];publicOnly?:boolean}>(InchMenu,{publishedDishes:dishes,publicOnly:true}));
  return [...html.matchAll(/data-dish-id="([^"]+)"/g)].map(match=>match[1]);
}
test("la carta de clientes conserva el orden del panel, sin adelantar platos con foto",()=>{
  const expected=initialDraft.filter(dish=>dish.categoryId==="entrantes"&&!dish.hidden).map(dish=>dish.id);
  assert.equal(initialDraft.find(dish=>dish.id===expected[0])?.name,"Poh Pia");
  assert.deepEqual(displayed(initialDraft),expected);
});

test("cambiar precio o añadir una foto no modifica posiciones",()=>{
  const changed=initialDraft.map((dish,index)=>index===0?{...dish,price:15,imageSrc:"/inch/fideos.webp"}:dish);
  const expected=changed.filter(d=>d.categoryId==="entrantes"&&!d.hidden).map(d=>d.id);
  assert.deepEqual(displayed(changed),expected);
});

test("ocultar un plato conserva el orden relativo de los demás",()=>{
  const changed=initialDraft.map((dish,index)=>index===1?{...dish,hidden:true}:dish);
  assert.deepEqual(displayed(changed),changed.filter(d=>d.categoryId==="entrantes"&&!d.hidden).map(d=>d.id));
});

test("una publicación anterior usa el orden corregido sin publicar el borrador ni cambiar sus datos",async()=>{
  const published=initialDraft.map((dish,index)=>index===0?{...dish,price:37.5}:dish);
  const html=`<!doctype html><html><body><h3>Tempura</h3><script id="inch-menu-data" type="application/json">${JSON.stringify(published)}</script></body></html>`;
  const queries:string[]=[];
  const env:Env={ASSETS:{fetch:async()=>new Response("unused")},DB:{batch:async()=>{throw Error("No escribir");},prepare(sql){queries.push(sql);const statement:Statement={bind:()=>statement,first:async<T>()=>{assert.match(sql,/^SELECT html FROM inch_publication/);return{html} as T;},run:async()=>{throw Error("No escribir");}};return statement;}}};
  const response=await worker.fetch(new Request("https://qa.test/"),env);
  assert.equal(response.status,200);
  const result=await response.text();
  const names=[...result.matchAll(/data-dish-id="([^"]+)"/g)].map(match=>match[1]);
  assert.deepEqual(names,published.filter(d=>d.categoryId==="entrantes"&&!d.hidden).map(d=>d.id));
  assert.match(result,/37,50/);
  const embedded=JSON.parse(result.match(/<script id="inch-menu-data" type="application\/json">([\s\S]*?)<\/script>/)![1]);
  assert.deepEqual(embedded,published);
  assert.equal(queries.length,1);
});
