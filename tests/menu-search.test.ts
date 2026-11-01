import assert from "node:assert/strict";
import test from "node:test";
import { categories } from "../src/app/inch/menu";
import { visibleMenuCategories } from "../src/app/inch/menu-search";
import { applyDraftToMenu, initialDraft } from "../src/lib/inch-draft";

const text = (dish: { name: string; description: string }) => `${dish.name} ${dish.description}`;

test("buscar desde Entrantes encuentra Tom Kha en Sopas e Inch Roll en Sushi, agrupados en orden", () => {
  const soups = visibleMenuCategories(categories, "carta", "entrantes", "tom kha", text);
  assert.deepEqual(soups.map(category => category.id), ["sopas"]);
  assert.ok(soups[0].dishes.some(dish => dish.name.includes("Tom Kha")));

  const sushi = visibleMenuCategories(categories, "carta", "entrantes", "inch roll", text);
  assert.deepEqual(sushi.map(category => category.id), ["uramaki"]);
  assert.deepEqual(sushi[0].dishes.map(dish => dish.name), ["Inch Roll"]);
});

test("sin búsqueda se conserva la categoría activa y con cero resultados no aparecen categorías vacías", () => {
  assert.deepEqual(visibleMenuCategories(categories, "carta", "entrantes", "", text).map(category => category.id), ["entrantes"]);
  assert.deepEqual(visibleMenuCategories(categories, "carta", "entrantes", "    ", text).map(category => category.id), ["entrantes"]);
  assert.deepEqual(visibleMenuCategories(categories, "sushi", "sashimi", "un-plato-que-no-existe", text), []);
});

test("la búsqueda no muestra platos ocultos y mantiene el orden publicado dentro de cada categoría", () => {
  const hidden = initialDraft.find(dish => dish.name.includes("Tom Kha"))!;
  const published = applyDraftToMenu(initialDraft.map(dish => dish.id === hidden.id ? { ...dish, hidden: true } : dish));
  const result = visibleMenuCategories(published, "sushi", "uramaki", "pollo", text);
  assert.ok(result.length > 1);
  assert.ok(!result.flatMap(category => category.dishes).some(dish => dish.id === hidden.id));
  for (const category of result) {
    const source = published.find(candidate => candidate.id === category.id)!;
    assert.deepEqual(category.dishes.map(dish => dish.id), source.dishes.filter(dish => text(dish).toLowerCase().includes("pollo")).map(dish => dish.id));
  }
  assert.ok(visibleMenuCategories(published, "sushi", "uramaki", "sesamo", text).some(category => category.dishes.some(dish => dish.name.includes("Sésamo"))));
});
