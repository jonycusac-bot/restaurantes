import type { AdminDish } from "./inch-draft";

// Presentation-only comparison between the browser draft and the latest cloud
// draft. It never exposes photo payloads (data URLs) as reviewable text: photos
// are reported by presence, and a validated thumbnail source is returned
// separately for the component to render.
export type ConflictedField = { field: string; label: string; local: string; cloud: string };
export type DishConflict = {
  id: string;
  name: string;
  status: "added" | "removed" | "changed" | "same";
  fields: ConflictedField[];
  localPhoto: string;
  cloudPhoto: string;
  photoChanged: boolean;
};
export type DraftDiff = { dishes: DishConflict[]; added: number; removed: number; changed: number };

export function isDisplayablePhoto(src: string): boolean {
  return /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(src)
    || /^\/media\/[a-f0-9]{64}\.(webp|jpg|png)$/.test(src)
    || /^\/inch\/[a-z0-9-]+\.webp$/.test(src);
}

const text = (field: string, label: string, local: string, cloud: string, out: ConflictedField[]) => { if (local !== cloud) out.push({ field, label, local, cloud }); };

function compare(local: AdminDish, cloud: AdminDish): DishConflict {
  const fields: ConflictedField[] = [];
  text("name", "Nombre", local.name, cloud.name, fields);
  text("description", "Descripción", local.description, cloud.description, fields);
  text("price", "Precio", String(local.price), String(cloud.price), fields);
  text("hidden", "Visibilidad", local.hidden ? "Oculto" : "Visible", cloud.hidden ? "Oculto" : "Visible", fields);
  text("categoryId", "Categoría", local.categoryId, cloud.categoryId, fields);
  const localPhoto = isDisplayablePhoto(local.imageSrc) ? local.imageSrc : "";
  const cloudPhoto = isDisplayablePhoto(cloud.imageSrc) ? cloud.imageSrc : "";
  const photoChanged = local.imageSrc !== cloud.imageSrc;
  if (photoChanged) fields.push({ field: "photo", label: "Foto", local: localPhoto ? "Con foto" : "Sin foto", cloud: cloudPhoto ? "Con foto" : "Sin foto" });
  return { id: local.id, name: local.name || cloud.name, status: fields.length ? "changed" : "same", fields, localPhoto, cloudPhoto, photoChanged };
}

export function diffDraft(local: AdminDish[], cloud: AdminDish[]): DraftDiff {
  const order: string[] = [];
  const localById = new Map(local.map(d => [d.id, d]));
  const cloudById = new Map(cloud.map(d => [d.id, d]));
  for (const d of local) if (!order.includes(d.id)) order.push(d.id);
  for (const d of cloud) if (!order.includes(d.id)) order.push(d.id);
  const dishes: DishConflict[] = order.map(id => {
    const l = localById.get(id); const c = cloudById.get(id);
    if (l && !c) return { id, name: l.name, status: "added", fields: [], localPhoto: isDisplayablePhoto(l.imageSrc) ? l.imageSrc : "", cloudPhoto: "", photoChanged: !!l.imageSrc };
    if (!l && c) return { id, name: c.name, status: "removed", fields: [], localPhoto: "", cloudPhoto: isDisplayablePhoto(c.imageSrc) ? c.imageSrc : "", photoChanged: !!c.imageSrc };
    return compare(l!, c!);
  });
  return { dishes, added: dishes.filter(d => d.status === "added").length, removed: dishes.filter(d => d.status === "removed").length, changed: dishes.filter(d => d.status === "changed").length };
}
