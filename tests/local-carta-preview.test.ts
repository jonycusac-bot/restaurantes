import assert from "node:assert/strict";
import test from "node:test";
import { prepareLocalCartaPreview } from "../src/lib/local-carta-preview";
import type { AdminDish } from "../src/lib/inch-draft";
const dish=(id:string,categoryId:string,price:number):AdminDish=>({id,categoryId,name:id,description:"",price,hidden:false,imageSrc:"",imageName:"Sin imagen"});
test("actualizar CARTA local aplica precios originales conservando fotos, visibilidad y Sushi",()=>{
 const catalog=[dish("entrantes-0","entrantes",6.3),dish("uramaki-0","uramaki",13)];
 const previous=[{...dish("entrantes-0","entrantes",99),hidden:true,imageSrc:"/inch/fideos.webp",imageName:"mi-foto.webp"},{...dish("uramaki-0","uramaki",22),name:"Sushi editado"},dish("extra-local","entrantes",8)];
 const before=JSON.stringify(previous);
 const result=prepareLocalCartaPreview(previous,catalog);
 assert.equal(result[0].price,6.3);
 assert.equal(result[0].imageSrc,"/inch/fideos.webp");
 assert.equal(result[0].imageName,"mi-foto.webp");
 assert.equal(result[0].hidden,true);
 assert.deepEqual(result[1],previous[1]);
 assert.deepEqual(result[2],previous[2]);
 assert.equal(JSON.stringify(previous),before);
});
