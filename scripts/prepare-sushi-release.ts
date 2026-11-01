import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Miniflare } from "miniflare";
import { approvedSushiDishes } from "../src/lib/sushi-release";
import { cartaReleaseStatements } from "../src/lib/carta-release";
import { publicHtml } from "../src/cloudflare/html";
import { menuSections } from "../src/app/inch/menu";
import type { AdminDish } from "../src/lib/inch-draft";

// Creates private release artifacts after testing the exact snapshot in ephemeral D1.
// No remote URL, credentials or remote write is present in this script.
async function main() {
  const directory = path.resolve("backups-private/2026-11-01-sushi-release");
  const baseline = JSON.parse(await readFile(path.join(directory, "baseline.json"), "utf8"));
  const before = baseline.publishedDishes as AdminDish[];
  const dishes = approvedSushiDishes(baseline.draftDishes, before);
  const html = publicHtml(dishes);
  const statements = cartaReleaseStatements(baseline, dishes, html);
  const sushiIds = new Set(menuSections.find(section => section.id === "sushi")!.categoryIds);
  const carta = (list: AdminDish[]) => list.filter(dish => !sushiIds.has(dish.categoryId));
  assert.deepEqual(carta(dishes), carta(before), "CARTA no se modifica");
  const visible = dishes.filter(dish => sushiIds.has(dish.categoryId) && !dish.hidden);
  assert.equal(visible.length, 56);
  for (const old of before.filter(dish => !!dish.imageSrc)) {
    const current = dishes.find(dish => dish.id === old.id);
    assert.ok(current, `No borrar ficha con foto ${old.id}`);
    assert.equal(current.imageSrc, old.imageSrc);
    assert.equal(current.imageName, old.imageName);
  }
  const embedded = html.match(/<script id="inch-menu-data" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(embedded);
  assert.deepEqual(JSON.parse(embedded), dishes, "HTML publica exactamente los datos aprobados");

  const runtime = new Miniflare({ host: "127.0.0.1", port: 0, enableDevRegistry: false, telemetry: { enabled: false }, workers: [{ config: { name: "sushi-release-qa", compatibilityDate: "2026-10-29", manifest: { mainModule: "worker.js", modules: { "worker.js": { type: "esm", contents: 'export default {fetch(){return new Response("QA")}}' } } }, env: { DB: { type: "d1", id: "sushi-release-qa" } } } }] });
  try {
    await runtime.ready;
    const db = await runtime.getD1Database("DB");
    for (const sql of (await readFile("cloudflare/migrations/0001_menu.sql", "utf8")).split(";").map(statement => statement.trim()).filter(Boolean)) await db.prepare(sql).run();
    await db.prepare("INSERT INTO inch_draft(id,dishes,revision,updated_at) VALUES('inch',?,?,?)").bind(baseline.draft.dishes, baseline.draft.revision, baseline.draft.updated_at).run();
    await db.prepare("INSERT INTO inch_publication(id,html,revision,source_revision,updated_at) VALUES('inch',?,?,?,?)").bind(baseline.publication.html, baseline.publication.revision, baseline.publication.source_revision, baseline.publication.updated_at).run();
    for (const statement of statements) await db.prepare(statement).run();
    const draft = await db.prepare("SELECT dishes,revision FROM inch_draft WHERE id='inch'").first<{ dishes: string; revision: number }>();
    const publication = await db.prepare("SELECT html,revision,source_revision FROM inch_publication WHERE id='inch'").first<{ html: string; revision: number; source_revision: number }>();
    assert.deepEqual(JSON.parse(draft!.dishes), dishes);
    assert.equal(publication!.html, html);
    assert.equal(draft!.revision, baseline.draft.revision + 1);
    assert.equal(publication!.revision, baseline.publication.revision + 1);
    assert.equal(publication!.source_revision, draft!.revision);
    assert.equal((await db.prepare("SELECT count(*) AS count FROM sqlite_master WHERE type='trigger'").first<{ count: number }>())!.count, 0);
  } finally { await runtime.dispose(); }

  const summary = { rehearsalPassed: true, visibleSushi: visible.length, hiddenSushiPreserved: dishes.filter(dish => sushiIds.has(dish.categoryId) && dish.hidden).length, cartaUnchanged: true, photoReferencesPreserved: before.filter(dish => !!dish.imageSrc).length, expectedDraftRevision: baseline.draft.revision + 1, expectedPublicationRevision: baseline.publication.revision + 1, htmlBytes: new TextEncoder().encode(html).byteLength, remoteWrites: false };
  await writeFile(path.join(directory, "approved-menu.json"), JSON.stringify(dishes));
  await writeFile(path.join(directory, "approved-publication.html"), html);
  await writeFile(path.join(directory, "apply-sushi.sql"), statements.join(";\n") + ";\n");
  await writeFile(path.join(directory, "approved-summary.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
