import assert from "node:assert/strict";
import test from "node:test";
import { categories, menuSections } from "../src/app/inch/menu";
import { dishTranslations, ui } from "../src/app/inch/translations";
import {cartaOriginal} from "../src/lib/carta-original";
import {sushiOriginal} from "../src/lib/sushi-original";
import {categoryNoteTranslations} from "../src/lib/carta-translations";

test("Las traducciones existentes no inventan descripciones de los platos originales", () => {
  const translatedDishes=categories.flatMap(category => category.dishes).filter(dish=>dishTranslations[dish.name]);
  for (const dish of translatedDishes) {
    for (const language of ["en", "de"] as const) {
      const translated = dishTranslations[dish.name]?.[language];
      assert.ok(translated, `Missing ${language} translation for ${dish.name}`);
      assert.ok(translated[0].trim().length > 0);
      if(dish.description) assert.ok(translated[1].trim().length > 0);
      else assert.equal(translated[1],"","No inventar descripciones donde la fuente no aporta ninguna");
    }
  }
  for(const category of categories.filter(category=>["tartar","poke","maki","temaki","gunkan"].includes(category.id)))
    for(const dish of category.dishes)assert.equal(dish.description,"","Sushi nuevo sin descripción inventada");
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
  assert.equal(dishes.length,cartaCount+sushiOriginal.reduce((count,category)=>count+category.items.length,0),"CARTA y los 56 platos Sushi solicitados");
  assert.equal(new Set(dishes).size,dishes.length);
});

test("las cantidades de Sushi se muestran también en inglés y alemán",()=>{
 for(const category of sushiOriginal.filter(category=>category.note)){
  assert.ok(categoryNoteTranslations[category.id]?.en,`Falta la cantidad de ${category.id} en inglés`);
  assert.ok(categoryNoteTranslations[category.id]?.de,`Falta la cantidad de ${category.id} en alemán`);
 }
 assert.equal(categoryNoteTranslations.temaki?.en,"1 piece");
});

test("las fichas Sushi renombradas conservan sus descripciones traducidas anteriores",()=>{
 const aliases={"Sashimi de Salmón":"Sashimi de salmón","Nigiri de Salmón":"Nigiri de salmón","Uramaki de Salmón":"Uramaki de salmón","Uramaki California":"California Roll","Uramaki de Langostino en Tempura":"Langostino Tempura Roll"};
 for(const [current,old] of Object.entries(aliases))for(const language of ["en","de"] as const){
  assert.equal(dishTranslations[current]?.[language][1],dishTranslations[old]?.[language][1],`Descripción conservada para ${current} en ${language}`);
 }
});
