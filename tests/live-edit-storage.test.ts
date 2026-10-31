import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { initialDraft, storageKey } from "../src/lib/inch-draft";

test("un formulario incompleto se conserva sin convertirlo en un plato publicable", async () => {
  const { persistLiveEdit, listLiveEdits } = await import("../src/lib/live-edit-storage");
  const entries = new Map<string,string>();
  const storage = { get length() { return entries.size; }, key: (index:number) => [...entries.keys()][index] ?? null, getItem: (key:string) => entries.get(key) ?? null, setItem: (key:string,value:string) => { entries.set(key,value); }, removeItem: (key:string) => { entries.delete(key); } };
  persistLiveEdit(storage, { token: "nuevo-plato", base: null, dish: { ...initialDraft[0], name: "" }, priceText: "" });
  assert.equal(listLiveEdits(storage)[0].dish.name, "");
  assert.equal(listLiveEdits(storage)[0].priceText, "");
});

test("las ediciones nuevas se conservan por separado sin sustituir el borrador antiguo", async () => {
  assert.ok(existsSync("src/lib/live-edit-storage.ts"), "Debe existir una conservación independiente para las ediciones del modo directo");
  const { persistLiveEdit, listLiveEdits, removeLiveEdit } = await import("../src/lib/live-edit-storage");
  const entries = new Map<string,string>([[storageKey, "copia-antigua-no-tocar"]]);
  const storage = { get length() { return entries.size; }, key: (index:number) => [...entries.keys()][index] ?? null, getItem: (key:string) => entries.get(key) ?? null, setItem: (key:string,value:string) => { entries.set(key,value); }, removeItem: (key:string) => { entries.delete(key); } };
  const first = { token: "edicion-a", base: initialDraft[0], dish: { ...initialDraft[0], name: "Nombre sin guardar" }, priceText: "15" };
  const second = { token: "edicion-b", base: initialDraft[1], dish: { ...initialDraft[1], imageSrc: "data:image/webp;base64,YQ==", imageName: "pendiente.webp" }, priceText: "8.10" };
  persistLiveEdit(storage, first);
  persistLiveEdit(storage, second);
  assert.equal(listLiveEdits(storage).length, 2);
  assert.equal(listLiveEdits(storage)[1].dish.imageSrc, second.dish.imageSrc);
  removeLiveEdit(storage, first.token);
  assert.equal(listLiveEdits(storage).length, 1);
  assert.equal(entries.get(storageKey), "copia-antigua-no-tocar");
});
