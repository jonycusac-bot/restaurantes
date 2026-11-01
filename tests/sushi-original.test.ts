import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { categories, menuSections } from "../src/app/inch/menu";
import { sushiOriginal, sushiItemId } from "../src/lib/sushi-original";

const source = readFileSync(new URL("../design/inch/sushi-original-precios-2026-11-01.md", import.meta.url), "utf8");
const sectionIds: Record<string, string> = {
  "ENTRADAS": "entradas", "TARTAR": "tartar", "POKE BOWLS": "poke", "SASHIMI": "sashimi",
  "NIGIRIS (2 piezas)": "nigiris", "MAKI (8 piezas)": "maki", "TEMAKI (1 pieza)": "temaki",
  "GUNKAN (2 piezas)": "gunkan", "URAMAKI (8 piezas)": "uramaki",
};
const expected: { categoryId: string; name: string; cents: number; note?: string }[] = [];
let categoryId = "";
for (const line of source.split("\n")) {
  if (line.startsWith("## ")) categoryId = sectionIds[line.slice(3)] ?? "";
  const match = /^(.+): (\d+),(\d{2}) €$/.exec(line);
  if (!match) continue;
  assert.ok(categoryId, `Fila sin categoría: ${line}`);
  const portion = / \((\d+ piezas?)\)$/.exec(match[1]);
  expected.push({ categoryId, name: portion ? match[1].slice(0, -portion[0].length) : match[1], cents: Number(match[2]) * 100 + Number(match[3]), ...(portion ? { note: portion[1] } : {}) });
}

test("Sushi reproduce todos los nombres, categorías, importes y orden del texto del dueño", () => {
  const sushiIds = menuSections.find(section => section.id === "sushi")!.categoryIds;
  assert.deepEqual(categories.filter(category => sushiIds.includes(category.id)).flatMap(category =>
    category.dishes.map(dish => ({ categoryId: category.id, name: dish.name, cents: Math.round(dish.price * 100), ...(dish.note ? { note: dish.note } : {}) }))), expected);
  assert.equal(expected.length, 56);
});

test("las cantidades por categoría constan sin inventar descripciones para los nuevos", () => {
  const notes = { nigiris: "2 piezas", maki: "8 piezas", temaki: "1 pieza", gunkan: "2 piezas", uramaki: "8 piezas" };
  for (const [id, note] of Object.entries(notes)) assert.equal(categories.find(category => category.id === id)?.note, note);
  for (const category of categories.filter(category => ["tartar", "poke", "maki", "temaki", "gunkan"].includes(category.id))) {
    for (const dish of category.dishes) assert.equal(dish.description, "", `No se facilitó descripción para ${dish.name}`);
  }
});

test("sushiItemId genera IDs únicos para todos los items nuevos sin legacyId", () => {
  const generatedIds = sushiOriginal.flatMap(category =>
    category.items
      .filter(item => !item.legacyId)
      .map(item => sushiItemId(category.id, item))
  );
  assert.equal(new Set(generatedIds).size, generatedIds.length, "IDs generados duplicados");
  for (const id of generatedIds) assert.match(id, /^sushi-[a-z]+-.+$/, `Formato de ID inválido: ${id}`);
});
