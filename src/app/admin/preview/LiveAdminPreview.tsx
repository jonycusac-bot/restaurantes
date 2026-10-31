"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { categories, menuSections, type MenuSection } from "../../inch/menu";
import { menuDishWithMetadata, parseDraft, readDraftSnapshot, serverDraftSnapshot, subscribeToDraft, type AdminDish } from "../../../lib/inch-draft";
import { groupMenuDishes } from "../../../lib/menu-presentation";
import { listLiveEdits, persistLiveEdit, removeLiveEdit, type SavedLiveEdit } from "../../../lib/live-edit-storage";
import { isDisplayablePhoto } from "../../../lib/cloud-conflict";
import type { LiveField, LiveImage } from "../../../lib/live-menu";
import { prepareDishImage } from "../../../lib/prepare-dish-image";
import { useLiveMenu } from "./useLiveMenu";

const money = (value: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(value);
const sameDish = (a: AdminDish, b: AdminDish) => ["id", "categoryId", "name", "description", "price", "hidden", "imageSrc", "imageName"].every(key => a[key as keyof AdminDish] === b[key as keyof AdminDish]);
function fieldText(field: LiveField, value: unknown): string {
  if (field === "price" && typeof value === "number") return money(value);
  if (field === "hidden") return value ? "Oculto" : "Visible";
  if (field === "categoryId") return categories.find(c => c.id === value)?.name ?? String(value);
  if (field === "image") return "foto";
  return String(value ?? "");
}
function applyField(dish: AdminDish, field: LiveField, value: unknown): AdminDish {
  return field === "image" ? { ...dish, ...value as LiveImage } : { ...dish, [field]: value };
}
function photo(value: unknown): string {
  const src = value && typeof value === "object" ? (value as LiveImage).imageSrc : "";
  return typeof src === "string" && isDisplayablePhoto(src) ? src : "";
}

export default function LiveAdminPreview() {
  const live = useLiveMenu();
  const [section, setSection] = useState<MenuSection>("carta");
  const [categoryId, setCategoryId] = useState("entrantes");
  const [edit, setEdit] = useState<SavedLiveEdit | null>(null);
  const editRef = useRef<SavedLiveEdit | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [recovery, setRecovery] = useState<SavedLiveEdit[]>([]);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const conflictRef = useRef<HTMLElement>(null);
  const legacyRaw = useSyncExternalStore(subscribeToDraft, readDraftSnapshot, serverDraftSnapshot);
  const dishes = live.menu?.dishes ?? [];
  const legacy = parseDraft(legacyRaw) ?? [];
  const oldEdits = live.menu ? legacy.filter(old => !dishes.some(current => current.id === old.id && sameDish(current, old))) : [];
  const sectionCategories = menuSections.find(s => s.id === section)!.categoryIds.map(id => categories.find(c => c.id === id)!);
  const rows = dishes.filter(dish => dish.categoryId === categoryId);
  const editableById = new Map(rows.map(dish => [dish.id, dish]));
  const groups = groupMenuDishes(rows.map(menuDishWithMetadata));
  const category = categories.find(c => c.id === categoryId)!;
  const open = edit !== null;
  const conflict = live.conflicts[0];

  function readRecovery() {
    try { setRecovery(listLiveEdits(window.localStorage)); } catch { /* The current form remains usable even if storage is unavailable. */ }
  }
  useEffect(() => {
    const update = () => { try { setRecovery(listLiveEdits(window.localStorage)); } catch { /* No recovery records can be read. */ } };
    const timer = window.setTimeout(update, 0);
    window.addEventListener("storage", update);
    return () => { clearTimeout(timer); window.removeEventListener("storage", update); };
  }, []);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const viewport = window.matchMedia("(max-width: 1050px)");
    const previousOverflow = document.body.style.overflow;
    const sync = () => {
      if (dialog.open && dialog.matches(":modal") === viewport.matches) return;
      if (dialog.open) dialog.close();
      if (viewport.matches) { dialog.showModal(); document.body.style.overflow = "hidden"; }
      else { dialog.show(); document.body.style.overflow = previousOverflow; }
    };
    sync(); viewport.addEventListener("change", sync);
    return () => {
      viewport.removeEventListener("change", sync);
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      triggerRef.current?.focus({ preventScroll: true });
    };
  }, [open]);
  useEffect(() => {
    if (live.conflicts.length) { conflictRef.current?.scrollIntoView({ block: "nearest" }); conflictRef.current?.focus(); }
  }, [live.conflicts]);

  function store(next: SavedLiveEdit) {
    editRef.current = next; setEdit(next);
    try { persistLiveEdit(window.localStorage, next); readRecovery(); }
    catch { setNotice("La edición sigue abierta, pero no se pudo conservar una copia en este navegador. No cierres esta pantalla antes de guardar."); }
  }
  function openDish(dish: AdminDish, trigger: HTMLButtonElement, base: AdminDish | null = dish) {
    live.dismissConflict(); setNotice(""); setImageLoading(false); triggerRef.current = trigger;
    const next = { token: crypto.randomUUID(), base, dish: { ...dish }, priceText: dish.price.toFixed(2) };
    store(next);
  }
  function change(values: Partial<AdminDish>, priceText?: string) {
    const current = editRef.current;
    if (!current || live.busy || live.conflicts.length) return;
    store({ ...current, dish: { ...current.dish, ...values }, priceText: priceText ?? current.priceText });
  }
  function close(discard: boolean) {
    if (live.busy) return;
    const current = editRef.current;
    if (discard && current) {
      try { removeLiveEdit(window.localStorage, current.token); readRecovery(); }
      catch { setNotice("No se pudo retirar la copia local de esta edición."); }
    }
    live.dismissConflict(); editRef.current = null; setEdit(null); setImageLoading(false);
  }
  function complete(token: string) {
    try { removeLiveEdit(window.localStorage, token); readRecovery(); }
    catch { setNotice("El cambio se ha guardado; no se pudo retirar su copia de recuperación local."); }
    if (editRef.current?.token === token) { editRef.current = null; setEdit(null); }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const current = editRef.current;
    if (!current || imageLoading || live.busy || live.conflicts.length) return;
    const price = Number(current.priceText.replace(",", "."));
    if (!current.dish.name.trim() || !current.priceText.trim() || !Number.isFinite(price) || price < 0 || price > 999999.99) {
      setNotice("Revisa el nombre y el precio del plato."); return;
    }
    setNotice("");
    const dish = { ...current.dish, name: current.dish.name.trim(), description: current.dish.description.trim(), price };
    store({ ...current, dish });
    if (await live.save(current.base, dish)) complete(current.token);
  }
  async function chooseImage(file?: File) {
    const current = editRef.current;
    if (!file || !current) return;
    setImageLoading(true); setNotice("");
    try {
      const prepared = await prepareDishImage(file, 750 * 1024);
      if (editRef.current?.token === current.token) store({ ...editRef.current, dish: { ...editRef.current.dish, imageSrc: prepared.dataUrl, imageName: prepared.name } });
    } catch (error) { setNotice(error instanceof Error ? error.message : "No se pudo preparar la foto."); }
    finally { if (editRef.current?.token === current.token) setImageLoading(false); }
  }
  async function chooseConflict(choice: "mine" | "remote") {
    const current = editRef.current;
    if (!current || !conflict || live.busy) return;
    // Update only the chosen field's base/values, so a later retry cannot turn
    // untouched cloud fields into accidental local edits.
    const next = { ...current, base: current.base ? applyField(current.base, conflict.field, conflict.current) : null };
    if (choice === "remote") {
      next.dish = applyField(next.dish, conflict.field, conflict.current);
      if (conflict.field === "price") next.priceText = String(conflict.current);
    }
    store(next);
    if (await live.resolve(conflict.field, choice)) complete(current.token);
  }
  function resume(record: SavedLiveEdit, trigger: HTMLButtonElement) {
    live.dismissConflict(); setNotice(""); triggerRef.current = trigger; setImageLoading(false);
    editRef.current = record; setEdit(record);
  }

  return <main className="admin-preview admin-live">
    <div className="admin-notice">Los cambios se ven en la carta al guardar.</div>
    <header className="admin-header"><div><p>INCH · ADMINISTRACIÓN</p><h1>Gestionar la carta</h1></div><a href="/" target="_blank" rel="noreferrer">Ver carta pública ↗</a></header>
    <div className="admin-toolbar"><div className="admin-sections" role="group" aria-label="Sección de la carta">
      <button type="button" aria-pressed={section === "carta"} disabled={live.busy} onClick={() => { close(false); setSection("carta"); setCategoryId("entrantes"); }}>Carta</button>
      <button type="button" aria-pressed={section === "sushi"} disabled={live.busy} onClick={() => { close(false); setSection("sushi"); setCategoryId("entradas"); }}>Sushi</button>
    </div><p className="admin-live-message" role="status">{live.loading ? "Cargando carta…" : live.message || "Selecciona un plato para editarlo."}</p></div>
    {!edit && (live.error || notice) && <p className="admin-feedback admin-feedback-error" role="alert">{live.error || notice}</p>}
    {!live.menu && live.error && <div className="admin-live-retry"><button type="button" onClick={() => void live.refresh()} disabled={live.busy}>Reintentar</button></div>}
    {live.menu && <div className="admin-workspace">
      <nav className="admin-categories" aria-label="Categorías">{sectionCategories.map(c => <button type="button" key={c.id} aria-pressed={categoryId === c.id} disabled={live.busy} onClick={() => { close(false); setCategoryId(c.id); }}>{c.name}<span>{dishes.filter(d => d.categoryId === c.id).length}</span></button>)}</nav>
      <section className="admin-list" aria-labelledby="admin-category"><div className="admin-list-heading"><div><h2 id="admin-category">{category.name}</h2><p>{rows.length} platos y variantes · selecciona uno para editarlo</p></div>
        <button type="button" disabled={live.busy} onClick={event => openDish({ id: crypto.randomUUID(), categoryId, name: "", description: "", price: 0, hidden: false, imageSrc: "", imageName: "Sin imagen" }, event.currentTarget, null)}>+ Añadir plato</button></div>
        {category.note && <p className="admin-category-note">{category.note}</p>}
        {rows.length ? <ul>{groups.map(group => <li key={group.id} className="admin-family">{group.grouped && <h3>{group.name}{group.note && <small> · {group.note}</small>}</h3>}<ul>{group.items.map(item => {
          const dish = editableById.get(item.id!)!;
          return <li key={dish.id}><button type="button" aria-label={`Editar ${dish.name}`} disabled={live.busy} onClick={event => openDish(dish, event.currentTarget)}><span className="admin-dish-name">{group.grouped ? item.label : dish.name}</span><span className={dish.hidden ? "admin-hidden" : "admin-visible"}>{dish.hidden ? "Oculto" : "Visible"}</span><strong>{group.pricePrefix && `${group.pricePrefix} `}{money(dish.price)}</strong><span aria-hidden="true">↗</span></button></li>;
        })}</ul></li>)}</ul> : <p className="admin-empty">No hay platos en esta categoría.</p>}
      </section>
      {edit && <dialog ref={dialogRef} className="admin-editor" aria-labelledby="admin-edit-title" aria-describedby="admin-edit-dish" onCancel={event => { event.preventDefault(); close(true); }}>
        <header className="admin-editor-header"><div><h2 id="admin-edit-title">{edit.base ? "Editar plato" : "Nuevo plato"}</h2><p id="admin-edit-dish">{edit.dish.name || "Añadir plato"}</p></div><button type="button" className="admin-editor-close" disabled={live.busy} onClick={() => close(true)}>Cerrar ×</button></header>
        <form onSubmit={save}><div className="admin-editor-fields">
          <fieldset className="admin-live-fields" disabled={live.busy || !!live.conflicts.length}>
            <label>Nombre<input name="name" value={edit.dish.name} onChange={event => change({ name: event.target.value })} required maxLength={160} /></label>
            <label>Precio (€)<input name="price" type="number" min="0" max="999999.99" step="0.01" value={edit.priceText} onChange={event => change({}, event.target.value)} required /></label>
            <label>Descripción<textarea name="description" value={edit.dish.description} onChange={event => change({ description: event.target.value })} rows={3} maxLength={2000} /></label>
            <label>Categoría<select name="categoryId" value={edit.dish.categoryId} onChange={event => change({ categoryId: event.target.value })}>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label className="admin-checkbox"><input name="hidden" type="checkbox" checked={edit.dish.hidden} onChange={event => change({ hidden: event.target.checked })} /> Ocultar plato</label>
            <label>Cambiar foto<input name="image" type="file" accept="image/jpeg,image/png,image/webp" disabled={imageLoading} onChange={event => void chooseImage(event.target.files?.[0])} /><span className="admin-file-name">{imageLoading ? "Preparando foto…" : edit.dish.imageName}</span></label>
            {/* Optimized local/media images; no Next image service is deployed on Pages. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {isDisplayablePhoto(edit.dish.imageSrc) && <img className="admin-live-photo" src={edit.dish.imageSrc} alt="Foto elegida para el plato" width={120} height={100} />}
          </fieldset>
          <p className="admin-file-help">Al guardar, el cambio se verá directamente en la carta.</p>
          {(live.error || notice) && <p className="admin-editor-status" role="alert">{live.error || notice}</p>}
          {conflict && <section className="admin-live-choice" ref={conflictRef} tabIndex={-1} aria-label="Elegir el dato que quieres conservar">
            <h3>{conflict.field === "price" ? "El precio cambió en otro dispositivo" : `${conflict.label} cambió en otro dispositivo`}</h3><p>¿Qué quieres conservar? Los demás cambios no se sustituirán.</p>
            <div><button type="button" disabled={live.busy} onClick={() => void chooseConflict("mine")}>{conflict.field === "price" ? `Usar ${fieldText(conflict.field, conflict.value)}` : `Conservar mi ${conflict.label.toLowerCase()}`}</button><button type="button" disabled={live.busy} onClick={() => void chooseConflict("remote")}>{conflict.field === "price" ? `Usar ${fieldText(conflict.field, conflict.current)}` : `Conservar ${conflict.label.toLowerCase()} actual`}</button></div>
            {conflict.field !== "price" && conflict.field !== "image" && <p className="admin-live-choice-values">Tu cambio: {fieldText(conflict.field, conflict.value)}<br />Guardado: {fieldText(conflict.field, conflict.current)}</p>}
            {conflict.field === "image" && <div className="admin-conflict-photos">
              {/* eslint-disable @next/next/no-img-element */}
              <figure><figcaption>Tu foto</figcaption>{photo(conflict.value) ? <img src={photo(conflict.value)} alt="Tu foto" width={96} height={96} /> : <span>Sin foto</span>}</figure>
              <figure><figcaption>Foto guardada</figcaption>{photo(conflict.current) ? <img src={photo(conflict.current)} alt="Foto guardada" width={96} height={96} /> : <span>Sin foto</span>}</figure>
              {/* eslint-enable @next/next/no-img-element */}
            </div>}
            <button type="button" disabled={live.busy} onClick={live.dismissConflict}>Seguir editando</button>
          </section>}
        </div><div className="admin-editor-actions"><button type="button" disabled={live.busy} onClick={() => close(true)}>Cancelar</button><button type="submit" disabled={live.busy || imageLoading || !!live.conflicts.length}>{live.busy ? "Guardando…" : "Guardar"}</button></div></form>
      </dialog>}
    </div>}
    {!!recovery.length && <details className="admin-live-recovery"><summary>Ediciones sin terminar en este dispositivo ({recovery.length})</summary><p>Continuar una edición no publica nada hasta que pulses Guardar.</p><ul>{recovery.map(record => <li key={record.token}><span>{record.dish.name || "Nuevo plato"}</span><button type="button" disabled={live.busy || !live.menu} onClick={event => resume(record, event.currentTarget)}>Continuar</button></li>)}</ul></details>}
    {!!oldEdits.length && <details className="admin-live-recovery"><summary>Ediciones anteriores conservadas</summary><p>Estas copias son anteriores al nuevo panel. No se han publicado ni eliminado. Revisa el formulario antes de guardar: solo se aplicarán diferencias del plato elegido.</p><ul>{oldEdits.map(old => <li key={old.id}><span>{old.name} · {money(old.price)}</span><button type="button" disabled={live.busy || !live.menu} onClick={event => openDish(old, event.currentTarget, dishes.find(d => d.id === old.id) ?? null)}>Revisar plato</button></li>)}</ul></details>}
    <footer className="admin-account-actions"><button type="button" disabled={live.busy} onClick={async () => { try { const result = await fetch("/api/admin/logout", { method: "POST" }); if (result.ok) window.location.reload(); else setNotice("No se pudo cerrar la sesión."); } catch { setNotice("No se pudo conectar para cerrar la sesión."); } }}>Cerrar sesión</button></footer>
  </main>;
}
