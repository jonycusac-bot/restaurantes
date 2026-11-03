"use client";
/* Static Cloudflare images; no Next image server. */
/* eslint-disable @next/next/no-img-element */
import {allergenLegend,type AllergenId} from '../../../lib/allergen-legend';

export default function AllergenSelector({selected,onChange}:{selected:AllergenId[];onChange:(ids:AllergenId[])=>void}){
 return <details className="admin-allergen-selector">
  <summary>Alérgenos <span>{selected.length ? `${selected.length} seleccionados` : 'Seleccionar'}</span></summary>
  <p>Marca los alérgenos confirmados de este plato. No marcar ninguno no acredita su ausencia.</p>
  <div className="admin-allergen-options">
   {allergenLegend.map(allergen=><label key={allergen.id}>
    <input type="checkbox" name="allergens" value={allergen.id} checked={selected.includes(allergen.id)} onChange={event=>onChange(event.target.checked?[...selected,allergen.id]:selected.filter(id=>id!==allergen.id))}/>
    <img src={allergen.icon} width="28" height="28" alt="" loading="lazy"/>
    <span>{allergen.labels.es}</span>
   </label>)}
  </div>
 </details>;
}
