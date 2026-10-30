import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { runInNewContext } from "node:vm";
import { resolve } from "node:path";
import { initialDraft, storageKey } from "../src/lib/inch-draft";
import { beforeCloudLoadKey, cloudRevisionKey, conflictBackupKey } from "../src/lib/cloud-draft";
import type { CloudDraft } from "../src/lib/cloud-draft";
import type { useCloudDraft } from "../src/app/admin/preview/useCloudDraft";

// Unit boundary of the hook: React scheduling, fetch and browser storage are
// replaced. This is not a mounted React or browser integration test.
const dishes = initialDraft.slice(0, 1);
const snapshot: CloudDraft = { dishes, revision: 3, updatedAt: "2026-10-30", imageStorage: true, canPublish: true, publishedRevision: 2 };

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

const base = dishes[0];
const edited = { ...base, name: "Editado local" };
const cloudAhead = { ...base, name: "Nube" };

test("recovering an unversioned conflict backup must remove a later revision token", async () => {
  const harness = await hookHarness(snapshot, [edited]);
  harness.storage.delete(cloudRevisionKey);
  harness.setFetch(async () => Response.json(snapshot));
  await harness.render().save([edited]);
  harness.setFetch(async () => Response.json({ ...snapshot, dishes: [edited], revision: 4 }));
  await harness.render().saveLocalOverCloud();
  assert.equal(harness.storage.get(cloudRevisionKey), "4");
  harness.render().restoreConflictBackup();
  assert.equal(harness.storage.has(cloudRevisionKey), false, "an old unversioned copy cannot inherit permission to overwrite revision 4");
});

test("stale browser revision must not be silently replaced by the newer GET revision", async () => {
  const harness = await hookHarness(snapshot, [edited]);
  harness.storage.set(cloudRevisionKey, "1");
  let sentRevision: number | undefined;
  harness.setFetch(async (_url, init) => {
    if (init?.method === "PUT") {
      sentRevision = JSON.parse(String(init.body)).revision;
      return Response.json({ error: "conflict" }, { status: 409 });
    }
    return Response.json(snapshot);
  });
  await harness.render().save([edited]);
  assert.equal(sentRevision, 1, "the first save must retain the browser's actual base revision");
  assert.equal(harness.storage.get(cloudRevisionKey), "1");
  assert.ok(harness.render().conflict);
});

test("missing browser revision requires review before writing a different local draft", async () => {
  const harness = await hookHarness(snapshot, [edited]);
  harness.storage.delete(cloudRevisionKey);
  let puts = 0;
  harness.setFetch(async (_url, init) => {
    if (init?.method === "PUT") puts++;
    return Response.json(snapshot);
  });
  await harness.render().save([edited]);
  assert.equal(puts, 0);
  assert.ok(harness.render().conflict);
});

test("a local edit during conflict GET is the copy presented for review", async () => {
  const harness = await hookHarness(snapshot, [edited]);
  const newer = [{ ...edited, name: "Otra pestaña durante la carga" }];
  harness.setFetch(async (_url, init) => {
    if (init?.method === "PUT") return Response.json({ error: "conflict" }, { status: 409 });
    harness.storage.set(storageKey, JSON.stringify(newer));
    return Response.json(snapshot);
  });
  await harness.render().save([edited]);
  assert.equal(JSON.stringify(harness.render().conflict?.local), JSON.stringify(newer));
});

test("using cloud cannot discard a local edit made after the review was opened", async () => {
  const harness = await hookHarness(snapshot, [edited]);
  harness.setFetch(async (_url, init) => init?.method === "PUT" ? Response.json({ error: "conflict" }, { status: 409 }) : Response.json(snapshot));
  await harness.render().save([edited]);
  const newer = JSON.stringify([{ ...edited, name: "Cambio sin revisar" }]);
  harness.storage.set(storageKey, newer);
  harness.render().acceptConflictCloud();
  assert.equal(harness.storage.get(storageKey), newer);
  assert.ok(harness.render().conflict);
  assert.equal(harness.render().error, true);
});

// Reproduces the reported seam: a stale local revision, an edited local copy and
// a newer cloud copy. With the old hook a 409 only produced an error string and
// no safe way to save the reviewer's edits without discarding them.
test("conflict: a 409 draft save surfaces the latest cloud revision for review instead of only an error", async () => {
  const harness = await hookHarness(snapshot, [edited]);
  harness.storage.set(cloudRevisionKey, "1"); // stale local revision, as the browser kept it
  harness.setFetch(async (url, init) => init?.method === "PUT"
    ? Response.json({ error: "conflict" }, { status: 409 })
    : Response.json({ ...snapshot, revision: 5, dishes: [cloudAhead] }));
  await harness.render().save([edited]);
  const conflict = harness.render().conflict;
  assert.ok(conflict, "a 409 must expose a conflict state instead of only an error string");
  assert.equal(conflict.cloud.revision, 5, "the conflict carries the latest cloud revision");
  assert.equal(JSON.stringify(conflict.local), JSON.stringify([edited]), "the conflict carries the reviewable local copy across the VM boundary");
  // The reviewer can save their own copy without a 409 loop.
  harness.setFetch(async (url, init) => init?.method === "PUT"
    ? Response.json({ ...snapshot, revision: 6, dishes: [edited] })
    : Response.json({ ...snapshot, revision: 5 }));
  await harness.render().saveLocalOverCloud();
  assert.equal(harness.render().conflict, null, "an explicit resolution clears the conflict");
  assert.equal(harness.render().cloud?.revision, 6);
  assert.equal(harness.render().error, false);
  assert.equal(harness.storage.get(cloudRevisionKey), "6");
});

test("conflict: cancel keeps the local and cloud copies untouched", async () => {
  const harness = await hookHarness(snapshot, [edited]);
  harness.setFetch(async (url, init) => init?.method === "PUT"
    ? Response.json({ error: "conflict" }, { status: 409 })
    : Response.json({ ...snapshot, revision: 5 }));
  await harness.render().save([edited]);
  assert.ok(harness.render().conflict);
  harness.render().cancelConflict();
  assert.equal(harness.render().conflict, null);
  assert.equal(harness.storage.get(storageKey), JSON.stringify([edited]), "cancel must not rewrite the local draft");
});

test("conflict: using the reviewed cloud version backs up the local copy before replacing it", async () => {
  const harness = await hookHarness(snapshot, [edited]);
  harness.setFetch(async (url, init) => init?.method === "PUT"
    ? Response.json({ error: "conflict" }, { status: 409 })
    : Response.json({ ...snapshot, revision: 5, dishes: [cloudAhead] }));
  await harness.render().save([edited]);
  harness.render().acceptConflictCloud();
  assert.equal(harness.storage.get(beforeCloudLoadKey), JSON.stringify([edited]), "the replaced local copy is saved for recovery");
  assert.equal(harness.storage.get(storageKey), JSON.stringify([cloudAhead]));
  assert.equal(harness.render().conflict, null);
  assert.equal(harness.storage.get(cloudRevisionKey), "5");
  harness.render().restoreBackup();
  assert.equal(harness.storage.get(storageKey), JSON.stringify([edited]));
});

test("conflict: a local change in another tab blocks a stale save and asks for a new review", async () => {
  const harness = await hookHarness(snapshot, [edited]);
  let puts = 0;
  harness.setFetch(async (url, init) => {
    if (init?.method === "PUT") { puts++; return Response.json({ error: "conflict" }, { status: 409 }); }
    return Response.json({ ...snapshot, revision: 5 });
  });
  await harness.render().save([edited]);
  assert.equal(puts, 1);
  harness.storage.set(storageKey, JSON.stringify([{ ...edited, name: "Otra pestaña" }]));
  await harness.render().saveLocalOverCloud();
  assert.equal(puts, 1, "a reviewed copy that changed in another tab must never be PUT");
  assert.equal(harness.render().error, true);
  const conflict = harness.render().conflict;
  assert.ok(conflict, "a new review is requested");
  assert.equal(JSON.stringify(conflict.local), JSON.stringify([{ ...edited, name: "Otra pestaña" }]), "the new review presents the current local copy");
});

test("conflict: a second 409 while resolving keeps the backups and re-opens the review", async () => {
  const harness = await hookHarness(snapshot, [edited]);
  let puts = 0;
  harness.setFetch(async (url, init) => {
    if (init?.method === "PUT") { puts++; return Response.json({ error: "conflict" }, { status: 409 }); }
    return Response.json({ ...snapshot, revision: 5 });
  });
  await harness.render().save([edited]);
  await harness.render().saveLocalOverCloud();
  assert.equal(puts, 2);
  const reopened = harness.render().conflict;
  assert.ok(reopened, "the cloud advanced while reviewing, so review re-opens");
  assert.equal(reopened.cloud.revision, 5);
  assert.ok(harness.storage.get(conflictBackupKey), "the backups are kept after a second conflict");
  assert.equal(harness.storage.get(storageKey), JSON.stringify([edited]), "the local copy is never lost on a second conflict");
});

test("conflict: a failed backup aborts the save without writing to the cloud", async () => {
  const harness = await hookHarness(snapshot, [edited]);
  let puts = 0;
  harness.setFetch(async (url, init) => {
    if (init?.method === "PUT") { puts++; return Response.json({ error: "conflict" }, { status: 409 }); }
    return Response.json({ ...snapshot, revision: 5 });
  });
  await harness.render().save([edited]);
  harness.failWrites.add(conflictBackupKey);
  await harness.render().saveLocalOverCloud();
  assert.equal(puts, 1, "no additional PUT when the backup cannot be written (quota)");
  assert.equal(harness.render().error, true);
  assert.ok(harness.render().conflict, "the review stays open so nothing is lost");
});

test("conflict: the pre-write backup is recoverable and never touches the cloud", async () => {
  const harness = await hookHarness(snapshot, [edited]);
  let puts = 0;
  harness.setFetch(async (url, init) => {
    if (init?.method === "PUT") { puts++; return puts === 1 ? Response.json({ error: "conflict" }, { status: 409 }) : Response.json({ ...snapshot, revision: 6, dishes: [edited] }); }
    return Response.json({ ...snapshot, revision: 5 });
  });
  await harness.render().save([edited]);
  await harness.render().saveLocalOverCloud();
  assert.ok(harness.storage.get(conflictBackupKey), "both the local and the cloud copy are backed up before the write");
  harness.storage.set(storageKey, JSON.stringify([{ ...edited, name: "Cambiado después" }]));
  harness.render().restoreConflictBackup();
  assert.equal(JSON.parse(harness.storage.get(storageKey)!)[0].name, "Editado local");
  assert.equal(puts, 2, "recovery never writes to the cloud");
});

test("conflict: using the cloud version preserves local browser photos on the legacy path", async () => {
  const withPhoto = [{ ...base, imageSrc: "data:image/webp;base64,YQ==", imageName: "local.webp" }];
  const cloudDishes = [{ ...base, imageSrc: "", imageName: "Sin imagen" }];
  const harness = await hookHarness({ ...snapshot, imageStorage: false }, withPhoto);
  harness.setFetch(async (url, init) => init?.method === "PUT"
    ? Response.json({ error: "conflict" }, { status: 409 })
    : Response.json({ ...snapshot, imageStorage: false, revision: 5, dishes: cloudDishes }));
  await harness.render().save(withPhoto);
  harness.render().acceptConflictCloud();
  const stored = JSON.parse(harness.storage.get(storageKey)!);
  assert.equal(stored[0].imageSrc, "data:image/webp;base64,YQ==", "local browser photos survive a cloud load");
});

test("publish gate: an unresolved conflict never publishes", async () => {
  const harness = await hookHarness(snapshot, [edited]);
  let publishes = 0;
  harness.setFetch(async (url, init) => {
    if (url.endsWith("/publish")) { publishes++; return Response.json({ ok: true, sourceRevision: 5 }); }
    if (init?.method === "PUT") return Response.json({ error: "conflict" }, { status: 409 });
    return Response.json({ ...snapshot, revision: 5 });
  });
  await harness.render().save([edited]);
  assert.ok(harness.render().conflict);
  await harness.render().publish([edited]);
  assert.equal(publishes, 0, "a conflict must not be published until it is resolved");
  assert.equal(harness.render().error, true);
});
