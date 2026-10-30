import { test } from "node:test";
import assert from "node:assert/strict";
import { getAdminPanelState } from "../src/lib/admin-panel-state";
import { initialDraft } from "../src/lib/inch-draft";
import type { CloudDraft } from "../src/lib/cloud-draft";

const dishes = initialDraft.slice(0, 1);
const cloud: CloudDraft = { dishes, revision: 3, updatedAt: "2026-10-30", canPublish: true };
const idle = { enabled: true, busy: false, pending: false };

test("unknown publication metadata never claims published", () => {
  const state = getAdminPanelState(dishes, cloud, idle);
  assert.equal(state.kind, "saved");
  assert.equal(state.label, "Guardado, pendiente de publicar");
  assert.equal(state.canSave, false);
  assert.equal(state.canPublish, true);
  assert.ok(state.description);
});

test("computed states and action gates follow precedence without mutating photos", () => {
  const photo = [{ ...dishes[0], imageSrc: "data:image/webp;base64,YQ==", imageName: "local.webp" }];
  const before = JSON.stringify(photo);
  const cases = [
    { local: dishes, remote: cloud, options: { ...idle, enabled: false }, kind: "local", label: "Solo en este dispositivo", save: false, publish: false },
    { local: dishes, remote: null, options: { ...idle, busy: true }, kind: "connecting", label: "Conectando…", save: false, publish: false },
    { local: dishes, remote: null, options: idle, kind: "offline", label: "Sin conexión", save: false, publish: false },
    { local: photo, remote: cloud, options: { ...idle, pending: true, busy: true }, kind: "pending", label: "Revisar copia", save: false, publish: false },
    { local: photo, remote: cloud, options: { ...idle, busy: true }, kind: "busy", label: "Procesando…", save: false, publish: false },
    { local: photo, remote: cloud, options: idle, kind: "dirty", label: "Cambios sin guardar", save: true, publish: false },
    { local: dishes, remote: { ...cloud, publishedRevision: 3 }, options: idle, kind: "published", label: "Carta publicada", save: false, publish: false },
    { local: photo, remote: { ...cloud, publishedRevision: 3 }, options: idle, kind: "dirty", label: "Cambios sin guardar", save: true, publish: false },
    { local: dishes, remote: { ...cloud, publishedRevision: 2 }, options: idle, kind: "saved", label: "Guardado, pendiente de publicar", save: false, publish: true },
    { local: dishes, remote: { ...cloud, publishedRevision: null }, options: idle, kind: "saved", label: "Guardado, pendiente de publicar", save: false, publish: true },
    { local: dishes, remote: { ...cloud, canPublish: false }, options: idle, kind: "saved", label: "Guardado, pendiente de publicar", save: false, publish: false },
  ];
  for (const row of cases) {
    const actual = getAdminPanelState(row.local, row.remote, row.options);
    assert.deepEqual({ kind: actual.kind, label: actual.label, save: actual.canSave, publish: actual.canPublish }, { kind: row.kind, label: row.label, save: row.save, publish: row.publish });
    assert.ok(actual.description);
  }
  assert.equal(JSON.stringify(photo), before);
});
