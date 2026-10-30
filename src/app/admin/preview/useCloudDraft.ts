"use client";
import { useEffect, useState } from "react";
import { beforeCloudLoadKey, cloudRevisionKey, draftForCloud, parseCloudDishes, preserveLocalPhotos, type CloudDraft } from "../../../lib/cloud-draft";
import { parseDraft, readDraftSnapshot, saveLocalDraft, type AdminDish } from "../../../lib/inch-draft";

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

  async function save(dishes: AdminDish[]) {
    if (!cloud || busy) return;
    setError(false); setBusy(true); setPending(null);
    try {
      const revision = Number(window.localStorage.getItem(cloudRevisionKey)) || cloud.revision;
      const normalized = cloud.imageStorage ? await uploadPhotos(dishes) : draftForCloud(dishes, cloud.dishes);
      const payload = { revision, dishes: normalized };
      const response = await fetch("/api/admin/draft", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await cloudResponse(response);
      if (cloud.imageStorage) {
        // Preserve edits made in another tab while the upload was in progress.
        const current = parseDraft(readDraftSnapshot()) ?? dishes;
        saveLocalDraft(current.map(dish => {
          const original = dishes.find(d => d.id === dish.id);
          const uploaded = normalized.find(d => d.id === dish.id);
          return original && uploaded && dish.imageSrc === original.imageSrc ? { ...dish, imageSrc: uploaded.imageSrc, imageName: uploaded.imageName } : dish;
        }));
      }
      window.localStorage.setItem(cloudRevisionKey, String(data.revision));
      setCloud(data);
      setStatus(`Borrador guardado en la nube · versión ${data.revision}. La carta pública no ha cambiado.${!data.imageStorage && dishes.some(d => d.imageSrc.startsWith("data:")) ? " Las fotos nuevas siguen solo en este navegador, pendientes del paso 2." : ""}`);
    } catch (error) { setError(true); setStatus(message(error)); }
    finally { setBusy(false); }
  }
  async function publish(dishes: AdminDish[]) {
    if (!cloud || !cloud.canPublish || busy) return;
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
      setPending(null);
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
  return { cloud, busy, status, error, pending, save, publish, requestLoad, acceptLoad, restoreBackup, cancelLoad: () => setPending(null) };
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
