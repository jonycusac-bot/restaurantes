import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import Home from "../src/app/page";
import MenuDisplay from "../src/components/MenuDisplay";

test("Home renders only MenuDisplay in a full-height centered main", () => {
  const page = Home();
  assert.equal(page.type, "main");
  assert.equal(page.props.children.type, MenuDisplay);
  const classes = page.props.className.split(/\s+/);
  for (const required of ["flex", "min-h-dvh", "items-center", "justify-center"]) {
    assert.ok(classes.includes(required), `Missing layout class: ${required}`);
  }
  const html = renderToStaticMarkup(page);
  assert.match(html, /Cargando menú/);
  assert.doesNotMatch(html, /next\.svg|vercel|Deploy Now|Documentation|To get started/i);
});
