import { renderToString } from "react-dom/server";
import InchMenu from "../app/inch/InchMenu";
import AdminPreview from "../app/admin/preview/AdminPreview";
import LoginForm from "../app/admin/LoginForm";
import type { AdminDish } from "../lib/inch-draft";

function document(title: string, css: string, content: string, script: string) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#f5f0e6"><title>${title}</title><link rel="stylesheet" href="/${css}"></head><body>${content}<script type="module" src="/${script}"></script></body></html>`;
}
export function publicHtml(dishes: AdminDish[]) {
  const data = JSON.stringify(dishes).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  return document("INCH · Carta asiática", "carta.css", `<div id="inch-root">${renderToString(<InchMenu publishedDishes={dishes} publicOnly />)}</div><script id="inch-menu-data" type="application/json">${data}</script>`, "carta.js");
}
export const adminHtml = document("INCH · Administración", "admin.css", `<div id="admin-root" data-mode="admin">${renderToString(<AdminPreview cloudflare />)}</div>`, "admin.js");
export const loginHtml = document("INCH · Acceso privado", "admin.css", `<div id="admin-root" data-mode="login">${renderToString(<LoginForm />)}</div>`, "admin.js");
