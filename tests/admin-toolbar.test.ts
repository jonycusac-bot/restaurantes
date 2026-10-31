import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import AdminPreview from "../src/app/admin/preview/AdminPreview";

function cloudPanel() {
  return renderToStaticMarkup(createElement<{ cloudflare?: boolean }>(AdminPreview, { cloudflare: true }));
}

test("el panel central explica Guardar directo sin controles de publicación ni copias completas", () => {
  const html = cloudPanel();
  assert.match(html, /Los cambios se ven en la carta al guardar/);
  assert.match(html, /Cargando carta/);
  assert.match(html, /Ver carta pública/);
  assert.doesNotMatch(html, /Publicar carta|Guardar cambios|Aplicar al borrador|Guardar mi copia|Usar versión de la nube|Copias y recuperación/);
  assert.doesNotMatch(html, /Poh Pia/, "No mostrar un catálogo demo o un borrador antiguo mientras llega la carta central");
});
