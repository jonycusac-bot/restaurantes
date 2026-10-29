import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import type { AdminDish } from "../src/lib/inch-draft";
import type { CloudDraft } from "../src/lib/cloud-draft";

async function main() {
  const base = process.env.INCH_TEST_BASE ?? "http://127.0.0.1:8788";
  if (!new URL(base).hostname.match(/^(127\.0\.0\.1|localhost)$/) && process.env.INCH_NEW_DEMO_CHECK !== "1") throw new Error("Solo se comprueba una base local o una demo nueva explícitamente autorizada.");
  let cookie = "";
  const request = (path: string, method = "GET", data?: unknown, origin = base) => fetch(base + path, { method, headers: { ...(cookie ? { Cookie: cookie } : {}), Origin: origin, ...(data === undefined ? {} : { "Content-Type": "application/json" }) }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
  assert.equal((await request("/api/admin/draft")).status, 401);
  const loginPage = await (await request("/admin")).text(); assert.match(loginPage, /Acceso privado/);
  assert.equal((await request("/api/admin/login", "POST", { password: "incorrecta" })).status, 401);
  const login = await request("/api/admin/login", "POST", { password: process.env.INCH_TEST_PASSWORD ?? "123456" });
  assert.equal(login.status, 200, await login.clone().text());
  cookie = login.headers.get("set-cookie")!.split(";")[0];
  assert.match(login.headers.get("set-cookie")!, /HttpOnly; SameSite=Strict/);
  const original: CloudDraft = await (await request("/api/admin/draft")).json();
  if (!new URL(base).hostname.match(/^(127\.0\.0\.1|localhost)$/)) assert.equal(original.revision, 1, "La demo remota ya tiene cambios: no ejecutar una prueba que sustituya su carta. Usar una base local limpia.");
  assert.equal(original.canPublish, true); assert.equal(original.imageStorage, true);
  const before = await (await request("/")).text();
  let changed = false;
  try {
    assert.equal((await request("/api/admin/draft", "PUT", { revision: original.revision, dishes: original.dishes }, "https://otro.test")).status, 403);
    const invalid = original.dishes.map((d, i) => i ? d : { ...d, imageSrc: "https://otro.test/foto.svg" });
    assert.equal((await request("/api/admin/draft", "PUT", { revision: original.revision, dishes: invalid })).status, 422);
    const bytes = await readFile("public/inch/fideos.webp");
    const upload = await fetch(base + "/api/admin/images", { method: "POST", headers: { Cookie: cookie, Origin: base, "Content-Type": "image/webp" }, body: bytes });
    assert.equal(upload.status, 200, await upload.clone().text());
    const imageSrc = (await upload.json()).imageSrc;
    const downloaded = await request(imageSrc);
    assert.equal(downloaded.headers.get("content-type"), "image/webp");
    assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()), bytes);
    const marker = "Plato de verificación INCH";
    const dishes: AdminDish[] = original.dishes.map((d, i) => i === 0 ? { ...d, name: marker, price: 7.77, imageSrc, imageName: "fideos.webp" } : i === 1 ? { ...d, hidden: true } : d);
    const saved = await request("/api/admin/draft", "PUT", { revision: original.revision, dishes });
    assert.equal(saved.status, 200, await saved.clone().text()); changed = true;
    const snapshot: CloudDraft = await saved.json();
    assert.equal(snapshot.revision, original.revision + 1);
    assert.equal(await (await request("/")).text(), before, "Guardar borrador no debe cambiar la carta");
    assert.equal((await request("/api/admin/draft", "PUT", { revision: original.revision, dishes: original.dishes })).status, 409);
    assert.equal((await request("/api/admin/publish", "POST", { revision: original.revision })).status, 409);
    const published = await request("/api/admin/publish", "POST", { revision: snapshot.revision });
    assert.equal(published.status, 200, await published.clone().text());
    const after = await (await request("/")).text();
    assert.match(after, /Plato de verificación INCH/); assert.match(after, /7,77/); assert.ok(after.includes(imageSrc));
    assert.equal(after.includes(`<h3>${original.dishes[1].name}</h3>`), false, "El plato oculto no debe renderizarse");
    const anotherBrowser = await fetch(base + "/api/admin/draft", { headers: { Cookie: cookie } });
    assert.equal((await anotherBrowser.json()).dishes[0].name, marker);
    console.log("Correctos: sesión, privacidad, origen, validación, foto persistente, borrador separado, conflicto, publicación y lectura desde otra sesión.");
  } finally {
    if (changed) {
      const latest: CloudDraft = await (await request("/api/admin/draft")).json();
      const restore = await request("/api/admin/draft", "PUT", { revision: latest.revision, dishes: original.dishes });
      assert.equal(restore.status, 200, "No se pudo restaurar la carta de la demo");
      const restored: CloudDraft = await restore.json();
      assert.equal((await request("/api/admin/publish", "POST", { revision: restored.revision })).status, 200);
      console.log("Carta inicial de la demo restaurada tras la comprobación.");
    }
  }
  const logout = await request("/api/admin/logout", "POST"); assert.match(logout.headers.get("set-cookie")!, /Max-Age=0/);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
