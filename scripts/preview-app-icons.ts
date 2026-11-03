import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {loginHtml} from '../src/cloudflare/html';

// Loopback-only icon review: no D1, sessions, credentials or writes.
const preview=`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>INCH · Iconos en local</title><style>
*{box-sizing:border-box}body{margin:0;background:#f5f0e6;color:#292d21;font:16px Arial,sans-serif;padding:32px 20px}main{max-width:760px;margin:auto}h1{font:32px Georgia,serif}p{line-height:1.6}.cards{display:flex;gap:24px;flex-wrap:wrap}.card{flex:1;min-width:230px;background:#fffdf8;border:1px solid #d4cbbb;padding:24px;border-radius:16px;text-align:center}.large{width:180px;height:180px;border-radius:38px}.sample{margin:24px auto 12px;display:flex;align-items:center;justify-content:center;gap:16px}.small{width:64px;height:64px;border-radius:14px}.favicon{width:32px;height:32px}a{display:inline-block;padding:12px;color:#ac3d2c}.note{font-size:14px;color:#666659}
</style></head><body><main><h1>Dos accesos, fáciles de distinguir</h1><p>Vista local de los iconos de inicio y de pestaña. No cambia la web publicada.</p><div class="cards">${(['carta','admin'] as const).map(app=>`<section class="card"><img class="large" src="/inch/app-${app}-180.png" alt="Icono INCH ${app}"><h2>INCH ${app==='admin'?'Admin':'Carta'}</h2><div class="sample"><img class="small" src="/inch/app-${app}-180.png" alt="Tamaño de acceso de inicio"><img class="favicon" src="/inch/app-${app}-32.png" alt="Icono de pestaña"></div><p class="note">Vista a 64 px · favicon a 32 px</p><a href="${app==='admin'?'/admin':'/'}" target="_blank">Abrir ${app==='admin'?'acceso Admin':'Carta'} ↗</a></section>`).join('')}</div><p class="note">La página Admin muestra el acceso privado, solo para comprobar su icono. Esta vista no permite iniciar sesión ni guardar. La instalación real en un iPhone queda pendiente de probar.</p></main></body></html>`;
const server=createServer(async(req,res)=>{
 try{
  if(req.method!=='GET'){res.writeHead(405,{'Content-Type':'application/json'}).end(JSON.stringify({error:'Vista local de iconos: sin escrituras ni inicio de sesión.'}));return;}
  const path=new URL(req.url??'/','http://127.0.0.1:8798').pathname;
  res.setHeader('Cache-Control','no-store');
  if(path==='/iconos'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'}).end(preview);return;}
  if(['/admin','/admin/','/admin/preview'].includes(path)){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'}).end(loginHtml);return;}
  if(path==='/'||path==='/inch'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'}).end(await readFile('dist-cloudflare/index.html'));return;}
  if(!/^\/inch\/[a-z0-9-]+\.(png|webp|webmanifest)$/.test(path)&&!/^\/(carta|admin)\.(js|css)$/.test(path)){res.writeHead(404).end();return;}
  const ext=path.split('.').at(-1)!;
  const mime:Record<string,string>={png:'image/png',webp:'image/webp',webmanifest:'application/manifest+json',js:'text/javascript',css:'text/css'};
  res.writeHead(200,{'Content-Type':mime[ext]}).end(await readFile('dist-cloudflare'+path));
 }catch{res.writeHead(404).end();}
});
server.listen(8798,'127.0.0.1',()=>console.log('Iconos: http://127.0.0.1:8798/iconos · solo local, sin base de datos'));
