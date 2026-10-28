import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

test("DishCard renders a price and accessible chips with recorded allergen presence", async () => {
  assert.ok(existsSync("src/components/DishCard.tsx"), "DishCard must exist");
  const { default: DishCard } = await import("../src/components/DishCard");
  const html = renderToStaticMarkup(createElement(DishCard, {
    currency: "EUR",
    dish: {
      id: "burger", name: "Burger La Bestia", description: "Carne y cheddar.",
      price: "12.9", isAvailable: true,
      allergens: [
        { presence: "CONTAINS", allergen: { code: "GLUTEN", name: "Gluten" } },
        { presence: "CONTAINS", allergen: { code: "MILK", name: "Lácteos" } },
        { presence: "MAY_CONTAIN", allergen: { code: "EGG", name: "Huevo" } },
      ],
    },
  }));
  assert.match(html, /<article/);
  assert.match(html, /Burger La Bestia/);
  assert.match(html, /12,90\s*€/);
  assert.match(html, /aria-label="Alérgenos de Burger La Bestia"/);
  assert.match(html, /Contiene: Gluten/);
  assert.match(html, /Contiene: Lácteos/);
  assert.match(html, /Puede contener: Huevo/);
  assert.doesNotMatch(html, /Sin alérgenos|No disponible/);
});

test("DishCard labels unavailable dishes and renders new allergen codes without guessing", async () => {
  const { default: DishCard } = await import("../src/components/DishCard");
  const html = renderToStaticMarkup(createElement(DishCard, {
    currency: "EUR",
    dish: {
      id: "special", name: "Especial", description: null, price: "8", isAvailable: false,
      allergens: [{ presence: "MAY_CONTAIN", allergen: { code: "CUSTOM", name: "Alérgeno registrado" } }],
    },
  }));
  assert.match(html, /No disponible/);
  assert.match(html, /Puede contener: Alérgeno registrado/);
});

test("DishCard never treats absent allergen records as an allergen-free guarantee", async () => {
  const { default: DishCard } = await import("../src/components/DishCard");
  for (const allergens of [undefined, []]) {
    const html = renderToStaticMarkup(createElement(DishCard, {
      currency: "EUR",
      dish: { id: "cola", name: "Cola", description: null, price: "2.5", isAvailable: true, allergens },
    }));
    assert.match(html, /Alérgenos: información no disponible/);
    assert.match(html, /Consulta al personal/);
    assert.doesNotMatch(html, /Sin alérgenos|Libre de|<ul/);
  }
});
