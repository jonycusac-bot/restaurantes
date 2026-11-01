"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { categories, menuSections, type MenuSection } from "./menu";
import { dishTranslations, languages, ui, type Language } from "./translations";
import { applyDraftToMenu, parseDraft, readLocalPreviewSnapshot, serverDraftSnapshot, subscribeToDraft, type AdminDish } from "../../lib/inch-draft";
import { groupMenuDishes } from "../../lib/menu-presentation";
import {cartaOriginal} from "../../lib/carta-original";
import {categoryNoteTranslations,variantTranslations} from "../../lib/carta-translations";
import {visibleMenuCategories} from "./menu-search";


export default function InchMenu({ publishedDishes, publicOnly = false }: { publishedDishes?: AdminDish[]; publicOnly?: boolean } = {}) {
  const rawDraft = useSyncExternalStore(subscribeToDraft, publicOnly ? serverDraftSnapshot : readLocalPreviewSnapshot, serverDraftSnapshot);
  const localDraft = useMemo(() => parseDraft(rawDraft), [rawDraft]);
  const menuCategories = useMemo(() => localDraft ? applyDraftToMenu(localDraft) : publishedDishes ? applyDraftToMenu(publishedDishes) : categories, [localDraft, publishedDishes]);
  const [language, setLanguage] = useState<Language>("es");
  const [section, setSection] = useState<MenuSection>("carta");
  const [active, setActive] = useState("entrantes");
  const [search, setSearch] = useState("");
  const t = ui[language];
  const labels: Record<string, string> = t.categories;
  useEffect(() => {
    document.documentElement.setAttribute("lang", language);
  }, [language]);
  function changeLanguage(next: Language) {
    setLanguage(next);
    setSearch("");
  }
  const euro = (price: number) => new Intl.NumberFormat(t.locale, { style: "currency", currency: "EUR" }).format(price);
  const localize = (name: string, description: string) => {
    const originalText = categories.some(c => c.dishes.some(d => d.name === name && d.description === description)) || cartaOriginal.some(c => c.items.some(d => d.name === name && d.description === description));
    return language === "es" || !originalText ? [name, description] : dishTranslations[name]?.[language] ?? [name, description];
  };
  const sectionCategories = menuSections.find(s => s.id === section)!.categoryIds.map(id => menuCategories.find(c => c.id === id)!);
  const globalSearch = Boolean(search.trim());
  const visible = visibleMenuCategories(menuCategories, section, active, search, d => localize(d.name, d.description).join(" "));
  function changeSection(next: MenuSection) {
    setSection(next);
    setActive(next === "carta" ? "entrantes" : "entradas");
    setSearch("");
  }

  return (
    <main className="inch-page" id="inch-inicio" lang={language}>
      <div className="inch-demo">{t.preview}</div>
      {localDraft && <div className="inch-draftNotice">Borrador local del administrador · No publicado en Netlify <a href="/admin/preview">Volver al panel ↗</a></div>}
      <div className="inch-paper">
        <header className="inch-header">
          <a href="#inch-inicio" className="inch-logo" aria-label={t.home}><img src="/inch/inch-logo.webp" alt="INCH · Thai, noodles, ramen, sushi" width="1024" height="488" /></a>
          <a href="#inch-inicio" aria-label={t.home} className="inch-headerArtwork"><img src="/inch/cabecera-inch.png" alt="Ilustración de la carta de INCH" width="1560" height="368" /></a>
          <div className="inch-headerActions">
            <div className="inch-languages" role="group" aria-label={t.language}>{languages.map(l => <button key={l.code} type="button" lang={l.code} aria-label={l.label} aria-pressed={language === l.code} onClick={() => changeLanguage(l.code)}><img src={`/inch/flag-${l.flag}.webp`} alt="" width="24" height="16" /><span className="inch-srOnly">{l.label}</span></button>)}</div>
            <a className="inch-original" href="https://inchbar.es/carta/" target="_blank" rel="noreferrer">{t.original} ↗</a>
          </div>
        </header>
        <section className="inch-heading" aria-labelledby="inch-title">
          <p>{t.tagline}</p>
          <h1 id="inch-title">{t.title} <em>{t.titleAccent}</em></h1>
          <span aria-hidden="true">✳</span>
        </section>
        <section id="inch-carta" aria-label={t.dishes} className="inch-menu">
          <div className="inch-sectionTabs" role="tablist" aria-label={t.sectionsLabel}>
            {menuSections.map(s => <button type="button" role="tab" key={s.id} id={`inch-tab-${s.id}`} tabIndex={section === s.id ? 0 : -1} aria-selected={section === s.id} aria-controls="inch-section-panel" onClick={() => changeSection(s.id)} onKeyDown={event => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              const next = event.key === "Home" ? "carta" : event.key === "End" ? "sushi" : section === "carta" ? "sushi" : "carta";
              changeSection(next);
              document.getElementById(`inch-tab-${next}`)?.focus();
            }}>{t.sections[s.id]}</button>)}
          </div>
          <div id="inch-section-panel" role="tabpanel" aria-labelledby={globalSearch ? undefined : `inch-tab-${section}`} aria-label={globalSearch ? t.searchScope : undefined}>
          <div className="inch-menuControls">
            <div className="inch-filters" role="group" aria-label={t.filter}>
              {sectionCategories.map(c => <button key={c.id} type="button" aria-pressed={!globalSearch && active === c.id} onClick={() => { setActive(c.id); setSearch(""); }}>{labels[c.id]}</button>)}
            </div>
            <label className="inch-search"><span aria-hidden="true">⌕</span><span className="inch-srOnly">{t.search}</span><input type="search" placeholder={t.search} value={search} onChange={e => setSearch(e.target.value)} /></label>
          </div>
          {globalSearch && <p className="inch-searchScope">{t.searchScope}</p>}
          <div aria-live="polite" aria-atomic="false">
            {globalSearch && visible.length === 0 && <p className="inch-empty">{t.empty}</p>}
            {visible.map(c => <section className="inch-category" key={c.id} aria-labelledby={`inch-${c.id}`}>
              <div className="inch-categoryHeading"><span aria-hidden="true" /> <h2 id={`inch-${c.id}`}>{labels[c.id]}{globalSearch && <small className="inch-categorySection"> · {t.sections[menuSections.find(s => s.categoryIds.includes(c.id))!.id]}</small>}</h2><span aria-hidden="true" /></div>
              {c.dishes.length === 0 && <p className="inch-empty">{t.categoryEmpty}</p>}
              {c.note && c.dishes.length > 0 && <p className="inch-categoryNote">{language === "es" ? c.note : categoryNoteTranslations[c.id]?.[language] ?? c.note}</p>}
              <ul className="inch-dishList">{groupMenuDishes(c.dishes).map(d => <li className={`inch-dish ${d.image || d.imageSrc ? "inch-dishWithPhoto" : "inch-dishCompact"}${d.role === "supplement" ? " inch-dishSupplement" : ""}`} key={d.id} data-dish-id={d.grouped ? undefined : d.items[0].id}>
                <div className="inch-dishLine"><div className="inch-dishTitle"><h3>{localize(d.name, d.description)[0]}</h3>{d.note && <span className="inch-portion">{language === "es" ? d.note : `${d.note.split(" ")[0]} ${t.pieces}`}</span>}</div>{!d.grouped && <span className="inch-price">{d.pricePrefix && `${d.pricePrefix} `}{euro(d.items[0].price)}</span>}</div>
                {(d.image || d.imageSrc) && <figure className="inch-dishFigure"><img src={d.imageSrc || `/inch/${d.image}.webp`} alt={language === "es" ? d.imageAlt ?? d.name : `${t.sample}: ${localize(d.name, d.description)[0]}`} width="1100" height="825" loading="lazy" /><figcaption>{t.sample}{d.imageVariant && ` · ${language === "es" ? d.imageVariant : variantTranslations[d.imageVariant]?.[language] ?? d.imageVariant}`}</figcaption></figure>}
                {d.description && <div className="inch-dishDescription"><p>{localize(d.name, d.description)[1]}</p></div>}
                {d.grouped && <ul className="inch-variants">{d.items.map(item => <li className="inch-variant" key={item.id ?? item.name} data-dish-id={item.id}><div><span>{language === "es" ? item.label : variantTranslations[item.label]?.[language] ?? item.label}</span>{!d.description && item.description && <p>{localize(item.name, item.description)[1]}</p>}</div><span className="inch-variantPrice">{d.pricePrefix && `${d.pricePrefix} `}{euro(item.price)}</span></li>)}</ul>}
              </li>)}</ul>
            </section>)}
          </div>
          </div>
          <details className="inch-allergens"><summary>{t.information} <span aria-hidden="true">+</span></summary><p>{t.allergy}</p><p>{t.photos}</p></details>
        </section>
        <footer className="inch-footer"><span>INCH · ASIAN FOOD</span><a href="#inch-inicio">{t.back} ↑</a></footer>
      </div>
    </main>
  );
}
