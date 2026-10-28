export type Language = "es" | "en" | "de";

export const languages: { code: Language; label: string; flag: string }[] = [
  { code: "es", label: "Español", flag: "es" },
  { code: "en", label: "English", flag: "gb" },
  { code: "de", label: "Deutsch", flag: "de" },
];

export const ui = {
  es: {
    locale: "es-ES", preview: "PROPUESTA DE CARTA · INCH", original: "Carta original", home: "INCH, inicio", tagline: "DE ASIA A TU MESA", title: "Nuestra", titleAccent: "carta.", all: "Toda la carta", search: "Buscar plato", dishes: "Platos de la carta", filter: "Filtrar por categoría", language: "Idioma", sample: "Foto de ejemplo", pieces: "piezas", back: "Volver arriba", empty: "No encontramos ese plato. Prueba con otro nombre o categoría.", information: "Alérgenos e información de la carta", allergy: "Consulta al personal antes de pedir si tienes alergias o intolerancias. La información de alérgenos, precios y disponibilidad está pendiente de validación con el restaurante.", photos: "Las cinco fotografías aportadas se utilizan como ejemplos visuales. Algunas muestran surtidos o variedades distintas del plato descrito. La carta original es la referencia para la selección de platos.", categories: { entrantes: "Entrantes", sushi: "Sushi", noodles: "Noodles", ramen: "Ramen & sopas", curry: "Currys" },
  },
  en: {
    locale: "en-GB", preview: "MENU PREVIEW · INCH", original: "Original menu", home: "INCH, home", tagline: "FROM ASIA TO YOUR TABLE", title: "Our", titleAccent: "menu.", all: "Full menu", search: "Find a dish", dishes: "Menu dishes", filter: "Filter by category", language: "Language", sample: "Sample photo", pieces: "pieces", back: "Back to top", empty: "No dishes found. Try another name or category.", information: "Allergens and menu information", allergy: "Please speak to our team before ordering if you have any allergies or intolerances. Allergen information, prices and availability still need to be confirmed by the restaurant.", photos: "The five photographs are visual examples. Some show assortments or varieties different from the dish described. Dish selection is based on the original menu.", categories: { entrantes: "Starters", sushi: "Sushi", noodles: "Noodles", ramen: "Ramen & soups", curry: "Curries" },
  },
  de: {
    locale: "de-DE", preview: "SPEISEKARTENENTWURF · INCH", original: "Originalkarte", home: "INCH, Startseite", tagline: "AUS ASIEN AUF DEINEN TISCH", title: "Unsere", titleAccent: "Karte.", all: "Alle Gerichte", search: "Gericht suchen", dishes: "Gerichte der Speisekarte", filter: "Nach Kategorie filtern", language: "Sprache", sample: "Beispielfoto", pieces: "Stück", back: "Nach oben", empty: "Keine Gerichte gefunden. Versuche einen anderen Namen oder eine andere Kategorie.", information: "Allergene und Informationen zur Speisekarte", allergy: "Bitte informiere unser Team vor der Bestellung über Allergien oder Unverträglichkeiten. Angaben zu Allergenen, Preisen und Verfügbarkeit müssen noch vom Restaurant bestätigt werden.", photos: "Die fünf Fotos dienen als Beispiele. Einige zeigen Zusammenstellungen oder andere Varianten als das beschriebene Gericht. Die Auswahl der Gerichte basiert auf der Originalkarte.", categories: { entrantes: "Vorspeisen", sushi: "Sushi", noodles: "Nudeln", ramen: "Ramen & Suppen", curry: "Currys" },
  },
};

// Named recipes are retained; ingredients are translated without adding claims.
export const dishTranslations: Record<string, { en: [string, string]; de: [string, string] }> = {
  "Edamame": { en: ["Edamame", "A classic to whet your appetite."], de: ["Edamame", "Ein Klassiker zum Einstieg."] },
  "Poh Pia": { en: ["Poh Pia", "Fried vegetable spring rolls."], de: ["Poh Pia", "Frittierte Gemüse-Frühlingsrollen."] },
  "Chicken Satay": { en: ["Chicken Satay", "Chicken skewers with peanut sauce."], de: ["Chicken Satay", "Hähnchenspieße mit Erdnusssauce."] },
  "Gyozas de pollo": { en: ["Chicken gyoza", "Japanese dumplings filled with chicken."], de: ["Hähnchen-Gyoza", "Japanische Teigtaschen mit Hähnchenfüllung."] },
  "Gyozas de verduras": { en: ["Vegetable gyoza", "Japanese dumplings filled with vegetables."], de: ["Gemüse-Gyoza", "Japanische Teigtaschen mit Gemüsefüllung."] },
  "Tempura": { en: ["Tempura", "Tiger prawns with kimchi mayonnaise."], de: ["Tempura", "Tigergarnelen mit Kimchi-Mayonnaise."] },
  "Uramaki de salmón": { en: ["Salmon uramaki", "Salmon, avocado and cucumber."], de: ["Lachs-Uramaki", "Lachs, Avocado und Gurke."] },
  "California Roll": { en: ["California Roll", "Avocado, cucumber and surimi."], de: ["California Roll", "Avocado, Gurke und Surimi."] },
  "Inch Roll": { en: ["Inch Roll", "King crab, mango, asparagus and avocado with wasabi."], de: ["Inch Roll", "Königskrabbe, Mango, Spargel und Avocado mit Wasabi."] },
  "Langostino Tempura Roll": { en: ["Prawn Tempura Roll", "Tempura prawn, kimchi, tobiko and avocado."], de: ["Garnelen-Tempura-Roll", "Tempura-Garnele, Kimchi, Tobiko und Avocado."] },
  "Nigiri de salmón": { en: ["Salmon nigiri", "Salmon on sushi rice."], de: ["Lachs-Nigiri", "Lachs auf Sushi-Reis."] },
  "Sashimi de salmón": { en: ["Salmon sashimi", "Sliced salmon sashimi."], de: ["Lachs-Sashimi", "Lachs in Sashimi-Scheiben."] },
  "Noodles al huevo con langostinos": { en: ["Egg noodles with prawns", "Thin wheat noodles, prawns and vegetables."], de: ["Eiernudeln mit Garnelen", "Dünne Weizennudeln, Garnelen und Gemüse."] },
  "Pad Thai de pollo": { en: ["Chicken Pad Thai", "Wide rice noodles with chicken and vegetables."], de: ["Pad Thai mit Hähnchen", "Breite Reisnudeln mit Hähnchen und Gemüse."] },
  "Pad Thai de langostinos": { en: ["Prawn Pad Thai", "Wide rice noodles with prawns and vegetables."], de: ["Pad Thai mit Garnelen", "Breite Reisnudeln mit Garnelen und Gemüse."] },
  "Udon de verduras": { en: ["Vegetable udon", "Thick wheat noodles with vegetables."], de: ["Gemüse-Udon", "Dicke Weizennudeln mit Gemüse."] },
  "Singapore Vermicelli": { en: ["Singapore Vermicelli", "Thin pea noodles with chicken, beef, prawns and vegetables."], de: ["Singapore Vermicelli", "Dünne Erbsennudeln mit Hähnchen, Rindfleisch, Garnelen und Gemüse."] },
  "Ramen de pollo": { en: ["Chicken ramen", "The chicken version of our house ramen."], de: ["Hähnchen-Ramen", "Die Hähnchenvariante unserer Haus-Ramen."] },
  "Ramen de verduras": { en: ["Vegetable ramen", "The vegetable version of our house ramen."], de: ["Gemüse-Ramen", "Die Gemüsevariante unserer Haus-Ramen."] },
  "Tom Kha de pollo": { en: ["Chicken Tom Kha", "Coconut milk soup with chicken."], de: ["Tom Kha mit Hähnchen", "Kokosmilchsuppe mit Hähnchen."] },
  "Laksa Lemak": { en: ["Laksa Lemak", "Singapore coconut soup with rice noodles, chicken, prawns, fried fish tofu, bean sprouts and egg."], de: ["Laksa Lemak", "Kokossuppe aus Singapur mit Reisnudeln, Hähnchen, Garnelen, frittiertem Fischtofu, Sojasprossen und Ei."] },
  "Curry de pollo": { en: ["Chicken curry", "Choose yellow, red or green. Steamed rice: €3 extra."], de: ["Hähnchen-Curry", "Gelb, rot oder grün zur Wahl. Gedämpfter Reis: 3 € zusätzlich."] },
  "Curry de tofu y verduras": { en: ["Tofu & vegetable curry", "Choose yellow, red or green. Steamed rice: €3 extra."], de: ["Tofu-Gemüse-Curry", "Gelb, rot oder grün zur Wahl. Gedämpfter Reis: 3 € zusätzlich."] },
  "Massaman de ternera": { en: ["Beef Massaman", "Curry from central Thailand. Steamed rice: €3 extra."], de: ["Massaman mit Rindfleisch", "Curry aus Zentralthailand. Gedämpfter Reis: 3 € zusätzlich."] },
  "Katsukarē": { en: ["Katsukarē", "Japanese curry with crispy chicken. Steamed rice: €3 extra."], de: ["Katsukarē", "Japanisches Curry mit knusprigem Hähnchen. Gedämpfter Reis: 3 € zusätzlich."] },
};
