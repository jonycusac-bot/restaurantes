import { initialDraft, parseDraft, type AdminDish } from "./inch-draft";

export type CloudDraft = { dishes: AdminDish[]; revision: number; updatedAt: string; imageStorage?: boolean; canPublish?: boolean; publishedRevision?: number | null };
export const cloudRevisionKey = "inch-admin-cloud-revision-v1";
export const beforeCloudLoadKey = "inch-admin-before-cloud-load-v1";
// Set before the reviewer overwrites the cloud with their own copy: it holds the
// reviewed local draft plus the cloud copy about to be replaced, so both are
// recoverable through the existing recovery controls.
export const conflictBackupKey = "inch-admin-conflict-backup-v1";

// Uploaded photos remain in the browser until file storage is implemented.
export function draftForCloud(dishes: AdminDish[], previous = initialDraft): AdminDish[] {
  return dishes.map(dish => {
    if (!dish.imageSrc.startsWith("data:")) return { ...dish };
    const fallback = previous.find(d => d.id === dish.id);
    return { ...dish, imageSrc: fallback?.imageSrc ?? "", imageName: fallback?.imageName ?? "Sin imagen" };
  });
}

export function preserveLocalPhotos(cloud: AdminDish[], local: AdminDish[]): AdminDish[] {
  return cloud.map(dish => {
    const photo = local.find(d => d.id === dish.id && d.imageSrc.startsWith("data:"));
    return photo ? { ...dish, imageSrc: photo.imageSrc, imageName: photo.imageName } : dish;
  });
}

export function parseCloudDishes(value: unknown): AdminDish[] | null {
  const parsed = parseDraft(JSON.stringify(value));
  if (!parsed || parsed.some(d => d.id.length > 160 || d.name.length > 160 || d.description.length > 2000 || d.imageName.length > 255 || d.imageSrc.startsWith("data:"))) return null;
  // Persist only expected fields, never arbitrary client properties.
  return parsed.map(({ id, categoryId, name, description, price, hidden, imageSrc, imageName }) => ({ id, categoryId, name: name.trim(), description, price, hidden, imageSrc, imageName }));
}
