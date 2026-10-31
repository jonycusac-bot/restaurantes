"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { parseCloudDishes, type CloudDraft } from "../../../lib/cloud-draft";
import { canonicalEqual, LIVE_FIELDS, LIVE_FIELD_LABELS, liveFieldValue, type LiveConflict, type LiveEditRequest, type LiveField } from "../../../lib/live-menu";
import type { AdminDish } from "../../../lib/inch-draft";

function readMenu(value: unknown, requireLive = true): CloudDraft {
  if (!value || typeof value !== "object") throw new Error("No se pudo leer la carta central.");
  const data=value as Record<string,unknown>;
  const dishes=parseCloudDishes(data.dishes);
  if (!dishes || (requireLive && data.live !== true) || !Number.isSafeInteger(data.revision) || (data.revision as number)<1 || typeof data.updatedAt!=="string" || (data.publishedRevision!==undefined && data.publishedRevision!==null && (!Number.isSafeInteger(data.publishedRevision)||(data.publishedRevision as number)<1))) throw new Error("La respuesta de la carta no es válida. Tu edición se conserva.");
  return {dishes,revision:data.revision as number,updatedAt:data.updatedAt,imageStorage:data.imageStorage===true,canPublish:false,...(data.publishedRevision===undefined?{}:{publishedRevision:data.publishedRevision as number|null})};
}
async function responseData(response: Response): Promise<Record<string,unknown>> {
  const data=await response.json();
  if (!data || typeof data!=="object" || Array.isArray(data)) throw new Error("Respuesta no válida. Tu edición se conserva.");
  return data;
}
const errorText=(error:unknown)=>error instanceof Error ? error.message : "No se pudo conectar. Tu edición se conserva.";
export function buildLiveRequest(base:AdminDish|null,dish:AdminDish):LiveEditRequest {
  if(!base)return{kind:"create",dish};
  if(base.id!==dish.id)throw new Error("No se puede cambiar el identificador de un plato.");
  const changes:Extract<LiveEditRequest,{kind:"update"}>["changes"]={};
  for(const field of LIVE_FIELDS){const before=liveFieldValue(base,field),value=liveFieldValue(dish,field);if(!canonicalEqual(before,value))changes[field]={before,value};}
  return{kind:"update",id:dish.id,changes};
}
async function uploadPhoto(dish:AdminDish):Promise<AdminDish>{
  if(!dish.imageSrc.startsWith("data:"))return dish;
  const comma=dish.imageSrc.indexOf(",");
  if(comma<0)throw new Error("No se pudo leer la foto. Vuelve a seleccionarla.");
  const bytes=Uint8Array.from(atob(dish.imageSrc.slice(comma+1)),character=>character.charCodeAt(0));
  if(bytes.byteLength>1024*1024)throw new Error("La foto supera 1 MB. Vuelve a seleccionarla para prepararla.");
  const response=await fetch("/api/admin/images",{method:"POST",headers:{"Content-Type":"application/octet-stream"},body:bytes});
  const data=await responseData(response);
  if(!response.ok)throw new Error(typeof data.error==="string"?data.error:"No se pudo guardar la foto.");
  if(typeof data.imageSrc!=="string"||!/^\/media\/[a-f0-9]{64}\.(webp|jpg|png)$/.test(data.imageSrc))throw new Error("La respuesta de la foto no es válida.");
  return{...dish,imageSrc:data.imageSrc};
}
export function useLiveMenu(enabled=true){
  const[menu,setMenu]=useState<CloudDraft|null>(null);
  const[loading,setLoading]=useState(enabled);
  const[busy,setBusy]=useState(false);
  const[error,setError]=useState("");
  const[message,setMessage]=useState("");
  const[conflicts,setConflicts]=useState<LiveConflict[]>([]);
  const[pending,setPending]=useState<LiveEditRequest|null>(null);
  const busyRef=useRef(false),epoch=useRef(0);
  const reviewRef=useRef<{request:LiveEditRequest;conflicts:LiveConflict[]}|null>(null);
  const refresh=useCallback(async()=>{
    if(!enabled||busyRef.current)return;
    const turn=++epoch.current;
    try{
      const response=await fetch("/api/admin/menu",{cache:"no-store"});
      const data=await responseData(response);
      if(!response.ok)throw new Error(typeof data.error==="string"?data.error:"No se pudo actualizar la carta.");
      const current=readMenu(data);
      if(turn===epoch.current&&!busyRef.current){setMenu(current);setError("");}
    }catch(reason){if(turn===epoch.current)setError(errorText(reason));}
    finally{if(turn===epoch.current)setLoading(false);}
  },[enabled]);
  useEffect(()=>{
    if(!enabled)return;
    // refresh changes state only after awaited HTTP I/O, not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    const update=()=>{if(document.visibilityState==="visible")void refresh();};
    const timer=window.setInterval(update,15000);
    window.addEventListener("focus",update);document.addEventListener("visibilitychange",update);
    // epoch is an operation counter, not a DOM node: invalidate outstanding GETs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return()=>{window.clearInterval(timer);window.removeEventListener("focus",update);document.removeEventListener("visibilitychange",update);epoch.current++;};
  },[enabled,refresh]);

  async function send(request:LiveEditRequest):Promise<boolean>{
    // Even no-op saves use the explicit API; it reports whether anything was
    // actually published. Background refresh is always a GET.
    const response=await fetch("/api/admin/menu",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(request)});
    const data=await responseData(response);
    if(response.status===409&&request.kind==="update"){
      const current=readMenu(data.current,false);
      if(!Array.isArray(data.conflicts)||!data.conflicts.length||data.conflicts.length>LIVE_FIELDS.length)throw new Error(typeof data.error==="string"?data.error:"El plato cambió. Vuelve a abrirlo para revisarlo.");
      const fields=new Set<string>();
      const next:LiveConflict[]=data.conflicts.map(value=>{
        const item=value as LiveConflict;
        if(!item||!LIVE_FIELDS.includes(item.field)||fields.has(item.field)||!request.changes[item.field]||!canonicalEqual(item.before,request.changes[item.field]!.before)||!canonicalEqual(item.value,request.changes[item.field]!.value))throw new Error("No se pudo confirmar el dato que cambió. Tu edición se conserva.");
        fields.add(item.field);
        const dish=current.dishes.find(d=>d.id===request.id);
        if(!dish||!canonicalEqual(item.current,liveFieldValue(dish,item.field)))throw new Error("El plato ya no está disponible. Tu edición se conserva.");
        return{...item,label:LIVE_FIELD_LABELS[item.field]};
      });
      reviewRef.current={request,conflicts:next};setPending(request);setConflicts(next);setMenu(current);
      setError("");setMessage("");return false;
    }
    if(!response.ok)throw new Error(typeof data.error==="string"?data.error:"No se pudo guardar. Tu edición se conserva.");
    const current=readMenu(data);
    setMenu(current);setConflicts([]);setPending(null);reviewRef.current=null;
    setMessage(current.publishedRevision===current.revision?"Guardado. Ya se ve en la carta.":"Sin cambios nuevos. La carta pública no se ha modificado.");
    return true;
  }
  async function save(base:AdminDish|null,dish:AdminDish):Promise<boolean>{
    if(!enabled||busyRef.current)return false;
    busyRef.current=true;++epoch.current;setBusy(true);setError("");setMessage("");
    reviewRef.current=null;setPending(null);setConflicts([]);
    try{return await send(buildLiveRequest(base,await uploadPhoto(dish)));}
    catch(reason){setError(errorText(reason));return false;}
    finally{busyRef.current=false;setBusy(false);setLoading(false);}
  }
  async function resolve(field:LiveField,choice:"mine"|"remote"):Promise<boolean>{
    if(busyRef.current)return false;
    const review=reviewRef.current;
    const selected=review?.conflicts.find(item=>item.field===field);
    if(!review||!selected||review.request.kind!=="update")return false;
    const changes={...review.request.changes};
    if(choice==="mine")changes[field]={before:selected.current,value:selected.value};else delete changes[field];
    const request:LiveEditRequest={...review.request,changes};
    const remaining=review.conflicts.filter(item=>item.field!==field);
    reviewRef.current={request,conflicts:remaining};setPending(request);setConflicts(remaining);
    if(remaining.length)return false;
    busyRef.current=true;++epoch.current;setBusy(true);setError("");
    try{return await send(request);}
    catch(reason){setError(errorText(reason));return false;}
    finally{busyRef.current=false;setBusy(false);setLoading(false);}
  }
  function dismissConflict(){if(busyRef.current)return;reviewRef.current=null;setPending(null);setConflicts([]);setError("");}
  return{menu,loading,busy,error,message,conflicts,pending,refresh,save,resolve,dismissConflict};
}
