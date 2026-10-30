import assert from "node:assert/strict";
import { pbkdf2Sync, randomBytes, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Miniflare } from "miniflare";
import { getAdminPanelState } from "../src/lib/admin-panel-state";
import type { CloudDraft } from "../src/lib/cloud-draft";
import { initialDraft } from "../src/lib/inch-draft";
import { publicHtml } from "../src/cloudflare/html";

async function check(base: string) {
  let cookie = "";
  const request = (url: string, method = "GET", body?: unknown) => fetch(base + url, {
    method,
    headers: { Origin: base, ...(cookie ? { Cookie: cookie } : {}), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  assert.equal((await request("/api/admin/draft")).status, 401);
  const login = await request("/api/admin/login", "POST", { password: "local-panel-qa-only" });
  assert.equal(login.status, 200, "Usar únicamente el servidor de QA con sus credenciales de prueba");
  cookie = login.headers.get("set-cookie")!.split(";")[0];
  const original: CloudDraft = await (await request("/api/admin/draft")).json();
  const options = { enabled: true, busy: false, pending: false };
  assert.equal(original.publishedRevision, original.revision);
  assert.equal(getAdminPanelState(original.dishes, original, options).label, "Carta publicada");
  const before = await (await request("/")).text();
  const bytes = await readFile("public/inch/fideos.webp");
  const photo = await fetch(base + "/api/admin/images", { method: "POST", headers: { Cookie: cookie, Origin: base, "Content-Type": "image/webp" }, body: bytes });
  assert.equal(photo.status, 200);
  const { imageSrc } = await photo.json() as { imageSrc: string };
  assert.deepEqual(Buffer.from(await (await request(imageSrc)).arrayBuffer()), bytes);
  const marker = `QA panel ${randomUUID()}`;
  const changed = original.dishes.map((dish, index) => index === 0 ? { ...dish, name: marker, price: 7.25, imageSrc, imageName: "qa-foto.webp" } : dish);
  assert.equal(getAdminPanelState(changed, original, options).label, "Cambios sin guardar");
  const save = await request("/api/admin/draft", "PUT", { revision: original.revision, dishes: changed });
  assert.equal(save.status, 200);
  const saved: CloudDraft = await save.json();
  assert.equal(saved.publishedRevision, original.revision);
  assert.equal(getAdminPanelState(saved.dishes, saved, options).label, "Guardado, pendiente de publicar");
  assert.equal(await (await request("/")).text(), before, "Guardar no cambia la carta pública");
  assert.equal((await request("/api/admin/draft", "PUT", { revision: original.revision, dishes: original.dishes })).status, 409);
  // Conflict resolution contract: re-read the latest cloud copy, then retry the
  // save explicitly with the reviewed revision. Resolving must never publish.
  const reread: CloudDraft = await (await request("/api/admin/draft")).json();
  assert.equal(reread.revision, saved.revision, "the re-read returns the latest cloud revision for review");
  assert.equal(await (await request("/")).text(), before, "re-reading the conflict does not change the public menu");
  const reviewedLocal = changed.map((dish, index) => index === 0 ? { ...dish, name: `${marker} revisado` } : dish);
  const retry = await request("/api/admin/draft", "PUT", { revision: reread.revision, dishes: reviewedLocal });
  assert.equal(retry.status, 200, "an explicit retry with the reviewed revision saves without a 409 loop");
  const retried: CloudDraft = await retry.json();
  assert.equal(retried.dishes[0].name, reviewedLocal[0].name, "the explicitly chosen local edit is the copy that persists");
  assert.equal(retried.publishedRevision, original.revision, "publication metadata stays truthful after resolution");
  assert.equal(getAdminPanelState(retried.dishes, retried, options).label, "Guardado, pendiente de publicar");
  assert.equal(await (await request("/")).text(), before, "resolving the conflict overwrites the draft but never publishes");
  assert.equal((await request("/api/admin/draft", "PUT", { revision: reread.revision, dishes: reread.dishes })).status, 409, "the old revision still conflicts after the retry");
  const publish = await request("/api/admin/publish", "POST", { revision: retried.revision });
  assert.equal(publish.status, 200);
  const reloaded: CloudDraft = await (await request("/api/admin/draft")).json();
  assert.equal(reloaded.publishedRevision, retried.revision);
  assert.equal(getAdminPanelState(reloaded.dishes, reloaded, options).label, "Carta publicada");
  const after = await (await request("/")).text();
  assert.ok(after.includes(marker));
  assert.ok(after.includes(imageSrc));
  console.log("QA D1 aislada: edición → guardado con foto → publicación → recarga conserva el estado; conflicto 409, relectura y reintento explícito intactos; publicar solo tras resolver. Sin escrituras remotas.");
}
async function main() {
  // Start our own Worker and ephemeral D1: no Wrangler discovery, real secrets,
  // ordinary local state, remote database, or caller-supplied target URL.
  const salt = randomBytes(16);
  const hash = `pbkdf2$100000$${salt.toString("hex")}$${pbkdf2Sync("local-panel-qa-only", salt, 100000, 32, "sha256").toString("hex")}`;
  const runtime = new Miniflare({
    host: "127.0.0.1", port: 0, enableDevRegistry: false, telemetry: { enabled: false },
    workers: [{ config: {
      name: "inch-panel-local-qa", compatibilityDate: "2026-10-29",
      manifest: { mainModule: "worker.js", modules: { "worker.js": { type: "esm", contents: await readFile("dist-cloudflare/_worker.js", "utf8") } } },
      env: {
        DB: { type: "d1", id: "inch-panel-local-qa" },
        INCH_CF_PASSWORD_HASH: { type: "text", value: hash },
        INCH_CF_SESSION_SECRET: { type: "text", value: randomBytes(32).toString("hex") },
      },
    } }],
  });
  try {
    const base = (await runtime.ready).origin;
    const db = await runtime.getD1Database("DB");
    const migration = await readFile("cloudflare/migrations/0001_menu.sql", "utf8");
    // This migration contains only DDL with no semicolons inside SQL literals.
    for (const statement of migration.split(";").map(value => value.trim()).filter(Boolean)) await db.prepare(statement).run();
    await db.prepare("INSERT INTO inch_draft (id,dishes) VALUES ('inch', ?)").bind(JSON.stringify(initialDraft)).run();
    await db.prepare("INSERT INTO inch_publication (id,html) VALUES ('inch', ?)").bind(publicHtml(initialDraft)).run();
    await check(base);
  } finally {
    await runtime.dispose();
    console.log("Worker de QA cerrado; base temporal descartada.");
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
