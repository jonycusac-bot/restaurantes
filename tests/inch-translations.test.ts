import assert from "node:assert/strict";
import test from "node:test";
import { categories, menuSections } from "../src/app/inch/menu";
import { dishTranslations, ui } from "../src/app/inch/translations";
import {cartaOriginal} from "../src/lib/carta-original";

test("Every current INCH dish has an English and German name and description", () => {
  for (const dish of categories.flatMap(category => category.dishes)) {
    for (const language of ["en", "de"] as const) {
      const translated = dishTranslations[dish.name]?.[language];
      assert.ok(translated, `Missing ${language} translation for ${dish.name}`);
      assert.ok(translated[0].trim().length > 0);
      if(dish.description) assert.ok(translated[1].trim().length > 0);
      else assert.equal(translated[1],"","No inventar descripciones donde la fuente no aporta ninguna");
    }
  }
});

test("All three languages cover the menu categories and allergy information", () => {
  for (const language of ["es", "en", "de"] as const) {
    for (const category of categories) assert.ok(ui[language].categories[category.id as keyof typeof ui.es.categories]);
    assert.ok(ui[language].allergy.length > 30);
  }
});

test("The two menu sections keep the requested order and every existing dish exactly once", () => {
  assert.deepEqual(menuSections.map(s => s.categoryIds), [
    ["entrantes", "ensaladas", "sopas", "salteados", "curry", "arroces", "noodles", "infantil"],
    ["entradas", "tartar", "poke", "sashimi", "nigiris", "maki", "temaki", "gunkan", "uramaki"],
  ]);
  assert.deepEqual(menuSections.flatMap(s => s.categoryIds), categories.map(c => c.id));
  const dishes = categories.flatMap(c => c.dishes.map(d => d.name));
  const cartaCount=cartaOriginal.reduce((total,category)=>total+category.items.reduce((count,item)=>count+(item.variants?.length??1),0),0);
  assert.equal(dishes.length,cartaCount+7,"CARTA completa y los siete platos Sushi conservados");
  assert.equal(new Set(dishes).size,dishes.length);
});
