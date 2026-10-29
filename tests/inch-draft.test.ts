import assert from "node:assert/strict";
import test from "node:test";
import { applyDraftToMenu, initialDraft, parseDraft, readLocalPreviewSnapshot } from "../src/lib/inch-draft";

test("Draft preview shows new dishes, edited prices and uploaded photos while omitting hidden dishes", () => {
  const draft = initialDraft.map(d => d.id === "entrantes-0" ? { ...d, price: 59, imageSrc: "data:image/png;base64,aGVsbG8=" } : d.id === "entrantes-1" ? { ...d, hidden: true } : d);
  draft.push({ id: "new-dish", categoryId: "infantil", name: "Plato de prueba", description: "Descripción nueva", price: 6, hidden: false, imageSrc: "", imageName: "Sin imagen" });
  const menu = applyDraftToMenu(draft);
  const starters = menu.find(c => c.id === "entrantes")!.dishes;
  assert.equal(starters.find(d => d.id === "entrantes-0")!.price, 59);
  assert.equal(starters.find(d => d.id === "entrantes-0")!.imageSrc, "data:image/png;base64,aGVsbG8=");
  assert.ok(!starters.some(d => d.id === "entrantes-1"));
  assert.equal(menu.find(c => c.id === "infantil")!.dishes[0].name, "Plato de prueba");
  assert.equal(initialDraft[0].price, 6.3);
});

test("Malformed drafts never replace the original menu", () => {
  assert.equal(parseDraft("not-json"), null);
  assert.equal(parseDraft(JSON.stringify([{ ...initialDraft[0], price: -2 }])), null);
  assert.equal(parseDraft(JSON.stringify([{ ...initialDraft[0], imageSrc: "javascript:alert(1)" }])), null);
  assert.equal(parseDraft(JSON.stringify([initialDraft[0], initialDraft[0]])), null);
  assert.deepEqual(parseDraft(JSON.stringify(initialDraft)), initialDraft);
});

test("Production never reads a local admin draft", () => {
  const environment: Record<string, string | undefined> = process.env;
  const previous = environment.NODE_ENV;
  try { environment.NODE_ENV = "production"; assert.equal(readLocalPreviewSnapshot(), ""); }
  finally { if (previous === undefined) delete environment.NODE_ENV; else environment.NODE_ENV = previous; }
});
