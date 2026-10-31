import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { runInNewContext } from "node:vm";
import { resolve } from "node:path";
import { initialDraft, storageKey } from "../src/lib/inch-draft";
import { beforeCloudLoadKey, cloudRevisionKey } from "../src/lib/cloud-draft";
import worker from "../src/cloudflare/worker";
import { loginCookie } from "../src/cloudflare/auth";
import type { Env, Statement } from "../src/cloudflare/types";
import type { CloudDraft } from "../src/lib/cloud-draft";
import type { useCloudDraft } from "../src/app/admin/preview/useCloudDraft";

const dishes = initialDraft.slice(0, 1);
const snapshot: CloudDraft = { dishes, revision: 3, updatedAt: "2026-10-30", imageStorage: true, canPublish: true, publishedRevision: 2 };

// Isolated hook unit boundary: only React scheduling, fetch and browser storage
// are replaced. This is not a mounted React or browser integration test.
async function hookHarness(data: unknown = snapshot, local = dishes) {
  const states: unknown[] = [];
  const effects: (() => unknown)[] = [];
  let cursor = 0;
  const storage = new Map<string, string>([[storageKey, JSON.stringify(local)], [cloudRevisionKey, "3"]]);
  const failWrites = new Set<string>();
  let fetcher: (url: string, init?: RequestInit) => Promise<Response> = async () => Response.json(data);
  const compiled = await build({
    entryPoints: [resolve("src/app/admin/preview/useCloudDraft.ts")], bundle: true, write: false, format: "cjs", platform: "node",
    plugins: [{ name: "isolated-react-hooks", setup(builder) {
      builder.onResolve({ filter: /^react$/ }, () => ({ path: "react", namespace: "unit" }));
      builder.onLoad({ filter: /.*/, namespace: "unit" }, () => ({ contents: "export const useState = globalThis.__hooks.useState; export const useEffect = globalThis.__hooks.useEffect;" }));
    } }],
  });
  const context = {
    exports: {}, module: { exports: {} }, AbortController, Uint8Array, Event, atob,
    fetch: (url: string, init?: RequestInit) => fetcher(url, init),
    window: { localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => { if (failWrites.has(key)) throw new Error("Storage full"); storage.set(key, value); }, removeItem: (key: string) => { storage.delete(key); } }, dispatchEvent: () => true },
    __hooks: {
      useState(initial: unknown) { const slot = cursor++; if (!(slot in states)) states[slot] = initial; return [states[slot], (next: unknown) => { states[slot] = typeof next === "function" ? next(states[slot]) : next; }]; },
      useEffect(effect: () => unknown) { if (!effects.length) effects.push(effect); },
    },
  };
  runInNewContext(compiled.outputFiles[0].text, context);
  const invoke = (context.module.exports as { useCloudDraft: typeof useCloudDraft }).useCloudDraft;
  const render = () => { cursor = 0; return invoke(); };
  render(); effects[0]();
  await new Promise(resolve => setImmediate(resolve));
  return { render, storage, failWrites, setFetch: (next: typeof fetcher) => { fetcher = next; } };
}

test("cloudResponse carries validated publication metadata without replacing local photos", async () => {
  const local = [{ ...dishes[0], imageSrc: "data:image/webp;base64,YQ==", imageName: "local.webp" }];
  const harness = await hookHarness(snapshot, local);
  assert.equal(harness.render().cloud?.publishedRevision, 2);
  assert.equal(harness.storage.get(storageKey), JSON.stringify(local));
});

test("invalid publication metadata fails closed with an explicit hook error; legacy omission and null remain valid", async () => {
  for (const publishedRevision of [-1, 0, 1.2, "3", true, Number.MAX_SAFE_INTEGER + 1]) {
    const harness = await hookHarness({ ...snapshot, publishedRevision });
    assert.equal(harness.render().cloud, null);
    assert.equal(harness.render().error, true);
    assert.equal(harness.render().busy, false);
    assert.equal(harness.storage.get(storageKey), JSON.stringify(dishes));
  }
  for (const publishedRevision of [undefined, null, 3]) {
    const harness = await hookHarness({ ...snapshot, publishedRevision });
    assert.equal(harness.render().cloud?.publishedRevision, publishedRevision);
    assert.equal(harness.render().error, false);
  }
});

test("publication only marks the matching confirmed revision and errors leave local snapshots untouched", async () => {
  const harness = await hookHarness();
  for (const reply of [Response.json({ error: "conflict" }, { status: 409 }), Response.json({ ok: true, sourceRevision: 4 }), Response.json({ ok: false, sourceRevision: 3 })]) {
    harness.setFetch(async () => reply);
    await harness.render().publish(dishes);
    assert.equal(harness.render().cloud?.publishedRevision, 2);
    assert.equal(harness.render().error, true);
    assert.equal(harness.render().busy, false);
    assert.equal(harness.storage.get(storageKey), JSON.stringify(dishes));
  }
  let finish!: (response: Response) => void;
  harness.setFetch(() => new Promise(resolve => { finish = resolve; }));
  const publishing = harness.render().publish(dishes);
  assert.equal(harness.render().busy, true);
  assert.equal(harness.render().error, false);
  finish(Response.json({ ok: true, sourceRevision: 3 }));
  await publishing;
  assert.equal(harness.render().cloud?.publishedRevision, 3);
  assert.equal(harness.render().error, false);
  assert.equal(harness.storage.get(storageKey), JSON.stringify(dishes));
  await harness.render().publish([{ ...dishes[0], price: 99 }]);
  assert.equal(harness.render().error, true);
  assert.equal(harness.render().cloud?.publishedRevision, 3);
});

test("save and recovery failures surface errors; successful review clears them and backs up photos", async () => {
  const local = [{ ...dishes[0], imageSrc: "data:image/webp;base64,YQ==", imageName: "local.webp" }];
  const harness = await hookHarness(snapshot, local);
  harness.setFetch(async () => Response.json({ error: "conflict" }, { status: 409 }));
  await harness.render().save(local);
  assert.equal(harness.render().error, true);
  assert.equal(harness.storage.get(storageKey), JSON.stringify(local));
  await harness.render().requestLoad();
  assert.equal(harness.render().error, true);
  harness.setFetch(async () => Response.json(snapshot));
  await harness.render().requestLoad();
  assert.equal(harness.render().error, false);
  assert.equal(harness.render().pending?.revision, 3);
  assert.equal(harness.storage.get(storageKey), JSON.stringify(local));
  harness.render().acceptLoad();
  assert.equal(harness.storage.get(beforeCloudLoadKey), JSON.stringify(local));
  assert.equal(harness.storage.get(storageKey), JSON.stringify(dishes));
  harness.render().restoreBackup();
  assert.equal(harness.storage.get(storageKey), JSON.stringify(local));
  assert.equal(harness.render().error, false);
  harness.storage.delete(beforeCloudLoadKey);
  harness.render().restoreBackup();
  assert.equal(harness.render().error, true);
});

// The D1 adapter is a unit boundary, not a database/integration substitute.
test("full backup storage aborts replacement and legacy recovery preserves local photos", async () => {
  const local = [{ ...dishes[0], imageSrc: "data:image/webp;base64,YQ==", imageName: "local.webp" }];
  const harness = await hookHarness({ ...snapshot, imageStorage: false }, local);
  await harness.render().requestLoad();
  harness.failWrites.add(beforeCloudLoadKey);
  harness.render().acceptLoad();
  assert.equal(harness.render().error, true);
  assert.equal(harness.storage.get(storageKey), JSON.stringify(local));
  assert.ok(harness.render().pending);
  harness.failWrites.clear();
  harness.render().acceptLoad();
  assert.equal(harness.render().error, false);
  assert.equal(harness.storage.get(storageKey), JSON.stringify(local));
});

test("successful photo upload save carries metadata while preserving newer local photo edits", async () => {
  const local = [{ ...dishes[0], imageSrc: "data:image/webp;base64,YQ==", imageName: "local.webp" }];
  const newer = [{ ...local[0], imageSrc: "data:image/webp;base64,Yg==", imageName: "newer.webp" }];
  const uploaded = [{ ...local[0], imageSrc: `/media/${"a".repeat(64)}.webp` }];
  const harness = await hookHarness(snapshot, local);
  harness.setFetch(async url => {
    if (url.endsWith("/images")) {
      harness.storage.set(storageKey, JSON.stringify(newer));
      return Response.json({ imageSrc: uploaded[0].imageSrc });
    }
    return Response.json({ ...snapshot, dishes: uploaded, revision: 4 });
  });
  await harness.render().save(local);
  assert.equal(harness.render().error, false);
  assert.equal(harness.render().cloud?.revision, 4);
  assert.equal(harness.render().cloud?.publishedRevision, 2);
  assert.equal(harness.storage.get(storageKey), JSON.stringify(newer));
});

async function workerHarness(published: number | null) {
  const queries: string[] = [];
  let conflict = false;
  const env: Env = {
    INCH_CF_PASSWORD_HASH: `pbkdf2$100000$${"0".repeat(32)}$${"0".repeat(64)}`,
    INCH_CF_SESSION_SECRET: "unit-test-secret-not-real-credentials",
    ASSETS: { fetch: async () => new Response("unused") },
    DB: { batch: async () => [], prepare(sql) {
      queries.push(sql);
      const statement: Statement = {
        bind: () => statement,
        async first<T>() {
          if (sql.startsWith("UPDATE inch_draft") && conflict) return null;
          const row = sql.includes("inch_draft")
            ? { dishes: JSON.stringify(dishes), revision: sql.startsWith("UPDATE") ? 4 : 3, updated_at: "2026-10-30", ...(sql.includes("source_revision") ? { source_revision: published } : {}) }
            : { source_revision: published };
          return row as T;
        },
        run: async () => ({ meta: { changes: conflict ? 0 : 1 } }),
      };
      return statement;
    } },
  };
  const cookie = (await loginCookie(new Request("https://inch.test/admin"), env)).split(";")[0];
  return { queries, setConflict: () => { conflict = true; }, request: (path = "/api/admin/draft", method = "GET", payload?: unknown) => worker.fetch(new Request(`https://inch.test${path}`, { method, headers: { Cookie: cookie, Origin: "https://inch.test", "Content-Type": "application/json" }, ...(payload === undefined ? {} : { body: JSON.stringify(payload) }) }), env) };
}

test("central reads expose persisted publication metadata without writes", async () => {
  for (const published of [null, 2, 3]) {
    const harness = await workerHarness(published);
    const read = await harness.request("/api/admin/menu");
    assert.equal(read.status, 200);
    const data = await read.json();
    assert.equal(data.publishedRevision, published);
    assert.equal(data.live, true);
    assert.equal(data.canPublish, false);
    assert.ok(harness.queries.some(sql => sql.startsWith("SELECT") && sql.includes("inch_publication") && sql.includes("source_revision")));
    assert.equal(harness.queries.some(sql => /^(UPDATE|INSERT|DELETE)/.test(sql)), false);
  }
});

test("retired whole-draft and separate publication writes require updating old tabs", async () => {
  const harness = await workerHarness(2);
  for (const revision of [2, 3]) {
    assert.equal((await harness.request(undefined, "PUT", { revision, dishes })).status, 426);
    assert.equal((await harness.request("/api/admin/publish", "POST", { revision })).status, 426);
  }
  assert.equal(harness.queries.some(sql => /^(UPDATE|INSERT|DELETE)/.test(sql)), false);
});
