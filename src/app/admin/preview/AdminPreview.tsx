"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { categories, menuSections, type MenuSection } from "../../inch/menu";
import { initialDraft, parseDraft, readDraftSnapshot, saveLocalDraft, serverDraftSnapshot, subscribeToDraft, type AdminDish } from "../../../lib/inch-draft";
import { prepareDishImage } from "../../../lib/prepare-dish-image";
import { diffDraft } from "../../../lib/cloud-conflict";
import { useCloudDraft, type CloudConflict } from "./useCloudDraft";
import { getAdminPanelState } from "../../../lib/admin-panel-state";
import LiveAdminPreview from "./LiveAdminPreview";

const money = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
const localPreview = process.env.NODE_ENV === "development";

export default function AdminPreview({ cloudflare = false }: { cloudflare?: boolean } = {}) {
  return cloudflare ? <LiveAdminPreview /> : <LegacyAdminPreview />;
}

// Retained for the separate local preview and its historical regression fixtures.
// Cloudflare always uses the central, direct-save editor above.
export function LegacyAdminPreview({ cloudflare = false }: { cloudflare?: boolean } = {}) {
  const [section, setSection] = useState<MenuSection>("carta");
  const [categoryId, setCategoryId] = useState("entrantes");
  const rawDraft = useSyncExternalStore(subscribeToDraft, readDraftSnapshot, serverDraftSnapshot);
  const drafts = useMemo(() => parseDraft(rawDraft) ?? initialDraft, [rawDraft]);
  const [editing, setEditing] = useState<AdminDish | null>(null);
  const [status, setStatus] = useState("");
  const [confirmation, setConfirmation] = useState<{ review: CloudConflict; choice: "keepLocal" | "useCloud" } | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const editorRef = useRef<HTMLDialogElement>(null);
  const editorTriggerRef = useRef<HTMLButtonElement | null>(null);
  const editorOpen = editing !== null;
  const cloud = useCloudDraft(cloudflare);
  const panelState = getAdminPanelState(drafts, cloud.cloud, { enabled: cloudflare, busy: cloud.busy, pending: !!cloud.pending, conflict: !!cloud.conflict });
  const sectionCategories = menuSections.find(s => s.id === section)!.categoryIds.map(id => categories.find(c => c.id === id)!);
  const category = categories.find(c => c.id === categoryId)!;
  const rows = drafts.filter(d => d.categoryId === categoryId);
  const activeConflict = cloud.conflict;
  const conflictConfirm = confirmation?.review === activeConflict ? confirmation?.choice : "none";
  function setConflictConfirm(choice: "none" | "keepLocal" | "useCloud") {
    setConfirmation(choice === "none" || !activeConflict ? null : { review: activeConflict, choice });
  }
  const conflictDiff = activeConflict ? diffDraft(activeConflict.local, activeConflict.cloud.dishes) : null;
  const conflictChanges = conflictDiff ? conflictDiff.dishes.filter(d => d.status !== "same") : [];

  useEffect(() => {
    const dialog = editorRef.current;
    if (!dialog) return;

    const viewport = window.matchMedia("(max-width: 1050px)");
    const previousOverflow = document.body.style.overflow;
    function syncEditor() {
      if (dialog!.open && dialog!.matches(":modal") === viewport.matches) return;
      if (dialog!.open) dialog!.close();
      if (viewport.matches) {
        dialog!.showModal();
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = previousOverflow;
        dialog!.show();
      }
    }
    syncEditor();
    viewport.addEventListener("change", syncEditor);
    return () => {
      viewport.removeEventListener("change", syncEditor);
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      editorTriggerRef.current?.focus({ preventScroll: true });
    };
  }, [editorOpen]);


  function changeCategory(id: string) { setCategoryId(id); setEditing(null); setStatus(""); }
  function changeSection(next: MenuSection) { setSection(next); changeCategory(next === "carta" ? "entrantes" : "entradas"); }
  function saveDish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || imageLoading) return;
    const data = new FormData(event.currentTarget);
    const price = Number(String(data.get("price")).replace(",", "."));
    const name = String(data.get("name") ?? "").trim();
    if (!name || !Number.isFinite(price) || price < 0) { setStatus("Revisa el nombre y el precio del plato."); return; }
    const next = { ...editing, name, price, description: String(data.get("description") ?? "").trim(), hidden: data.get("hidden") === "on" };
    try {
      saveLocalDraft(drafts.some(d => d.id === next.id) ? drafts.map(d => d.id === next.id ? next : d) : [...drafts, next]);
      setEditing(null); setStatus(cloudflare ? "Cambios del plato aplicados. Pulsa «Guardar cambios» para guardarlos en la nube." : "Plato guardado en este dispositivo. Esta vista local no publica la carta.");
    } catch { setStatus("No se pudo guardar el plato. El navegador puede tener el almacenamiento lleno o bloqueado. Tus cambios siguen en el formulario; prueba con una imagen más pequeña."); }
  }
  async function chooseImage(file?: File) {
    if (!file || !editing) return;
    const id = editing.id;
    setImageLoading(true);
    try {
      const image = await prepareDishImage(file, cloudflare ? 750 * 1024 : 2 * 1024 * 1024);
      setEditing(current => current?.id === id ? { ...current, imageSrc: image.dataUrl, imageName: image.name } : current);
      setStatus(`Foto preparada: ${(file.size / 1024 / 1024).toFixed(1)} MB → ${Math.ceil(image.bytes / 1024)} KB. Aplica el cambio al borrador para guardarla.`);
    } catch (error) { setStatus(error instanceof Error ? error.message : "No se pudo preparar la imagen."); }
    finally { setImageLoading(false); }
  }
  function saveDraft() {
    try { saveLocalDraft(drafts); setStatus("Borrador guardado en este navegador. No se ha publicado ni enviado a la nube."); }
    catch { setStatus("No se pudo guardar: el navegador puede tener el almacenamiento lleno o bloqueado. Prueba con imágenes más pequeñas."); }
  }
  return <main className="admin-preview">
    <div className="admin-notice">{cloudflare ? "Edita tus platos, guarda los cambios y publica cuando estén listos." : "Vista local · Los cambios se conservan solo en este dispositivo."}</div>
    <header className="admin-header"><div><p>INCH · ADMINISTRACIÓN</p><h1>Gestionar la carta</h1></div><a href="/" target="_blank" rel="noreferrer">{localPreview && !cloudflare ? "Ver borrador en la carta local ↗" : "Ver carta pública ↗"}</a></header>
    <div className="admin-toolbar">
      <div className="admin-sections" role="group" aria-label="Sección de la carta"><button type="button" aria-pressed={section === "carta"} onClick={() => changeSection("carta")}>Carta</button><button type="button" aria-pressed={section === "sushi"} onClick={() => changeSection("sushi")}>Sushi</button></div>
      <div className="admin-save-state" role="status" data-state={panelState.kind}><strong>{panelState.label}</strong><span>{panelState.description}</span></div>
      <div className="admin-primary-actions">
        <button type="button" disabled={!!editing || cloud.busy || (cloudflare && !panelState.canSave)} onClick={() => { if (cloudflare) { setStatus(""); void cloud.save(drafts); } else saveDraft(); }}>Guardar cambios</button>
        <button type="button" disabled={!!editing || !panelState.canPublish} onClick={() => cloud.publish(drafts)}>Publicar carta</button>
      </div>
    </div>
    {cloudflare && cloud.error && <p className="admin-feedback admin-feedback-error" role="alert">{cloud.status}</p>}
    {status && <p className="admin-status" role="status">{status}</p>}
    {cloudflare && activeConflict && conflictDiff && <section className="admin-conflict" aria-label="Revisar diferencias del conflicto de revisiones">
      <h2>Revisar diferencias antes de continuar</h2>
      <p>La nube tiene cambios más recientes (versión {activeConflict.cloud.revision}). Compara tu copia con la de la nube. Nada se ha modificado todavía: tu borrador local sigue intacto.</p>
      <p className="admin-conflict-summary">{conflictDiff.added} solo en tu copia · {conflictDiff.removed} solo en la nube · {conflictDiff.changed} con cambios de campos.</p>
      {conflictChanges.length ? <ul className="admin-conflict-list">{conflictChanges.map(d => <li key={d.id}>
        <div className="admin-conflict-dish"><span className="admin-conflict-name">{d.name || d.id}</span><span className={`admin-conflict-badge admin-conflict-badge-${d.status}`}>{d.status === "added" ? "Solo en tu copia" : d.status === "removed" ? "Solo en la nube" : "Cambios"}</span></div>
        {d.fields.some(f => f.field !== "photo") && <ul className="admin-conflict-fields">{d.fields.filter(f => f.field !== "photo").map(f => <li key={f.field}><strong>{f.label}:</strong> <span className="admin-conflict-local">Tu copia: {f.local || "—"}</span> · <span className="admin-conflict-cloud">Nube: {f.cloud || "—"}</span></li>)}</ul>}
        {d.photoChanged && <div className="admin-conflict-photos">
          {/* These are validated local/data/media URLs, already optimized. No Next image service is deployed on Pages. */}
          {/* eslint-disable @next/next/no-img-element */}
          <figure><figcaption>Tu copia</figcaption>{d.localPhoto ? <img src={d.localPhoto} alt={`Foto de ${d.name} en tu copia`} loading="lazy" /> : <span className="admin-conflict-nophoto">Sin foto</span>}</figure>
          <figure><figcaption>Nube</figcaption>{d.cloudPhoto ? <img src={d.cloudPhoto} alt={`Foto de ${d.name} en la nube`} loading="lazy" /> : <span className="admin-conflict-nophoto">Sin foto</span>}</figure>
          {/* eslint-enable @next/next/no-img-element */}
        </div>}
        {d.localPhoto && !d.cloudPhoto && <p className="admin-conflict-note">La foto que ves como «Tu copia» puede ser una imagen de este navegador; se subirá al guardar.</p>}
      </li>)}</ul> : <p className="admin-conflict-summary">Los datos coinciden; solo difieren los números de revisión.</p>}
      <div className="admin-conflict-actions">
        <button type="button" disabled={cloud.busy} onClick={() => { setConflictConfirm("none"); cloud.cancelConflict(); }}>Cancelar y conservar todo</button>
        <button type="button" disabled={cloud.busy} onClick={() => setConflictConfirm("useCloud")}>Usar versión de la nube</button>
        <button type="button" disabled={cloud.busy} onClick={() => setConflictConfirm("keepLocal")}>Guardar mi copia</button>
      </div>
      {conflictConfirm === "useCloud" && <div className="admin-conflict-confirm" role="alertdialog" aria-label="Confirmar uso de la versión de la nube">
        <p>Sustituirá el borrador de este navegador por la versión {activeConflict.cloud.revision} de la nube. Tu copia local quedará disponible en «Copias y recuperación». No se publicará nada.</p>
        <div><button type="button" disabled={cloud.busy} onClick={() => { cloud.acceptConflictCloud(); setConflictConfirm("none"); }}>Sí, usar la versión de la nube</button><button type="button" onClick={() => setConflictConfirm("none")}>Volver</button></div>
      </div>}
      {conflictConfirm === "keepLocal" && <div className="admin-conflict-confirm" role="alertdialog" aria-label="Confirmar guardado de tu copia">
        <p>Esto sustituirá el borrador de la nube (versión {activeConflict.cloud.revision}) con tu copia local revisada y NO publicará la carta. Antes de escribir se guardará una copia de tu borrador y de la versión de la nube en este navegador. ¿Continuar?</p>
        <div><button type="button" disabled={cloud.busy} onClick={() => { void cloud.saveLocalOverCloud(); setConflictConfirm("none"); }}>Sí, guardar mi copia encima</button><button type="button" onClick={() => setConflictConfirm("none")}>Volver</button></div>
      </div>}
    </section>}
    {cloudflare && <details className="admin-recovery">
      <summary>Copias y recuperación</summary>
      <div className="admin-recovery-content">
        <p>Solo necesitas estas opciones para traer cambios de otro dispositivo o recuperar una copia anterior. No publican la carta.</p>
        <div className="admin-recovery-actions">
          <button type="button" disabled={!!editing || cloud.busy} onClick={cloud.requestLoad}>Cargar versión guardada</button>
          <button type="button" disabled={!!editing || cloud.busy} onClick={cloud.restoreBackup}>Recuperar copia anterior</button>
          <button type="button" disabled={!!editing || cloud.busy} onClick={cloud.restoreConflictBackup}>Recuperar mi copia del conflicto</button>
          <button type="button" disabled={!!editing || cloud.busy} onClick={cloud.restoreConflictCloud}>Recuperar copia de la nube del conflicto</button>
        </div>
        <p>Al cargar otra versión, se conserva una copia del borrador anterior en este navegador.</p>
        <p>Tras resolver un conflicto guardando tu copia, aquí se conserva tanto tu borrador como la versión de la nube que se sustituyó.</p>
        {!cloud.error && <p className="admin-recovery-status" role="status">{cloud.status}</p>}
      </div>
    </details>}
    {cloudflare && cloud.pending && <section className="admin-load-confirm" aria-label="Confirmar carga de la versión guardada">
      <h2>¿Cargar la versión guardada?</h2>
      <p>Sustituirá el borrador de este dispositivo por la versión {cloud.pending.revision} de la nube. Tu copia anterior quedará disponible en «Copias y recuperación». La carta pública no cambia.</p>
      <div><button type="button" onClick={cloud.acceptLoad} disabled={!!editing}>Usar versión guardada</button><button type="button" onClick={cloud.cancelLoad}>Cancelar</button></div>
    </section>}
    <div className="admin-workspace">
      <nav className="admin-categories" aria-label="Categorías">{sectionCategories.map(c => <button key={c.id} type="button" aria-pressed={categoryId === c.id} onClick={() => changeCategory(c.id)}>{c.name}<span>{drafts.filter(d => d.categoryId === c.id).length}</span></button>)}</nav>
      <section className="admin-list" aria-labelledby="admin-category"><div className="admin-list-heading"><div><h2 id="admin-category">{category.name}</h2><p>{rows.length} platos · selecciona uno para editarlo</p></div><button type="button" onClick={event => { editorTriggerRef.current = event.currentTarget; setEditing({ id: crypto.randomUUID(), categoryId, name: "", description: "", price: 0, hidden: false, imageSrc: "", imageName: "Sin imagen" }); setStatus(""); }}>+ Añadir plato</button></div>
        {rows.length ? <ul>{rows.map(d => <li key={d.id}><button type="button" onClick={event => { editorTriggerRef.current = event.currentTarget; setEditing({ ...d }); setStatus(""); }}><span className="admin-dish-name">{d.name}</span><span className={d.hidden ? "admin-hidden" : "admin-visible"}>{d.hidden ? "Oculto" : "Visible"}</span><strong>{money(d.price)}</strong><span aria-hidden="true">↗</span></button></li>)}</ul> : <p className="admin-empty">No hay platos en esta categoría. Puedes añadir el primero.</p>}
      </section>
      {editing && <dialog ref={editorRef} className="admin-editor" aria-labelledby="admin-edit-title" aria-describedby="admin-edit-dish" onCancel={event => { event.preventDefault(); setEditing(null); }}>
        <header className="admin-editor-header">
          <div><h2 id="admin-edit-title">{drafts.some(d => d.id === editing.id) ? "Editar plato" : "Nuevo plato"}</h2><p id="admin-edit-dish">{editing.name || "Añadir un plato a la carta"}</p></div>
          <button type="button" className="admin-editor-close" aria-label="Cerrar editor y volver al listado" onClick={() => setEditing(null)}>Cerrar ×</button>
        </header>
        <form key={editing.id} onSubmit={saveDish}>
          <div className="admin-editor-fields">
            <label>Nombre<input name="name" defaultValue={editing.name} required maxLength={160} /></label>
            <label>Precio (€)<input name="price" type="number" min="0" max="999999.99" step="0.01" defaultValue={editing.price.toFixed(2)} required /></label>
            <label>Descripción<textarea name="description" defaultValue={editing.description} rows={3} maxLength={2000} /></label>
            <label className="admin-checkbox"><input name="hidden" type="checkbox" defaultChecked={editing.hidden} /> Ocultar plato en la carta</label>
            <label>Cambiar imagen<input type="file" accept="image/jpeg,image/png,image/webp" disabled={imageLoading} onChange={e => chooseImage(e.target.files?.[0])} /><span className="admin-file-name">{imageLoading ? "Preparando imagen…" : editing.imageName}</span></label>
            <p className="admin-file-help">JPG, PNG o WebP · hasta 20 MB. Reducción automática a 1600 px y {cloudflare ? "menos de 1 MB." : "menos de 2 MB."}</p>
            <p className="admin-editor-status" role="status">{status}</p>
          </div>
          <div className="admin-editor-actions"><button type="button" onClick={() => setEditing(null)}>Cancelar</button><button type="submit" disabled={imageLoading}>Aplicar al borrador</button></div>
        </form>
      </dialog>}
    </div>
    <footer className="admin-account-actions"><button type="button" onClick={async () => { try { const response = await fetch("/api/admin/logout", { method: "POST" }); if (response.ok) window.location.reload(); else setStatus("No se pudo cerrar la sesión."); } catch { setStatus("No se pudo conectar con el servidor."); } }}>Cerrar sesión</button></footer>
  </main>;
}

