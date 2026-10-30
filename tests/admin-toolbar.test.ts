import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import AdminPreview from "../src/app/admin/preview/AdminPreview";

function cloudPanel() {
  return renderToStaticMarkup(createElement<{ cloudflare?: boolean }>(AdminPreview, { cloudflare: true }));
}

test("el panel muestra Guardar cambios y Publicar carta como únicas acciones principales", () => {
  const html = cloudPanel();
  const primary = html.match(/<div class="admin-primary-actions">([\s\S]*?)<\/div>/)?.[1];
  assert.ok(primary, "Debe existir un grupo claro de acciones principales");
  assert.match(primary, />Guardar cambios<\/button>/);
  assert.match(primary, />Publicar carta<\/button>/);
  assert.equal((primary.match(/<button\b/g) ?? []).length, 2);
  assert.match(html, /Ver carta pública/);
  assert.doesNotMatch(html, /Guardar borrador local|Borrador local cargado|Publicar cambios|Guardar borrador en nube/);
  const recovery = html.match(/<details\b([^>]*)>([\s\S]*?)<\/details>/);
  assert.ok(recovery, "La recuperación debe estar agrupada en un apartado plegable");
  assert.doesNotMatch(recovery[1], /\bopen(?:\s|=|$)/);
  assert.match(recovery[2], /<summary>Copias y recuperación<\/summary>/);
  assert.match(recovery[2], /Cargar versión guardada/);
  assert.match(recovery[2], /Recuperar copia anterior/);
  const daily = html.replace(recovery[0], "");
  assert.doesNotMatch(daily, /Cargar versión guardada|Recuperar copia anterior/);
  assert.match(html, /data-state=/);
});
