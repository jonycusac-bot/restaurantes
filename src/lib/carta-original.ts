export type CartaVariant={id:string;label:string;price:number;sourceLine:number;legacyId?:string;image?:string;imageAlt?:string};
export type CartaItem={id:string;name:string;description:string;note?:string;price?:number;sourceLine?:number;variants?:CartaVariant[];legacyId?:string;image?:string;imageAlt?:string;role?:"supplement";pricePrefix?:"+"};
export type CartaCategory={id:string;name:string;note?:string;items:CartaItem[]};
// Reference transcribed from the owner-provided CARTA. Existing D1 is not migrated.
const sixVariants=(prefix:string,prices:number[],firstLine:number,legacy:Record<string,string>={}):CartaVariant[]=>[
 ["verduras","Verduras"],["pollo","Pollo"],["ternera","Ternera"],["langostinos","Langostinos"],["mezcla-2","Mezcla de 2 ingredientes"],["mezcla-3","Mezcla de 3 ingredientes"],
].map(([suffix,label],index)=>({id:`${prefix}-${suffix}`,label,price:prices[index],sourceLine:firstLine+index,legacyId:legacy[suffix],...(prefix==="carta-al-huevo"&&suffix==="langostinos"?{image:"fideos",imageAlt:"Fotografía de ejemplo de fideos con langostinos"}:{})}));
export const cartaOriginal:CartaCategory[]=[
 {id:"entrantes",name:"Entrantes",items:[
  {id:"carta-poh-pia",legacyId:"entrantes-0",name:"Poh Pia",description:"Rollitos de Verduras Fritos",note:"2 unidades",price:6.3,sourceLine:3},
  {id:"carta-poh-pia-sod",name:"Poh Pia Sod",description:"Rollitos Vietnamitas Fritos con pollo y gambas",note:"4 unidades",price:9.7,sourceLine:4},
  {id:"carta-pollo-sesamo",name:"Pollo con Sésamo",description:"Pollo Frito con Sésamo",note:"4 unidades",price:9.6,sourceLine:5},
  {id:"carta-satay-pollo",legacyId:"entrantes-1",name:"Satay de Pollo",description:"Pinchitos de Pollo con Salsa de Cacahuetes",note:"2 unidades",price:8.1,sourceLine:6},
  {id:"carta-alitas-pollo",name:"Alitas de Pollo",description:"",note:"6 unidades",price:10,sourceLine:7},
  {id:"carta-gyozas",name:"Gyozas",description:"Empanadillas",note:"6 unidades",variants:[
   {id:"carta-gyozas-verduras",legacyId:"entrantes-3",label:"Verduras",price:9.6,sourceLine:9},
   {id:"carta-gyozas-pollo",legacyId:"entrantes-2",label:"Pollo",price:10,sourceLine:10},
   {id:"carta-gyozas-gambas",label:"Gambas",price:10.3,sourceLine:11},
  ]},
  {id:"carta-gyozas-okonomiyaki",name:"Gyozas Okonomiyaki",description:"Empanadillas Japonesas con Escamas de Bonito",note:"6 unidades",variants:[
   {id:"carta-gyozas-okonomiyaki-pollo",label:"Pollo",price:12,sourceLine:13},
   {id:"carta-gyozas-okonomiyaki-gambas",label:"Gambas",price:12.75,sourceLine:14},
  ]},
  {id:"carta-gyozas-pato",name:"Gyozas Pato",description:"",note:"6 unidades",price:12,sourceLine:15},
  {id:"carta-tempura",legacyId:"entrantes-4",name:"Tempura",description:"Langostinos Tigre con Mayonesa de Kimchi",price:12.75,sourceLine:16,image:"tempura-gyozas",imageAlt:"Fotografía de ejemplo con langostinos en tempura y gyozas"},
 ]},
 {id:"ensaladas",name:"Ensaladas",items:[
  {id:"carta-ensalada-inch",name:"Inch",description:"Mango, Piña, Cebolla, Tomate, Pepino y Pollo Teriyaki",price:15.4,sourceLine:20},
  {id:"carta-yam-woonsen",name:"Yam Woonsen",description:"Fideos de Guisantes, Gambas, Cebolla, Cilantro, Tomate, Pepino, Pimiento y Salsa de Lima",price:14.2,sourceLine:21},
  {id:"carta-ensalada-ginger",name:"Ginger",description:"Pollo Marinado estilo Coreano, Apio, Cebolleta, Pepino, Aguacate, Tomate Cherry con Vinagreta de Jengibre",price:14.2,sourceLine:22},
 ]},
 {id:"sopas",name:"Sopas",items:[
  {id:"carta-sopa-miso",name:"Sopa de Miso",description:"",price:5.95,sourceLine:26},
  {id:"carta-tom-yum",name:"Tom Yum",description:"Agripicante",variants:[
   {id:"carta-tom-yum-pollo",label:"Pollo",price:8.7,sourceLine:28},
   {id:"carta-tom-yum-gambas",label:"Gambas",price:9.6,sourceLine:29},
  ]},
  {id:"carta-tom-kha",name:"Tom Kha",description:"Leche de Coco",variants:[
   {id:"carta-tom-kha-pollo",legacyId:"sopas-2",label:"Pollo",price:8.7,sourceLine:31},
   {id:"carta-tom-kha-gambas",label:"Gambas",price:9.6,sourceLine:32},
  ]},
  {id:"carta-laksa-lemak",legacyId:"sopas-3",name:"Laksa Lemak",description:"Sopa de coco de Singapur, tallarines de arroz, pollo, gambas, tofu de pescado frito, brotes de soja y huevo",price:17.6,sourceLine:33},
  {id:"carta-ramen",name:"Ramen",description:"",variants:[
   {id:"carta-ramen-verduras",legacyId:"sopas-1",label:"Verduras",price:13.2,sourceLine:35},
   {id:"carta-ramen-pollo",legacyId:"sopas-0",label:"Pollo",price:14.45,sourceLine:36},
   {id:"carta-ramen-ternera",label:"Ternera",price:15.2,sourceLine:37},
   {id:"carta-ramen-gambas",label:"Gambas",price:15.7,sourceLine:38},
  ]},
 ]},
 {id:"salteados",name:"Salteados",items:[
  {id:"carta-kapraw",name:"Kapraw",description:"Chile y Albahaca",variants:[
   {id:"carta-kapraw-tofu-verduras",label:"Tofu - Verduras",price:13.2,sourceLine:43},
   {id:"carta-kapraw-pollo",label:"Pollo",price:14.45,sourceLine:44},
   {id:"carta-kapraw-ternera",label:"Ternera",price:15.2,sourceLine:45},
   {id:"carta-kapraw-langostinos",label:"Langostinos",price:16.4,sourceLine:46},
   {id:"carta-kapraw-pato",label:"Pato",price:19.3,sourceLine:47},
  ]},
  {id:"carta-gai-pad-med",name:"Gai Pad Med",description:"Pollo con Anacardos",price:16.4,sourceLine:48},
  {id:"carta-morning-glory",name:"Morning Glory",description:"Pak choi, Espinacas, Brotes de Soja y Salsa de Ajo",price:14.45,sourceLine:49},
  {id:"carta-salteados-acompanamientos",name:"Opciones para elegir",description:"",role:"supplement",pricePrefix:"+",variants:[
   {id:"carta-salteados-arroz-vapor",label:"Arroz al vapor",price:3,sourceLine:51},
   {id:"carta-salteados-arroz-frito",label:"Arroz frito con huevo",price:4.3,sourceLine:52},
  ]},
 ]},
 {id:"curry",name:"Curry",note:"Servidos con arroz al vapor",items:[
  {id:"carta-curry",name:"Curry",description:"Opciones: Amarillo | Rojo | Verde",variants:[
   {id:"carta-curry-tofu-verduras",legacyId:"curry-1",label:"Tofu - Verduras",price:13.2,sourceLine:57},
   {id:"carta-curry-pollo",legacyId:"curry-0",label:"Pollo",price:14.45,sourceLine:58},
   {id:"carta-curry-ternera",label:"Ternera",price:15.6,sourceLine:59},
   {id:"carta-curry-langostinos",label:"Langostinos",price:16.8,sourceLine:60},
   {id:"carta-curry-pato",label:"Pato",price:19.3,sourceLine:61},
  ]},
  {id:"carta-massaman",name:"Massaman",description:"Central Tailandia",variants:[
   {id:"carta-massaman-pollo",label:"Pollo",price:14.45,sourceLine:63},
   {id:"carta-massaman-ternera",legacyId:"curry-2",label:"Ternera",price:15.6,sourceLine:64},
   {id:"carta-massaman-langostinos",label:"Langostinos",price:16.8,sourceLine:65},
   {id:"carta-massaman-pato",label:"Pato",price:19.3,sourceLine:66},
  ]},
  {id:"carta-katsukare",legacyId:"curry-3",name:"Katsukaré",description:"Pollo Crujiente",price:15.65,sourceLine:67},
  {id:"carta-curry-arroz-frito",name:"Suplemento por arroz frito",description:"",role:"supplement",pricePrefix:"+",price:3,sourceLine:68},
 ]},
 {id:"arroces",name:"Arroces",note:"Todos los arroces incluyen verduras y huevo",items:[
  {id:"carta-arroz-frito",name:"Arroz Frito",description:"",variants:sixVariants("carta-arroz-frito",[10.8,12,12.75,13.2,14.45,15.65],73)},
 ]},
 {id:"noodles",name:"Tallarines",note:"Todos los tallarines incluyen verduras",items:[
  {id:"carta-al-huevo",name:"Al Huevo",description:"Fino de Trigo",variants:sixVariants("carta-al-huevo",[10.8,12,12.75,13.2,14.45,15.65],84,{langostinos:"noodles-0"})},
  {id:"carta-pad-thai",name:"Pad Thai Original",description:"Anchos de Arroz",variants:sixVariants("carta-pad-thai",[12,13.2,13.95,14.45,15.2,16.4],91,{pollo:"noodles-1",langostinos:"noodles-2"})},
  {id:"carta-udon",name:"Udon Japonés",description:"Grueso de Trigo",variants:sixVariants("carta-udon",[12.75,13.95,14.45,15.2,15.65,16.8],98,{verduras:"noodles-3"})},
  {id:"carta-vermicelli",name:"Vermicelli de Singapur",description:"Finos de Guisantes",variants:[{id:"carta-vermicelli-mezcla",legacyId:"noodles-4",label:"Mezcla de Pollo + Ternera + Langostinos",price:16.8,sourceLine:105}]},
 ]},
 {id:"infantil",name:"Menú infantil",items:[
  {id:"carta-menu-infantil",name:"Menú infantil",description:"A elegir entre Tallarines o Arroz y Pollo, Ternera o Langostinos.",price:10.3,sourceLine:108},
 ]},
];
