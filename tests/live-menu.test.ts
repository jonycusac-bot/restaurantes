import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyLiveEdit,
  canonicalEqual,
  liveFieldValue,
  validateLiveEditRequest,
  LIVE_FIELD_LABELS,
} from "../src/lib/live-menu";
import { initialDraft, type AdminDish } from "../src/lib/inch-draft";

const base = initialDraft[0];
const photo = { imageSrc: `/media/${"a".repeat(64)}.webp`, imageName: "plato.webp" };

test("labelled fields cover every whitelisted live field", () => {
  assert.deepEqual(Object.keys(LIVE_FIELD_LABELS).sort(), ["categoryId", "description", "hidden", "image", "name", "price"]);
});

test("validateLiveEditRequest rejects unknown fields, malformed entries and non-whitelisted keys", () => {
  const bad = [
    null,
    [],
    { kind: "nope" },
    { kind: "update" },
    { kind: "update", id: "", changes: { name: { before: "a", value: "b" } } },
    { kind: "update", id: base.id, changes: { bogus: { before: "a", value: "b" } } },
    { kind: "update", id: base.id, changes: { price: {} } },
    { kind: "update", id: base.id, changes: { price: { before: 1 } } },
    { kind: "update", id: base.id, changes: { price: { before: 1, value: 2, extra: 3 } } },
    { kind: "update", id: base.id, changes: { price: { before: Number.NaN, value: 2 } } },
    { kind: "update", id: base.id, changes: { price: { before: 1, value: Number.POSITIVE_INFINITY } } },
    { kind: "update", id: base.id, changes: { name: { before: "ok", value: 5 } } },
    { kind: "update", id: base.id, changes: { categoryId: { before: base.categoryId, value: "no-existe" } } },
  ];
  for (const value of bad) assert.equal(validateLiveEditRequest(value), null, JSON.stringify(value));
});

test("validateLiveEditRequest rejects external routes and Base64 image sources but accepts stored photos", () => {
  for (const imageSrc of ["https://evil.example/x.webp", "//evil.example/x.webp", "data:image/png;base64,AAAA", "/etc/passwd", `/media/${"Z".repeat(64)}.webp`]) {
    assert.equal(validateLiveEditRequest({ kind: "update", id: base.id, changes: { image: { before: { imageSrc: "", imageName: "Sin imagen" }, value: { imageSrc, imageName: "x.webp" } } } }), null, imageSrc);
  }
  const accepted = validateLiveEditRequest({ kind: "update", id: base.id, changes: { image: { before: { imageSrc: "", imageName: "Sin imagen" }, value: photo } } });
  assert.ok(accepted && accepted.kind === "update");
});

test("validateLiveEditRequest accepts a well formed update", () => {
  const edit = validateLiveEditRequest({ kind: "update", id: base.id, changes: { name: { before: base.name, value: "Nuevo nombre" }, price: { before: base.price, value: base.price + 1 } } });
  assert.deepEqual(edit, { kind: "update", id: base.id, changes: { name: { before: base.name, value: "Nuevo nombre" }, price: { before: base.price, value: base.price + 1 } } });
});

test("validateLiveEditRequest accepts a fully formed dish as create and rejects invalid dishes", () => {
  const dish: AdminDish = { ...base, id: "creado-1", name: "Plato creado" };
  const edit = validateLiveEditRequest({ kind: "create", dish });
  assert.ok(edit && edit.kind === "create");
  assert.deepEqual(edit.dish, { id: "creado-1", categoryId: base.categoryId, name: "Plato creado", description: base.description, price: base.price, hidden: base.hidden, imageSrc: base.imageSrc, imageName: base.imageName });
  for (const badDish of [{ ...base, id: "x", price: -1 }, { ...base, id: "x", categoryId: "bogus" }, { ...base, id: "x", imageSrc: "data:image/png;base64,AA" }, { ...base, id: "x", name: "   " }, "not-a-dish"]) {
    assert.equal(validateLiveEditRequest({ kind: "create", dish: badDish }), null, JSON.stringify(badDish));
  }
});

test("canonical equality ignores object key order and compares by value", () => {
  assert.ok(canonicalEqual({ imageSrc: "a", imageName: "b" }, { imageName: "b", imageSrc: "a" }));
  assert.ok(canonicalEqual({ a: [1, { x: 1, y: 2 }] }, { a: [1, { y: 2, x: 1 }] }));
  assert.equal(canonicalEqual({ a: 1 }, { a: 2 }), false);
  assert.equal(canonicalEqual({ a: 1 }, { a: "1" }), false);
});

test("liveFieldValue groups imageSrc and imageName under the image field", () => {
  assert.deepEqual(liveFieldValue(base, "image"), { imageSrc: base.imageSrc, imageName: base.imageName });
  assert.equal(liveFieldValue(base, "price"), base.price);
});

test("update applies the value when the current field still matches before", () => {
  const dishes = initialDraft.slice(0, 2);
  const result = applyLiveEdit(dishes, { kind: "update", id: base.id, changes: { price: { before: base.price, value: 9.5 } } });
  assert.ok(result.ok);
  assert.equal(result.changed, true);
  assert.equal(result.dishes.find(d => d.id === base.id)!.price, 9.5);
  assert.equal(result.dishes.length, 2);
});

test("update is idempotent when the current field already equals value", () => {
  const result = applyLiveEdit(initialDraft, { kind: "update", id: base.id, changes: { price: { before: 1, value: base.price } } });
  assert.ok(result.ok);
  assert.equal(result.changed, false);
  assert.equal(result.dishes, initialDraft);
});

test("update applies the image field atomically as one coherent pair", () => {
  const result = applyLiveEdit(initialDraft, { kind: "update", id: base.id, changes: { image: { before: { imageSrc: base.imageSrc, imageName: base.imageName }, value: photo } } });
  assert.ok(result.ok);
  const dish = result.dishes.find(d => d.id === base.id)!;
  assert.equal(dish.imageSrc, photo.imageSrc);
  assert.equal(dish.imageName, photo.imageName);
});

test("update preserves another device's independent field while applying ours", () => {
  const current = initialDraft.map((d, i) => i === 0 ? { ...d, description: "Descripción de otro dispositivo" } : d);
  const result = applyLiveEdit(current, { kind: "update", id: base.id, changes: { price: { before: base.price, value: 12 } } });
  assert.ok(result.ok);
  const dish = result.dishes.find(d => d.id === base.id)!;
  assert.equal(dish.price, 12);
  assert.equal(dish.description, "Descripción de otro dispositivo");
});

test("update refuses to write when the same field changed elsewhere and reports a detailed conflict", () => {
  const current = initialDraft.map((d, i) => i === 0 ? { ...d, price: 8 } : d);
  const result = applyLiveEdit(current, { kind: "update", id: base.id, changes: { price: { before: base.price, value: 7 } } });
  assert.ok(!result.ok);
  assert.deepEqual(result.conflicts, [{
    field: "price",
    label: LIVE_FIELD_LABELS.price,
    before: base.price,
    value: 7,
    current: 8,
  }]);
});

test("update reports a conflict without writing for every field when the dish no longer exists", () => {
  const result = applyLiveEdit(initialDraft, { kind: "update", id: "desaparecido", changes: { name: { before: "a", value: "b" } } });
  assert.ok(!result.ok);
  assert.equal(result.conflicts.length, 1);
  assert.equal(result.conflicts[0].current, null);
});

test("create appends a new dish, keeps duplicate identical content idempotent and blocks a real collision", () => {
  const dish: AdminDish = { ...base, id: "creado-1", name: "Plato creado" };
  const appended = applyLiveEdit(initialDraft, { kind: "create", dish });
  assert.ok(appended.ok);
  assert.equal(appended.changed, true);
  assert.equal(appended.dishes.at(-1)!.id, "creado-1");

  const again = applyLiveEdit(appended.dishes, { kind: "create", dish });
  assert.ok(again.ok);
  assert.equal(again.changed, false);

  const colliding = applyLiveEdit(appended.dishes, { kind: "create", dish: { ...dish, name: "Otro nombre" } });
  assert.ok(!colliding.ok);
  assert.equal(colliding.conflicts[0].field, "name");
  assert.equal(colliding.conflicts[0].before, "Plato creado");
  assert.equal(colliding.conflicts[0].value, "Otro nombre");
});

test("update applies multiple independent fields in one edit", () => {
  const result = applyLiveEdit(initialDraft, { kind: "update", id: base.id, changes: {
    name: { before: base.name, value: "Nombre nuevo" },
    hidden: { before: base.hidden, value: !base.hidden },
    image: { before: { imageSrc: base.imageSrc, imageName: base.imageName }, value: photo },
  } });
  assert.ok(result.ok);
  const dish = result.dishes.find(d => d.id === base.id)!;
  assert.equal(dish.name, "Nombre nuevo");
  assert.equal(dish.hidden, !base.hidden);
  assert.equal(dish.imageSrc, photo.imageSrc);
});
