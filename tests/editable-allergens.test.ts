import test from 'node:test';
import assert from 'node:assert/strict';
import {initialDraft,parseDraft} from '../src/lib/inch-draft';
import {parseCloudDishes} from '../src/lib/cloud-draft';
import {applyLiveEdit,validateLiveEditRequest} from '../src/lib/live-menu';
import {buildLiveRequest} from '../src/app/admin/preview/useLiveMenu';
test('Guardar añade o quita alérgenos sin pisar el precio de otro dispositivo',()=>{
 const base=initialDraft[0];
 const desired={...base,allergens:['eggs'] as const};
 const request=buildLiveRequest(base,{...desired,allergens:[...desired.allergens]});
 assert.deepEqual(request,{kind:'update',id:base.id,changes:{allergens:{before:[],value:['eggs']}}});
 const validated=validateLiveEditRequest(request);assert.ok(validated);
 const current=[{...base,price:22}];
 const changed=applyLiveEdit(current,validated);assert.ok(changed.ok);
 assert.equal(changed.dishes[0].price,22);
 assert.deepEqual(changed.dishes[0].allergens,['eggs']);
 const removal=validateLiveEditRequest(buildLiveRequest(changed.dishes[0],{...changed.dishes[0],allergens:[]}));assert.ok(removal);
 const removed=applyLiveEdit(changed.dishes,removal);assert.ok(removed.ok);
 assert.deepEqual(removed.dishes[0].allergens,[]);
 const conflict=applyLiveEdit([{...base,allergens:['fish']}],validated);assert.equal(conflict.ok,false);
});
const base=initialDraft[0];
test('el piloto heredado permite desmarcar todo y no reaparece al guardar',()=>{
 const pilot={...initialDraft[0],id:'carta-poh-pia-sod'};
 const request=buildLiveRequest(pilot,{...pilot,allergens:[]});
 assert.deepEqual(request,{kind:'update',id:pilot.id,changes:{allergens:{before:['gluten','crustaceans','eggs'],value:[]}}});
 const edit=validateLiveEditRequest(request);assert.ok(edit);
 const removed=applyLiveEdit([pilot],edit);assert.ok(removed.ok);
 assert.deepEqual(removed.dishes[0].allergens,[]);
 assert.deepEqual(buildLiveRequest(removed.dishes[0],{...removed.dishes[0],price:33}),{kind:'update',id:pilot.id,changes:{price:{before:pilot.price,value:33}}});
});
test('rechaza identificadores desconocidos, repetidos y campos mal formados',()=>{
 for(const allergens of [null,'gluten',['other'],['eggs','eggs'],[1],{},Array(15).fill('milk')]){
  assert.equal(parseDraft(JSON.stringify([{...base,allergens}])),null);
  assert.equal(parseCloudDishes([{...base,allergens}]),null);
 }
 assert.deepEqual(parseCloudDishes([{...base,allergens:[]}]),[{...base,allergens:[]}]);
 assert.deepEqual(parseCloudDishes([base]),[base]);
});
test('los alérgenos seleccionados sobreviven a validación local y de nube',()=>{
 const dishes=[{...base,allergens:['gluten','eggs']}];
 assert.deepEqual(parseDraft(JSON.stringify(dishes)),dishes);
 assert.deepEqual(parseCloudDishes(dishes),dishes);
});
