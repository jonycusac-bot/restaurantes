import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { existsSync } from "node:fs";
import AllergenLegend from "../src/app/inch/AllergenLegend";
import InchMenu from "../src/app/inch/InchMenu";

test("la carta integra la leyenda al final antes del pie",()=>{
 const html=renderToStaticMarkup(createElement<{publicOnly?:boolean}>(InchMenu,{publicOnly:true}));
 assert.match(html,/Leyenda de alérgenos/);
 assert.equal([...html.matchAll(/data-allergen-id=/g)].length,14);
 assert.ok(html.indexOf('class="inch-allergenLegend"')<html.indexOf('class="inch-footer"'));
});
import { allergenLegend } from "../src/lib/allergen-legend";

const expected = {
 es: ["Lácteos","Con gluten","Pescado","Moluscos","Crustáceos","Sésamo","Cacahuetes","Huevos","Sulfitos","Mostaza","Con soja","Altramuces","Apio","Frutos secos"],
 en: ["Milk","With gluten","Fish","Molluscs","Crustaceans","Sesame","Peanuts","Eggs","Sulphites","Mustard","With soya","Lupins","Celery","Nuts"],
 de: ["Milch","Mit Gluten","Fisch","Weichtiere","Krebstiere","Sesam","Erdnüsse","Eier","Sulfite","Senf","Mit Soja","Lupinen","Sellerie","Schalenfrüchte"],
};
for (const language of ["es","en","de"] as const) test(`leyenda: dibujos originales y nombres en ${language}`,()=>{
 const html=renderToStaticMarkup(createElement(AllergenLegend,{language}));
 assert.deepEqual([...html.matchAll(/<span>([^<]+)<\/span>/g)].map(m=>m[1]),expected[language]);
 assert.equal([...html.matchAll(/data-allergen-id=/g)].length,14);
 assert.equal([...html.matchAll(/<img /g)].length,14);
 assert.match(html,new RegExp(`lang="${language}"`));
 assert.doesNotMatch(html,/butterfish|pez mantequilla|gluten-free|sin gluten|data-dish-id/i);
 for(const row of allergenLegend){assert.ok(existsSync(`public${row.icon}`));assert.ok(html.includes(row.icon));}
});
test("identificadores estables y distintos, sin datos de platos",()=>{
 assert.equal(new Set(allergenLegend.map(a=>a.id)).size,14);
 assert.ok(allergenLegend.every(a=>Object.keys(a.labels).length===3));
});
