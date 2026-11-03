import {allergenLegend,type AllergenId} from './allergen-legend';
// Backwards compatibility for the owner's already-published pilot only.
// Explicit saved [] overrides it; no other dish receives inferred allergens.
export function dishAllergens(dish:{id?:string;allergens?:AllergenId[]}):AllergenId[]{
 return dish.allergens ?? (dish.id==='carta-poh-pia-sod' ? ['gluten','crustaceans','eggs'] : []);
}
const known=new Set<string>(allergenLegend.map(a=>a.id));
export function validAllergens(value:unknown):value is AllergenId[]{
 return Array.isArray(value)&&value.length<=known.size&&new Set(value).size===value.length&&value.every(id=>typeof id==='string'&&known.has(id));
}
