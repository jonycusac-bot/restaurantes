import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

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
    return Response.json({ name: "Burger & Co Central" });
  });
  assert.match(view.initial, /Cargando/);
  assert.deepEqual(requests, ["/api/menu"]);
  assert.match(view.render(), /Menú cargado: .*Burger &amp; Co Central/);
  if (typeof view.cleanup === "function") view.cleanup();
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
