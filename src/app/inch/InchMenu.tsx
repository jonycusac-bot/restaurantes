"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { categories, menuSections, type MenuSection } from "./menu";
import { dishTranslations, languages, ui, type Language } from "./translations";
import { applyDraftToMenu, parseDraft, readLocalPreviewSnapshot, serverDraftSnapshot, subscribeToDraft } from "../../lib/inch-draft";

const normalize = (text: string) => text.toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export default function InchMenu() {
  const rawDraft = useSyncExternalStore(subscribeToDraft, readLocalPreviewSnapshot, serverDraftSnapshot);
  const localDraft = useMemo(() => parseDraft(rawDraft), [rawDraft]);
  const menuCategories = useMemo(() => localDraft ? applyDraftToMenu(localDraft) : categories, [localDraft]);
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
    const originalText = categories.some(c => c.dishes.some(d => d.name === name && d.description === description));
    return language === "es" || !originalText ? [name, description] : dishTranslations[name]?.[language] ?? [name, description];
  };
  const sectionCategories = menuSections.find(s => s.id === section)!.categoryIds.map(id => menuCategories.find(c => c.id === id)!);
  const visible = sectionCategories.filter(c => c.id === active).map(c => ({
    ...c,
    dishes: c.dishes.filter(d => normalize(localize(d.name, d.description).join(" ")).includes(normalize(search))).sort((a, b) => Number(Boolean(b.image || b.imageSrc)) - Number(Boolean(a.image || a.imageSrc))),
  }));
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
          <div id="inch-section-panel" role="tabpanel" aria-labelledby={`inch-tab-${section}`}>
          <div className="inch-menuControls">
            <div className="inch-filters" role="group" aria-label={t.filter}>
              {sectionCategories.map(c => <button key={c.id} type="button" aria-pressed={active === c.id} onClick={() => { setActive(c.id); setSearch(""); }}>{labels[c.id]}</button>)}
            </div>
            <label className="inch-search"><span aria-hidden="true">⌕</span><span className="inch-srOnly">{t.search}</span><input type="search" placeholder={t.search} value={search} onChange={e => setSearch(e.target.value)} /></label>
          </div>
          <div aria-live="polite" aria-atomic="false">
            {visible.map(c => <section className="inch-category" key={c.id} aria-labelledby={`inch-${c.id}`}>
              <div className="inch-categoryHeading"><span aria-hidden="true" /> <h2 id={`inch-${c.id}`}>{labels[c.id]}</h2><span aria-hidden="true" /></div>
              {c.dishes.length === 0 && <p className="inch-empty">{search ? t.empty : t.categoryEmpty}</p>}
              <ul className="inch-dishList">{c.dishes.map(d => <li className={`inch-dish ${d.image || d.imageSrc ? "inch-dishWithPhoto" : "inch-dishCompact"}`} key={d.id ?? d.name}>
                <div className="inch-dishLine"><h3>{localize(d.name, d.description)[0]}</h3><span className="inch-price">{euro(d.price)}</span></div>
                {(d.image || d.imageSrc) && <figure className="inch-dishFigure"><img src={d.imageSrc || `/inch/${d.image}.webp`} alt={language === "es" ? d.imageAlt ?? d.name : `${t.sample}: ${localize(d.name, d.description)[0]}`} width="1100" height="825" loading="lazy" /><figcaption>{t.sample}</figcaption></figure>}
                <div className="inch-dishDescription"><p>{localize(d.name, d.description)[1]}</p>{d.note && <span className="inch-portion">{d.note.split(" ")[0]} {t.pieces}</span>}</div>
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
