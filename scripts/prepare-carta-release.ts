import assert from "node:assert/strict";
import {readFile,writeFile} from "node:fs/promises";
import path from "node:path";
import {Miniflare} from "miniflare";
import {approvedCartaDishes,cartaReleaseStatements} from "../src/lib/carta-release";
import {publicHtml} from "../src/cloudflare/html";
import {menuSections} from "../src/app/inch/menu";
import type {AdminDish} from "../src/lib/inch-draft";

// Prepares private artifacts and rehearses against a new temporary D1 only.
// Deliberately has no remote execution, credentials or configurable target URL.
async function main(){
 const directory=path.resolve("backups-private/2026-10-31-release-live");
 const baseline=JSON.parse(await readFile(path.join(directory,"baseline.json"),"utf8"));
 const dishes=approvedCartaDishes(baseline.draftDishes,baseline.publishedDishes);
 const html=publicHtml(dishes);
 const statements=cartaReleaseStatements(baseline,dishes,html);
 const runtime=new Miniflare({host:"127.0.0.1",port:0,enableDevRegistry:false,telemetry:{enabled:false},workers:[{config:{name:"carta-real-snapshot-rehearsal",compatibilityDate:"2026-10-29",manifest:{mainModule:"worker.js",modules:{"worker.js":{type:"esm",contents:'export default {fetch(){return new Response("QA")}}'}}},env:{DB:{type:"d1",id:"carta-real-snapshot-rehearsal"}}}}]});
 try{
  await runtime.ready;const db=await runtime.getD1Database("DB");
  for(const sql of (await readFile("cloudflare/migrations/0001_menu.sql","utf8")).split(";").map(s=>s.trim()).filter(Boolean))await db.prepare(sql).run();
  await db.prepare("INSERT INTO inch_draft(id,dishes,revision,updated_at) VALUES('inch',?,?,?)").bind(baseline.draft.dishes,baseline.draft.revision,baseline.draft.updated_at).run();
  await db.prepare("INSERT INTO inch_publication(id,html,revision,source_revision,updated_at) VALUES('inch',?,?,?,?)").bind(baseline.publication.html,baseline.publication.revision,baseline.publication.source_revision,baseline.publication.updated_at).run();
  for(const statement of statements)await db.prepare(statement).run();
  const draft=await db.prepare("SELECT dishes,revision FROM inch_draft WHERE id='inch'").first<{dishes:string;revision:number}>();
  const published=await db.prepare("SELECT html,revision,source_revision FROM inch_publication WHERE id='inch'").first<{html:string;revision:number;source_revision:number}>();
  assert.deepEqual(JSON.parse(draft!.dishes),dishes);assert.equal(published!.html,html);assert.equal(draft!.revision,published!.source_revision);
  assert.equal((await db.prepare("SELECT count(*) AS count FROM sqlite_master WHERE type='trigger'").first<{count:number}>())!.count,0);
 }finally{await runtime.dispose();}
 const cartaIds=new Set(menuSections.find(section=>section.id==="carta")!.categoryIds);
 const summary={rehearsalPassed:true,originalCartaPrices:dishes.filter(dish=>cartaIds.has(dish.categoryId)).length,sushiPreserved:dishes.filter(dish=>!cartaIds.has(dish.categoryId)).length,photosPreserved:dishes.filter(dish=>!!dish.imageSrc).length,expectedDraftRevision:baseline.draft.revision+1,expectedPublicationRevision:baseline.publication.revision+1,remoteWrites:false};
 const sourceImages=new Map<string,AdminDish>((baseline.publishedDishes as AdminDish[]).filter(d=>!!d.imageSrc).map(d=>[d.id,d]));
 for(const [id,old] of sourceImages){const next=dishes.find(d=>d.id===id);assert.equal(next?.imageSrc,old.imageSrc);assert.equal(next?.imageName,old.imageName);}
 await writeFile(path.join(directory,"approved-menu.json"),JSON.stringify(dishes));
 await writeFile(path.join(directory,"approved-publication.html"),html);
 await writeFile(path.join(directory,"apply-approved-carta.sql"),statements.join(";\n")+";\n");
 await writeFile(path.join(directory,"approved-summary.json"),JSON.stringify(summary,null,2));
 console.log(JSON.stringify(summary));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
