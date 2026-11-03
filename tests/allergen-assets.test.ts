import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {allergenLegend} from '../src/lib/allergen-legend';
import {execFileSync} from 'node:child_process';
// Exercise the actual builder: this also works from a clean checkout.
test('Cloudflare distribuye todos los dibujos originales sin alterarlos',()=>{
 execFileSync(process.execPath,['node_modules/tsx/dist/cli.mjs','scripts/build-cloudflare.tsx'],{stdio:'pipe'});
 for(const allergen of allergenLegend){
  const output=`dist-cloudflare${allergen.icon}`;
  assert.ok(existsSync(output),`Falta ${output}`);
  assert.deepEqual(readFileSync(output),readFileSync(`public${allergen.icon}`));
 }
});
