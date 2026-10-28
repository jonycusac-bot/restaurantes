export type MenuDish = {
  id: string;
  name: string;
  description: string | null;
  price: string | number;
  isAvailable: boolean;
  allergens?: Array<{
    presence: "CONTAINS" | "MAY_CONTAIN";
    allergen: { code: string; name: string };
  }>;
};

const allergenPaths: Record<string, string> = {
  GLUTEN: "M5 19 18 6M9 15C3 15 3 9 3 9s6 0 6 6Zm4-4C7 11 7 5 7 5s6 0 6 6Zm0 0c0 6 6 6 6 6s0-6-6-6Zm4-4c0 6 6 6 6 6s0-6-6-6Z",
  MILK: "M9 3h6v5l3 4v8a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-8l3-4V3Zm0 4h6M6 13h12",
  EGG: "M19 14c0 4-3 7-7 7s-7-3-7-7S8 3 12 3s7 7 7 11Z",
};

export default function DishCard({ dish, currency }: { dish: MenuDish; currency: string }) {
  const price = new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(Number(dish.price));

  return (
    <article
      data-dish-card
      className="flex h-full flex-col rounded-2xl border border-menu-border bg-menu-surface p-5 shadow-sm sm:p-6"
      aria-labelledby={`dish-${dish.id}`}
    >
      <div className="flex items-start justify-between gap-4">
        <h3 id={`dish-${dish.id}`} className="min-w-0 text-lg leading-snug font-semibold tracking-tight wrap-anywhere">{dish.name}</h3>
        <span className="shrink-0 rounded-xl bg-menu-soft px-3 py-2 text-lg leading-none font-bold whitespace-nowrap text-menu-accent tabular-nums">{price}</span>
      </div>
      {dish.description && <p className="mt-3 text-sm leading-relaxed text-menu-muted">{dish.description}</p>}
      {!dish.isAvailable && <span className="mt-3 self-start rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">No disponible</span>}
      <div className="mt-auto pt-5">
        {dish.allergens?.length ? (
        <ul className="flex flex-wrap gap-2" aria-label={`Alérgenos de ${dish.name}`}>
          {dish.allergens?.map(({ presence, allergen }) => (
            <li key={allergen.code} className={presence === "MAY_CONTAIN"
              ? "inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs leading-normal font-medium text-amber-900"
              : "inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-xs leading-normal font-medium text-orange-900"}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
                <path d={allergenPaths[allergen.code] ?? "M12 8v5m0 3v.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z"} />
              </svg>
              <span>{presence === "MAY_CONTAIN" ? "Puede contener: " : "Contiene: "}{allergen.name}</span>
            </li>
          ))}
        </ul>
        ) : (
          <p className="text-xs leading-relaxed text-menu-muted">Alérgenos: información no disponible. Consulta al personal.</p>
        )}
      </div>
    </article>
  );
}
