import { build } from "esbuild";
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// Isolated, component-only preview: no D1, authentication or remote API.
async function main() {
const output = path.resolve(".cloudflare-build/admin-editor-qa");
await mkdir(output, { recursive: true });
await build({
  entryPoints: ["tests/browser/admin-editor.tsx"],
  bundle: true,
  outfile: path.join(output, "app.js"),
  format: "esm",
  platform: "browser",
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
});
await writeFile(path.join(output, "index.html"), '<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>INCH · QA aislada del editor</title><link rel="stylesheet" href="/app.css"><div id="root"></div><script type="module" src="/app.js"></script></html>');
const files: Record<string, [string, string]> = {
  "/": ["index.html", "text/html; charset=utf-8"],
  "/app.js": ["app.js", "text/javascript; charset=utf-8"],
  "/app.css": ["app.css", "text/css; charset=utf-8"],
};
createServer(async (request, response) => {
  const entry = files[new URL(request.url ?? "/", "http://127.0.0.1").pathname];
  if (request.method !== "GET" || !entry) { response.writeHead(404).end(); return; }
  try {
    const content = await readFile(path.join(output, entry[0]));
    response.writeHead(200, { "Content-Type": entry[1], "Cache-Control": "no-store" }).end(content);
  } catch { response.writeHead(500).end("No se pudo cargar la prueba local."); }
}).listen(8791, "127.0.0.1", () => console.log("QA del componente real: http://127.0.0.1:8791 · sin D1 ni publicación"));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
