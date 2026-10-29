import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, scryptSync } from "node:crypto";
import { authAction } from "../src/lib/admin-auth";
import { handleDraftRequest } from "../src/lib/admin-draft-api";
import { draftForCloud, parseCloudDishes, preserveLocalPhotos, type CloudDraft } from "../src/lib/cloud-draft";
import { initialDraft } from "../src/lib/inch-draft";
import { inchDatabase, postgresDraftStore, type DraftStore } from "../src/lib/inch-database";

test("la nube conserva metadatos y excluye fotos Base64 sin perder la foto del navegador", () => {
  const edited = [{ ...initialDraft[0], price: 15, imageSrc: "data:image/webp;base64,YQ==", imageName: "nueva.webp" }];
  const cloud = draftForCloud(edited);
  assert.equal(cloud[0].price, 15);
  assert.equal(cloud[0].imageSrc, initialDraft[0].imageSrc);
  assert.equal(edited[0].imageSrc, "data:image/webp;base64,YQ==");
  assert.deepEqual(preserveLocalPhotos(cloud, edited), edited);
  assert.equal(parseCloudDishes(edited), null);
  assert.equal(parseCloudDishes([{ ...cloud[0], name: "x".repeat(161) }]), null);
  assert.equal(parseCloudDishes([{ ...cloud[0], categoryId: "desconocida" }]), null);
});

test("API privada: sesión, origen, validación, guardado, conflicto y error sin filtración", async () => {
  const originalHash = process.env.INCH_ADMIN_PASSWORD_HASH, originalKey = process.env.INCH_ADMIN_SESSION_SECRET;
  const salt = randomBytes(16).toString("hex");
  process.env.INCH_ADMIN_PASSWORD_HASH = `${salt}:${scryptSync("test-login", salt, 64).toString("hex")}`;
  process.env.INCH_ADMIN_SESSION_SECRET = randomBytes(32).toString("hex");
  try {
    let snapshot: CloudDraft = { dishes: initialDraft, revision: 1, updatedAt: new Date().toISOString() };
    let reads = 0;
    const store: DraftStore = { read: async () => { reads++; return snapshot; }, save: async (dishes, revision) => revision === snapshot.revision ? (snapshot = { dishes, revision: revision + 1, updatedAt: new Date().toISOString() }) : null };
    const unauth = await handleDraftRequest(new Request("https://inch.test/api/admin/draft"), () => { throw new Error("No debe llegar a la base"); });
    assert.equal(unauth.status, 401); assert.equal(reads, 0);
    const login = await authAction(new Request("https://inch.test/api/admin/login", { method: "POST", headers: { Origin: "https://inch.test", "Content-Type": "application/json" }, body: JSON.stringify({ password: "test-login" }) }));
    const cookie = login.headers.get("set-cookie")!.split(";")[0];
    const request = (method: string, payload?: unknown, origin = "https://inch.test") => new Request("https://inch.test/api/admin/draft", { method, headers: { Cookie: cookie, Origin: origin, "Content-Type": "application/json" }, ...(payload === undefined ? {} : { body: JSON.stringify(payload) }) });
    const read = await handleDraftRequest(request("GET"), () => store);
    assert.equal(read.status, 200); assert.match(read.headers.get("cache-control")!, /no-store/);
    const changed = [{ ...initialDraft[0], price: 15, hidden: true }, { ...initialDraft[0], id: "nuevo", name: "Nuevo plato" }];
    assert.equal((await handleDraftRequest(request("PUT", { revision: 1, dishes: changed }, "https://otro.test"), () => store)).status, 403);
    assert.equal((await handleDraftRequest(request("PUT", { revision: 1, dishes: [{ ...changed[0], price: -1 }] }), () => store)).status, 422);
    assert.equal((await handleDraftRequest(request("PUT", { revision: 1, dishes: changed }), () => store)).status, 200);
    const loaded = await (await handleDraftRequest(request("GET"), () => store)).json();
    assert.equal(loaded.revision, 2); assert.equal(loaded.dishes[0].price, 15); assert.equal(loaded.dishes[0].hidden, true); assert.equal(loaded.dishes[1].id, "nuevo");
    assert.equal((await handleDraftRequest(request("PUT", { revision: 1, dishes: initialDraft }), () => store)).status, 409);
    assert.equal(snapshot.dishes[0].price, 15);
    const bad = request("PUT", {}); // Malformed JSON is handled separately.
    assert.equal((await handleDraftRequest(bad, () => store)).status, 422);
    const failure = await handleDraftRequest(request("GET"), () => { throw new Error("private-database-credential"); });
    assert.equal(failure.status, 503); assert.equal((await failure.text()).includes("private-database-credential"), false);
  } finally {
    if (originalHash) process.env.INCH_ADMIN_PASSWORD_HASH = originalHash; else delete process.env.INCH_ADMIN_PASSWORD_HASH;
    if (originalKey) process.env.INCH_ADMIN_SESSION_SECRET = originalKey; else delete process.env.INCH_ADMIN_SESSION_SECRET;
  }
});

test("PostgreSQL real: persiste borrador y evita dos escrituras simultáneas sobre una versión", { skip: process.env.INCH_DB_INTEGRATION !== "1" }, async () => {
  const database = inchDatabase();
  const menuId = `test-${randomBytes(12).toString("hex")}`;
  try {
    await database.query("INSERT INTO inch_menu_drafts (menu_id, dishes) VALUES ($1, $2::jsonb)", [menuId, JSON.stringify(initialDraft)]);
    const store = postgresDraftStore(database, menuId);
    const read = await store.read(); assert.equal(read.revision, 1);
    const changes = [{ ...initialDraft[0], price: 99, hidden: true }];
    const results = await Promise.all([store.save(changes, 1), store.save(initialDraft, 1)]);
    assert.equal(results.filter(Boolean).length, 1);
    const after = await store.read(); assert.equal(after.revision, 2);
    assert.deepEqual(after.dishes, results.find(Boolean)!.dishes);
    assert.equal(await store.save(initialDraft, 1), null);
  } finally {
    await database.query("DELETE FROM inch_menu_drafts WHERE menu_id = $1", [menuId]);
    await database.end();
  }
});
