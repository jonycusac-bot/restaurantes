import { createRoot } from "react-dom/client";
import AdminPreview from "../../src/app/admin/preview/AdminPreview";
import LoginForm from "../../src/app/admin/LoginForm";
import { startConflictQA } from "./admin-conflict";
import "tailwindcss/preflight.css";
import "../../src/app/admin/preview/admin.css";

// Component-only QA on an isolated loopback origin. No Cloudflare session or API.
if (location.hostname !== "127.0.0.1" || location.port !== "8791") {
  throw new Error("Esta prueba solo se ejecuta en el origen local aislado de QA.");
}

const loginMode = new URLSearchParams(location.search).has("login");
if (new URLSearchParams(location.search).has("conflict")) startConflictQA();
else createRoot(document.getElementById("root")!).render(loginMode ? <LoginForm /> : <AdminPreview />);

const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 50));
function check(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

declare global {
  interface Window {
    checkAdminEditor: () => Promise<Record<string, unknown>>;
    checkAdminEditorSave: () => Promise<Record<string, unknown>>;
    checkAdminEditorSwitch: () => Promise<Record<string, unknown>>;
    checkAdminLogin: () => Promise<Record<string, unknown>>;
  }
}

window.checkAdminLogin = async () => {
  await settle();
  const password = document.querySelector<HTMLInputElement>('input[type="password"]');
  check(password, "Existe el campo de contraseña del componente real");
  const section = password.closest<HTMLElement>(".admin-editor")!;
  check(section.tagName === "SECTION", "El acceso conserva su sección, no un diálogo de edición");
  check(getComputedStyle(section).display !== "none" && password.getBoundingClientRect().width > 0, "El formulario de acceso debe ser visible aunque no tenga atributo open");
  check(getComputedStyle(password.closest("label")!).display === "flex", "La etiqueta y el campo conservan su distribución vertical");
  check(!document.querySelector("dialog:modal"), "El acceso no abre el editor de platos");
  check(document.documentElement.scrollWidth <= innerWidth, "El acceso no debe desbordar horizontalmente");
  return { passed: true, width: innerWidth, loginVisible: true, passwordWidth: password.getBoundingClientRect().width, noCredentialsEntered: true };
};

window.checkAdminEditor = async () => {
  await settle();
  document.querySelector<HTMLButtonElement>(".admin-editor-close")?.click();
  await settle();
  const trigger = document.querySelector<HTMLButtonElement>(".admin-list li button");
  check(trigger, "Hay un plato real de la carta inicial para editar");
  trigger.scrollIntoView({ block: "center" });
  trigger.focus();
  const selectedName = trigger.querySelector(".admin-dish-name")!.textContent;
  const beforeDraft = localStorage.getItem("inch-admin-preview-draft-v1");
  trigger.click();
  await settle();
  // Opening clears the previous save status, which can legitimately reflow the list.
  const beforeScroll = scrollY;
  const editor = document.querySelector<HTMLDialogElement>(".admin-editor");
  check(editor instanceof HTMLDialogElement, "El editor debe ser un diálogo, no una sección debajo del listado");
  const mobile = innerWidth <= 1050;
  check(editor.open && editor.matches(":modal") === mobile, "Modal en móvil y panel no modal en escritorio");
  const rect = editor.getBoundingClientRect();
  if (mobile) {
    check(Math.abs(rect.top) < 2 && rect.bottom <= innerHeight + 2, "El editor debe quedar dentro de la pantalla móvil");
    check(document.body.style.overflow === "hidden", "El fondo no debe desplazarse mientras se edita en móvil");
    const actions = editor.querySelector(".admin-editor-actions")!.getBoundingClientRect();
    check(actions.top >= 0 && actions.bottom <= innerHeight, "Cancelar y Aplicar deben permanecer visibles");
    check(document.activeElement === editor.querySelector(".admin-editor-close"), "Abrir no debe enfocar un campo ni solicitar el teclado");
  } else {
    check(getComputedStyle(editor).position === "static", "En escritorio se conserva el editor lateral");
  }
  check(editor.textContent?.includes(selectedName!), "El nombre del plato seleccionado debe aparecer en el editor");
  const nameInput = editor.querySelector<HTMLInputElement>('input[name="name"]')!;
  nameInput.value = "Cambio temporal de la prueba aislada";
  editor.querySelector<HTMLButtonElement>(".admin-editor-actions button")!.click();
  await settle();
  check(!document.querySelector(".admin-editor"), "Cancelar debe cerrar el editor");
  check(localStorage.getItem("inch-admin-preview-draft-v1") === beforeDraft, "Cancelar no debe modificar el borrador");
  check(trigger.querySelector(".admin-dish-name")!.textContent === selectedName, "Cancelar debe conservar el plato original");
  check(document.body.style.overflow !== "hidden", "Cerrar debe desbloquear el fondo");
  check(document.activeElement === trigger, "Cerrar debe devolver el foco al plato seleccionado");
  check(Math.abs(scrollY - beforeScroll) < 2, "Cerrar debe conservar la posición del listado");

  document.querySelector<HTMLButtonElement>(".admin-list-heading button")!.click();
  await settle();
  const newEditor = document.querySelector<HTMLDialogElement>(".admin-editor");
  check(newEditor?.open && newEditor.querySelector("h2")?.textContent === "Nuevo plato", "Añadir debe abrir el mismo editor visible");
  newEditor.querySelector<HTMLButtonElement>(".admin-editor-close")!.click();
  await settle();
  check(localStorage.getItem("inch-admin-preview-draft-v1") === beforeDraft, "Cerrar un alta no debe crear un plato");

  trigger.focus(); trigger.click();
  await settle();
  return { passed: true, width: innerWidth, height: innerHeight, selectedName, modal: mobile, editorTop: rect.top, editorBottom: rect.bottom, cancelPreservesDraft: true, focusRestored: true, addVisible: true };
};

window.checkAdminEditorSave = async () => {
  await settle();
  document.querySelector<HTMLButtonElement>(".admin-editor-close")?.click();
  await settle();
  const before = localStorage.getItem("inch-admin-preview-draft-v1");
  try {
    document.querySelector<HTMLButtonElement>(".admin-list li button")!.click();
    await settle();
    const editor = document.querySelector<HTMLDialogElement>(".admin-editor")!;
    editor.querySelector<HTMLInputElement>('input[name="name"]')!.value = "Nombre de prueba del editor aislado";
    editor.querySelector<HTMLInputElement>('input[name="price"]')!.value = "7.25";
    editor.querySelector<HTMLFormElement>("form")!.requestSubmit();
    await settle();
    check(!document.querySelector(".admin-editor"), "Aplicar debe cerrar el editor");
    const saved = JSON.parse(localStorage.getItem("inch-admin-preview-draft-v1")!);
    check(saved.some((dish: { name: string; price: number }) => dish.name === "Nombre de prueba del editor aislado" && dish.price === 7.25), "Aplicar debe conservar el guardado local de nombre y precio");
    check(document.body.style.overflow !== "hidden", "Aplicar debe desbloquear el fondo");
    return { passed: true, localSaveWorks: true, noCloudSession: true };
  } finally {
    // This origin belongs exclusively to this fixture; never clear a user's origin.
    if (before === null) localStorage.removeItem("inch-admin-preview-draft-v1");
    else localStorage.setItem("inch-admin-preview-draft-v1", before);
    window.dispatchEvent(new StorageEvent("storage", { key: "inch-admin-preview-draft-v1" }));
  }
};

window.checkAdminEditorSwitch = async () => {
  await settle();
  check(innerWidth > 1050, "La regresión de cambio directo se prueba en el panel lateral de escritorio");
  document.querySelector<HTMLButtonElement>(".admin-editor-close")?.click();
  await settle();
  const triggers = [...document.querySelectorAll<HTMLButtonElement>(".admin-list li button")];
  check(triggers.length >= 2, "La carta inicial tiene dos platos para probar el cambio directo");
  triggers[0].focus(); triggers[0].click();
  await settle();
  triggers[1].focus(); triggers[1].click();
  await settle();
  const secondName = triggers[1].querySelector(".admin-dish-name")!.textContent;
  check(document.querySelector<HTMLInputElement>('.admin-editor input[name="name"]')!.value === secondName, "El editor debe mostrar el segundo plato");
  document.querySelector<HTMLButtonElement>(".admin-editor-close")!.click();
  await settle();
  check(document.activeElement === triggers[1], "Al cerrar el segundo plato, el foco debe volver al segundo, no al primero");
  return { passed: true, secondName, focusReturnedToSecondDish: true };
};
