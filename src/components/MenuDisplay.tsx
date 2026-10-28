"use client";

import { useEffect, useState } from "react";

type Dish = {
  id: string;
  name: string;
  description: string | null;
  price: string | number;
  isAvailable: boolean;
};
type Category = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  dishes: Dish[];
};
type Menu = { name: string; currency: string; categories: Category[] };

export default function MenuDisplay() {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function loadMenu() {
      try {
        const response = await fetch("/api/menu", { signal: controller.signal });
        if (!response.ok) throw new Error("No se pudo cargar el menú.");
        const datos: Menu = await response.json();
        if (!controller.signal.aborted) setMenu(datos);
      } catch {
        if (!controller.signal.aborted) setError(true);
      }
    }
    void loadMenu();
    return () => controller.abort();
  }, []);

  if (error) {
    return <p className="menu-status" role="alert">No se pudo cargar el menú. Recarga la página para volver a intentarlo.</p>;
  }
  if (menu === null) {
    return <p className="menu-status" role="status">Cargando menú...</p>;
  }

  const currency = new Intl.NumberFormat("es-ES", { style: "currency", currency: menu.currency });
  const categories = menu.categories.filter((category) => category.isActive);

  return (
    <div className="menu-shell">
      <header className="menu-topbar">
        <a className="menu-brand" href="#inicio" aria-label="Volver al inicio de la carta">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path d="M5 13C5 7 10 4 16 4S27 7 27 13H5Z" stroke="currentColor" strokeWidth="2" />
            <path d="m5 18 5 2 6-2 6 2 5-2M5 24h22M7 28h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="m12 9 1-1m6 1 1 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span>La carta<span className="menu-brand-dot">.</span></span>
        </a>
        <span className="menu-edition">CARTA DIGITAL <span aria-hidden="true">/</span> {menu.currency}</span>
      </header>
      <section className="menu-hero" id="inicio" aria-labelledby="restaurant-name">
        <div className="menu-hero-copy">
          <p className="menu-eyebrow">BIENVENIDO A TU MESA</p>
          <h1 id="restaurant-name">{menu.name}</h1>
          <p className="menu-intro">Echa un vistazo. Encuentra tu favorito. Disfruta.</p>
          <a className="menu-hero-link" href="#carta">Descubre la carta <span aria-hidden="true">↗</span></a>
        </div>
        <div className="menu-hero-mark" aria-hidden="true"><span>BUEN</span><span>PROVECHO</span><span className="menu-mark-star">✳</span></div>
      </section>
      <nav className="menu-categories" aria-label="Categorías de la carta">
        {categories.map((category) => (
          <a key={category.id} href={`#category-${category.id}`}>{category.name}<span aria-hidden="true">↘</span></a>
        ))}
      </nav>
      <div className="menu-content" id="carta">
        <div className="menu-section-label"><span>NUESTRA CARTA</span><span>ELIGE TU FAVORITO</span></div>
        {categories.length === 0 && <p className="menu-empty">La carta estará disponible pronto.</p>}
        {categories.map((category, index) => (
          <section className="menu-category" key={category.id} id={`category-${category.id}`} aria-labelledby={`heading-${category.id}`}>
            <div className="menu-category-heading">
              <span className="menu-category-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h2 id={`heading-${category.id}`}>{category.name}</h2>
                {category.description && <p className="menu-category-description">{category.description}</p>}
              </div>
              <span className="menu-category-count">{category.dishes.length} {category.dishes.length === 1 ? "opción" : "opciones"}</span>
            </div>
            <ul className="menu-dishes">
              {category.dishes.length === 0 && <li className="menu-empty">Todavía no hay platos en esta categoría.</li>}
              {category.dishes.map((dish) => (
                <li key={dish.id} className="menu-dish">
                  <div className="menu-dish-top"><h3>{dish.name}</h3><span className="menu-price">{currency.format(Number(dish.price))}</span></div>
                  {dish.description && <p>{dish.description}</p>}
                  {!dish.isAvailable && <span className="menu-unavailable">No disponible</span>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <footer className="menu-footer"><span>{menu.name}</span><a href="#inicio">Volver arriba <span aria-hidden="true">↑</span></a></footer>
    </div>
  );
}
