import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { build } from "esbuild";
import { renderToString } from "react-dom/server";
import InchMenu from "../src/app/inch/InchMenu";
import { categories } from "../src/app/inch/menu";

async function main() {
  const root = process.cwd();
  const destination = path.join(root, "dist-inch");
  await mkdir(path.join(destination, "inch"), { recursive: true });
  await build({
    entryPoints: [path.join(root, "src/inch-static.tsx")],
    outfile: path.join(destination, "carta.js"),
    bundle: true,
    minify: true,
    platform: "browser",
    format: "esm",
    target: ["es2020"],
    define: { "process.env.NODE_ENV": '"production"' },
    logLevel: "warning",
  });
  const require = createRequire(import.meta.url);
  const preflight = await readFile(path.join(path.dirname(require.resolve("tailwindcss/package.json")), "preflight.css"), "utf8");
  const styles = await readFile(path.join(root, "src/app/inch/inch.css"), "utf8");
  await writeFile(path.join(destination, "carta.css"), `${preflight}\nhtml{scroll-behavior:smooth}body{margin:0}\n${styles}`, "utf8");
  const photos = new Set(categories.flatMap(c => c.dishes.flatMap(d => d.image ? [`${d.image}.webp`] : [])));
  for (const photo of photos) await copyFile(path.join(root, "public/inch", photo), path.join(destination, "inch", photo));
  for (const asset of ["inch-logo.webp", "cabecera-inch.png", "flag-es.webp", "flag-gb.webp", "flag-de.webp"]) await copyFile(path.join(root, "public/inch", asset), path.join(destination, "inch", asset));
  const markup = renderToString(<InchMenu />);
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#f5f0e6"><title>INCH · Carta asiática</title><meta name="description" content="Carta digital de INCH. Sushi, noodles, ramen y currys. Propuesta en pruebas."><link rel="stylesheet" href="/carta.css"></head><body><div id="inch-root">${markup}</div><script type="module" src="/carta.js"></script></body></html>`;
  await writeFile(path.join(destination, "index.html"), html, "utf8");
  await writeFile(path.join(destination, "_redirects"), "/inch / 200\n", "utf8");
  await writeFile(path.join(destination, "_headers"), "/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Robots-Tag: noindex, nofollow\n", "utf8");
  console.log(`Carta estática preparada en ${destination}. ${photos.size} fotografías. Sin API, credenciales ni base de datos.`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
