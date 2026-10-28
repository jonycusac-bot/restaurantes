import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import Home from "../src/app/page";

test("Home serves the INCH menu and its dish photos without waiting for the old database API", () => {
  const html = renderToStaticMarkup(Home());
  assert.match(html, /Nuestra /);
  assert.match(html, /California Roll/);
  assert.match(html, /california-roll\.webp/);
  assert.match(html, /13,00/);
  assert.doesNotMatch(html, /Cargando menú|Burger La Bestia|Create Next App/);
});
