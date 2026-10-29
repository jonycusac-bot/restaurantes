import { cookieFromRequest, validSession } from "./admin-auth";
import { parseCloudDishes } from "./cloud-draft";
import type { DraftStore } from "./inch-database";

const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const json = (value: unknown, status = 200) => Response.json(value, { status, headers });
export async function handleDraftRequest(request: Request, store: () => DraftStore): Promise<Response> {
  if (!validSession(cookieFromRequest(request))) return json({ error: "Tu sesión ha caducado. Vuelve a entrar; el borrador local se conserva." }, 401);
  if (!["GET", "PUT"].includes(request.method)) return json({ error: "Método no permitido." }, 405);
  if (request.method === "PUT" && request.headers.get("origin") !== new URL(request.url).origin) return json({ error: "Origen no permitido." }, 403);
  try {
    if (request.method === "GET") return json(await store().read());
    if (!request.headers.get("content-type")?.includes("application/json")) return json({ error: "Formato no válido." }, 415);
    const maxBytes = 2 * 1024 * 1024;
    if (Number(request.headers.get("content-length")) > maxBytes) return json({ error: "El borrador supera el tamaño permitido." }, 413);
    const reader = request.body?.getReader();
    if (!reader) return json({ error: "Falta el borrador." }, 400);
    let body = ""; let bytes = 0;
    const decoder = new TextDecoder();
    while (true) {
      const part = await reader.read(); if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > maxBytes) { await reader.cancel(); return json({ error: "El borrador supera el tamaño permitido." }, 413); }
      body += decoder.decode(part.value, { stream: true });
    }
    body += decoder.decode();
    let payload;
    try { payload = JSON.parse(body); } catch { return json({ error: "El borrador no es válido." }, 400); }
    if (!payload || !Number.isSafeInteger(payload.revision) || payload.revision < 1) return json({ error: "Falta la versión del borrador. Carga la copia de la nube." }, 422);
    const dishes = parseCloudDishes(payload.dishes);
    if (!dishes) return json({ error: "Revisa los platos. Las fotos nuevas todavía se conservan solo en el navegador." }, 422);
    const saved = await store().save(dishes, payload.revision);
    return saved ? json(saved) : json({ error: "Hay una versión más reciente en la nube. Tus cambios locales se conservan; carga la nube antes de volver a guardar." }, 409);
  } catch {
    // Never return database errors or connection strings to the browser.
    return json({ error: "No se pudo conectar con la base de datos. El borrador local se conserva. Inténtalo de nuevo." }, 503);
  }
}
