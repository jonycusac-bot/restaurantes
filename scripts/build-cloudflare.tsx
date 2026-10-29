import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { build } from "esbuild";
import { initialDraft } from "../src/lib/inch-draft";
import { publicHtml } from "../src/cloudflare/html";

async function main() {
  const output = path.resolve("dist-cloudflare");
  await mkdir(path.join(output, "inch"), { recursive: true });
  await mkdir(".cloudflare-build", { recursive: true });
  const shared = { bundle: true, minify: true, platform: "browser" as const, format: "esm" as const, target: ["es2022"], define: { "process.env.NODE_ENV": '"production"' }, logLevel: "warning" as const };
  await build({ ...shared, entryPoints: ["src/cloudflare/public-client.tsx"], outfile: path.join(output, "carta.js") });
  await build({ ...shared, entryPoints: ["src/cloudflare/admin-client.tsx"], outfile: path.join(output, "admin.js") });
  await build({ ...shared, entryPoints: ["src/cloudflare/worker.ts"], outfile: path.join(output, "_worker.js") });
  const require = createRequire(import.meta.url);
  const preflight = await readFile(path.join(path.dirname(require.resolve("tailwindcss/package.json")), "preflight.css"), "utf8");
  for (const [name, file] of [["carta", "src/app/inch/inch.css"], ["admin", "src/app/admin/preview/admin.css"]]) {
    await writeFile(path.join(output, `${name}.css`), `${preflight}\nbody{margin:0}\n${await readFile(file, "utf8")}`);
  }
  const assets = new Set(["inch-logo.webp", "cabecera-inch.png", "flag-es.webp", "flag-gb.webp", "flag-de.webp", ...initialDraft.flatMap(d => d.imageSrc ? [d.imageSrc.split("/").pop()!] : [])]);
  for (const file of assets) await copyFile(path.join("public/inch", file), path.join(output, "inch", file));
  const html = publicHtml(initialDraft);
  await writeFile(path.join(output, "index.html"), html);
  await writeFile(path.join(output, "404.html"), "<!doctype html><html lang='es'><meta charset='utf-8'><title>INCH</title><p>Página no encontrada. <a href='/'>Volver a la carta</a></p></html>");
  await writeFile(path.join(output, "_routes.json"), JSON.stringify({ version: 1, include: ["/", "/inch", "/inch/", "/admin", "/admin/*", "/api/*", "/media/*"], exclude: [] }));
  await writeFile(path.join(output, "_headers"), "/*\n  X-Content-Type-Options: nosniff\n  X-Robots-Tag: noindex, nofollow\n  Referrer-Policy: same-origin\n");
  const sql = (value: string) => `'${value.replace(/'/g, "''")}'`;
  await writeFile(".cloudflare-build/seed.sql", `INSERT OR IGNORE INTO inch_draft (id,dishes) VALUES ('inch',${sql(JSON.stringify(initialDraft))});\nINSERT OR IGNORE INTO inch_publication (id,html) VALUES ('inch',${sql(html)});\n`);
  console.log("Cloudflare preparado: carta, admin protegido, borradores, publicación y fotos. Sin secretos en los archivos públicos.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
