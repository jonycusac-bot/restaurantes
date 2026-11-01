import {cartaOriginal} from "./carta-original";
type Translation={en:[string,string];de:[string,string]};
export const variantTranslations:Record<string,{en:string;de:string}>={
 "Verduras":{en:"Vegetables",de:"Gemüse"},"Pollo":{en:"Chicken",de:"Hähnchen"},"Ternera":{en:"Beef",de:"Rindfleisch"},"Gambas":{en:"Prawns",de:"Garnelen"},"Langostinos":{en:"King prawns",de:"Riesengarnelen"},"Pato":{en:"Duck",de:"Ente"},"Tofu - Verduras":{en:"Tofu - Vegetables",de:"Tofu - Gemüse"},
 "Mezcla de 2 ingredientes":{en:"Mix of 2 ingredients",de:"Mischung aus 2 Zutaten"},"Mezcla de 3 ingredientes":{en:"Mix of 3 ingredients",de:"Mischung aus 3 Zutaten"},"Mezcla de Pollo + Ternera + Langostinos":{en:"Chicken + beef + king prawns mix",de:"Mischung aus Hähnchen + Rindfleisch + Riesengarnelen"},"Arroz al vapor":{en:"Steamed rice",de:"Gedämpfter Reis"},"Arroz frito con huevo":{en:"Egg fried rice",de:"Gebratener Reis mit Ei"},
};
const bases:Record<string,Translation>={
 "Poh Pia":{en:["Poh Pia","Fried vegetable rolls"],de:["Poh Pia","Frittierte Gemüserollen"]},
 "Poh Pia Sod":{en:["Poh Pia Sod","Fried Vietnamese rolls with chicken and prawns"],de:["Poh Pia Sod","Frittierte vietnamesische Rollen mit Hähnchen und Garnelen"]},
 "Pollo con Sésamo":{en:["Sesame Chicken","Fried chicken with sesame"],de:["Sesamhähnchen","Frittiertes Hähnchen mit Sesam"]},
 "Satay de Pollo":{en:["Chicken Satay","Chicken skewers with peanut sauce"],de:["Hähnchen-Satay","Hähnchenspieße mit Erdnusssauce"]},
 "Alitas de Pollo":{en:["Chicken Wings",""],de:["Hähnchenflügel",""]},
 "Gyozas":{en:["Gyoza","Dumplings"],de:["Gyoza","Teigtaschen"]},
 "Gyozas Okonomiyaki":{en:["Okonomiyaki Gyoza","Japanese dumplings with bonito flakes"],de:["Okonomiyaki-Gyoza","Japanische Teigtaschen mit Bonitoflocken"]},
 "Gyozas Pato":{en:["Duck Gyoza",""],de:["Enten-Gyoza",""]},
 "Tempura":{en:["Tempura","Tiger prawns with kimchi mayonnaise"],de:["Tempura","Tigergarnelen mit Kimchi-Mayonnaise"]},
 "Inch":{en:["Inch","Mango, pineapple, onion, tomato, cucumber and teriyaki chicken"],de:["Inch","Mango, Ananas, Zwiebeln, Tomaten, Gurken und Teriyaki-Hähnchen"]},
 "Yam Woonsen":{en:["Yam Woonsen","Pea noodles, prawns, onion, coriander, tomato, cucumber, pepper and lime sauce"],de:["Yam Woonsen","Erbsennudeln, Garnelen, Zwiebeln, Koriander, Tomaten, Gurken, Paprika und Limettensauce"]},
 "Ginger":{en:["Ginger","Korean-style marinated chicken, celery, spring onion, cucumber, avocado and cherry tomatoes with ginger vinaigrette"],de:["Ginger","Hähnchen in koreanischer Marinade, Sellerie, Frühlingszwiebeln, Gurken, Avocado und Kirschtomaten mit Ingwer-Vinaigrette"]},
 "Sopa de Miso":{en:["Miso Soup",""],de:["Miso-Suppe",""]},
 "Tom Yum":{en:["Tom Yum","Hot and sour"],de:["Tom Yum","Sauer-scharf"]},
 "Tom Kha":{en:["Tom Kha","Coconut milk"],de:["Tom Kha","Kokosmilch"]},
 "Laksa Lemak":{en:["Laksa Lemak","Singapore coconut soup with rice noodles, chicken, prawns, fried fish tofu, bean sprouts and egg"],de:["Laksa Lemak","Kokossuppe aus Singapur mit Reisnudeln, Hähnchen, Garnelen, frittiertem Fischtofu, Sojasprossen und Ei"]},
 "Ramen":{en:["Ramen",""],de:["Ramen",""]},
 "Kapraw":{en:["Kapraw","Chilli and basil"],de:["Kapraw","Chili und Basilikum"]},
 "Gai Pad Med":{en:["Gai Pad Med","Chicken with cashew nuts"],de:["Gai Pad Med","Hähnchen mit Cashewkernen"]},
 "Morning Glory":{en:["Morning Glory","Pak choi, spinach, bean sprouts and garlic sauce"],de:["Morning Glory","Pak Choi, Spinat, Sojasprossen und Knoblauchsauce"]},
 "Opciones para elegir":{en:["Choose an accompaniment",""],de:["Beilage zur Wahl",""]},
 "Curry":{en:["Curry","Options: Yellow | Red | Green"],de:["Curry","Zur Wahl: Gelb | Rot | Grün"]},
 "Massaman":{en:["Massaman","Central Thailand"],de:["Massaman","Zentralthailand"]},
 "Katsukaré":{en:["Katsukaré","Crispy chicken"],de:["Katsukaré","Knuspriges Hähnchen"]},
 "Suplemento por arroz frito":{en:["Fried rice supplement",""],de:["Aufpreis für gebratenen Reis",""]},
 "Arroz Frito":{en:["Fried Rice",""],de:["Gebratener Reis",""]},
 "Al Huevo":{en:["Egg Noodles","Thin wheat noodles"],de:["Eiernudeln","Dünne Weizennudeln"]},
 "Pad Thai Original":{en:["Original Pad Thai","Wide rice noodles"],de:["Original Pad Thai","Breite Reisnudeln"]},
 "Udon Japonés":{en:["Japanese Udon","Thick wheat noodles"],de:["Japanische Udon","Dicke Weizennudeln"]},
 "Vermicelli de Singapur":{en:["Singapore Vermicelli","Thin pea noodles"],de:["Singapur-Vermicelli","Dünne Erbsennudeln"]},
 "Menú infantil":{en:["Kids Menu","Choose noodles or rice with chicken, beef or king prawns."],de:["Kindermenü","Nudeln oder Reis mit Hähnchen, Rindfleisch oder Riesengarnelen zur Wahl."]},
};
export const categoryNoteTranslations:Record<string,{en:string;de:string}>={
  curry:{en:"Served with steamed rice",de:"Serviert mit gedämpftem Reis"},
  arroces:{en:"All rice dishes include vegetables and egg",de:"Alle Reisgerichte enthalten Gemüse und Ei"},
  noodles:{en:"All noodle dishes include vegetables",de:"Alle Nudelgerichte enthalten Gemüse"},
  nigiris:{en:"2 pieces",de:"2 Stück"},
  maki:{en:"8 pieces",de:"8 Stück"},
  temaki:{en:"1 piece",de:"1 Stück"},
  gunkan:{en:"2 pieces",de:"2 Stück"},
  uramaki:{en:"8 pieces",de:"8 Stück"},
};
export const cartaDishTranslations:Record<string,Translation>={};
for(const category of cartaOriginal) for(const item of category.items){
 const base=bases[item.name];
 if(!base) throw new Error(`Traducción de CARTA ausente: ${item.name}`);
 cartaDishTranslations[item.name]=base;
 for(const variant of item.variants??[]){
  const label=variantTranslations[variant.label];
  if(!label) throw new Error(`Traducción de variante ausente: ${variant.label}`);
  cartaDishTranslations[`${item.name} · ${variant.label}`]={en:[`${base.en[0]} · ${label.en}`,base.en[1]],de:[`${base.de[0]} · ${label.de}`,base.de[1]]};
 }
}
