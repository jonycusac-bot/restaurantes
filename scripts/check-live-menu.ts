import assert from "node:assert/strict";
import { pbkdf2Sync, randomBytes, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { build } from "esbuild";
import { Miniflare } from "miniflare";
import { initialDraft } from "../src/lib/inch-draft";
import { publicHtml } from "../src/cloudflare/html";
import type { CloudDraft } from "../src/lib/cloud-draft";

async function main(){
  // Self-created runtime only: no target argument, Wrangler discovery, real
  // credentials, ordinary local D1 state, or remote writes.
  const worker=await build({entryPoints:["src/cloudflare/worker.ts"],bundle:true,write:false,platform:"browser",format:"esm",define:{"process.env.NODE_ENV":JSON.stringify("production")}});
  const salt=randomBytes(16);
  const hash=`pbkdf2$100000$${salt.toString("hex")}$${pbkdf2Sync("live-api-qa-only",salt,100000,32,"sha256").toString("hex")}`;
  const runtime=new Miniflare({host:"127.0.0.1",port:0,enableDevRegistry:false,telemetry:{enabled:false},workers:[{config:{name:"inch-live-api-qa",compatibilityDate:"2026-10-29",manifest:{mainModule:"worker.js",modules:{"worker.js":{type:"esm",contents:worker.outputFiles[0].text}}},env:{DB:{type:"d1",id:"inch-live-api-qa"},INCH_CF_PASSWORD_HASH:{type:"text",value:hash},INCH_CF_SESSION_SECRET:{type:"text",value:randomBytes(32).toString("hex")}}}}]});
  try{
    const base=(await runtime.ready).origin;
    const db=await runtime.getD1Database("DB");
    for(const sql of (await readFile("cloudflare/migrations/0001_menu.sql","utf8")).split(";").map(s=>s.trim()).filter(Boolean))await db.prepare(sql).run();
    await db.prepare("INSERT INTO inch_draft(id,dishes) VALUES('inch',?)").bind(JSON.stringify(initialDraft)).run();
    await db.prepare("INSERT INTO inch_publication(id,html) VALUES('inch',?)").bind(publicHtml(initialDraft)).run();
    let cookie="";
    const request=(path:string,method="GET",body?:unknown,origin=base)=>fetch(base+path,{method,headers:{Origin:origin,...(cookie?{Cookie:cookie}:{}),...(body===undefined?{}:{"Content-Type":"application/json"})},...(body===undefined?{}:{body:JSON.stringify(body)})});
    assert.equal((await request("/api/admin/menu")).status,401);
    const login=await request("/api/admin/login","POST",{password:"live-api-qa-only"});assert.equal(login.status,200);cookie=login.headers.get("set-cookie")!.split(";")[0];
    const get=async():Promise<CloudDraft>=>{const result=await request("/api/admin/menu");assert.equal(result.status,200,"GET de la carta central disponible");const data=await result.json();assert.equal(data.live,true);return data;};
    const patch=(id:string,changes:Record<string,{before:unknown;value:unknown}>)=>request("/api/admin/menu","PATCH",{kind:"update",id,changes});
    const initial=await get();
    const htmlBefore=await(await request("/")).text();
    assert.equal((await request("/api/admin/menu","PATCH",{kind:"update",id:initial.dishes[0].id,changes:{}},"https://otro.example")).status,403);
    assert.equal((await request("/api/admin/menu","PATCH",{kind:"update",id:initial.dishes[0].id,changes:{price:{before:1,value:-5}}})).status,422);
    assert.equal((await request("/api/admin/draft","PUT",{revision:initial.revision,dishes:initial.dishes})).status,426);
    assert.equal((await request("/api/admin/publish","POST",{revision:initial.revision})).status,426);
    assert.equal(await(await request("/")).text(),htmlBefore,"GET e intentos inválidos no publican nada");
    const first=initial.dishes[0],second=initial.dishes[1];
    const independent=await Promise.all([patch(first.id,{price:{before:first.price,value:15}}),patch(second.id,{price:{before:second.price,value:17}})]);
    assert.deepEqual(independent.map(result=>result.status),[200,200],"Dos dispositivos guardan platos distintos sin conflicto global");
    let current=await get();
    assert.equal(current.dishes.find(d=>d.id===first.id)!.price,15);assert.equal(current.dishes.find(d=>d.id===second.id)!.price,17);
    assert.equal(current.publishedRevision,current.revision);
    const publicData=async()=>JSON.parse((await(await request("/")).text()).match(/<script id="inch-menu-data" type="application\/json">([\s\S]*?)<\/script>/)![1]);
    assert.equal((await publicData()).find((d:{id:string})=>d.id===first.id).price,15,"Guardar cambió la carta pública sin una segunda llamada");
    const fields=await Promise.all([patch(first.id,{description:{before:first.description,value:"Cambio independiente del PC"}}),patch(first.id,{price:{before:15,value:16}})]);
    assert.deepEqual(fields.map(result=>result.status),[200,200]);
    current=await get();assert.equal(current.dishes[0].price,16);assert.equal(current.dishes[0].description,"Cambio independiente del PC");
    assert.equal((await patch(first.id,{price:{before:16,value:19}})).status,200);
    const conflicting=await patch(first.id,{price:{before:16,value:18},name:{before:first.name,value:"Nombre del teléfono"}});
    assert.equal(conflicting.status,409);const conflict=await conflicting.json();
    assert.equal(conflict.conflicts.length,1);assert.equal(conflict.conflicts[0].field,"price");assert.equal(conflict.conflicts[0].current,19);
    current=await get();assert.equal(current.dishes[0].name,first.name,"Un conflicto no aplica parcialmente otros cambios");
    assert.equal((await patch(first.id,{price:{before:19,value:18},name:{before:first.name,value:"Nombre del teléfono"}})).status,200);
    current=await get();assert.equal(current.dishes[0].price,18);assert.equal(current.dishes[0].description,"Cambio independiente del PC");assert.equal(current.dishes[1].price,17);assert.equal(current.publishedRevision,current.revision);
    const unchangedRevision=current.revision;
    assert.equal((await patch(first.id,{price:{before:1,value:18}})).status,200,"Reintentar un valor ya guardado es idempotente");
    assert.equal((await get()).revision,unchangedRevision);
    const bytes=await readFile("public/inch/fideos.webp");
    const uploaded=await fetch(base+"/api/admin/images",{method:"POST",headers:{Cookie:cookie,Origin:base,"Content-Type":"image/webp"},body:bytes});assert.equal(uploaded.status,200);
    const image=await uploaded.json();
    assert.equal((await patch(first.id,{image:{before:{imageSrc:current.dishes[0].imageSrc,imageName:current.dishes[0].imageName},value:{imageSrc:image.imageSrc,imageName:"foto-qa.webp"}}})).status,200);
    assert.deepEqual(Buffer.from(await(await request(image.imageSrc)).arrayBuffer()),bytes);
    const created={...first,id:randomUUID(),name:"Nuevo plato QA",imageSrc:"",imageName:"Sin imagen"};
    assert.equal((await request("/api/admin/menu","PATCH",{kind:"create",dish:created})).status,200);
    current=await get();assert.equal(current.dishes.at(-1)!.id,created.id);const createRevision=current.revision;
    assert.equal((await request("/api/admin/menu","PATCH",{kind:"create",dish:created})).status,200);assert.equal((await get()).revision,createRevision);
    assert.equal((await request("/api/admin/menu","PATCH",{kind:"create",dish:{...created,name:"Colisión distinta"}})).status,409);
    // A real SQLite trigger injects failure in the publication statement. The
    // D1 batch must roll back its earlier draft UPDATE too.
    const beforeFailure=await get();const publicBeforeFailure=await(await request("/")).text();
    await db.prepare("CREATE TRIGGER qa_fail_publication BEFORE UPDATE ON inch_publication BEGIN SELECT RAISE(ABORT, 'qa_failure'); END").run();
    const failed=await patch(first.id,{price:{before:beforeFailure.dishes[0].price,value:21}});assert.equal(failed.status,503);
    const afterFailure=await get();assert.equal(afterFailure.revision,beforeFailure.revision);assert.deepEqual(afterFailure.dishes,beforeFailure.dishes);assert.equal(await(await request("/")).text(),publicBeforeFailure);
    await db.prepare("DROP TRIGGER qa_fail_publication").run();
    console.log("PASS: Worker/D1 reales aislados; PC+iPhone conservan platos/campos independientes; solo mismo dato genera conflicto; guardar publica atómicamente; fotos, altas idempotentes, auth/origen/validación/legacy426 y rollback real comprobados. Sin escrituras remotas.");
  }finally{await runtime.dispose();console.log("Worker y D1 temporales cerrados.");}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
