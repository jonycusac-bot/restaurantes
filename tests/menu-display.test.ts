import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import DishCard from "../src/components/DishCard";

async function mountMenu(fetchMenu: typeof fetch) {
  const path = "src/components/MenuDisplay.tsx";
  assert.ok((await import("node:fs")).existsSync(path), "MenuDisplay must exist");
  const source = readFileSync(path, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const state: unknown[] = [];
  let cursor = 0;
  let effect: (() => void | (() => void)) | undefined;
  const hooks = {
    ...React,
    useState(initial: unknown) {
      const index = cursor++;
      if (!(index in state)) state[index] = initial;
      return [state[index], (value: unknown) => { state[index] = value; }];
    },
    useEffect(callback: () => void | (() => void), dependencies: unknown[]) {
      assert.deepEqual(Array.from(dependencies), []);
      effect = callback;
    },
  };
  const exports: { default?: () => React.ReactNode } = {};
  runInNewContext(compiled, {
    exports,
    require: (name: string) => {
      if (name === "react") return hooks;
      if (name === "react/jsx-runtime") return jsxRuntime;
      if (name === "./DishCard") return { default: DishCard };
      throw new Error(`Unexpected import: ${name}`);
    },
    fetch: fetchMenu,
    AbortController,
    console,
  });
  const render = () => {
    cursor = 0;
    return renderToStaticMarkup(exports.default!());
  };
  const initial = render();
  const cleanup = effect?.();
  await new Promise<void>((resolve) => setImmediate(resolve));
  return { initial, render, cleanup };
}

test("MenuDisplay fetches /api/menu on mount and displays the restaurant name", async () => {
  const requests: string[] = [];
  const view = await mountMenu(async (url) => {
    requests.push(String(url));
    return Response.json({
      name: "Burger & Co Central",
      currency: "EUR",
      categories: [
        {
          id: "burgers", name: "Hamburguesas Gourmet", isActive: true,
          dishes: [{ id: "bestia", name: "Burger La Bestia", description: "Carne madurada y cheddar.", price: "12.9", isAvailable: true,
            allergens: [{ presence: "CONTAINS", allergen: { code: "MILK", name: "Lácteos" } }],
          }],
        },
        {
          id: "drinks", name: "Bebidas y Refrescos", isActive: true,
          dishes: [{ id: "cola", name: "Refresco de Cola", description: null, price: "2.5", isAvailable: true }],
        },
      ],
    });
  });
  assert.match(view.initial, /Cargando/);
  assert.deepEqual(requests, ["/api/menu"]);
  const html = view.render();
  assert.match(html, /<h1[^>]*>Burger &amp; Co Central<\/h1>/);
  assert.match(html, /Hamburguesas Gourmet/);
  assert.match(html, /Bebidas y Refrescos/);
  assert.match(html, /Burger La Bestia/);
  assert.match(html, /Carne madurada y cheddar/);
  assert.match(html, /Refresco de Cola/);
  assert.match(html, /12,90\s*€/);
  assert.match(html, /2,50\s*€/);
  assert.match(html, /href="#category-burgers"/);
  assert.match(html, /id="category-burgers"/);
  assert.doesNotMatch(html, /Menú cargado:/);
  assert.match(html, /data-dish-card/);
  assert.match(html, /Contiene: Lácteos/);
  assert.match(html, /Consulta al personal antes de pedir/);
  if (typeof view.cleanup === "function") view.cleanup();
});

test("MenuDisplay hides inactive categories and labels unavailable dishes", async () => {
  const view = await mountMenu(async () => Response.json({
    name: "Prueba", currency: "EUR", categories: [
      { id: "hidden", name: "Categoría oculta", isActive: false, dishes: [] },
      { id: "visible", name: "Carta", isActive: true, dishes: [
        { id: "sold-out", name: "Plato agotado", price: "8", description: null, isAvailable: false },
      ] },
    ],
  }));
  const html = view.render();
  assert.doesNotMatch(html, /Categoría oculta|#category-hidden/);
  assert.match(html, /Plato agotado/);
  assert.match(html, /No disponible/);
});

test("MenuDisplay explains when the menu has no active categories or dishes", async () => {
  const view = await mountMenu(async () => Response.json({
    name: "Prueba", currency: "EUR", categories: [],
  }));
  assert.match(view.render(), /La carta estará disponible pronto/);
  const emptyCategory = await mountMenu(async () => Response.json({
    name: "Prueba", currency: "EUR", categories: [
      { id: "empty", name: "Entrantes", isActive: true, dishes: [] },
    ],
  }));
  assert.match(emptyCategory.render(), /Todavía no hay platos en esta categoría/);
});

test("MenuDisplay shows an error when the backend returns a failure", async () => {
  const view = await mountMenu(async () => Response.json({ error: "Unavailable" }, { status: 500 }));
  assert.match(view.render(), /role="alert".*No se pudo cargar el menú/);
});

test("MenuDisplay shows an error when the network request fails", async () => {
  const view = await mountMenu(async () => { throw new Error("Network error"); });
  assert.match(view.render(), /role="alert".*No se pudo cargar el menú/);
});

test("MenuDisplay cancels its request on unmount", async () => {
  let signal: AbortSignal | null | undefined;
  const view = await mountMenu(async (_url, options) => {
    signal = options?.signal;
    return Response.json({ name: "Burger & Co Central" });
  });
  assert.equal(signal?.aborted, false);
  assert.equal(typeof view.cleanup, "function");
  if (typeof view.cleanup === "function") view.cleanup();
  assert.equal(signal?.aborted, true);
});
