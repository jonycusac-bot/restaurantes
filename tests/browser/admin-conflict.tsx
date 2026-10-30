import { createRoot } from "react-dom/client";
import AdminPreview from "../../src/app/admin/preview/AdminPreview";
import { initialDraft, saveLocalDraft, storageKey } from "../../src/lib/inch-draft";
import { cloudRevisionKey, conflictBackupKey, type CloudDraft } from "../../src/lib/cloud-draft";

// Mounted component/browser regression with an explicit simulated HTTP boundary.
// No credentials, Cloudflare connections, production storage or real D1 writes.
export function startConflictQA() {
  if (location.origin !== "http://127.0.0.1:8791") throw new Error("Solo origen QA aislado");
  const local = [{ ...initialDraft[0], name: "Cambio en el teléfono", price: 8.1 }];
  let remote: CloudDraft = { dishes: [{ ...initialDraft[0], name: "Versión de la nube", price: 9.2 }], revision: 7, updatedAt: "2026-10-30", imageStorage: true, canPublish: true, publishedRevision: 5 };
  const puts: number[] = [];
  let publications = 0;
  saveLocalDraft(local);
  localStorage.setItem(cloudRevisionKey, "6");
  window.fetch = async (input, init) => {
    const path = String(input);
    if (path === "/api/admin/draft") {
      if (init?.method === "PUT") {
        const payload = JSON.parse(String(init.body));
        puts.push(payload.revision);
        if (payload.revision !== remote.revision) return Response.json({ error: "Hay cambios más recientes en la nube." }, { status: 409 });
        remote = { ...remote, revision: remote.revision + 1, dishes: payload.dishes };
      }
      return Response.json(remote);
    }
    if (path === "/api/admin/publish") publications++;
    throw new Error(`Ruta inesperada en QA: ${path}`);
  };
  createRoot(document.getElementById("root")!).render(<AdminPreview cloudflare />);
  const settle = () => new Promise(resolve => setTimeout(resolve, 80));
  const check = (ok: unknown, message: string) => { if (!ok) throw new Error(message); };
  const click = (text: string) => {
    const button = [...document.querySelectorAll("button")].find(el => el.textContent === text);
    check(button && !button.disabled, `Botón disponible: ${text}`);
    button!.click();
  };
  window.checkAdminConflict = async () => {
    await settle();
    click("Guardar cambios"); await settle();
    check(puts[0] === 6, "No usar silenciosamente la revisión nueva del GET");
    check(document.querySelector(".admin-conflict"), "Revisión visible después del conflicto");
    check(document.querySelector(".admin-conflict")!.textContent?.includes("Tu copia: Cambio en el teléfono"), "Comparación local identificada");
    check(document.querySelector(".admin-conflict")!.textContent?.includes("Nube: Versión de la nube"), "Comparación nube identificada");
    check([...document.querySelectorAll<HTMLButtonElement>(".admin-primary-actions button")].every(button => button.disabled), "Guardar y publicar bloqueados hasta resolver");
    click("Guardar mi copia"); await settle();
    check(document.querySelector(".admin-conflict-confirm")?.textContent?.includes("NO publicará"), "Advertencia explícita antes de guardar");
    check(puts.length === 1, "La primera selección no escribe todavía");
    click("Volver"); await settle();
    click("Cancelar y conservar todo"); await settle();
    check(remote.revision === 7 && JSON.parse(localStorage.getItem(storageKey)!)[0].price === 8.1, "Cancelar no altera ninguna copia");
    click("Guardar cambios"); await settle();
    click("Guardar mi copia"); await settle();
    remote = { ...remote, revision: 8, dishes: [{ ...remote.dishes[0], price: 11 }] };
    click("Sí, guardar mi copia encima"); await settle();
    check(remote.revision === 8, "Otro dispositivo avanzó: el reintento no sobrescribe");
    check(document.querySelector(".admin-conflict") && !document.querySelector(".admin-conflict-confirm"), "Exige nueva revisión y confirmación");
    click("Guardar mi copia"); await settle();
    click("Sí, guardar mi copia encima"); await settle();
    check(remote.revision === 9 && remote.dishes[0].price === 8.1, "La copia elegida se guarda con la revisión revisada");
    check(document.querySelector('[data-state="saved"]'), "Guardado, pendiente de publicar");
    const backup = JSON.parse(localStorage.getItem(conflictBackupKey)!);
    check(backup.cloud.revision === 8 && JSON.parse(backup.localRaw)[0].price === 8.1, "Respaldo real de ambas copias");
    check(publications === 0, "Resolver no publica");
    check(document.documentElement.scrollWidth <= innerWidth, "Sin desbordamiento horizontal");
    return { passed: true, width: innerWidth, firstStaleRevision: puts[0], reviewedRetryRevisions: puts.slice(2), backupHasBothCopies: true, publications, networkBoundary: "simulated; not remote or D1 E2E" };
  };
}

declare global { interface Window { checkAdminConflict: () => Promise<Record<string, unknown>> } }
