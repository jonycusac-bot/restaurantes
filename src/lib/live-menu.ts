import { categories } from "../app/inch/menu";
import { parseCloudDishes } from "./cloud-draft";
import type { AdminDish } from "./inch-draft";

export type LiveField = "name" | "description" | "price" | "hidden" | "categoryId" | "image";
export type LiveImage = { imageSrc: string; imageName: string };
export type LiveEditRequest = { kind: "update"; id: string; changes: Partial<Record<LiveField, { before: unknown; value: unknown }>> } | { kind: "create"; dish: AdminDish };
export type LiveConflict = { field: LiveField; label: string; before: unknown; value: unknown; current: unknown };
export const LIVE_FIELD_LABELS: Record<LiveField,string> = { name: "Nombre", description: "Descripción", price: "Precio", hidden: "Visibilidad", categoryId: "Categoría", image: "Foto" };
export const LIVE_FIELDS = Object.keys(LIVE_FIELD_LABELS) as LiveField[];
const record = (value: unknown): value is Record<string,unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const keysOnly = (value: Record<string,unknown>, allowed: string[]) => Object.keys(value).every(key => allowed.includes(key));
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (record(value)) return Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])]));
  return value;
}
export const canonicalEqual = (a: unknown,b: unknown): boolean => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
export function liveFieldValue(dish: AdminDish, field: LiveField): unknown {
  return field === "image" ? { imageSrc: dish.imageSrc, imageName: dish.imageName } : dish[field];
}
function validField(field: LiveField,value: unknown): boolean {
  if (field === "price") return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 999999.99;
  if (field === "hidden") return typeof value === "boolean";
  if (field === "categoryId") return typeof value === "string" && categories.some(category=>category.id===value);
  if (field === "name") return typeof value === "string" && !!value.trim() && value.length <= 160;
  if (field === "description") return typeof value === "string" && value.length <= 2000;
  return record(value) && keysOnly(value,["imageSrc","imageName"]) && typeof value.imageSrc === "string" && typeof value.imageName === "string" && value.imageName.length <= 255 && (!value.imageSrc || /^\/inch\/[a-z0-9-]+\.webp$/.test(value.imageSrc) || /^\/media\/[a-f0-9]{64}\.(webp|jpg|png)$/.test(value.imageSrc));
}
export function validateLiveEditRequest(value: unknown): LiveEditRequest | null {
  if (!record(value)) return null;
  if (value.kind === "create") {
    if (!keysOnly(value,["kind","dish"])) return null;
    const parsed=parseCloudDishes([value.dish]);
    return parsed?.length === 1 ? {kind:"create",dish:parsed[0]} : null;
  }
  if (value.kind !== "update" || !keysOnly(value,["kind","id","changes"]) || typeof value.id !== "string" || !value.id || value.id.length > 160 || !record(value.changes) || !keysOnly(value.changes,LIVE_FIELDS)) return null;
  const changes: Extract<LiveEditRequest,{kind:"update"}>["changes"] = {};
  for (const field of Object.keys(value.changes) as LiveField[]) {
    const change=value.changes[field];
    if (!record(change) || !keysOnly(change,["before","value"]) || !validField(field,change.before) || !validField(field,change.value)) return null;
    changes[field]={before:change.before,value:field === "name" ? (change.value as string).trim() : change.value};
  }
  return {kind:"update",id:value.id,changes};
}
export function applyLiveEdit(dishes: AdminDish[],edit: LiveEditRequest): {ok:true;dishes:AdminDish[];changed:boolean} | {ok:false;conflicts:LiveConflict[]} {
  if (edit.kind === "create") {
    const current=dishes.find(dish=>dish.id===edit.dish.id);
    if (!current) return {ok:true,dishes:[...dishes,edit.dish],changed:true};
    if (canonicalEqual(current,edit.dish)) return {ok:true,dishes,changed:false};
    const differences=LIVE_FIELDS.filter(field=>!canonicalEqual(liveFieldValue(current,field),liveFieldValue(edit.dish,field)));
    return {ok:false,conflicts:differences.map(field=>({field,label:LIVE_FIELD_LABELS[field],before:liveFieldValue(current,field),value:liveFieldValue(edit.dish,field),current:liveFieldValue(current,field)}))};
  }
  const current=dishes.find(dish=>dish.id===edit.id);
  const conflicts: LiveConflict[]=[];
  let next=current ? {...current} : null;
  let changed=false;
  for (const field of Object.keys(edit.changes) as LiveField[]) {
    const change=edit.changes[field]!;
    const currentValue=current ? liveFieldValue(current,field) : null;
    if (!current || (!canonicalEqual(currentValue,change.before) && !canonicalEqual(currentValue,change.value))) {
      conflicts.push({field,label:LIVE_FIELD_LABELS[field],before:change.before,value:change.value,current:currentValue});continue;
    }
    if (canonicalEqual(currentValue,change.value)) continue;
    changed=true;
    next=field === "image" ? {...next!,...change.value as LiveImage} : {...next!,[field]:change.value};
  }
  if (conflicts.length) return {ok:false,conflicts};
  return {ok:true,dishes:changed ? dishes.map(dish=>dish.id===edit.id ? next! : dish) : dishes,changed};
}
