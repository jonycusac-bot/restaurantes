import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("dist-inch");
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".webp": "image/webp", ".svg": "image/svg+xml" };
createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", "http://localhost");
    const pathname = decodeURIComponent(url.pathname);
    const file = path.resolve(root, `.${pathname === "/" || pathname === "/inch" ? "/index.html" : pathname}`);
    if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
    const bytes = await readFile(file);
    response.writeHead(200, { "Content-Type": types[path.extname(file)] ?? "application/octet-stream" }).end(bytes);
  } catch { response.writeHead(404).end("No encontrado"); }
}).listen(Number(process.env.INCH_PREVIEW_PORT || 4173), "127.0.0.1", () => console.log(`Carta estática: http://127.0.0.1:${process.env.INCH_PREVIEW_PORT || 4173}`));
