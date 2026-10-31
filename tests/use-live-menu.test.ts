import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";
import { build } from "esbuild";
import { runInNewContext } from "node:vm";
import { initialDraft } from "../src/lib/inch-draft";
import type { useLiveMenu } from "../src/app/admin/preview/useLiveMenu";


const base = initialDraft[0];
const snapshot = { dishes: initialDraft, revision: 1, publishedRevision: 1, updatedAt: "2026-10-30", live: true, imageStorage: true };
async function harness() {
  assert.ok(existsSync("src/app/admin/preview/useLiveMenu.ts"), "Debe existir la conexión directa con la carta central");
  const slots: unknown[]=[];let cursor=0;let effect: (()=>unknown)|undefined;
  const listeners=new Map<string,()=>unknown>();
  let fetcher:(url:string,init?:RequestInit)=>Promise<Response>=async()=>Response.json(snapshot);
  const compiled=await build({entryPoints:["src/app/admin/preview/useLiveMenu.ts"],bundle:true,write:false,format:"cjs",platform:"node",plugins:[{name:"hook-unit",setup(builder){builder.onResolve({filter:/^react$/},()=>({path:"react",namespace:"unit"}));builder.onLoad({filter:/.*/,namespace:"unit"},()=>({contents:"export const {useState,useRef,useCallback,useEffect}=globalThis.__hooks;"}));}}]});
  const context={module:{exports:{}},exports:{},AbortController,Uint8Array,atob,Response,Event,console,
    fetch:(url:string,init?:RequestInit)=>fetcher(url,init),
    window:{setInterval:()=>1,clearInterval:()=>{},addEventListener:(name:string,fn:()=>unknown)=>listeners.set(name,fn),removeEventListener:()=>{},localStorage:{getItem:()=>{throw Error("No leer borradores antiguos");},setItem:()=>{throw Error("No sustituir copias locales");}}},
    document:{visibilityState:"visible",addEventListener:(name:string,fn:()=>unknown)=>listeners.set(name,fn),removeEventListener:()=>{}},
    __hooks:{useState(initial:unknown){const index=cursor++;if(!(index in slots))slots[index]=initial;return[slots[index],(next:unknown)=>{slots[index]=typeof next==="function"?next(slots[index]):next;}];},useRef(initial:unknown){const index=cursor++;if(!(index in slots))slots[index]={current:initial};return slots[index];},useCallback(fn:unknown){return fn;},useEffect(fn:()=>unknown){effect??=fn;}}
  };
  runInNewContext(compiled.outputFiles[0].text,context);
  const hook=(context.module.exports as {useLiveMenu:typeof useLiveMenu}).useLiveMenu;
  const render=()=>{cursor=0;return hook();};render();effect!();await new Promise(resolve=>setImmediate(resolve));
  return{render,listeners,setFetch:(fn:typeof fetcher)=>{fetcher=fn;}};
}
test("Guardar envía solo el precio modificado y reconoce la publicación del servidor",async()=>{
  const h=await harness();let payload:unknown;
  h.setFetch(async(_url,init)=>{payload=JSON.parse(String(init?.body));return Response.json({...snapshot,dishes:[{...base,price:15}],revision:2,publishedRevision:2});});
  assert.equal(await h.render().save(base,{...base,price:15}),true);
  assert.equal(JSON.stringify(payload),JSON.stringify({kind:"update",id:base.id,changes:{price:{before:base.price,value:15}}}));
  assert.equal(h.render().menu?.revision,2);
  assert.match(h.render().message,/Ya se ve en la carta/);
});

test("resolver solo el precio conserva el cambio independiente de descripción",async()=>{
  const h=await harness();const payloads:Record<string,unknown>[]=[];
  h.setFetch(async(_url,init)=>{
    const payload=JSON.parse(String(init?.body));payloads.push(payload);
    return payloads.length===1?Response.json({error:"El precio cambió",conflicts:[{field:"price",label:"Precio",before:base.price,value:15,current:13.13}],current:{...snapshot,dishes:[{...base,price:13.13}],revision:2,publishedRevision:2}},{status:409}):Response.json({...snapshot,dishes:[{...base,price:15,description:"Mi descripción"}],revision:3,publishedRevision:3});
  });
  assert.equal(await h.render().save(base,{...base,price:15,description:"Mi descripción"}),false);
  assert.equal(h.render().conflicts.length,1);
  assert.equal(await h.render().resolve("price","mine"),true);
  const changes=payloads[1].changes as Record<string,{before:unknown;value:unknown}>;
  assert.equal(changes.price.before,13.13);assert.equal(changes.price.value,15);
  assert.equal(changes.description.value,"Mi descripción");
  assert.equal(Object.keys(changes).length,2);
});

test("elegir precio remoto no elimina los demás cambios pendientes",async()=>{
  const h=await harness();let count=0;let final:Record<string,unknown>|undefined;
  h.setFetch(async(_url,init)=>{count++;const payload=JSON.parse(String(init?.body));
    if(count===1)return Response.json({error:"Precio",conflicts:[{field:"price",label:"Precio",before:base.price,value:15,current:13.13}],current:{...snapshot,dishes:[{...base,price:13.13}],revision:2,publishedRevision:2}},{status:409});
    final=payload.changes;return Response.json({...snapshot,dishes:[{...base,price:13.13,description:"Mi descripción"}],revision:3,publishedRevision:3});
  });
  await h.render().save(base,{...base,price:15,description:"Mi descripción"});
  assert.equal(await h.render().resolve("price","remote"),true);
  assert.equal(JSON.stringify(Object.keys(final!)),JSON.stringify(["description"]));
});

test("un GET anterior no hace retroceder el menú después de guardar",async()=>{
  const h=await harness();let finish!:(r:Response)=>void;
  h.setFetch(async(_url,init)=>init?.method==="PATCH"?Response.json({...snapshot,dishes:[{...base,price:15}],revision:2,publishedRevision:2}):new Promise(resolve=>{finish=resolve;}));
  const refreshing=h.render().refresh();
  await h.render().save(base,{...base,price:15});
  finish(Response.json(snapshot));await refreshing;
  assert.equal(h.render().menu?.revision,2);
});

test("dos pulsaciones rápidas no duplican el guardado",async()=>{
  const h=await harness();let patches=0;let finish!:(r:Response)=>void;
  h.setFetch(async()=>{patches++;return new Promise(resolve=>{finish=resolve;});});
  const first=h.render().save(base,{...base,price:15});
  assert.equal(await h.render().save(base,{...base,price:15}),false);
  finish(Response.json({...snapshot,revision:2,publishedRevision:2}));await first;
  assert.equal(patches,1);
});

test("errores de red conservan el formulario y no proclaman publicación",async()=>{
  const h=await harness();h.setFetch(async()=>{throw Error("Sin red");});
  assert.equal(await h.render().save(base,{...base,price:15}),false);
  assert.ok(h.render().error);assert.equal(h.render().busy,false);
  assert.equal(h.render().menu?.revision,1);
});
