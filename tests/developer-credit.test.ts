import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import InchMenu from '../src/app/inch/InchMenu';

test('CUSAC WEB PROJECTS aparece después de INCH con enlace seguro en otra pestaña',()=>{
 const html=renderToStaticMarkup(createElement(InchMenu));
 const footer=html.match(/<footer\b[\s\S]*?<\/footer>/)?.[0]??'';
 assert.match(footer,/CUSAC/);
 assert.match(footer,/WEB PROJECTS/);
 assert.ok(footer.indexOf('CUSAC')>footer.indexOf('INCH · ASIAN FOOD'));
 const link=footer.match(/<a\b[^>]*class="inch-developer-credit"[^>]*>[\s\S]*?<\/a>/)?.[0]??'';
 assert.match(link,/href="https:\/\/cusac-web-designer\.ai\.studio\/"/);
 assert.match(link,/target="_blank"/);
 assert.match(link,/rel="noopener noreferrer"/);
 assert.doesNotMatch(link,/<img\b/);
});
