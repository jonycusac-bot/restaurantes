"use client";
import { useEffect, useState } from "react";
import { beforeCloudLoadKey, cloudRevisionKey, conflictBackupKey, draftForCloud, parseCloudDishes, preserveLocalPhotos, type CloudDraft } from "../../../lib/cloud-draft";
import { parseDraft, readDraftSnapshot, saveLocalDraft, type AdminDish } from "../../../lib/inch-draft";

// A reviewed revision conflict: the latest cloud draft plus the local copy the
// reviewer actually saw, so the two can be compared before anything is written.
export type CloudConflict = { cloud: CloudDraft; local: AdminDish[]; localRaw: string };

async function cloudResponse(response: Response): Promise<CloudDraft> {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "No se pudo acceder al borrador de la nube.");
  const dishes = parseCloudDishes(data.dishes);
  if (!dishes || !Number.isSafeInteger(data.revision) || data.revision < 1 || typeof data.updatedAt !== "string" || (data.publishedRevision !== undefined && data.publishedRevision !== null && (!Number.isSafeInteger(data.publishedRevision) || data.publishedRevision < 1))) throw new Error("La respuesta de la nube no es válida. Tu copia local se conserva.");
  return { dishes, revision: data.revision, updatedAt: data.updatedAt, imageStorage: data.imageStorage === true, canPublish: data.canPublish === true, ...(data.publishedRevision === undefined ? {} : { publishedRevision: data.publishedRevision }) };
}
const message = (error: unknown) => error instanceof Error ? error.message : "No se pudo conectar. Tu borrador local se conserva.";

export function useCloudDraft(enabled = true) {
  const [cloud, setCloud] = useState<CloudDraft | null>(null);
  const [pending, setPending] = useState<CloudDraft | null>(null);
  const [conflict, setConflict] = useState<CloudConflict | null>(null);
  const [busy, setBusy] = useState(enabled);
  const [error, setError] = useState(false);
  const [status, setStatus] = useState(enabled ? "Conectando con el borrador de la nube…" : "Borrador local. La conexión PostgreSQL quedó detenida.");
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    void fetch("/api/admin/draft", { cache: "no-store", signal: controller.signal }).then(cloudResponse).then(data => {
      if (controller.signal.aborted) return;
      setError(false);
      setCloud(data);
      if (!readDraftSnapshot()) {
        // Only initialize an empty browser; never replace an existing local draft.
        saveLocalDraft(data.dishes);
        window.localStorage.setItem(cloudRevisionKey, String(data.revision));
        setStatus("Borrador de la nube cargado. Los cambios que hagas deben guardarse en la nube con el botón correspondiente.");
      } else setStatus("Conectado. Tu borrador de este navegador se conserva. Puedes guardarlo en la nube o cargar la copia de la nube.");
    }).catch(error => { if (!controller.signal.aborted) { setError(true); setStatus(message(error)); } }).finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [enabled]);

  // Reconcile uploaded photo URLs into the working local copy without discarding
  // edits made in another tab while the upload was in progress.
  function reconcilePhotos(imageStorage: boolean, reviewed: AdminDish[], normalized: AdminDish[]) {
    if (!imageStorage) return;
    try {
      const current = parseDraft(readDraftSnapshot()) ?? reviewed;
      saveLocalDraft(current.map(dish => {
        const original = reviewed.find(d => d.id === dish.id);
        const uploaded = normalized.find(d => d.id === dish.id);
        return original && uploaded && dish.imageSrc === original.imageSrc ? { ...dish, imageSrc: uploaded.imageSrc, imageName: uploaded.imageName } : dish;
      }));
    } catch { /* keep the local copy if the browser storage is full; the cloud copy already saved */ }
  }

  // Fetch the latest cloud copy with GET (never rewriting the local draft) and
  // expose it for a visible, explicit review instead of only an error string.
  async function openConflict() {
    const data = await cloudResponse(await fetch("/api/admin/draft", { cache: "no-store" }));
    const localRaw = readDraftSnapshot();
    const local = parseDraft(localRaw);
    if (!local) throw new Error("No se pudo leer tu borrador para compararlo. No se ha sustituido ninguna copia.");
    setCloud(data);
    setConflict({ cloud: data, local, localRaw });
    setError(true);
    setStatus("Hay cambios más recientes en la nube. Revisa las diferencias y elige: cancelar, usar la versión de la nube o guardar tu copia. Tu borrador local se conserva.");
  }

  async function save(dishes: AdminDish[]) {
    if (!cloud || busy) return;
    setError(false); setBusy(true); setPending(null);
    try {
      // The browser revision belongs to this local copy. A fresh GET must never
      // silently grant an old copy permission to overwrite a newer cloud draft.
      const revision = Number(window.localStorage.getItem(cloudRevisionKey));
      if (!Number.isSafeInteger(revision) || revision < 1) { await openConflict(); return; }
      const normalized = cloud.imageStorage ? await uploadPhotos(dishes) : draftForCloud(dishes, cloud.dishes);
      const response = await fetch("/api/admin/draft", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ revision, dishes: normalized }) });
      if (response.status === 409) { await openConflict(); return; }
      const data = await cloudResponse(response);
      reconcilePhotos(data.imageStorage === true, dishes, normalized);
      window.localStorage.setItem(cloudRevisionKey, String(data.revision));
      setCloud(data);
      setStatus(`Borrador guardado en la nube · versión ${data.revision}. La carta pública no ha cambiado.${!data.imageStorage && dishes.some(d => d.imageSrc.startsWith("data:")) ? " Las fotos nuevas siguen solo en este navegador, pendientes del paso 2." : ""}`);
    } catch (error) { setError(true); setStatus(message(error)); }
    finally { setBusy(false); }
  }

  // Explicit resolution 1/3: cancel keeps both copies, changing nothing.
  function cancelConflict() { setConflict(null); }

  // Explicit resolution 2/3: replace the local draft with the reviewed cloud
  // copy, backing up the local copy first through the existing recovery keys.
  function acceptConflictCloud() {
    if (!conflict) return;
    setError(false);
    try {
      const raw = readDraftSnapshot();
      if (raw !== conflict.localRaw) {
        const current = parseDraft(raw);
        if (current) setConflict({ ...conflict, local: current, localRaw: raw });
        setError(true); setStatus("Tu copia local cambió. Revisa de nuevo las diferencias antes de sustituirla.");
        return;
      }
      window.localStorage.setItem(beforeCloudLoadKey, conflict.localRaw);
      window.localStorage.setItem(`${beforeCloudLoadKey}-revision`, window.localStorage.getItem(cloudRevisionKey) ?? "");
      saveLocalDraft(conflict.cloud.imageStorage ? conflict.cloud.dishes : preserveLocalPhotos(conflict.cloud.dishes, conflict.local));
      window.localStorage.setItem(cloudRevisionKey, String(conflict.cloud.revision));
      setConflict(null);
      setStatus("Versión de la nube cargada. Tu copia anterior se puede recuperar en «Copias y recuperación». La carta pública no ha cambiado.");
    } catch { setError(true); setStatus("No se pudo cargar la versión de la nube: el almacenamiento local puede estar lleno. El borrador anterior se conserva."); }
  }

  // Explicit resolution 3/3: overwrite the cloud with the reviewed local copy
  // using the reviewed cloud revision. Backs up both copies first and never
  // publishes. Aborts without a PUT if the backup cannot be stored.
  async function saveLocalOverCloud() {
    if (!conflict || busy) return;
    if (readDraftSnapshot() !== conflict.localRaw) {
      setError(true);
      setStatus("El borrador de este navegador cambió en otra pestaña. Vuelve a revisar las diferencias antes de guardar.");
      try { await openConflict(); } catch { /* keep the previous review open */ }
      return;
    }
    setError(false); setBusy(true);
    try {
      window.localStorage.setItem(conflictBackupKey, JSON.stringify({
        localRaw: conflict.localRaw,
        localRevision: window.localStorage.getItem(cloudRevisionKey),
        cloud: { dishes: conflict.cloud.dishes, revision: conflict.cloud.revision, updatedAt: conflict.cloud.updatedAt, publishedRevision: conflict.cloud.publishedRevision ?? null },
      }));
      const normalized = conflict.cloud.imageStorage ? await uploadPhotos(conflict.local) : draftForCloud(conflict.local, conflict.cloud.dishes);
      const response = await fetch("/api/admin/draft", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ revision: conflict.cloud.revision, dishes: normalized }) });
      if (response.status === 409) {
        await openConflict();
        setStatus("La nube volvió a cambiar mientras revisabas. Vuelve a revisar las diferencias; tus copias se conservan.");
        return;
      }
      const data = await cloudResponse(response);
      reconcilePhotos(data.imageStorage === true, conflict.local, normalized);
      window.localStorage.setItem(cloudRevisionKey, String(data.revision));
      setCloud(data); setConflict(null);
      setStatus(`Tu copia revisada se guardó en la nube · versión ${data.revision}. Sustituyó el borrador de la nube; la carta pública no ha cambiado.`);
    } catch (error) {
      setError(true);
      setStatus(error instanceof Error && error.message === "Storage full" ? "No hay espacio para respaldar las copias; no se ha escrito en la nube. Libera espacio e inténtalo de nuevo." : message(error));
    }
    finally { setBusy(false); }
  }

  // Recover the pre-write local copy of a resolved conflict without touching the cloud.
  function restoreConflictBackup() {
    setError(false);
    try {
      const backup = readConflictBackup();
      const local = backup && typeof backup.localRaw === "string" ? parseDraft(backup.localRaw) : null;
      if (!local) { setError(true); setStatus("No hay una copia del conflicto que recuperar."); return; }
      saveLocalDraft(local);
      if (backup!.localRevision) window.localStorage.setItem(cloudRevisionKey, backup!.localRevision);
      else window.localStorage.removeItem(cloudRevisionKey);
      setConflict(null);
      setStatus("Copia del conflicto recuperada en este navegador. No se ha escrito en la nube.");
    } catch { setError(true); setStatus("No se pudo recuperar la copia del conflicto."); }
  }

  // Recover the cloud copy that was about to be replaced, through the existing load confirmation.
  function restoreConflictCloud() {
    setError(false);
    try {
      const backup = readConflictBackup();
      if (!backup?.cloud || !parseCloudDishes(backup.cloud.dishes)) { setError(true); setStatus("No hay una copia de la nube del conflicto que recuperar."); return; }
      setPending({ dishes: backup.cloud.dishes, revision: backup.cloud.revision, updatedAt: backup.cloud.updatedAt, imageStorage: true, canPublish: true, publishedRevision: backup.cloud.publishedRevision ?? null });
      setStatus("Copia de la nube del conflicto recuperada. Confirma abajo si quieres sustituir el listado local.");
    } catch { setError(true); setStatus("No se pudo recuperar la copia de la nube del conflicto."); }
  }

  async function publish(dishes: AdminDish[]) {
    if (!cloud || !cloud.canPublish || busy) return;
    if (conflict) { setError(true); setStatus("Resuelve primero el conflicto de revisiones antes de publicar."); return; }
    if (JSON.stringify(dishes) !== JSON.stringify(cloud.dishes)) { setError(true); setStatus("Guarda primero todos los cambios del borrador en la nube antes de publicar."); return; }
    setError(false); setBusy(true);
    try {
      const response = await fetch("/api/admin/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ revision: cloud.revision }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo publicar.");
      if (data.ok !== true || data.sourceRevision !== cloud.revision) throw new Error("No se pudo confirmar la revisión publicada. Tu copia local se conserva.");
      setCloud(current => current && current.revision === data.sourceRevision ? { ...current, publishedRevision: data.sourceRevision } : current);
      setStatus("Carta publicada. Ya puedes abrir «Ver carta pública» para comprobar los cambios.");
    } catch (error) { setError(true); setStatus(message(error)); }
    finally { setBusy(false); }
  }
  async function requestLoad() {
    if (busy) return;
    setError(false); setBusy(true);
    try {
      const data = await cloudResponse(await fetch("/api/admin/draft", { cache: "no-store" }));
      setCloud(data); setPending(data);
      setStatus("Copia de la nube disponible. Confirma abajo si quieres sustituir el listado local; se conservará una copia anterior en este navegador.");
    } catch (error) { setError(true); setStatus(message(error)); }
    finally { setBusy(false); }
  }
  function acceptLoad() {
    if (!pending) return;
    setError(false);
    try {
      const raw = readDraftSnapshot();
      const local = parseDraft(raw) ?? [];
      // If backup storage is full, abort before replacing the working copy.
      if (raw) {
        window.localStorage.setItem(beforeCloudLoadKey, raw);
        window.localStorage.setItem(`${beforeCloudLoadKey}-revision`, window.localStorage.getItem(cloudRevisionKey) ?? "");
      }
      saveLocalDraft(pending.imageStorage ? pending.dishes : preserveLocalPhotos(pending.dishes, local));
      window.localStorage.setItem(cloudRevisionKey, String(pending.revision));
      setPending(null); setConflict(null);
      setStatus(pending.imageStorage ? "Copia de la nube cargada con sus fotos. Tu copia anterior se puede recuperar. La carta pública no ha cambiado." : "Copia de la nube cargada. Las fotos nuevas que ya tenías se conservan en este navegador. La carta pública no ha cambiado.");
    } catch { setError(true); setStatus("No se pudo cargar la copia de la nube: el almacenamiento local puede estar lleno. El borrador anterior se conserva."); }
  }
  function restoreBackup() {
    setError(false);
    try {
      const draft = parseDraft(window.localStorage.getItem(beforeCloudLoadKey) ?? "");
      if (!draft) { setError(true); setStatus("No hay una copia anterior a la carga de la nube."); return; }
      saveLocalDraft(draft);
      const revision = window.localStorage.getItem(`${beforeCloudLoadKey}-revision`);
      if (revision) window.localStorage.setItem(cloudRevisionKey, revision); else window.localStorage.removeItem(cloudRevisionKey);
      setPending(null); setStatus("Copia local anterior recuperada. No se ha escrito en la nube.");
    } catch { setError(true); setStatus("No se pudo recuperar la copia anterior."); }
  }
  return { cloud, busy, status, error, pending, conflict, save, saveLocalOverCloud, acceptConflictCloud, cancelConflict, restoreConflictBackup, restoreConflictCloud, publish, requestLoad, acceptLoad, restoreBackup, cancelLoad: () => setPending(null) };
}

function readConflictBackup(): { localRaw?: string; localRevision?: string | null; cloud?: { dishes: AdminDish[]; revision: number; updatedAt: string; publishedRevision?: number | null } } | null {
  try { const raw = window.localStorage.getItem(conflictBackupKey); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

async function uploadPhotos(dishes: AdminDish[]): Promise<AdminDish[]> {
  const uploaded: AdminDish[] = [];
  for (const dish of dishes) {
    if (!dish.imageSrc.startsWith("data:")) { uploaded.push({ ...dish }); continue; }
    const comma = dish.imageSrc.indexOf(",");
    const bytes = Uint8Array.from(atob(dish.imageSrc.slice(comma + 1)), c => c.charCodeAt(0));
    if (bytes.byteLength > 1024 * 1024) throw new Error(`La foto de «${dish.name}» supera 1 MB. Vuelve a seleccionarla para optimizarla.`);
    const response = await fetch("/api/admin/images", { method: "POST", headers: { "Content-Type": "application/octet-stream" }, body: bytes });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "No se pudo guardar la foto.");
    if (!/^\/media\/[a-f0-9]{64}\.(webp|jpg|png)$/.test(data.imageSrc)) throw new Error("La respuesta de la foto no es válida.");
    uploaded.push({ ...dish, imageSrc: data.imageSrc });
  }
  return uploaded;
}
