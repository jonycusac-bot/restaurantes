import type { PresentableDish } from "../../lib/menu-presentation";
import { cartaOriginal } from "../../lib/carta-original";
import { buildCartaCategories } from "../../lib/carta-menu";
import { sushiOriginal, sushiItemId } from "../../lib/sushi-original";

export type Dish = PresentableDish;
export type Category = { id: string; name: string; subtitle?: string; note?: string; dishes: Dish[] };

// Selección transcrita de la carta pública enlazada el 28/10/2026.
// No sustituye la validación de precios, disponibilidad o alérgenos por el restaurante.
const prototypeCategories: Category[] = [
  { id: "entrantes", name: "Para empezar", subtitle: "Pequeños bocados. Grandes comienzos.", dishes: [
    { name: "Edamame", description: "Un clásico para abrir el apetito.", price: 6 },
    { name: "Poh Pia", description: "Rollitos fritos de verduras.", price: 6.3, note: "2 piezas" },
    { name: "Chicken Satay", description: "Pinchitos de pollo con salsa de cacahuetes.", price: 8.1, note: "2 piezas" },
    { name: "Gyozas de pollo", description: "Empanadillas japonesas rellenas de pollo.", price: 10, note: "6 piezas" },
    { name: "Gyozas de verduras", description: "Empanadillas japonesas rellenas de verduras.", price: 9.6, note: "6 piezas" },
    { name: "Tempura", description: "Langostinos tigre con mahonesa de kimchi.", price: 12.75, image: "tempura-gyozas", imageAlt: "Fotografía de ejemplo con langostinos en tempura y gyozas" },
  ] },
  { id: "sushi", name: "El arte del sushi", subtitle: "El equilibrio está en cada pieza.", dishes: [
    { name: "Uramaki de salmón", description: "Salmón, aguacate y pepino.", price: 13, note: "8 piezas", image: "uramaki", imageAlt: "Fotografía de ejemplo de uramaki, variedad pendiente de confirmar" },
    { name: "California Roll", description: "Aguacate, pepino y bocas de mar.", price: 11, note: "8 piezas", image: "california-roll", imageAlt: "Fotografía de ejemplo de rolls de sushi" },
    { name: "Inch Roll", description: "Cangrejo real, mango, espárrago y aguacate con wasabi.", price: 17.6, note: "8 piezas" },
    { name: "Langostino Tempura Roll", description: "Langostino en tempura, kimchi, tobico y aguacate.", price: 14.45, note: "8 piezas" },
    { name: "Nigiri de salmón", description: "Salmón sobre arroz de sushi.", price: 6.45, note: "2 piezas" },
    { name: "Sashimi de salmón", description: "Salmón en corte sashimi.", price: 12, note: "4 piezas", image: "sashimi", imageAlt: "Fotografía de ejemplo de una tabla de sashimi variado" },
  ] },
  { id: "noodles", name: "Noodles & wok", subtitle: "El sabor de las calles de Asia.", dishes: [
    { name: "Noodles al huevo con langostinos", description: "Fideos finos de trigo, langostinos y verduras.", price: 13.2, image: "fideos", imageAlt: "Fotografía de ejemplo de fideos con langostinos" },
    { name: "Pad Thai de pollo", description: "Fideos anchos de arroz con pollo y verduras.", price: 13.2 },
    { name: "Pad Thai de langostinos", description: "Fideos anchos de arroz con langostinos y verduras.", price: 14.45 },
    { name: "Udon de verduras", description: "Fideos gruesos de trigo con verduras.", price: 12.75 },
    { name: "Singapore Vermicelli", description: "Fideos finos de guisantes con pollo, ternera, langostinos y verduras.", price: 16.8 },
  ] },
  { id: "ramen", name: "Un buen bowl", subtitle: "Para saborear hasta la última cucharada.", dishes: [
    { name: "Ramen de pollo", description: "La versión de pollo del ramen de la casa.", price: 14.45 },
    { name: "Ramen de verduras", description: "La versión de verduras del ramen de la casa.", price: 13.2 },
    { name: "Tom Kha de pollo", description: "Sopa con leche de coco y pollo.", price: 8.7 },
    { name: "Laksa Lemak", description: "Sopa de coco de Singapur, tallarines de arroz, pollo, gambas, tofu de pescado frito, brotes de soja y huevo.", price: 17.6 },
  ] },
  { id: "curry", name: "Alma de curry", subtitle: "Aromas que te llevan lejos.", dishes: [
    { name: "Curry de pollo", description: "A elegir: amarillo, rojo o verde. Arroz al vapor adicional: 3 €.", price: 14.45 },
    { name: "Curry de tofu y verduras", description: "A elegir: amarillo, rojo o verde. Arroz al vapor adicional: 3 €.", price: 13.2 },
    { name: "Massaman de ternera", description: "Curry del centro de Tailandia. Arroz al vapor adicional: 3 €.", price: 15.65 },
    { name: "Katsukarē", description: "Curry japonés con pollo crujiente. Arroz al vapor adicional: 3 €.", price: 15.65 },
  ] },
];

export type MenuSection = "carta" | "sushi";
export const menuSections: { id: MenuSection; categoryIds: string[] }[] = [
  { id: "carta", categoryIds: ["entrantes", "ensaladas", "sopas", "salteados", "curry", "arroces", "noodles", "infantil"] },
  { id: "sushi", categoryIds: ["entradas", "tartar", "poke", "sashimi", "nigiris", "maki", "temaki", "gunkan", "uramaki"] },
];

const existing = (id: string) => {
  const category = prototypeCategories.find(c => c.id === id);
  if (!category) throw new Error(`Categoría prototype no encontrada: ${id}`);
  return category.dishes;
};
const findDish = (categoryId: string, name: string) => {
  const dish = existing(categoryId).find(d => d.name === name);
  if (!dish) throw new Error(`Plato prototype no encontrado: ${name} en ${categoryId}`);
  return dish;
};
const legacySushi = new Map<string, Dish>([
  ["entradas-0", findDish("entrantes", "Edamame")],
  ["sashimi-0", findDish("sushi", "Sashimi de salmón")],
  ["nigiris-0", findDish("sushi", "Nigiri de salmón")],
  ["uramaki-0", findDish("sushi", "Uramaki de salmón")],
  ["uramaki-1", findDish("sushi", "California Roll")],
  ["uramaki-3", findDish("sushi", "Langostino Tempura Roll")],
]);
const sushiNames: Record<string, string> = { entradas: "Entradas", tartar: "Tartar", poke: "Poke Bowls", sashimi: "Sashimi", nigiris: "Nigiris", maki: "Maki", temaki: "Temaki", gunkan: "Gunkan", uramaki: "Uramaki" };
export const categories: Category[] = [
  ...buildCartaCategories(cartaOriginal),
  ...sushiOriginal.map(category => ({
    id: category.id, name: sushiNames[category.id], note: category.note,
    dishes: category.items.map(item => {
      const previous = legacySushi.get(item.legacyId ?? "");
      return { ...previous, id: sushiItemId(category.id, item), name: item.name, description: previous?.description ?? "", price: item.price, note: item.note };
    }),
  })),
];
