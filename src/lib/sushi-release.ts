import { initialDraft, type AdminDish } from "./inch-draft";
import { menuSections } from "../app/inch/menu";
import { sushiOriginal } from "./sushi-original";
import { parseCloudDishes } from "./cloud-draft";
import { canonicalEqual } from "./live-menu";

const sushiIds = new Set(menuSections.find(section => section.id === "sushi")!.categoryIds);
const oldNames: Record<string, string> = {
  "sashimi-0": "Sashimi de salmón",
  "nigiris-0": "Nigiri de salmón",
  "uramaki-0": "Uramaki de salmón",
  "uramaki-1": "California Roll",
  "uramaki-3": "Langostino Tempura Roll",
};

// One-time owner-approved Sushi replacement, separate from the original CARTA release.
// All unrequested entries remain in the admin catalogue, hidden with their photos.
export function approvedSushiDishes(draft: AdminDish[], published: AdminDish[]): AdminDish[] {
  if (!parseCloudDishes(draft) || !parseCloudDishes(published)) throw new Error("El respaldo del catálogo no es válido.");
  if (!canonicalEqual(draft, published)) throw new Error("Hay un cambio pendiente o distinto entre borrador y publicación; revisar antes de sustituir Sushi.");
  const previous = new Map(published.map(dish => [dish.id, dish]));
  const sourceIds = new Set(sushiOriginal.flatMap(category => category.items.map(item => item.legacyId).filter(Boolean)));
  const target = initialDraft.filter(dish => sushiIds.has(dish.categoryId));
  const claimed = new Set<string>();
  const next = target.map(dish => {
    const old = previous.get(dish.id);
    if (old) {
      if (old.categoryId !== dish.categoryId || (old.name !== dish.name && old.name !== oldNames[dish.id])) throw new Error(`Colisión de ID o identidad de plato: ${dish.id}`);
      claimed.add(dish.id);
      return { ...old, name: dish.name, price: dish.price };
    }
    if (sourceIds.has(dish.id)) throw new Error(`Falta correspondencia legacy para ID nuevo: ${dish.id}`);
    return { ...dish };
  });
  const archived = published.filter(dish => sushiIds.has(dish.categoryId) && !claimed.has(dish.id)).map(dish => ({ ...dish, hidden: true }));
  const result = [...published.filter(dish => !sushiIds.has(dish.categoryId)).map(dish => ({ ...dish })), ...next, ...archived];
  if (!parseCloudDishes(result)) throw new Error("La carta Sushi resultante no es válida.");
  return result;
}
