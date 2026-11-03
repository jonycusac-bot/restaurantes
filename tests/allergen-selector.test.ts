import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import AllergenSelector from '../src/app/admin/preview/AllergenSelector';
test('desplegable de selección múltiple: dibujos, etiquetas y casillas preseleccionadas',()=>{
 const html=renderToStaticMarkup(createElement(AllergenSelector,{selected:['gluten','eggs'],onChange:()=>{}}));
 assert.match(html,/<details/);assert.match(html,/<summary>Alérgenos/);
 assert.equal([...html.matchAll(/type="checkbox"/g)].length,14);
 assert.equal([...html.matchAll(/checked=""/g)].length,2);
 assert.equal([...html.matchAll(/<img /g)].length,14);
 assert.match(html,/Con gluten/);assert.match(html,/Huevos/);
 assert.doesNotMatch(html,/type="submit"|sin alérgenos/i);
});
