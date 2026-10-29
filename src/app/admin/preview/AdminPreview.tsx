"use client";

import { useMemo, useState, useSyncExternalStore, type FormEvent } from "react";
import { categories, menuSections, type MenuSection } from "../../inch/menu";
import { initialDraft, parseDraft, readDraftSnapshot, saveLocalDraft, serverDraftSnapshot, subscribeToDraft, type AdminDish } from "../../../lib/inch-draft";
import { prepareDishImage } from "../../../lib/prepare-dish-image";

const money = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
const localPreview = process.env.NODE_ENV === "development";

export default function AdminPreview() {
  const [section, setSection] = useState<MenuSection>("carta");
  const [categoryId, setCategoryId] = useState("entrantes");
  const rawDraft = useSyncExternalStore(subscribeToDraft, readDraftSnapshot, serverDraftSnapshot);
  const drafts = useMemo(() => parseDraft(rawDraft) ?? initialDraft, [rawDraft]);
  const [editing, setEditing] = useState<AdminDish | null>(null);
  const [status, setStatus] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const sectionCategories = menuSections.find(s => s.id === section)!.categoryIds.map(id => categories.find(c => c.id === id)!);
  const category = categories.find(c => c.id === categoryId)!;
  const rows = drafts.filter(d => d.categoryId === categoryId);

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
      setEditing(null); setStatus(localPreview ? "Plato guardado. Ya puedes verlo en la carta local; no se ha publicado en Netlify." : "Plato guardado como borrador en este navegador. No se ha publicado en la carta pública.");
    } catch { setStatus("No se pudo guardar el plato. El navegador puede tener el almacenamiento lleno o bloqueado. Tus cambios siguen en el formulario; prueba con una imagen más pequeña."); }
  }
  async function chooseImage(file?: File) {
    if (!file || !editing) return;
    const id = editing.id;
    setImageLoading(true);
    try {
      const image = await prepareDishImage(file);
      setEditing(current => current?.id === id ? { ...current, imageSrc: image.dataUrl, imageName: image.name } : current);
      setStatus(`Foto preparada: ${(file.size / 1024 / 1024).toFixed(1)} MB → ${Math.ceil(image.bytes / 1024)} KB. Aplica el cambio al borrador para guardarla.`);
    } catch (error) { setStatus(error instanceof Error ? error.message : "No se pudo preparar la imagen."); }
    finally { setImageLoading(false); }
  }
  function saveDraft() {
    try { saveLocalDraft(drafts); setStatus("Borrador guardado en este navegador. No se ha publicado ni enviado a la nube."); }
    catch { setStatus("No se pudo guardar: el navegador puede tener el almacenamiento lleno o bloqueado. Prueba con imágenes más pequeñas."); }
  }
  function restoreDraft() {
    try {
      const stored = readDraftSnapshot();
      if (!stored) { setStatus("No hay ningún borrador guardado en este navegador."); return; }
      const parsed = parseDraft(stored);
      if (!parsed) { setStatus("El borrador guardado no es válido y no se ha cargado."); return; }
      setEditing(null); setStatus("El borrador guardado en este navegador ya está cargado en el panel.");
    } catch { setStatus("No se pudo recuperar el borrador local."); }
  }

  return <main className="admin-preview">
    <div className="admin-notice">Panel privado · Borradores guardados solo en este navegador. Los cambios no afectan a la carta pública.</div>
    <header className="admin-header"><div><p>INCH · ADMINISTRACIÓN</p><h1>Gestionar la carta</h1></div><a href="/" target="_blank" rel="noreferrer">{localPreview ? "Ver borrador en la carta local ↗" : "Ver carta pública ↗"}</a></header>
    <div className="admin-toolbar"><div className="admin-sections" role="group" aria-label="Sección de la carta"><button type="button" aria-pressed={section === "carta"} onClick={() => changeSection("carta")}>Carta</button><button type="button" aria-pressed={section === "sushi"} onClick={() => changeSection("sushi")}>Sushi</button></div><span>{rawDraft ? "Borrador local cargado" : "Vista previa"}</span><button type="button" onClick={restoreDraft} disabled={!!editing}>Recuperar borrador</button><button type="button" onClick={saveDraft} disabled={!!editing}>Guardar borrador local</button><button type="button" disabled>Publicar cambios</button></div>
    <p className="admin-publish-note">La publicación de platos se habilitará al conectar la base de datos. <button type="button" onClick={async () => { try { const response = await fetch("/api/admin/logout", { method: "POST" }); if (response.ok) window.location.reload(); else setStatus("No se pudo cerrar la sesión."); } catch { setStatus("No se pudo conectar con el servidor."); } }}>Cerrar sesión</button></p>
    <p className="admin-status" role="status">{status}</p>
    <div className="admin-workspace">
      <nav className="admin-categories" aria-label="Categorías">{sectionCategories.map(c => <button key={c.id} type="button" aria-pressed={categoryId === c.id} onClick={() => changeCategory(c.id)}>{c.name}<span>{drafts.filter(d => d.categoryId === c.id).length}</span></button>)}</nav>
      <section className="admin-list" aria-labelledby="admin-category"><div className="admin-list-heading"><div><h2 id="admin-category">{category.name}</h2><p>{rows.length} platos · selecciona uno para editarlo</p></div><button type="button" onClick={() => { setEditing({ id: crypto.randomUUID(), categoryId, name: "", description: "", price: 0, hidden: false, imageSrc: "", imageName: "Sin imagen" }); setStatus(""); }}>+ Añadir plato</button></div>
        {rows.length ? <ul>{rows.map(d => <li key={d.id}><button type="button" onClick={() => { setEditing({ ...d }); setStatus(""); }}><span className="admin-dish-name">{d.name}</span><span className={d.hidden ? "admin-hidden" : "admin-visible"}>{d.hidden ? "Oculto" : "Visible"}</span><strong>{money(d.price)}</strong><span aria-hidden="true">↗</span></button></li>)}</ul> : <p className="admin-empty">No hay platos en esta categoría. Puedes añadir el primero.</p>}
      </section>
      {editing && <section className="admin-editor" aria-labelledby="admin-edit-title"><h2 id="admin-edit-title">{drafts.some(d => d.id === editing.id) ? "Editar plato" : "Nuevo plato"}</h2><form key={editing.id} onSubmit={saveDish}><label>Nombre<input name="name" defaultValue={editing.name} required maxLength={160} /></label><label>Precio (€)<input name="price" type="number" min="0" max="999999.99" step="0.01" defaultValue={editing.price.toFixed(2)} required /></label><label>Descripción<textarea name="description" defaultValue={editing.description} rows={3} maxLength={2000} /></label><label className="admin-checkbox"><input name="hidden" type="checkbox" defaultChecked={editing.hidden} /> Ocultar plato en la carta</label><label>Cambiar imagen<input type="file" accept="image/jpeg,image/png,image/webp" disabled={imageLoading} onChange={e => chooseImage(e.target.files?.[0])} /><span className="admin-file-name">{imageLoading ? "Preparando imagen…" : editing.imageName}</span></label><p className="admin-file-help">JPG, PNG o WebP · hasta 20 MB. Reducción automática a 1600 px y menos de 2 MB.</p><div className="admin-editor-actions"><button type="button" onClick={() => setEditing(null)}>Cancelar</button><button type="submit" disabled={imageLoading}>Aplicar al borrador</button></div></form></section>}
    </div>
  </main>;
}

