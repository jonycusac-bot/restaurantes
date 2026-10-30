import { test } from "node:test";
import assert from "node:assert/strict";
import { diffDraft, isDisplayablePhoto } from "../src/lib/cloud-conflict";
import { initialDraft } from "../src/lib/inch-draft";

const base = initialDraft[0];

test("diffDraft reports changed fields plus added and removed dishes", () => {
  const local = [
    { ...base, id: "a", name: "Cambiado", price: 9 },
    { ...base, id: "solo-local", name: "Solo local" },
    { ...base, id: "igual", name: "Igual" },
  ];
  const cloud = [
    { ...base, id: "a", name: "Original", price: 5 },
    { ...base, id: "solo-cloud", name: "Solo nube" },
    { ...base, id: "igual", name: "Igual" },
  ];
  const diff = diffDraft(local, cloud);
  const byId = Object.fromEntries(diff.dishes.map(d => [d.id, d]));
  assert.equal(byId.a.status, "changed");
  assert.deepEqual(byId.a.fields.map(f => f.field).sort(), ["name", "price"]);
  assert.equal(byId["solo-local"].status, "added");
  assert.equal(byId["solo-cloud"].status, "removed");
  assert.equal(byId.igual.status, "same");
  assert.equal(diff.added, 1);
  assert.equal(diff.removed, 1);
  assert.equal(diff.changed, 1);
});

test("diffDraft never exposes photo data URLs as text and flags only safe thumbnails", () => {
  const local = [{ ...base, id: "a", imageSrc: "data:image/webp;base64,SECRETBASE64", imageName: "l.webp" }];
  const cloud = [{ ...base, id: "a", imageSrc: "", imageName: "Sin imagen" }];
  const diff = diffDraft(local, cloud);
  const dish = diff.dishes[0];
  assert.equal(dish.photoChanged, true);
  assert.equal(dish.localPhoto, "data:image/webp;base64,SECRETBASE64", "the component gets the validated src to render a thumbnail");
  assert.equal(dish.cloudPhoto, "");
  // No text field may leak the photo payload.
  const text = JSON.stringify(dish.fields);
  assert.ok(!text.includes("base64") && !text.includes("SECRET"), `fields must not leak photo data: ${text}`);
  assert.ok(dish.fields.some(f => f.field === "photo" && f.local === "Con foto" && f.cloud === "Sin foto"));
  assert.equal(isDisplayablePhoto("data:image/webp;base64,AAAA"), true);
  assert.equal(isDisplayablePhoto("/media/" + "a".repeat(64) + ".webp"), true);
  assert.equal(isDisplayablePhoto("/inch/fideos.webp"), true);
  assert.equal(isDisplayablePhoto("javascript:alert(1)"), false);
  assert.equal(isDisplayablePhoto(""), false);
});
