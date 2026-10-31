import assert from "node:assert/strict";
import test from "node:test";
import {initialDraft} from "../src/lib/inch-draft";
import {menuSections} from "../src/app/inch/menu";
import {approvedCartaDishes} from "../src/lib/carta-release";
import {cartaReleaseStatements} from "../src/lib/carta-release";
import {Miniflare} from "miniflare";

test("publicación aprobada toma precios originales, conserva fotos y Sushi y no copia valores de QA",()=>{
 const legacy=initialDraft.filter(d=>!d.id.startsWith("carta-")).map(d=>d.id==="entrantes-0"?{...d,price:14.14}:d);
 const result=approvedCartaDishes(legacy,legacy);
 const carta=new Set(menuSections.find(s=>s.id==="carta")!.categoryIds);
 assert.equal(result.find(d=>d.id==="entrantes-0")!.price,6.3);
 assert.deepEqual(result.filter(d=>!carta.has(d.categoryId)),legacy.filter(d=>!carta.has(d.categoryId)));
 for(const old of legacy.filter(d=>!!d.imageSrc)){const next=result.find(d=>d.id===old.id)!;assert.equal(next.imageSrc,old.imageSrc);assert.equal(next.imageName,old.imageName);}
 assert.equal(result.length,initialDraft.length);
});

test("la preparación se detiene si hay Sushi pendiente, fotos distintas o platos adicionales no aprobados",()=>{
 const published=initialDraft.map(d=>({...d}));
 const changedSushi=published.map(d=>d.categoryId==="uramaki"?{...d,price:d.price+1}:d);
 assert.throws(()=>approvedCartaDishes(changedSushi,published),/Sushi/);
 const changedPhoto=published.map((d,index)=>index===0?{...d,imageSrc:"/inch/fideos.webp",imageName:"nueva.webp"}:d);
 assert.throws(()=>approvedCartaDishes(changedPhoto,published),/foto/i);
 const extra={...published[0],id:"adicional-del-dueno",name:"Plato adicional"};
 assert.throws(()=>approvedCartaDishes([...published,extra],[...published,extra]),/adicional/i);
});

test("la publicación completa es atómica en D1 y no pisa una revisión concurrente",async()=>{
 const runtime=new Miniflare({host:"127.0.0.1",port:0,enableDevRegistry:false,telemetry:{enabled:false},workers:[{config:{name:"release-cas-qa",compatibilityDate:"2026-10-29",manifest:{mainModule:"worker.js",modules:{"worker.js":{type:"esm",contents:'export default {fetch(){return new Response("QA")}}'}}},env:{DB:{type:"d1",id:"release-cas-qa"}}}}]});
 try{
  await runtime.ready;const db=await runtime.getD1Database("DB");
  await db.prepare("CREATE TABLE inch_draft(id TEXT PRIMARY KEY,dishes TEXT,revision INTEGER,updated_at TEXT)").run();
  await db.prepare("CREATE TABLE inch_publication(id TEXT PRIMARY KEY,html TEXT,revision INTEGER,source_revision INTEGER,updated_at TEXT)").run();
  const old=JSON.stringify([initialDraft[0]]);const next=[{...initialDraft[0],price:6.31}];
  const before={draft:{dishes:old,revision:1},publication:{html:"old's publication",revision:1,source_revision:1}};
  await db.prepare("INSERT INTO inch_draft VALUES('inch',?,1,'old')").bind(old).run();
  await db.prepare("INSERT INTO inch_publication VALUES('inch',?,1,1,'old')").bind(before.publication.html).run();
  const statements=cartaReleaseStatements(before,next,"new's publication");
  for(const statement of statements)await db.prepare(statement).run();
  assert.equal((await db.prepare("SELECT dishes FROM inch_draft").first<{dishes:string}>())!.dishes,JSON.stringify(next));
  assert.equal((await db.prepare("SELECT html FROM inch_publication").first<{html:string}>())!.html,"new's publication");
  const reset=async()=>{await db.prepare("UPDATE inch_draft SET dishes=?,revision=1").bind(old).run();await db.prepare("UPDATE inch_publication SET html=?,revision=1,source_revision=1").bind(before.publication.html).run();};
  await reset();
  await db.prepare("CREATE TRIGGER qa_abort_release BEFORE UPDATE ON inch_publication BEGIN SELECT RAISE(ABORT,'qa_abort'); END").run();
  await db.prepare(statements[0]).run();await assert.rejects(db.prepare(statements[1]).run());
  assert.equal((await db.prepare("SELECT dishes FROM inch_draft").first<{dishes:string}>())!.dishes,old,"Si falla publicar también se deshace el borrador");
  assert.equal((await db.prepare("SELECT html FROM inch_publication").first<{html:string}>())!.html,before.publication.html);
  await db.prepare("DROP TRIGGER qa_abort_release").run();await db.prepare(statements[2]).run();
  const concurrent=JSON.stringify([{...initialDraft[0],price:88}]);
  await db.prepare("UPDATE inch_draft SET dishes=?,revision=2").bind(concurrent).run();
  for(const statement of statements)await db.prepare(statement).run();
  assert.equal((await db.prepare("SELECT dishes FROM inch_draft").first<{dishes:string}>())!.dishes,concurrent,"No sobrescribir otro cambio después del respaldo");
  assert.equal((await db.prepare("SELECT html FROM inch_publication").first<{html:string}>())!.html,before.publication.html);
 }finally{await runtime.dispose();}
});
