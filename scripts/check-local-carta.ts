import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {initialDraft} from "../src/lib/inch-draft";
import {menuSections} from "../src/app/inch/menu";
import type {CloudDraft} from "../src/lib/cloud-draft";
const origin="http://127.0.0.1:8794";
async function main(){
 const response=await fetch(origin+"/");assert.equal(response.status,200);
 const html=await response.text();assert.match(html,/class="inch-page"/,"La raíz local debe ser la carta de clientes, no el editor");
 const admin=await fetch(origin+"/admin");assert.equal(admin.status,200);assert.match(await admin.text(),/QA central aislada/);
 const state=await(await fetch(origin+"/api/admin/menu")).json() as CloudDraft;
 const cartaIds=new Set(menuSections.find(section=>section.id==="carta")!.categoryIds);
 const expected=initialDraft.filter(dish=>cartaIds.has(dish.categoryId));
 const actualById=new Map(state.dishes.map(dish=>[dish.id,dish]));
 for(const dish of expected){const actual=actualById.get(dish.id);assert.ok(actual,`Plato presente: ${dish.name}`);assert.equal(actual.price,dish.price,`Precio original: ${dish.name}`);assert.equal(actual.name,dish.name);assert.equal(actual.description,dish.description);}
 const embedded=JSON.parse(html.match(/<script id="inch-menu-data" type="application\/json">([\s\S]*?)<\/script>/)![1]);
 assert.deepEqual(embedded,state.dishes,"La carta pública y gestión comparten datos locales");
 const visibleIds=[...html.matchAll(/data-dish-id="([^"]+)"/g)].map(match=>match[1]);
 assert.deepEqual(visibleIds,state.dishes.filter(d=>d.categoryId==="entrantes"&&!d.hidden).map(d=>d.id));
 const backup=JSON.parse(await readFile(".cloudflare-build/live-menu-qa/before-carta-original.json","utf8")) as {menu:CloudDraft};
 const images=backup.menu.dishes.filter(d=>!!d.imageSrc);
 for(const old of images){const current=actualById.get(old.id);assert.ok(current,`Conservar plato con foto: ${old.name}`);assert.equal(current.imageSrc,old.imageSrc);assert.equal(current.imageName,old.imageName);const image=await fetch(origin+old.imageSrc);assert.equal(image.status,200);assert.match(image.headers.get("Content-Type")??"",/^image\//);}
 assert.deepEqual(state.dishes.filter(d=>!cartaIds.has(d.categoryId)),backup.menu.dishes.filter(d=>!cartaIds.has(d.categoryId)),"Sushi no se modifica");
 for(const asset of ["/app.js","/app.css","/carta.js","/carta.css","/inch/cabecera-inch.png"]){const file=await fetch(origin+asset);assert.equal(file.status,200,asset);}
 console.log(JSON.stringify({passed:true,categories:cartaIds.size,cartaPricesChecked:expected.length,photosPreserved:images.length,sushiPreserved:true,publicAndAdminSameData:true,rootIsCustomerMenu:true,remoteWrites:false}));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
