import { categories, type Category, type Dish } from "../app/inch/menu";

export type AdminDish = { id: string; categoryId: string; name: string; description: string; price: number; hidden: boolean; imageSrc: string; imageName: string };
export const storageKey = "inch-admin-preview-draft-v1";
const changeEvent = "inch-admin-preview-updated";
export const initialDraft: AdminDish[] = categories.flatMap(c => c.dishes.map((d, i) => ({ id: `${c.id}-${i}`, categoryId: c.id, name: d.name, description: d.description, price: d.price, hidden: false, imageSrc: d.image ? `/inch/${d.image}.webp` : "", imageName: d.image ? `${d.image}.webp` : "Sin imagen" })));
export function applyDraftToMenu(dishes: AdminDish[]): Category[] {
  const originals = new Map<string, Dish>(categories.flatMap(c => c.dishes.map((d, i) => [`${c.id}-${i}`, d] as const)));
  return categories.map(c => ({ ...c, dishes: dishes.filter(d => d.categoryId === c.id && !d.hidden).map(d => ({
    ...originals.get(d.id), id: d.id, name: d.name, description: d.description, price: d.price, image: undefined, imageSrc: d.imageSrc,
  })) }));
}

export function parseDraft(raw: string): AdminDish[] | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value) || value.length > 500 || new Set(value.map(d => d?.id)).size !== value.length) return null;
    if (!value.every(d => d && typeof d.id === "string" && d.id.length > 0 && categories.some(c => c.id === d.categoryId) && typeof d.name === "string" && d.name.trim().length > 0 && typeof d.description === "string" && typeof d.price === "number" && Number.isFinite(d.price) && d.price >= 0 && d.price <= 999999.99 && typeof d.hidden === "boolean" && typeof d.imageName === "string" && typeof d.imageSrc === "string" && (!d.imageSrc || /^\/inch\/[a-z0-9-]+\.webp$/.test(d.imageSrc) || /^data:image\/(png|jpeg|webp);base64,/.test(d.imageSrc)))) return null;
    return value as AdminDish[];
  } catch { return null; }
}

export function readDraftSnapshot() {
  try { return window.localStorage.getItem(storageKey) ?? ""; } catch { return ""; }
}
export function readLocalPreviewSnapshot() {
  // The deployed static menu must never consume private-browser draft data.
  if (process.env.NODE_ENV !== "development" || !["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname)) return "";
  return readDraftSnapshot();
}
export const serverDraftSnapshot = () => "";
export function subscribeToDraft(onChange: () => void) {
  const storageChange = (event: StorageEvent) => { if (event.key === storageKey || event.key === null) onChange(); };
  window.addEventListener("storage", storageChange);
  window.addEventListener(changeEvent, onChange);
  return () => { window.removeEventListener("storage", storageChange); window.removeEventListener(changeEvent, onChange); };
}
export function saveLocalDraft(dishes: AdminDish[]) {
  const raw = JSON.stringify(dishes);
  if (!parseDraft(raw)) throw new Error("Invalid menu draft");
  window.localStorage.setItem(storageKey, raw);
  window.dispatchEvent(new Event(changeEvent));
}
