import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import DishAllergens from '../src/app/inch/DishAllergens';
import {publicHtml} from '../src/cloudflare/html';
import {initialDraft} from '../src/lib/inch-draft';
test('la carta muestra los datos guardados incluso en variantes y elimina el piloto vacío',()=>{
 const variant=initialDraft.find(d=>d.name.includes('Gyozas')&&d.name.includes('Pollo'))!;assert.ok(variant);
 const dishes=initialDraft.map(d=>d.id==='carta-poh-pia-sod'?{...d,allergens:[]}:d.id===variant.id?{...d,allergens:['milk'] as ('milk')[]}:d);
 const html=publicHtml(dishes);
 assert.deepEqual([...html.matchAll(/data-dish-allergen="([^"]+)"/g)].map(m=>m[1]),['milk']);
 assert.doesNotMatch(renderToStaticMarkup(createElement(DishAllergens,{dishId:'carta-poh-pia-sod',language:'es',allergens:[]})),/data-dish-allergen/);
});
for(const language of ['es','en','de'] as const) test(`Poh Phia Sod: solo los tres alérgenos confirmados (${language})`,()=>{
 const html=renderToStaticMarkup(createElement(DishAllergens,{dishId:'carta-poh-pia-sod',language}));
 assert.deepEqual([...html.matchAll(/data-dish-allergen="([^"]+)"/g)].map(m=>m[1]),['gluten','crustaceans','eggs']);
 assert.match(html,new RegExp(`lang="${language}"`));
});
test('ningún otro plato hereda los alérgenos del ejemplo',()=>{
 for(const dishId of ['entrantes-0','entrantes-1','unknown',undefined]) assert.equal(renderToStaticMarkup(createElement(DishAllergens,{dishId,language:'es'})),'');
});
