/* eslint-disable @next/next/no-img-element */
import type { Language } from './translations';
import {dishAllergens} from '../../lib/dish-allergens';
import {allergenLegend,type AllergenId} from '../../lib/allergen-legend';

// Render persisted choices; legacy pilot compatibility is centralized.
const titles:Record<Language,string>={es:'Alérgenos',en:'Allergens',de:'Allergene'};
export default function DishAllergens({dishId,language,allergens}:{dishId?:string;language:Language;allergens?:AllergenId[]}) {
 const ids=dishAllergens({id:dishId,allergens});
 if(!ids.length) return null;
 return <ul className="inch-dishAllergens" lang={language} aria-label={titles[language]}>
  {ids.map(id=>{
   const allergen=allergenLegend.find(a=>a.id===id)!;
   return <li key={id} data-dish-allergen={id}><img src={allergen.icon} width="28" height="28" alt="" loading="lazy"/><span>{allergen.labels[language]}</span></li>;
  })}
 </ul>;
}
