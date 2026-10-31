import { parseDraft, type AdminDish } from "./inch-draft";

export const liveEditPrefix = "inch-admin-live-edit-v1:";
export type SavedLiveEdit = { token: string; base: AdminDish | null; dish: AdminDish; priceText: string };
type EditStorage = Pick<Storage, "length" | "key" | "getItem" | "setItem" | "removeItem">;

function valid(value: unknown): value is SavedLiveEdit {
  if (!value || typeof value !== "object") return false;
  const edit = value as SavedLiveEdit;
  return typeof edit.token === "string" && /^[a-zA-Z0-9-]{1,100}$/.test(edit.token)
    && typeof edit.priceText === "string" && edit.priceText.length <= 100
    && !!edit.dish && typeof edit.dish.name === "string" && edit.dish.name.length <= 160
    && !!parseDraft(JSON.stringify([{ ...edit.dish, name: edit.dish.name.trim() || "Edición pendiente" }]))
    && (edit.base === null || !!parseDraft(JSON.stringify([edit.base])));
}
export function persistLiveEdit(storage: EditStorage, edit: SavedLiveEdit) {
  if (!valid(edit)) throw new Error("Edición no válida");
  storage.setItem(liveEditPrefix + edit.token, JSON.stringify(edit));
}
export function listLiveEdits(storage: EditStorage): SavedLiveEdit[] {
  const result: SavedLiveEdit[] = [];
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index);
    if (!key?.startsWith(liveEditPrefix)) continue;
    try {
      const edit: unknown = JSON.parse(storage.getItem(key) ?? "null");
      if (valid(edit) && key === liveEditPrefix + edit.token) result.push(edit);
    } catch { /* Never delete an unreadable recovery copy. */ }
  }
  return result;
}
export function removeLiveEdit(storage: EditStorage, token: string) {
  if (!/^[a-zA-Z0-9-]{1,100}$/.test(token)) throw new Error("Edición no válida");
  storage.removeItem(liveEditPrefix + token);
}
