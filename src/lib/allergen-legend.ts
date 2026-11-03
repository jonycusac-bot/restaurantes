import type { Language } from "../app/inch/translations";

// Labels translated from the owner's image, not declarations about any dish.
const rows = [
 ["milk", "Lácteos", "Milk", "Milch"],
 ["gluten", "Con gluten", "With gluten", "Mit Gluten"],
 ["fish", "Pescado", "Fish", "Fisch"],
 ["molluscs", "Moluscos", "Molluscs", "Weichtiere"],
 ["crustaceans", "Crustáceos", "Crustaceans", "Krebstiere"],
 ["sesame", "Sésamo", "Sesame", "Sesam"],
 ["peanuts", "Cacahuetes", "Peanuts", "Erdnüsse"],
 ["eggs", "Huevos", "Eggs", "Eier"],
 ["sulphites", "Sulfitos", "Sulphites", "Sulfite"],
 ["mustard", "Mostaza", "Mustard", "Senf"],
 ["soya", "Con soja", "With soya", "Mit Soja"],
 ["lupins", "Altramuces", "Lupins", "Lupinen"],
 ["celery", "Apio", "Celery", "Sellerie"],
 ["nuts", "Frutos secos", "Nuts", "Schalenfrüchte"],
] as const;
export const allergenLegend = rows.map(([id,es,en,de]) => ({id, icon:`/inch/allergen-${id}.webp`, labels:{es,en,de} as Record<Language,string>}));
export type AllergenId = typeof allergenLegend[number]['id'];
export const allergenLegendTitles:Record<Language,string> = {es:"Leyenda de alérgenos",en:"Allergen symbols",de:"Allergenlegende"};
