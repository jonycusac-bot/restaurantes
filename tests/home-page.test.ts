import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import Home from "../src/app/page";

test("Home serves the INCH menu and its dish photos without waiting for the old database API", () => {
  const html = renderToStaticMarkup(Home());
  assert.match(html, /Nuestra /);
  assert.match(html, /Chicken Satay/);
  assert.match(html, /tempura-gyozas\.webp/);
  assert.match(html, /12,75/);
  assert.doesNotMatch(html, /Toda la carta|California Roll/);
  assert.doesNotMatch(html, /Cargando menú|Burger La Bestia|Create Next App/);
});
