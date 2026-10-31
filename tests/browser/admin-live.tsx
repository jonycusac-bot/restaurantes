import { createRoot } from "react-dom/client";
import AdminPreview from "../../src/app/admin/preview/AdminPreview";
import { storageKey, initialDraft } from "../../src/lib/inch-draft";
import type { CloudDraft } from "../../src/lib/cloud-draft";
import "tailwindcss/preflight.css";
import "../../src/app/admin/preview/admin.css";

if (location.origin !== "http://127.0.0.1:8794") throw new Error("Solo QA de carta central aislada");
// Deliberately stale legacy data must never become the central displayed menu.
localStorage.setItem(storageKey, JSON.stringify(initialDraft.map((dish,index) => index === 0 ? { ...dish, price: 99 } : dish)));
createRoot(document.getElementById("root")!).render(<AdminPreview cloudflare />);
const settle = () => new Promise(resolve => setTimeout(resolve, 120));
const check = (ok: unknown, text: string) => { if (!ok) throw new Error(text); };
const menu = async (): Promise<CloudDraft> => (await fetch("/api/admin/menu")).json();
const patch = async (id: string, changes: Record<string,{before:unknown;value:unknown}>) => {
  const response = await fetch("/api/admin/menu", { method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({kind:"update",id,changes}) });
  check(response.ok, `Otro dispositivo: ${response.status}`);
  return response.json() as Promise<CloudDraft>;
};
const click = (text: string) => {
  const button = [...document.querySelectorAll<HTMLButtonElement>("button")].find(el => el.textContent?.replace(/\s/g,"") === text.replace(/\s/g,""));
  check(button && !button.disabled, `Botón disponible: ${text}`); button!.click();
};
function input(name: string, value: string) {
  const element = document.querySelector<HTMLInputElement>(`dialog input[name="${name}"]`)!;
  check(element, `Campo ${name}`);
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value")!.set!.call(element,value);
  element.dispatchEvent(new Event("input",{bubbles:true}));
}
async function openFirst() {
  document.querySelector<HTMLButtonElement>(".admin-list li button")!.click(); await settle();
  check(document.querySelector<HTMLDialogElement>("dialog")?.open,"Editor visible inmediatamente");
}
async function submit() { document.querySelector<HTMLFormElement>("dialog form")!.requestSubmit(); await settle(); }

declare global { interface Window { checkLiveCentral: () => Promise<Record<string,unknown>>; prepareLiveReload: () => Promise<Record<string,unknown>>; checkLiveResume: () => Promise<Record<string,unknown>> } }
window.checkLiveCentral = async () => {
  await settle(); const initial = await menu();
  const first = initial.dishes[0], second = initial.dishes[1];
  check(!document.body.textContent?.includes("Publicar carta"),"Sin botón Publicar");
  check(!document.body.textContent?.includes("Guardar mi copia"),"Sin reemplazo de copias completas");
  check(document.querySelector(".admin-list")?.textContent?.includes("6,30"),"El borrador antiguo de 99 no sustituye la carta central");
  await openFirst(); input("price","15"); await settle();
  await patch(second.id,{price:{before:second.price,value:17}});
  await submit();
  let current = await menu();
  check(current.dishes.find(d=>d.id===first.id)?.price===15,"Cambio del teléfono guardado");
  check(current.dishes.find(d=>d.id===second.id)?.price===17,"Se conserva el cambio independiente del PC");
  check(current.publishedRevision===current.revision,"Guardar publica sin otro botón");
  check(!document.querySelector("dialog"),"Guardar cierra el editor");
  await openFirst(); input("price","16"); await settle();
  const currentFirst=current.dishes.find(d=>d.id===first.id)!;
  await patch(first.id,{description:{before:currentFirst.description,value:"Descripción cambiada desde PC"}});
  await submit(); current=await menu();
  check(current.dishes.find(d=>d.id===first.id)?.price===16 && current.dishes.find(d=>d.id===first.id)?.description==="Descripción cambiada desde PC","Campos distintos del mismo plato se combinan sin preguntas");
  await openFirst(); input("price","18"); await settle();
  await patch(first.id,{price:{before:16,value:19}});
  await submit();
  check(document.querySelector(".admin-live-choice")?.textContent?.includes("El precio cambió"),"Solo pregunta por el precio conflictivo");
  check(document.querySelectorAll(".admin-live-choice > div button").length===2,"Dos valores, no copias enteras");
  click("Usar 18,00 €"); await settle(); current=await menu();
  check(current.dishes.find(d=>d.id===first.id)?.price===18,"Se guarda el precio elegido");
  check(current.dishes.find(d=>d.id===second.id)?.price===17,"No se pisa el otro plato");
  check(current.dishes.find(d=>d.id===first.id)?.description==="Descripción cambiada desde PC","No se revierte el campo independiente");
  check(current.publishedRevision===current.revision,"Elección aplicada y publicada");
  const publicHtml=await(await fetch("/qa/public")).text();
  check(publicHtml.includes("Descripción cambiada desde PC"),"Carta pública real actualizada");
  check(JSON.parse(localStorage.getItem(storageKey)!)[0].price===99,"Borrador anterior intacto");
  check(document.documentElement.scrollWidth<=innerWidth,"Sin desbordamiento");
  return {passed:true,width:innerWidth,independentDishesPreserved:true,independentFieldsPreserved:true,samePriceChoiceOnly:true,savePublishes:true,legacyPreserved:true,boundary:"mounted UI → real HTTP proxy → isolated Worker/D1; second client uses real HTTP"};
};
window.prepareLiveReload = async () => {
  await openFirst(); input("price","20"); await settle();
  return {prepared:true,price:document.querySelector<HTMLInputElement>('dialog input[name="price"]')!.value};
};
window.checkLiveResume = async () => {
  await settle();
  const detail=document.querySelector<HTMLDetailsElement>(".admin-live-recovery");
  check(detail,"Hay una edición conservada tras recargar"); detail!.open=true;
  click("Continuar"); await settle();
  check(document.querySelector<HTMLInputElement>('dialog input[name="price"]')?.value==="20","Se recupera el precio sin publicar automáticamente");
  const current=await menu(); check(current.dishes[0].price===18,"Recuperar no cambia la carta");
  click("Cancelar"); await settle();
  return {passed:true,unsavedEditRestored:true,noAutomaticPublication:true};
};
