import assert from "node:assert/strict";
import test from "node:test";
import { categories } from "../src/app/inch/menu";
import { dishTranslations, ui } from "../src/app/inch/translations";

test("Every current INCH dish has an English and German name and description", () => {
  for (const dish of categories.flatMap(category => category.dishes)) {
    for (const language of ["en", "de"] as const) {
      const translated = dishTranslations[dish.name]?.[language];
      assert.ok(translated, `Missing ${language} translation for ${dish.name}`);
      assert.ok(translated.every(text => text.trim().length > 0));
    }
  }
});

test("All three languages cover the menu categories and allergy information", () => {
  for (const language of ["es", "en", "de"] as const) {
    for (const category of categories) assert.ok(ui[language].categories[category.id as keyof typeof ui.es.categories]);
    assert.ok(ui[language].allergy.length > 30);
  }
});
