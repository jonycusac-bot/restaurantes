import test from 'node:test';
import assert from 'node:assert/strict';
import {publicHtml,adminHtml,loginHtml} from '../src/cloudflare/html';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
test('build incluye iconos y manifiestos separados con destinos correctos',()=>{
 execFileSync(process.execPath,['node_modules/tsx/dist/cli.mjs','scripts/build-cloudflare.tsx'],{stdio:'pipe'});
 for(const app of ['carta','admin']){
  const file=`dist-cloudflare/inch/app-${app}.webmanifest`;
  assert.ok(existsSync(file),`Falta ${file}`);
  const manifest=JSON.parse(readFileSync(file,'utf8'));
  assert.equal(manifest.id,app==='admin'?'/admin':'/');
  assert.equal(manifest.start_url,app==='admin'?'/admin':'/');
  assert.equal(manifest.name,app==='admin'?'INCH Admin':'INCH Carta');
  for(const size of [32,180,192,512]){
   const image=readFileSync(`dist-cloudflare/inch/app-${app}-${size}.png`);
   assert.equal(image.readUInt32BE(16),size);assert.equal(image.readUInt32BE(20),size);
   assert.deepEqual(image,readFileSync(`public/inch/app-${app}-${size}.png`));
  }
 }
 assert.notDeepEqual(readFileSync('dist-cloudflare/inch/app-carta-180.png'),readFileSync('dist-cloudflare/inch/app-admin-180.png'));
});
test('Carta y Admin tienen iconos y nombres de inicio distintos, incluido login',()=>{
 for(const [html,app,name] of [[publicHtml([]),'carta','INCH Carta'],[adminHtml,'admin','INCH Admin'],[loginHtml,'admin','INCH Admin']]){
  assert.match(html,new RegExp(`rel="apple-touch-icon"[^>]+href="/inch/app-${app}-180.png"`));
  assert.match(html,new RegExp(`name="apple-mobile-web-app-title" content="${name}"`));
  assert.match(html,new RegExp(`rel="manifest" href="/inch/app-${app}.webmanifest"`));
  assert.match(html,new RegExp(`rel="icon"[^>]+href="/inch/app-${app}-32.png"`));
 }
});
