// Source: design/inch/sushi-original-precios-2026-11-01.md (owner's 1 Nov list).
// Names and prices are exact; no descriptions or photos are inferred.
export type SushiSourceItem = { name: string; price: number; note?: string; legacyId?: string };
export type SushiSourceCategory = { id: string; note?: string; items: SushiSourceItem[] };
export const sushiOriginal: SushiSourceCategory[] = [
  { id: "entradas", items: [
    { name: "Edamame", price: 6, legacyId: "entradas-0" },
    { name: "Edamame con Lima y Guindilla", price: 9.15 },
    { name: "Ensalada de Wakame", price: 7.25 },
  ] },
  { id: "tartar", items: [
    { name: "Tartar de Salmón", price: 18.15 },
    { name: "Tartar de Atún", price: 20.85 },
    { name: "Tartar de Atún Picante", price: 21.40 },
    { name: "Tartar de Toro [Ventresca de Atún]", price: 22.95 },
  ] },
  { id: "poke", items: [
    { name: "Poke Vegano [Shiitake y Tofu]", price: 15.70 },
    { name: "Poke de Salmón", price: 17.60 },
    { name: "Poke de Atún", price: 19.10 },
    { name: "Poke Tropical", price: 18.05 },
  ] },
  { id: "sashimi", items: [
    { name: "Sashimi de Salmón", price: 12, note: "4 piezas", legacyId: "sashimi-0" },
    { name: "Sashimi de Pez Mantequilla", price: 11.25, note: "4 piezas" },
    { name: "Sashimi de Pez Limón", price: 11.25, note: "4 piezas" },
    { name: "Sashimi de Lubina Usuzukuri [Corte Fino]", price: 12, note: "8 piezas" },
    { name: "Sashimi de Atún", price: 12.75, note: "4 piezas" },
    { name: "Sashimi de Toro [Ventresca de Atún]", price: 16.80, note: "4 piezas" },
    { name: "Sashimi Variado [Moriawase]", price: 21.10, note: "8 piezas" },
  ] },
  { id: "nigiris", note: "2 piezas", items: [
    { name: "Nigiri de Huevo de Codorniz con Trufa", price: 6 },
    { name: "Nigiri de Salmón", price: 6.45, legacyId: "nigiris-0" },
    { name: "Nigiri de Gamba Dulce", price: 6.30 },
    { name: "Nigiri de Pez Mantequilla", price: 6.45 },
    { name: "Nigiri de Atún", price: 7.15 },
    { name: "Nigiri de Pez Limón", price: 7.15 },
    { name: "Nigiri de Lubina", price: 7.15 },
    { name: "Nigiri Steak Tartar", price: 8 },
    { name: "Nigiri de Anguila", price: 7.60 },
    { name: "Nigiri de Toro [Ventresca de Atún]", price: 8.20 },
    { name: "Nigiri Flambeado de Salmón", price: 7.15 },
    { name: "Nigiri Flambeado de Toro [Ventresca de Atún]", price: 8.40 },
    { name: "Nigiri Flambeado de Toro [Ventresca de Atún] con Huevo de Codorniz y Trufa", price: 9.65 },
  ] },
  { id: "maki", note: "8 piezas", items: [
    { name: "Maki de Wakame", price: 6.20 },
    { name: "Maki de Pepino", price: 6 },
    { name: "Maki de Aguacate", price: 6 },
    { name: "Maki de Salmón", price: 8.40 },
    { name: "Maki de Atún", price: 8.60 },
    { name: "Maki de Tartar de Toro", price: 9.45 },
  ] },
  { id: "temaki", note: "1 pieza", items: [
    { name: "Temaki de Salmón", price: 8.70 },
    { name: "Temaki de Cangrejo de Concha Blanda", price: 9.60 },
    { name: "Temaki de Langostino en Tempura con Salsa Kimchi", price: 8.70 },
    { name: "Temaki de Atún Picante con Huevo de Codorniz", price: 9.95 },
  ] },
  { id: "gunkan", note: "2 piezas", items: [
    { name: "Gunkan de Tobiko [Huevas de Pez Volador]", price: 7.15 },
    { name: "Gunkan de Vieira", price: 7.35 },
    { name: "Gunkan de Toro [Ventresca de Atún]", price: 9.25 },
    { name: "Gunkan de Ikura [Huevas de Salmón]", price: 8.70 },
  ] },
  { id: "uramaki", note: "8 piezas", items: [
    { name: "Uramaki de Salmón", price: 13, legacyId: "uramaki-0" },
    { name: "Uramaki de Atún", price: 13.55 },
    { name: "Uramaki de Langostino en Tempura", price: 14.45, legacyId: "uramaki-3" },
    { name: "Uramaki de Anguila", price: 15.65 },
    { name: "Uramaki California", price: 11, legacyId: "uramaki-1" },
    { name: "Uramaki Frito", price: 14.45 },
    { name: "Uramaki Cangrejo Blando", price: 14.85 },
    { name: "Uramaki Cangrejo Real", price: 17.60 },
    { name: "Uramaki de Pez Mantequilla", price: 18.05 },
    { name: "Uramaki Flambeado de Salmón", price: 18.05 },
    { name: "Uramaki Flambeado de Toro [Ventresca de Atún]", price: 18.45 },
  ] },
];

// Stable name-derived IDs only for first-time additions; legacy IDs keep owner photos.
export function sushiItemId(categoryId: string, item: SushiSourceItem): string {
  return item.legacyId ?? `sushi-${categoryId}-${item.name.toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}
