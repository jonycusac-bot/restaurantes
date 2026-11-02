import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Miniflare } from "miniflare";
import { correctedCartaDishes, type PriceComparison } from "../src/lib/carta-price-correction";
import { cartaReleaseStatements } from "../src/lib/carta-release";
import { publicHtml } from "../src/cloudflare/html";
import type { AdminDish } from "../src/lib/inch-draft";

const directory = path.resolve("backups-private/2026-11-01-carta-price-correction");
type Exported = {integrity:string;draft:{dishes:string;revision:number;updated_at:string};publication:{html:string;revision:number;source_revision:number;updated_at:string};images:{id:string;mime_type:string;hex:string;created_at:string}[]};
const checksum = (data:Uint8Array|string)=>createHash("sha256").update(data).digest("hex");
async function main(){
 // Python reads the already-exported SQLite SQL in memory. No Wrangler, network,
 // remote D1 or owner's persistent local database is used by this preparation.
 const python = `import sqlite3,json,pathlib\nc=sqlite3.connect(':memory:');c.row_factory=sqlite3.Row\nc.executescript(pathlib.Path(${JSON.stringify(path.join(directory,"baseline.sql"))}).read_text(encoding='utf8'))\ndef row(q):return dict(c.execute(q).fetchone())\nprint(json.dumps({'integrity':c.execute('pragma integrity_check').fetchone()[0],'draft':row('select dishes,revision,updated_at from inch_draft'),'publication':row('select html,revision,source_revision,updated_at from inch_publication'),'images':[dict(id=r['id'],mime_type=r['mime_type'],hex=r['bytes'].hex(),created_at=r['created_at']) for r in c.execute('select * from inch_images order by id')]}))`;
 const baseline=JSON.parse(execFileSync("python",["-c",python],{encoding:"utf8",maxBuffer:15_000_000})) as Exported;
 assert.equal(baseline.integrity,"ok");assert.equal(baseline.draft.revision,35);assert.equal(baseline.publication.revision,32);assert.equal(baseline.publication.source_revision,35);assert.equal(baseline.images.length,16);
 const before=JSON.parse(baseline.draft.dishes) as AdminDish[];
 const embedded=baseline.publication.html.match(/<script id="inch-menu-data" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
 assert.ok(embedded,"Published snapshot missing embedded catalogue");
 const published=JSON.parse(embedded) as AdminDish[];
 assert.deepEqual(before,published,"Baseline draft and publication must match exactly");
 const source=await readFile("design/inch/carta-precios-actualizados-2026-11-01.txt","utf8");
 const comparison=JSON.parse(await readFile("design/inch/carta-price-mapping-2026-11-01.json","utf8")) as PriceComparison;
 const dishes=correctedCartaDishes(before,published,source,comparison);
 const html=publicHtml(dishes);
 assert.deepEqual(JSON.parse(html.match(/<script id="inch-menu-data" type="application\/json">([\s\S]*?)<\/script>/)![1]),dishes);
 const statements=cartaReleaseStatements(baseline,dishes,html);
 const runtime=new Miniflare({host:"127.0.0.1",port:0,enableDevRegistry:false,telemetry:{enabled:false},workers:[{config:{name:"carta-price-correction-disposable",compatibilityDate:"2026-10-29",manifest:{mainModule:"worker.js",modules:{"worker.js":{type:"esm",contents:'export default {fetch(){return new Response("QA")}}'}}},env:{DB:{type:"d1",id:"carta-price-correction-disposable"}}}}]});
 try{
  await runtime.ready;
  const db=await runtime.getD1Database("DB");
  for(const sql of (await readFile("cloudflare/migrations/0001_menu.sql","utf8")).split(";").map(s=>s.trim()).filter(Boolean))await db.prepare(sql).run();
  await db.prepare("INSERT INTO inch_draft(id,dishes,revision,updated_at) VALUES('inch',?,?,?)").bind(baseline.draft.dishes,baseline.draft.revision,baseline.draft.updated_at).run();
  await db.prepare("INSERT INTO inch_publication(id,html,revision,source_revision,updated_at) VALUES('inch',?,?,?,?)").bind(baseline.publication.html,baseline.publication.revision,baseline.publication.source_revision,baseline.publication.updated_at).run();
  for(const image of baseline.images)await db.prepare("INSERT INTO inch_images(id,mime_type,bytes,created_at) VALUES(?,?,?,?)").bind(image.id,image.mime_type,Buffer.from(image.hex,"hex"),image.created_at).run();
  for(const sql of statements)await db.prepare(sql).run();
  const draft=await db.prepare("SELECT dishes,revision FROM inch_draft WHERE id='inch'").first<{dishes:string;revision:number}>();
  const publication=await db.prepare("SELECT html,revision,source_revision FROM inch_publication WHERE id='inch'").first<{html:string;revision:number;source_revision:number}>();
  assert.deepEqual(JSON.parse(draft!.dishes),dishes);assert.equal(draft!.revision,36);
  assert.equal(publication!.html,html);assert.equal(publication!.revision,33);assert.equal(publication!.source_revision,36);
  assert.equal((await db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE type='trigger'").first<{n:number}>())!.n,0);
  const afterImages=await db.prepare("SELECT id,mime_type,bytes,created_at FROM inch_images ORDER BY id").all<{id:string;mime_type:string;bytes:number[];created_at:string}>();
  assert.equal(afterImages.results.length,16);
  for(const [index,image] of afterImages.results.entries()){
   const old=baseline.images[index];assert.deepEqual([image.id,image.mime_type,image.created_at],[old.id,old.mime_type,old.created_at]);
   assert.equal(checksum(Buffer.from(image.bytes)),checksum(Buffer.from(old.hex,"hex")),`BLOB ${old.id}`);
  }
  // Replaying a stale snapshot may create/drop its temporary trigger, but must
  // not touch either revision or the corrected publication.
  for(const sql of statements)await db.prepare(sql).run();
  assert.equal((await db.prepare("SELECT dishes FROM inch_draft WHERE id='inch'").first<{dishes:string}>())!.dishes,draft!.dishes);
  assert.equal((await db.prepare("SELECT html FROM inch_publication WHERE id='inch'").first<{html:string}>())!.html,html);
  assert.equal((await db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE type='trigger'").first<{n:number}>())!.n,0);
 }finally{await runtime.dispose();}
 const summary={rehearsalPassed:true,remoteWrites:false,matched:comparison.matched.length,oldOnlyUntouched:comparison.oldOnly,newOnlyExcluded:comparison.newOnly,dishCount:dishes.length,imagesUnchanged:baseline.images.length,expectedDraftRevision:36,expectedPublicationRevision:33,publicationSha256:checksum(html),sourceSha256:checksum(source)};
 await writeFile(path.join(directory,"prepared-menu.json"),JSON.stringify(dishes));
 await writeFile(path.join(directory,"prepared-publication.html"),html);
 await writeFile(path.join(directory,"DO-NOT-APPLY-without-owner-approval.sql"),statements.join(";\n")+";\n");
 await writeFile(path.join(directory,"rehearsal-summary.json"),JSON.stringify(summary,null,2));
 console.log(JSON.stringify(summary));
}
main().catch(error=>{console.error(error);process.exitCode=1});
