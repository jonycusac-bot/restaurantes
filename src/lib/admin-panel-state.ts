import type { CloudDraft } from "./cloud-draft";
import type { AdminDish } from "./inch-draft";

export function getAdminPanelState(dishes: AdminDish[], cloud: CloudDraft | null, options: { enabled: boolean; busy: boolean; pending: boolean; conflict?: boolean }): { kind: string; label: string; description: string; canSave: boolean; canPublish: boolean } {
  const state = (kind: string, label: string, description: string, canSave = false, canPublish = false) => ({ kind, label, description, canSave, canPublish });
  if (!options.enabled) return state("local", "Solo en este dispositivo", "Los cambios y las fotos se conservan en este navegador.");
  if (!cloud) return options.busy
    ? state("connecting", "Conectando…", "Tu copia local se conserva mientras conectamos con la nube.")
    : state("offline", "Sin conexión", "No se ha podido confirmar la copia de la nube. Tu borrador local se conserva.");
  if (options.pending) return state("pending", "Revisar copia", "Revisa la copia de la nube antes de sustituir tu borrador local.");
  if (options.conflict) return state("conflict", "Resolver conflicto", "Hay cambios más recientes en la nube. Revisa las diferencias y elige qué hacer; tu borrador local se conserva.");
  if (options.busy) return state("busy", "Procesando…", "Espera a que termine la operación. Tu copia local se conserva.");
  if (JSON.stringify(dishes) !== JSON.stringify(cloud.dishes)) return state("dirty", "Cambios sin guardar", "Guarda los cambios en la nube antes de publicarlos.", true);
  if (cloud.publishedRevision === cloud.revision) return state("published", "Carta publicada", "Esta revisión guardada es la que está publicada en la carta pública.");
  return state("saved", "Guardado, pendiente de publicar", "Los cambios guardados todavía no están confirmados en la carta pública.", false, cloud.canPublish === true);
}
