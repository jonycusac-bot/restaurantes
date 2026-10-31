import { configured, hex, isAdmin, loginAllowed, loginCookie, logoutCookie, passwordMatches } from "./auth";
import { adminHtml, loginHtml, publicHtml } from "./html";
import { parseCloudDishes } from "../lib/cloud-draft";
import type { CloudDraft } from "../lib/cloud-draft";
import { applyLiveEdit, validateLiveEditRequest } from "../lib/live-menu";
import type { Env } from "./types";

class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
const privateHeaders = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "X-Robots-Tag": "noindex, nofollow", "Referrer-Policy": "same-origin" };
const json = (body: unknown, status = 200, extra: Record<string, string> = {}) => Response.json(body, { status, headers: { ...privateHeaders, ...extra } });
async function readBody(request: Request, max: number): Promise<Uint8Array<ArrayBuffer>> {
  if (Number(request.headers.get("content-length")) > max) throw new HttpError(413, "El archivo o borrador supera el tamaño permitido.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Faltan los datos.");
  const chunks: Uint8Array[] = []; let length = 0;
  while (true) {
    const next = await reader.read(); if (next.done) break;
    length += next.value.byteLength;
    if (length > max) { await reader.cancel(); throw new HttpError(413, "El archivo o borrador supera el tamaño permitido."); }
    chunks.push(next.value);
  }
  const body = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  return body;
}
async function readJson(request: Request, max = 2 * 1024 * 1024): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new HttpError(415, "Se esperaba un formulario JSON.");
  const bytes = await readBody(request, max);
  try {
    const data = JSON.parse(new TextDecoder().decode(bytes));
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error();
    return data;
  } catch { throw new HttpError(400, "Datos no válidos."); }
}
function sameOrigin(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) throw new HttpError(403, "Origen no permitido.");
}

type Row = { dishes: string; revision: number; updated_at: string };
function snapshot(row: Row): CloudDraft {
  const dishes = parseCloudDishes(JSON.parse(row.dishes));
  if (!dishes) throw new Error("INVALID_STORED_MENU");
  return { dishes, revision: row.revision, updatedAt: row.updated_at, imageStorage: true, canPublish: true };
}
async function publishedRevision(env: Env): Promise<number | null> {
  const row = await env.DB.prepare("SELECT source_revision FROM inch_publication WHERE id = 'inch'").first<{ source_revision: number }>();
  return row?.source_revision ?? null;
}
async function readDraft(env: Env) {
  const row = await env.DB.prepare("SELECT dishes, revision, updated_at FROM inch_draft WHERE id = 'inch'").first<Row>();
  if (!row) throw new HttpError(503, "La carta de prueba todavía no está inicializada.");
  return { ...snapshot(row), publishedRevision: await publishedRevision(env) };
}
function renderPublishedSnapshot(html: string): string {
  // Read only the data embedded in the published snapshot, never the draft.
  // This also lets existing publications pick up presentation fixes without
  // writing D1, publishing pending edits, or serving stale server-side ordering.
  const embedded = html.match(/<script id="inch-menu-data" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
  if (embedded) {
    try {
      const dishes = parseCloudDishes(JSON.parse(embedded));
      if (dishes) return publicHtml(dishes);
    } catch { /* Preserve an unsupported old publication rather than substitute demo data. */ }
  }
  return html;
}
async function saveLive(request: Request, env: Env): Promise<Response> {
  const edit = validateLiveEditRequest(await readJson(request));
  if (!edit) throw new HttpError(422, "Revisa los datos del plato. No se ha guardado ningún cambio.");
  for (let attempt = 0; attempt < 3; attempt++) {
    const current = await readDraft(env);
    const merged = applyLiveEdit(current.dishes, edit);
    if (!merged.ok) return json({ error: "Este dato cambió en otro dispositivo. Elige cuál quieres conservar.", conflicts: merged.conflicts, current }, 409);
    if (!merged.changed) return json({ ...current, canPublish: false, live: true });
    const dishes = parseCloudDishes(merged.dishes);
    if (!dishes) throw new HttpError(422, "La carta no es válida o tiene demasiados platos.");
    const html = publicHtml(dishes);
    if (new TextEncoder().encode(html).byteLength > 1800000) throw new HttpError(413, "La carta es demasiado grande. Reduce las descripciones antes de guardar.");
    const serialized = JSON.stringify(dishes);
    const nextRevision = current.revision + 1;
    // D1 executes the batch in one transaction. changes() gates publication on
    // THIS draft UPDATE succeeding; a stale compare-and-swap publishes nothing.
    // An error in either SQL statement rolls back the whole batch.
    const result = await env.DB.batch([
      env.DB.prepare("UPDATE inch_draft SET dishes = ?, revision = revision + 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = 'inch' AND revision = ?").bind(serialized, current.revision),
      env.DB.prepare("INSERT INTO inch_publication (id,html,source_revision) SELECT 'inch', ?, ? WHERE changes() = 1 AND EXISTS(SELECT 1 FROM inch_draft WHERE id = 'inch' AND revision = ? AND dishes = ?) ON CONFLICT(id) DO UPDATE SET html = excluded.html, source_revision = excluded.source_revision, revision = inch_publication.revision + 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')").bind(html, nextRevision, nextRevision, serialized),
    ]);
    if (!result[0]?.meta.changes) continue;
    if (result[1]?.meta.changes !== 1) throw new Error("LIVE_PUBLICATION_NOT_CONFIRMED");
    return json({ ...await readDraft(env), canPublish: false, live: true });
  }
  throw new HttpError(503, "Se está guardando otro cambio. Tu edición se conserva; vuelve a pulsar Guardar.");
}
export function imageType(bytes: Uint8Array): { type: string; extension: string } | null {
  if (bytes.length < 16) return null;
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { type: "image/webp", extension: "webp" };
  if (bytes[0] === 0x89 && ascii(1, 4) === "PNG" && bytes[4] === 13 && bytes[5] === 10 && bytes[6] === 26 && bytes[7] === 10) return { type: "image/png", extension: "png" };
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return { type: "image/jpeg", extension: "jpg" };
  return null;
}
async function saveImage(request: Request, env: Env) {
  const bytes = await readBody(request, 1024 * 1024);
  const format = imageType(bytes);
  if (!format) throw new HttpError(422, "Solo se admiten fotos JPG, PNG o WebP válidas, hasta 1 MB después de optimizar.");
  const id = hex(await crypto.subtle.digest("SHA-256", bytes));
  const result = await env.DB.prepare("INSERT INTO inch_images (id, mime_type, bytes) SELECT ?, ?, ? WHERE (SELECT coalesce(sum(length(bytes)),0) FROM inch_images) + ? <= 104857600 ON CONFLICT(id) DO NOTHING").bind(id, format.type, bytes.buffer, bytes.byteLength).run();
  if (!result.meta.changes && !await env.DB.prepare("SELECT id FROM inch_images WHERE id = ?").bind(id).first()) throw new HttpError(413, "Se ha alcanzado el límite de fotos de esta prueba (100 MB). Conserva tu copia local.");
  return json({ imageSrc: `/media/${id}.${format.extension}` });
}

async function handle(request: Request, env: Env): Promise<Response> {
  const path = new URL(request.url).pathname;
  if (path.startsWith("/media/")) {
    if (!["GET", "HEAD"].includes(request.method)) return new Response(null, { status: 405 });
    const match = /^\/media\/([a-f0-9]{64})\.(webp|jpg|png)$/.exec(path);
    if (!match) return new Response("No encontrado", { status: 404 });
    const row = await env.DB.prepare("SELECT mime_type, bytes FROM inch_images WHERE id = ?").bind(match[1]).first<{ mime_type: string; bytes: number[] }>();
    if (!row || row.mime_type !== { webp: "image/webp", jpg: "image/jpeg", png: "image/png" }[match[2]]) return new Response("No encontrado", { status: 404 });
    return new Response(request.method === "HEAD" ? null : new Uint8Array(row.bytes), { headers: { "Content-Type": row.mime_type, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'" } });
  }
  if (["/", "/inch", "/inch/"].includes(path)) {
    if (!["GET", "HEAD"].includes(request.method)) return new Response(null, { status: 405 });
    const row = await env.DB.prepare("SELECT html FROM inch_publication WHERE id = 'inch'").first<{ html: string }>();
    if (!row) throw new HttpError(503, "La carta de prueba todavía no está inicializada.");
    return new Response(request.method === "HEAD" ? null : renderPublishedSnapshot(row.html), { headers: { ...privateHeaders, "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
  }
  if (["/api/admin/login", "/api/admin/logout"].includes(path)) {
    if (request.method !== "POST") throw new HttpError(405, "Método no permitido.");
    sameOrigin(request);
    if (path.endsWith("/logout")) return json({ ok: true }, 200, { "Set-Cookie": logoutCookie(request) });
    if (!configured(env)) throw new HttpError(503, "Acceso privado pendiente de configurar.");
    if (!await loginAllowed(request, env)) return json({ error: "Demasiados intentos. Espera cinco minutos antes de volver a entrar." }, 429, { "Retry-After": "300" });
    const body = await readJson(request, 1024);
    if (typeof body.password !== "string" || !await passwordMatches(body.password, env)) throw new HttpError(401, "Contraseña incorrecta.");
    return json({ ok: true }, 200, { "Set-Cookie": await loginCookie(request, env) });
  }
  if (["/admin", "/admin/", "/admin/preview", "/admin/preview/"].includes(path)) {
    if (!["GET", "HEAD"].includes(request.method)) throw new HttpError(405, "Método no permitido.");
    return new Response(request.method === "HEAD" ? null : await isAdmin(request, env) ? adminHtml : loginHtml, { headers: { ...privateHeaders, "Content-Type": "text/html; charset=utf-8" } });
  }
  if (path.startsWith("/api/admin/")) {
    if (!await isAdmin(request, env)) throw new HttpError(401, "Tu sesión ha caducado. Vuelve a entrar; el borrador local se conserva.");
    if (request.method !== "GET") sameOrigin(request);
    if (path === "/api/admin/images" && request.method === "POST") return saveImage(request, env);
    if (path === "/api/admin/menu" && request.method === "GET") return json({ ...await readDraft(env), canPublish: false, live: true });
    if (path === "/api/admin/menu" && request.method === "PATCH") return saveLive(request, env);
    if (path === "/api/admin/draft" && request.method === "GET") return json(await readDraft(env));
    if ((path === "/api/admin/draft" && request.method === "PUT") || (path === "/api/admin/publish" && request.method === "POST")) throw new HttpError(426, "Actualiza el panel para guardar con el nuevo editor. Tus copias locales se conservan.");
    throw new HttpError(405, "Operación no disponible.");
  }
  return env.ASSETS.fetch(request);
}
const worker = {
  async fetch(request: Request, env: Env) {
    try { return await handle(request, env); }
    catch (error) {
      if (error instanceof HttpError) return json({ error: error.message }, error.status);
      return json({ error: "No se pudo completar la operación. Tu borrador local se conserva. Inténtalo de nuevo." }, 503);
    }
  },
};
export default worker;
