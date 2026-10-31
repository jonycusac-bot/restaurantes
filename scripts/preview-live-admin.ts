import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash, pbkdf2Sync, randomBytes } from "node:crypto";
import { build } from "esbuild";
import { Miniflare } from "miniflare";
import { initialDraft, parseDraft } from "../src/lib/inch-draft";
import { prepareLocalCartaPreview } from "../src/lib/local-carta-preview";
import { publicHtml } from "../src/cloudflare/html";

// Real compiled Worker + ephemeral D1 + mounted UI, on loopback only. Test auth
// stays inside the proxy; it never reads real credentials or forwards browser cookies.
async function main() {
  const output=path.resolve(".cloudflare-build/live-menu-qa");
  await mkdir(output,{recursive:true});
  await build({entryPoints:["tests/browser/admin-live.tsx"],bundle:true,outfile:path.join(output,"app.js"),platform:"browser",format:"esm",define:{"process.env.NODE_ENV":JSON.stringify("production")}});
  await build({stdin:{contents:'import "tailwindcss/preflight.css"; import "./src/app/inch/inch.css"; import "./src/cloudflare/public-client.tsx";',resolveDir:process.cwd(),loader:"tsx"},bundle:true,outfile:path.join(output,"carta.js"),platform:"browser",format:"esm",define:{"process.env.NODE_ENV":JSON.stringify("production")}});
  const compiled=await build({entryPoints:["src/cloudflare/worker.ts"],bundle:true,write:false,platform:"browser",format:"esm",define:{"process.env.NODE_ENV":JSON.stringify("production")}});
  const salt=randomBytes(16);
  const hash=`pbkdf2$100000$${salt.toString("hex")}$${pbkdf2Sync("live-ui-qa-only",salt,100000,32,"sha256").toString("hex")}`;
  const runtime=new Miniflare({host:"127.0.0.1",port:0,enableDevRegistry:false,telemetry:{enabled:false},workers:[{config:{name:"inch-live-ui-qa",compatibilityDate:"2026-10-29",manifest:{mainModule:"worker.js",modules:{"worker.js":{type:"esm",contents:compiled.outputFiles[0].text}}},env:{DB:{type:"d1",id:"inch-live-ui-qa"},INCH_CF_PASSWORD_HASH:{type:"text",value:hash},INCH_CF_SESSION_SECRET:{type:"text",value:randomBytes(32).toString("hex")}}}}]});
  let server: ReturnType<typeof createServer> | undefined;
  try {
    const base=(await runtime.ready).origin;
    const db=await runtime.getD1Database("DB");
    const schema=await readFile("cloudflare/migrations/0001_menu.sql","utf8");
    for(const statement of schema.split(";").map(s=>s.trim()).filter(Boolean)) await db.prepare(statement).run();
    let seedDishes=initialDraft;
    if(process.argv.includes("--preserve-local")) {
      const backup=JSON.parse(await readFile(path.join(output,"before-carta-original.json"),"utf8"));
      const previous=parseDraft(JSON.stringify(backup.menu?.dishes));
      if(!previous) throw new Error("El respaldo del entorno local no es válido; no se sustituye por datos de ejemplo.");
      seedDishes=prepareLocalCartaPreview(previous);
      for(const image of backup.media??[]) {
        const match=typeof image.path==="string" ? image.path.match(/^\/media\/([a-f0-9]{64})\.(webp|jpg|png)$/) : null;
        const bytes=Buffer.from(image.base64??"","base64");
        if(!match || bytes.length>1024*1024 || createHash("sha256").update(bytes).digest("hex")!==match[1] || !["image/webp","image/jpeg","image/png"].includes(image.mime)) throw new Error("Foto del respaldo local no válida.");
        await db.prepare("INSERT OR IGNORE INTO inch_images(id,mime_type,bytes) VALUES(?,?,?)").bind(match[1],image.mime,bytes).run();
      }
    }
    await db.prepare("INSERT INTO inch_draft(id,dishes) VALUES('inch',?)").bind(JSON.stringify(seedDishes)).run();
    await db.prepare("INSERT INTO inch_publication(id,html) VALUES('inch',?)").bind(publicHtml(seedDishes)).run();
    const login=await fetch(base+"/api/admin/login",{method:"POST",headers:{Origin:base,"Content-Type":"application/json"},body:JSON.stringify({password:"live-ui-qa-only"})});
    if(!login.ok) throw new Error(`QA login: ${login.status}`);
    const cookie=login.headers.get("set-cookie")!.split(";")[0];
    const html='<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>INCH · QA central aislada</title><link rel="stylesheet" href="/app.css"><div id="root"></div><script type="module" src="/app.js"></script></html>';
    server=createServer(async(request,response)=>{
      try {
        const url=new URL(request.url??"/","http://127.0.0.1:8794");
        if(request.method==="GET" && ["/admin","/admin/preview"].includes(url.pathname)) {response.writeHead(200,{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"}).end(html);return;}
        if(request.method==="GET" && ["/app.js","/app.css","/carta.js","/carta.css"].includes(url.pathname)) {
          response.writeHead(200,{"Content-Type":url.pathname.endsWith(".js")?"text/javascript":"text/css","Cache-Control":"no-store"}).end(await readFile(path.join(output,url.pathname.slice(1))));return;
        }
        if(request.method==="GET" && /^\/inch\/[a-z0-9-]+\.(webp|png)$/.test(url.pathname)) {
          response.writeHead(200,{"Content-Type":url.pathname.endsWith(".png")?"image/png":"image/webp"}).end(await readFile(path.join("public",url.pathname.slice(1))));return;
        }
        if(!url.pathname.startsWith("/api/admin/")&&!url.pathname.startsWith("/media/")&&url.pathname!=="/qa/public"&&url.pathname!=="/") {response.writeHead(404).end();return;}
        const chunks:Buffer[]=[];let size=0;
        for await(const part of request) {size+=part.length;if(size>2*1024*1024){response.writeHead(413).end();return;}chunks.push(part);}
        const method=request.method??"GET";
        const upstream=await fetch(base+(url.pathname==="/qa/public"?"/":url.pathname),{method,headers:{Cookie:cookie,Origin:base,...(request.headers["content-type"]?{"Content-Type":request.headers["content-type"]}:{})},...(method==="GET"||method==="HEAD"?{}:{body:Buffer.concat(chunks)})});
        response.writeHead(upstream.status,{"Content-Type":upstream.headers.get("Content-Type")??"application/json","Cache-Control":"no-store"}).end(Buffer.from(await upstream.arrayBuffer()));
      } catch {response.writeHead(503).end("Fallo del entorno de QA");}
    });
    await new Promise<void>((resolve,reject)=>{server!.once("error",reject);server!.listen(8794,"127.0.0.1",resolve);});
    console.log("QA real UI/Worker/D1 en http://127.0.0.1:8794 · datos temporales, sin secretos ni escrituras remotas");
    await writeFile(path.join(output,"ready.txt"),"127.0.0.1:8794\n");
    await new Promise<void>(resolve=>{process.once("SIGINT",resolve);process.once("SIGTERM",resolve);});
  } finally {server?.close();await runtime.dispose();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
