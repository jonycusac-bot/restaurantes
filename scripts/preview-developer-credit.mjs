// Read-only visual preview. No Worker, credentials, administration or database.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist-cloudflare');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png'};
createServer(async(req,res)=>{
 try{
  const url=new URL(req.url??'/','http://127.0.0.1:4180');
  if(req.method!=='GET'||!(/^\/(?:index\.html|carta\.(?:js|css))?$/.test(url.pathname)||/^\/inch\/[a-z0-9-]+\.(?:webp|png)$/.test(url.pathname))){res.writeHead(404).end();return;}
  const file=path.join(root,url.pathname==='/'?'index.html':url.pathname.slice(1));
  const bytes=await readFile(file);
  res.writeHead(200,{'Content-Type':types[path.extname(file)]??'application/octet-stream','Cache-Control':'no-store'}).end(bytes);
 }catch{res.writeHead(404).end();}
}).listen(4180,'127.0.0.1',()=>console.log('Vista local CUSAC: http://127.0.0.1:4180/#inch-developer-credit · solo lectura'));
