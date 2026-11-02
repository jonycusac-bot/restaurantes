import { cartaOriginal, type CartaCategory } from "./carta-original";

// Approved EXISTING rows only. Every sourceLine points into the owner's literal 72-price list.
// Four new-only rows are intentionally absent. Existing old-only rows remain in cartaOriginal.
const corrections = [
  {
    "id": "entrantes-0",
    "name": "Poh Pia",
    "price": 5.2,
    "sourceLine": 2,
    "description": "Rollitos de Verduras Fritos"
  },
  {
    "id": "carta-poh-pia-sod",
    "name": "Poh Phia Sod",
    "price": 7.9,
    "sourceLine": 3,
    "description": "Rollitos Vietnamitas Fritos con Pollo y Gambas"
  },
  {
    "id": "carta-pollo-sesamo",
    "name": "Pollo con Sésamo",
    "price": 7.5,
    "sourceLine": 4
  },
  {
    "id": "entrantes-1",
    "name": "Chicken Satay",
    "price": 6.3,
    "sourceLine": 5,
    "description": "Pinchitos de Pollo con Salsa de Cacahuetes"
  },
  {
    "id": "carta-alitas-pollo",
    "name": "Alitas de Pollo Inch",
    "price": 7.5,
    "sourceLine": 6
  },
  {
    "id": "entrantes-3",
    "name": "Gyozas de Verduras",
    "price": 7.1,
    "sourceLine": 7
  },
  {
    "id": "entrantes-2",
    "name": "Gyozas de Pollo",
    "price": 7.1,
    "sourceLine": 8
  },
  {
    "id": "carta-gyozas-gambas",
    "name": "Gyozas de Gambas",
    "price": 8.1,
    "sourceLine": 9
  },
  {
    "id": "carta-gyozas-okonomiyaki-pollo",
    "name": "Gyozas Okonomiyaki de Pollo con Escamas de Bonito",
    "price": 9.5,
    "sourceLine": 10
  },
  {
    "id": "entrantes-4",
    "name": "Tempura de Langostinos Tigre con Mahonesa de Kimchi",
    "price": 10.3,
    "sourceLine": 11
  },
  {
    "id": "carta-ensalada-inch",
    "name": "Ensalada Inch",
    "price": 11.9,
    "sourceLine": 13,
    "description": "Pollo Teriyaki"
  },
  {
    "id": "carta-yam-woonsen",
    "name": "Ensalada Yam Woonsen",
    "price": 10.9,
    "sourceLine": 14,
    "description": "Fideos de Arroz y Gambas"
  },
  {
    "id": "carta-ensalada-ginger",
    "name": "Ensalada Ginger",
    "price": 10.9,
    "sourceLine": 15,
    "description": "Pollo Marinado estilo Coreano"
  },
  {
    "id": "carta-sopa-miso",
    "name": "Sopa de Miso",
    "price": 4.9,
    "sourceLine": 21
  },
  {
    "id": "carta-tom-yum-pollo",
    "name": "Sopa Tom Yum de Pollo",
    "price": 6.9,
    "sourceLine": 22,
    "description": "Agripicante"
  },
  {
    "id": "carta-tom-yum-gambas",
    "name": "Sopa Tom Yum de Gambas",
    "price": 7.9,
    "sourceLine": 23,
    "description": "Agripicante"
  },
  {
    "id": "sopas-2",
    "name": "Sopa Tom Kha de Pollo",
    "price": 6.9,
    "sourceLine": 24,
    "description": "Leche de Coco"
  },
  {
    "id": "carta-tom-kha-gambas",
    "name": "Sopa Tom Kha de Gambas",
    "price": 7.9,
    "sourceLine": 25,
    "description": "Leche de Coco"
  },
  {
    "id": "sopas-3",
    "name": "Laksa Lemak",
    "price": 13.5,
    "sourceLine": 26,
    "description": "Tallarines de Arroz, Pollo, Gambas, Tofu y Huevo en Sopa de Coco"
  },
  {
    "id": "sopas-1",
    "name": "Ramen de Verduras",
    "price": 9.9,
    "sourceLine": 27
  },
  {
    "id": "sopas-0",
    "name": "Ramen de Pollo",
    "price": 10.9,
    "sourceLine": 28
  },
  {
    "id": "carta-ramen-ternera",
    "name": "Ramen de Ternera",
    "price": 11.5,
    "sourceLine": 29
  },
  {
    "id": "carta-ramen-gambas",
    "name": "Ramen de Gambas",
    "price": 11.9,
    "sourceLine": 30
  },
  {
    "id": "carta-kapraw-tofu-verduras",
    "name": "Salteado Kapraw - Tofu y Verduras",
    "price": 9.9,
    "sourceLine": 32,
    "description": "Chile y Albahaca"
  },
  {
    "id": "carta-kapraw-pollo",
    "name": "Salteado Kapraw - Pollo",
    "price": 10.9,
    "sourceLine": 33,
    "description": "Chile y Albahaca"
  },
  {
    "id": "carta-kapraw-ternera",
    "name": "Salteado Kapraw - Ternera",
    "price": 11.9,
    "sourceLine": 34,
    "description": "Chile y Albahaca"
  },
  {
    "id": "carta-kapraw-langostinos",
    "name": "Salteado Kapraw - Langostinos",
    "price": 12.9,
    "sourceLine": 35,
    "description": "Chile y Albahaca"
  },
  {
    "id": "carta-kapraw-pato",
    "name": "Salteado Kapraw - Pato",
    "price": 15.9,
    "sourceLine": 36,
    "description": "Chile y Albahaca"
  },
  {
    "id": "carta-gai-pad-med",
    "name": "Gai Pad Med",
    "price": 11.9,
    "sourceLine": 37,
    "description": "Pollo con Anacardos"
  },
  {
    "id": "carta-morning-glory",
    "name": "Morning Glory",
    "price": 10.9,
    "sourceLine": 38,
    "description": "Pak Choi, Espinacas, Brotes de Soja y Salsa de Ajo"
  },
  {
    "id": "carta-salteados-arroz-vapor",
    "name": "Guarnición: Arroz al Vapor",
    "price": 2.7,
    "sourceLine": 39
  },
  {
    "id": "carta-salteados-arroz-frito",
    "name": "Guarnición: Arroz Frito con Huevo",
    "price": 3.9,
    "sourceLine": 40
  },
  {
    "id": "curry-1",
    "name": "Curry - Tofu y Verduras",
    "price": 9.9,
    "sourceLine": 43
  },
  {
    "id": "curry-0",
    "name": "Curry - Pollo",
    "price": 10.9,
    "sourceLine": 44
  },
  {
    "id": "carta-curry-ternera",
    "name": "Curry - Ternera",
    "price": 11.9,
    "sourceLine": 45
  },
  {
    "id": "carta-curry-langostinos",
    "name": "Curry - Langostinos",
    "price": 12.9,
    "sourceLine": 46
  },
  {
    "id": "carta-curry-pato",
    "name": "Curry - Pato",
    "price": 15.9,
    "sourceLine": 47
  },
  {
    "id": "carta-massaman-pollo",
    "name": "Curry Mussa Man - Pollo",
    "price": 10.9,
    "sourceLine": 48
  },
  {
    "id": "curry-2",
    "name": "Curry Mussa Man - Ternera",
    "price": 11.9,
    "sourceLine": 49
  },
  {
    "id": "carta-massaman-langostinos",
    "name": "Curry Mussa Man - Langostinos",
    "price": 12.9,
    "sourceLine": 50
  },
  {
    "id": "carta-massaman-pato",
    "name": "Curry Mussa Man - Pato",
    "price": 15.9,
    "sourceLine": 51
  },
  {
    "id": "curry-3",
    "name": "Katsu Kare",
    "price": 12.9,
    "sourceLine": 52,
    "description": "Pollo Crujiente con Curry Japonés"
  },
  {
    "id": "carta-arroz-frito-verduras",
    "name": "Arroz Frito con Verduras",
    "price": 8.5,
    "sourceLine": 56
  },
  {
    "id": "carta-arroz-frito-pollo",
    "name": "Arroz Frito con Pollo",
    "price": 9.5,
    "sourceLine": 57
  },
  {
    "id": "carta-arroz-frito-ternera",
    "name": "Arroz Frito con Ternera",
    "price": 9.9,
    "sourceLine": 58
  },
  {
    "id": "carta-arroz-frito-langostinos",
    "name": "Arroz Frito con Langostinos",
    "price": 10.5,
    "sourceLine": 59
  },
  {
    "id": "carta-arroz-frito-mezcla-2",
    "name": "Arroz Frito Mix 2 Ingredientes",
    "price": 11.5,
    "sourceLine": 60
  },
  {
    "id": "carta-arroz-frito-mezcla-3",
    "name": "Arroz Frito Mix 3 Ingredientes",
    "price": 12.5,
    "sourceLine": 61
  },
  {
    "id": "carta-al-huevo-verduras",
    "name": "Noodles al Huevo con Verduras",
    "price": 8.5,
    "sourceLine": 65
  },
  {
    "id": "carta-al-huevo-pollo",
    "name": "Noodles al Huevo con Pollo",
    "price": 9.5,
    "sourceLine": 66
  },
  {
    "id": "carta-al-huevo-ternera",
    "name": "Noodles al Huevo con Ternera",
    "price": 9.9,
    "sourceLine": 67
  },
  {
    "id": "noodles-0",
    "name": "Noodles al Huevo con Langostinos",
    "price": 10.5,
    "sourceLine": 68
  },
  {
    "id": "carta-al-huevo-mezcla-2",
    "name": "Noodles al Huevo Mix 2 Ingredientes",
    "price": 11.5,
    "sourceLine": 69
  },
  {
    "id": "carta-al-huevo-mezcla-3",
    "name": "Noodles al Huevo Mix 3 Ingredientes",
    "price": 12.5,
    "sourceLine": 70
  },
  {
    "id": "carta-pad-thai-verduras",
    "name": "Pad Thai con Verduras",
    "price": 8.9,
    "sourceLine": 72
  },
  {
    "id": "noodles-1",
    "name": "Pad Thai con Pollo",
    "price": 9.9,
    "sourceLine": 73
  },
  {
    "id": "carta-pad-thai-ternera",
    "name": "Pad Thai con Ternera",
    "price": 10.9,
    "sourceLine": 74
  },
  {
    "id": "noodles-2",
    "name": "Pad Thai con Langostinos",
    "price": 11.4,
    "sourceLine": 75
  },
  {
    "id": "carta-pad-thai-mezcla-2",
    "name": "Pad Thai Mix 2 Ingredientes",
    "price": 11.9,
    "sourceLine": 76
  },
  {
    "id": "carta-pad-thai-mezcla-3",
    "name": "Pad Thai Mix 3 Ingredientes",
    "price": 12.9,
    "sourceLine": 77
  },
  {
    "id": "noodles-3",
    "name": "Udon Japonés con Verduras",
    "price": 8.9,
    "sourceLine": 79
  },
  {
    "id": "carta-udon-pollo",
    "name": "Udon Japonés con Pollo",
    "price": 9.9,
    "sourceLine": 80
  },
  {
    "id": "carta-udon-ternera",
    "name": "Udon Japonés con Ternera",
    "price": 10.9,
    "sourceLine": 81
  },
  {
    "id": "carta-udon-langostinos",
    "name": "Udon Japonés con Langostinos",
    "price": 11.4,
    "sourceLine": 82
  },
  {
    "id": "carta-udon-mezcla-2",
    "name": "Udon Japonés Mix 2 Ingredientes",
    "price": 11.9,
    "sourceLine": 83
  },
  {
    "id": "carta-udon-mezcla-3",
    "name": "Udon Japonés Mix 3 Ingredientes",
    "price": 12.9,
    "sourceLine": 84
  },
  {
    "id": "noodles-4",
    "name": "Singapore Vermicelli Mix (Pollo + Ternera + Langostinos)",
    "price": 12.9,
    "sourceLine": 86
  },
  {
    "id": "carta-menu-infantil",
    "name": "Menú Infantil (Noodles o Arroz con Pollo / Ternera / Langostinos)",
    "price": 7.5,
    "sourceLine": 88,
    "description": "Noodles o Arroz con Pollo / Ternera / Langostinos"
  }
] as const;

const groupTitles:Record<string,string>={
 "carta-tom-yum":"Sopa Tom Yum", "carta-tom-kha":"Sopa Tom Kha",
 "carta-kapraw":"Salteado Kapraw", "carta-salteados-acompanamientos":"Guarnición",
 "carta-massaman":"Curry Mussa Man", "carta-al-huevo":"Noodles al Huevo",
 "carta-vermicelli":"Singapore Vermicelli",
};
export const cartaActualizada: CartaCategory[] = cartaOriginal.map(category => ({
  ...category,
  // The new list does not say rice is included; no new paid rice dish is created.
  note: category.id === "curry" ? undefined : category.note,
  items: category.items.map(item => {
    const update = (id: string) => corrections.find(row => row.id === id);
    if (item.variants) return { ...item, name:groupTitles[item.id]??item.name, variants: item.variants.map(variant => {
      const row = update(variant.legacyId ?? variant.id);
      return row ? { ...variant, name: row.name, description: "description" in row ? row.description : item.description, price: row.price, sourceLine: row.sourceLine } : { ...variant };
    }) };
    const row = update(item.legacyId ?? item.id);
    return row ? { ...item, name: row.name, description: "description" in row ? row.description : item.description, price: row.price, sourceLine: row.sourceLine } : { ...item };
  }),
}));
