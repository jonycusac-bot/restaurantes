import test from "node:test";
import assert from "node:assert/strict";
import {prepareDishImage} from "../src/lib/prepare-dish-image";

test("si el navegador devuelve PNG al solicitar WebP, comprime como JPEG y no bloquea la foto",async()=>{
 const originalBitmap=globalThis.createImageBitmap,originalDocument=globalThis.document,originalReader=globalThis.FileReader;
 const calls:{type:string;width:number;height:number}[]=[];
 let closed=false;
 try{
  Object.defineProperty(globalThis,"createImageBitmap",{configurable:true,value:async()=>({width:4032,height:3024,close(){closed=true;}})});
  const canvas={width:0,height:0,getContext:()=>({drawImage(){},save(){},restore(){},fillRect(){},globalCompositeOperation:"source-over",fillStyle:"#fff"}),toBlob(callback:(value:Blob)=>void,type:string){calls.push({type,width:canvas.width,height:canvas.height});callback(new Blob([new Uint8Array(type==="image/webp"?850_000:250_000)],{type:type==="image/webp"?"image/png":type}));}};
  Object.defineProperty(globalThis,"document",{configurable:true,value:{createElement:()=>canvas}});
  class Reader {result:string|null=null;onload:(()=>void)|null=null;onerror:(()=>void)|null=null;readAsDataURL(blob:Blob){this.result=`data:${blob.type};base64,AA==`;this.onload?.();}}
  Object.defineProperty(globalThis,"FileReader",{configurable:true,value:Reader});
  const file=new File([new Uint8Array(1)],"foto-antigua.jpg",{type:"image/jpeg"});
  const result=await prepareDishImage(file,750*1024);
  assert.equal(result.bytes,250_000);assert.equal(result.name,"foto-antigua.jpg");
  assert.ok(result.dataUrl.startsWith("data:image/jpeg;"));
  assert.deepEqual(calls.map(call=>call.type),["image/webp","image/jpeg"]);
  assert.equal(closed,true);
 }finally{
  Object.defineProperty(globalThis,"createImageBitmap",{configurable:true,value:originalBitmap});
  Object.defineProperty(globalThis,"document",{configurable:true,value:originalDocument});
  Object.defineProperty(globalThis,"FileReader",{configurable:true,value:originalReader});
 }
});

test("reduce también las dimensiones cuando bajar la calidad no alcanza el límite",async()=>{
 const originalBitmap=globalThis.createImageBitmap,originalDocument=globalThis.document,originalReader=globalThis.FileReader;
 const dimensions:number[]=[];
 try{
  Object.defineProperty(globalThis,"createImageBitmap",{configurable:true,value:async()=>({width:4000,height:3000,close(){}})});
  const canvas={width:0,height:0,getContext:()=>({drawImage(){},save(){},restore(){},fillRect(){},globalCompositeOperation:"source-over",fillStyle:"#fff"}),toBlob(callback:(value:Blob)=>void,type:string){dimensions.push(canvas.width);callback(new Blob([new Uint8Array(canvas.width*700)],{type}));}};
  Object.defineProperty(globalThis,"document",{configurable:true,value:{createElement:()=>canvas}});
  class Reader {result:string|null=null;onload:(()=>void)|null=null;onerror:(()=>void)|null=null;readAsDataURL(blob:Blob){this.result=`data:${blob.type};base64,AA==`;this.onload?.();}}
  Object.defineProperty(globalThis,"FileReader",{configurable:true,value:Reader});
  const result=await prepareDishImage(new File([new Uint8Array(1)],"vieja.png",{type:"image/png"}),750*1024);
  assert.ok(result.bytes<=750*1024);assert.ok(dimensions.includes(1600));assert.ok(dimensions.some(width=>width<1600));
 }finally{
  Object.defineProperty(globalThis,"createImageBitmap",{configurable:true,value:originalBitmap});
  Object.defineProperty(globalThis,"document",{configurable:true,value:originalDocument});
  Object.defineProperty(globalThis,"FileReader",{configurable:true,value:originalReader});
 }
});
