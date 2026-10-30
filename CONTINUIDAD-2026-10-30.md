# INCH · Continuidad del proyecto — cierre del 30/10/2026

> **ESTADO VIGENTE TRAS LA INCIDENCIA DE GUARDADO (30/10).** Después del despliegue del toolbar el usuario reportó un conflicto de revisión que impedía guardar sus cambios del teléfono. Se añadió una revisión explícita de ambas copias, con cancelación, carga de nube con respaldo y guardado de la copia local solo tras confirmación y respaldo de ambas versiones. La revisión independiente final pasó y la corrección está desplegada en **https://dd290f1b.inch-carta-demo.pages.dev/**, disponible en el dominio estable. Verificados los assets corregidos, el acceso privado y la carta pública intacta antes/después. Pruebas actuales: **53 en total, 52 correctas, 1 omitida**; TypeScript, ESLint, build, integración D1 efímera y navegador aislado correctos. Falta comprobar el flujo en el iPhone del dueño; no se tocó su borrador real. **No borrar caché ni cargar la nube a ciegas**: recargar el panel conservando los datos del navegador y revisar las diferencias antes de elegir qué copia guardar. Detalles y límites: `design/inch/revision-movil/conflicto-guardado.md`. Las notas posteriores de este documento describen la entrega anterior del toolbar.

Documento de traspaso para retomar otro día sin releer el chat ni volver a ejecutar scripts remotos. No declara el trabajo terminado: recoge lo hecho hasta hoy, lo desplegado, lo que sigue solo en local y lo pendiente.

Convenciones de este documento:

- **[HECHO]** verificado con herramientas en la sesión del 30/10/2026 (rutas y evidencia citadas).
- **[DOC]** estado que solo consta por documentación previa del repositorio, no re-verificado hoy.
- **[PENDIENTE]** trabajo abierto o decisión sin confirmar.
- No se añaden fechas, plazos ni decisiones no confirmadas por el usuario.

> **ACTUALIZACIÓN ANTERIOR A LA INCIDENCIA (30/10/2026).** Este documento se redactó *antes* de que el usuario autorizara desplegar y hacer commit/push. Con esa autorización ya concedida, al cierre del 30/10 se completaron ambos frentes: el **toolbar de estados se desplegó** en Cloudflare Pages (`https://8c6fd1e5.inch-carta-demo.pages.dev/`, dominio estable `https://inch-carta-demo.pages.dev/`) y **los cambios de hoy se guardaron en Git y se empujaron** a `origin/feat/bootstrap`. Los párrafos siguientes conservan el estado **anterior** (marcado «estado anterior») y se corrigen donde decían «solo en local / sin desplegar / sin commit». Detalle no sensible de la operación: `.cloudflare-build/release-result.json`.

Fuentes locales leídas para este traspaso (por secciones): `AGENTS.md`, `CLOUDFLARE.md`, `VIERNES-2026-10-30.md`, `INCH.md`, `RETOMAR-MANANA.md`, `design/inch/revision-movil/{report.md,editor-corregido.md,hallazgos.json}`, `tests/browser/README.md`, `tests/browser/admin-editor.tsx`, `src/lib/admin-panel-state.ts`, `src/lib/cloud-draft.ts`, `src/app/admin/preview/useCloudDraft.ts`, `src/app/admin/preview/AdminPreview.tsx`, `src/app/admin/preview/admin.css`, `src/cloudflare/worker.ts`, `scripts/check-admin-publication.ts`, `scripts/preview-admin-editor.ts`, `tests/admin-panel-state.test.ts`, `tests/admin-toolbar.test.ts`, `tests/cloud-publication-state.test.ts`, `git status/log/diff` (solo lectura).

No se abrieron secretos ni copias privadas: `.env*`, `.dev.vars`, `.env.admin.local`, `.env.inch-db.local`, `.cloudflare-build/`, `.netlify/`, `.wrangler/`, `backups-private/`.

---

## 0. Resumen ejecutivo

El proyecto es una carta digital exclusiva de INCH, servida como prueba sobre **Cloudflare Pages (Pages clásico) + D1**, sin R2 ni planes de pago. La migración desde Next 16 + Tailwind 4 + Prisma 7 + PostgreSQL (y desde la parada de Netlify) ya se hizo en la prueba Pages+D1.

- **[HECHO]** Hoy (30/10) se cerraron dos frentes: (a) corrección del editor móvil (diálogo modal) y del login en blanco, **desplegada**; (b) nuevo toolbar de estados y flujo «Guardar cambios / Publicar carta» con recuperación agrupada — *estado anterior:* «solo en local, sin desplegar»; **actualizado: ya desplegado** al cierre del 30/10 (ver la nota superior).
- **[HECHO]** El usuario probó en iPhone: la carta se ve correcta, pero al tocar un plato el editor quedaba al fondo. Se corrigió con diálogo modal hasta 1050 px y panel lateral en escritorio.
- **[HECHO]** El usuario aprobó dejar dos acciones principales (GUARDAR CAMBIOS / PUBLICAR CARTA), enlace VER CARTA PÚBLICA y la recuperación dentro de un `<details>` cerrado «Copias y recuperación». Se implementó en local.
- **[HECHO·actualizado]** Con autorización del usuario **se desplegó** el toolbar nuevo (solo código). Sigue **[PENDIENTE]** comprobar su flujo completo en el iPhone y la lista de producto/cuentas/copias (sección 10). El usuario ya confirmó que al pulsar un plato el editor aparece en primera vista; eso no valida todavía la nueva barra ni todo el flujo con fotos.
- **[HECHO·actualizado]** Los cambios de hoy **ya tienen commit y push** en `origin/feat/bootstrap`. *Estado anterior:* al redactar el resumen aún no los tenían (git status lo confirmaba).

---

## 1. Objetivo y diseño

- **[DOC]** Carta digital exclusiva de INCH (no plataforma multi-restaurante). El repositorio conserva el nombre `Restaurantes` y código del prototipo, pero no se está construyendo un producto multirrestaurante.
- **[DOC]** «Diseño ante todo»: es una CARTA, no una página promocional. Papel marfil, tinta oscura, acentos bermellón, títulos serif, líneas finas, descripciones cortas y fotografías protagonistas debajo del nombre del plato. No rehacer desde cero la estética aprobada.
- **[DOC]** Dos pestañas superiores **Carta** y **Sushi**, sin «Toda la carta». Carta: Entrantes → Ensaladas → Sopas → Salteados → Curry → Arroces → Noodles → Menú infantil. Sushi: Entradas → Tartar → Poke Bowls → Sashimi → Nigiris → Maki → Temaki → Gunkan → Uramaki.
- **[DOC]** Cabecera con logo a la izquierda, arte central (91 px escritorio / 56 px móvil) y banderas es/en/de. Prioridad: fotos, nombres y precios.
- **[DOC]** No añadir pedidos, pagos ni reservas sin petición. Mantener decisiones ya aprobadas; no pedir de nuevo autorización para acciones ya autorizadas.
- **[DOC]** La base de datos se autorizó **solo si podía usarse gratis**. No activar pagos ni cambiar de plan.
- **[DOC]** La gestión de enlaces/códigos dinámicos queda fuera de este proyecto por decisión del usuario.

---

## 2. Rutas y enlaces

- **[HECHO]** Carpeta local del proyecto: `C:/Users/Usuario/Desktop/Restaurantes`.
- **[DOC]** GitHub: `https://github.com/jonycusac-bot/restaurantes`, rama `feat/bootstrap`.
- **[DOC]** Carta pública: `https://inch-carta-demo.pages.dev/`.
- **[DOC]** Panel: `https://inch-carta-demo.pages.dev/admin`. Alias también disponible: `/admin/preview`.
- **[DOC]** Local con entorno real de Cloudflare (D1 local, persistente en `.wrangler/`): `http://127.0.0.1:8788/` (panel en `/admin`).
- **[DOC]** QA aislada del componente real (sin auth ni D1): `http://127.0.0.1:8791` (`scripts/preview-admin-editor.ts`).
- **[DOC]** El servidor Next anterior en `localhost:3000` es otra vista con otro almacenamiento local; no confundirlo con la prueba Cloudflare.
- **[DOC]** Netlify (etapa anterior) sigue en su versión publicada y **no se ha modificado**; su integración PostgreSQL quedó detenida por el usuario y no debe retomarse sin nueva petición.
- **[DOC]** Recursos: cuenta Cloudflare `f732c02bdb73d8bb8d944ba5a6d6481d`; proyecto Pages clásico `inch-carta-demo` (rama de producción `feat/bootstrap`); base D1 `inch-carta-demo` id `c66f1733-19cb-4e41-b5c1-f4491fedc914` (región WEUR); tablas `inch_draft`, `inch_publication`, `inch_images`, `inch_login_attempts`; migración `cloudflare/migrations/0001_menu.sql`; config `wrangler.jsonc`. Los IDs de recursos no son contraseñas.

---

## 3. Arquitectura vigente y evolución

Evolución (según `INCH.md` / `RETOMAR-MANANA.md`): prototipo Next + Prisma + PostgreSQL local → publicación estática Netlify (`dist-inch/`) → Netlify Database (creada, sin integrar) → **detención de Netlify** → prueba **Cloudflare Pages + D1** (estado vigente).

Arquitectura vigente de la prueba Cloudflare:

- **[DOC] Worker** `src/cloudflare/worker.ts`: rutas de borrador (`/api/admin/draft` GET/PUT), imágenes (`/api/admin/images`), publicación (`/api/admin/publish`), login/logout y lectura de la carta pública (`/`). Sirve assets estáticos vía binding `ASSETS`.
- **[DOC] Auth** `src/cloudflare/auth.ts`: contraseña provisional compartida con hash PBKDF2+sal, sesión firmada HMAC con caducidad de 8 h, cookie HttpOnly/SameSite=Strict/Secure en HTTPS, y límite de 8 intentos por IP en ventana de 5 min (IP hasheada en D1).
- **[DOC] Render** `src/cloudflare/html.tsx` (HTML de carta, login y panel), `public-client.tsx` (hidrata la carta publicada sin leer borradores locales), `admin-client.tsx` (hidrata el panel en modo Cloudflare).
- **[DOC] UI compartida** `src/app/admin/preview/AdminPreview.tsx` (funciones Cloudflare habilitadas por la prop `cloudflare`), `useCloudDraft.ts` (cargar/guardar/subir fotos/publicar), `src/lib/cloud-draft.ts` y `src/lib/inch-draft.ts` (tipos y borrador local).
- **[DOC] Persistencia**: borrador (`inch_draft`), instantánea HTML publicada (`inch_publication`), imágenes como BLOB en tabla separada (`inch_images`). `INSERT OR IGNORE` desde `src/app/inch/menu.ts` solo carga si la base está vacía: builds/despliegues posteriores **no sustituyen** los platos del dueño.
- **[DOC] Control de revisión**: una edición con revisión antigua recibe **409** y no sobrescribe una versión más reciente; el servidor hace dos comprobaciones (borrador y publicación).

**[HECHO] Cambio de hoy en worker** (`git diff src/cloudflare/worker.ts`): se añade `publishedRevision(env)` que lee `SELECT source_revision FROM inch_publication` (solo lectura, sin migración de esquema) y se expone `publishedRevision` en las respuestas de `readDraft` y del guardado. No hay migración nueva: `source_revision` ya existe.

---

## 4. Funcionalidades (estado documentado)

1. **[DOC]** Panel privado Carta/Sushi con categorías y estética aprobadas; listados sin miniaturas; editor de nombre, descripción, precio, imagen, visibilidad y alta de platos.
2. **[DOC]** Flujo: **editar → Aplicar al borrador → Guardar (nube) → Publicar carta**. Guardar **no** modifica la carta pública; publicar genera una instantánea HTML separada en D1.
3. **[DOC]** Publicar exige que la copia local coincida con la de la nube y publica solo la revisión guardada.
4. **[DOC]** Recuperación: «Cargar versión guardada» pide confirmación, sustituye la copia local y conserva una copia anterior recuperable («Recuperar copia anterior»). Un borrador local existente **no** se reemplaza automáticamente.
5. **[DOC]** Fotografías optimizadas en navegador (JPG/PNG/WebP hasta 20 MB; lado mayor ≤1600 px; objetivo ≤750 KB en Cloudflare, servidor acepta ≤1 MB y valida cabeceras, rechaza SVG/documentos). Se suben al «Guardar cambios»; rutas inmutables `/media/<sha256>.<ext>`. SHA-256 deduplica; las descartadas **no** se borran solas.
6. **[DOC]** Carta pública servida ya renderizada, con hidratación de filtros e idiomas. Límite propio de la prueba: 100 MB de fotos; instantánea HTML ≤1,8 MB por fila D1.
7. **[DOC]** Cierre de sesión, validación en servidor, origen comprobado para escrituras y mensajes de error sin credenciales.

**[DOC]** Los textos nuevos/editados se mantienen en español hasta disponer de traducciones propias (evita traducciones antiguas engañosas).

---

## 5. Flujo del dueño

- **[DOC]** El dueño entra en `/admin` con la contraseña provisional compartida (sin cuentas individuales todavía). Sin sesión, `/admin` muestra el formulario de acceso; la API privada devuelve 401.
- **[HECHO/verificado hoy]** Ciclo real validado con D1 aislada (`scripts/check-admin-publication.ts`): rechazo sin sesión → login → cargar → guardar plato con foto → guardar **no** altera la carta pública → conflicto 409 con revisión antigua → publicar → recargar con revisión coherente y carta pública cambiada solo con datos de prueba. **Sin escrituras remotas** (Miniflare + D1 efímera, credenciales de prueba en memoria).
- **[DOC]** Distinguir tres almacenamientos: navegador local (borrador), `127.0.0.1:8788` (D1 local) y Cloudflare (D1 remota). No comparten sesión ni datos.

---

## 6. Trabajo de hoy (30/10): móvil, login y toolbar

### 6.1 Editor móvil + login — DESPLEGADO hoy

- **[HECHO]** Problema reportado por el usuario en iPhone: al tocar un plato no aparecía el editor (el formulario se insertaba después del listado, sin primer plano).
- **[HECHO]** Solución local: el editor pasa a `<dialog className="admin-editor">`. **Hasta 1050 px** se abre como modal a pantalla completa (`showModal`, altura `100dvh`, acciones inferiores siempre visibles, scroll interno de campos, fondo bloqueado); en escritorio amplio se conserva el panel lateral no modal (`show()`).
- **[HECHO]** Se guarda el botón de apertura (`editorTriggerRef`) y se separa el ciclo abrir/cerrar del cambio de plato. La revisión independiente encontró un fallo de foco A→B (al cerrar B el foco volvía a A); se corrigió con regresión que ahora pasa (`checkAdminEditorSwitch`, solo >1050 px).
- **[HECHO]** Corrección del login en blanco: una regla previa de diálogo cerrado ocultaba la sección compartida del login. Se limitó a `dialog.admin-editor:not([open]) { display:none }`, sin afectar a la sección `.admin-editor` del login. La regresión `checkAdminLogin` verifica que el formulario de acceso es visible sin atributo `open`.
- **[HECHO/DOC]** Dos entregas sucesivas del 30/10: `design/inch/revision-movil/editor-corregido.md` recoge el editor móvil en `https://0dbfe22e.inch-carta-demo.pages.dev/`; después se reparó el login y `CLOUDFLARE.md` documenta `https://259d0430.inch-carta-demo.pages.dev/`, comprobado en el dominio estable. Es el último despliegue documentado en esta sesión; no se ha consultado otra vez el estado remoto para redactar este resumen.
- **[HECHO/DOC]** Verificación de ese despliegue: nuevos `admin.js`/`admin.css`, rechazo 401 de la API privada sin sesión, formulario sin sesión visible, y carta pública con **SHA-256 idéntico** antes/después (`2839d0f403e4899502d96220f358d4c2e60bf59a358b8204ead129739c84b7df`). Sin migraciones, semillas ni escrituras de contenido en D1.

### 6.2 Toolbar de estados y recuperación — SOLO EN LOCAL, sin desplegar

- **[HECHO]** El usuario vio exceso de botones y aprobó dos acciones principales (**GUARDAR CAMBIOS / PUBLICAR CARTA**), el enlace **VER CARTA PÚBLICA** y la recuperación dentro de `<details>` **cerrado** «Copias y recuperación».
- **[HECHO]** Nuevo módulo `src/lib/admin-panel-state.ts` → `getAdminPanelState(dishes, cloud, {enabled, busy, pending})` con estos estados y etiquetas:
  - `local` → «Solo en este dispositivo»
  - `connecting` → «Conectando…»
  - `offline` → «Sin conexión»
  - `pending` → «Revisar copia»
  - `busy` → «Procesando…»
  - `dirty` → «Cambios sin guardar» (guarda permitido)
  - `published` → «Carta publicada»
  - `saved` → «Guardado, pendiente de publicar»
  - **Solo** marca `published` si los platos son iguales **y** `publishedRevision === revision`. Metadatos de publicación ausentes → nunca afirma «publicado».
- **[HECHO]** `CloudDraft` gana `publishedRevision?: number | null` (`src/lib/cloud-draft.ts`), expuesto con `SELECT source_revision` existente, **sin migración**.
- **[HECHO]** `useCloudDraft.ts`: nuevo `error: boolean` para mostrar el error fuera de `<details>`; validación de `publishedRevision` en respuestas; validación de la respuesta de publicar (`ok===true && sourceRevision===cloud.revision`); la publicación solo marca la revisión coincidente; los fallos conservan el snapshot local.
- **[HECHO]** `AdminPreview.tsx`: toolbar rediseñado (sección + `admin-save-state` con `data-state` + `admin-primary-actions`), `<details class="admin-recovery">` con «Cargar versión guardada» / «Recuperar copia anterior» fuera del flujo diario, banner de error (`role="alert"`) y pie con «Cerrar sesión». `admin.css` añade estilos de estado, banner, recovery, confirmación de carga y layout móvil (acciones a ancho completo en ≤640 px).
- **[HECHO]** El script `check-admin-publication.ts` **también** usa `getAdminPanelState` para asertar los estados (`Carta publicada` → `Cambios sin guardar` → `Guardado, pendiente de publicar` → `Carta publicada`) durante el ciclo real.
- **[HECHO·actualizado]** Este toolbar/estados **ya se desplegó** (`https://8c6fd1e5.inch-carta-demo.pages.dev/`, dominio estable verificado) al cierre del 30/10, tras la autorización explícita del usuario. *Estado anterior:* al redactar el resumen no estaba desplegado — se había pedido autorización y el usuario aún no la había dado (el «te autorizo» previo cerró solo el servidor de QA local).

---

## 7. Desplegado vs local vs GitHub (corroborado con git, solo lectura)

**[HECHO] `git status`, rama `feat/bootstrap`:**

- Working tree **modificado**: `CLOUDFLARE.md`, `src/app/admin/preview/AdminPreview.tsx`, `src/app/admin/preview/admin.css`, `src/app/admin/preview/useCloudDraft.ts`, `src/cloudflare/worker.ts`, `src/lib/cloud-draft.ts`.
- **Sin seguimiento (untracked)**: `design/inch/revision-movil/`, `scripts/check-admin-publication.ts`, `scripts/preview-admin-editor.ts`, `src/lib/admin-panel-state.ts`, `tests/admin-panel-state.test.ts`, `tests/admin-toolbar.test.ts`, `tests/browser/`, `tests/cloud-publication-state.test.ts`.
- Sin cambios preparados (nada en stage).

**[HECHO] `git log` (HEAD):** `20eac42 Save Friday handoff and document verified private backups` → anterior `4652e4e Add editable INCH Cloudflare Pages demo with D1 drafts photos and publishing`.

**[HECHO]** `git` informa: *«Your branch is up to date with 'origin/feat/bootstrap'»* — es decir, HEAD local coincide con la **referencia remota en seguimiento local**. No se consultó la red en esta sesión, por lo que **no se puede afirmar** que el remoto real esté al día sin un `git fetch`/consulta (prohibidos aquí).

Resumen de estado de entrega:

| Frente | Código | Desplegado Cloudflare | Git (commit/push) |
| --- | --- | --- | --- |
| Editor móvil + login (30/10) | [HECHO] local | **[HECHO]** (desplegado 30/10, ver 6.1) | **[HECHO·actualizado]** commit+push |
| Toolbar/estados/`publishedRevision` (30/10) | [HECHO] local | **[HECHO·actualizado]** desplegado (`8c6fd1e5`) | **[HECHO·actualizado]** commit+push |
| Commit de cierre (`20eac42`) | — | etapa previa | [DOC] en la rama |

**[DOC]** El despliegue del editor se hizo con `--commit-dirty=true` (sube cambios locales sin depender de un commit). No hay integración automática GitHub→Cloudflare: **un push no despliega** esta prueba; se despliega con Wrangler.

---

## 8. Pruebas: alcances y límites

**[HECHO] Suite completa (última ejecución real):** `node --import tsx --test tests/*.test.ts` → **36 pruebas, 35 pasan, 1 omitida (integración PostgreSQL preexistente), 0 fallos.**

**[HECHO]** También correctos: `npx tsc --noEmit --incremental false`; ESLint de los archivos tocados; `npm run build:cloudflare`; `git diff --check` (solo avisos CRLF). El aviso de fin de línea es normal en este clon de Windows.

**[HECHO] Integración real local** — `scripts/check-admin-publication.ts`: arranca el **Worker compilado** con **Miniflare + D1 efímera** aislada; credenciales de prueba generadas en memoria; **no** descubre configuración de Wrangler, **no** lee secretos reales y **no** admite URL de destino (no puede apuntarse a la carta del dueño). Comprueba 401/login, subida y lectura de foto byte a byte, guardado que **no** altera el público, estado guardado-pendiente, PUT antiguo → 409, publicar, recarga con revisión coherente y pública cambiada solo con datos de prueba; cierra con `dispose`. **PASÓ.**

**[HECHO] QA de componente real** — `scripts/preview-admin-editor.ts` sirve `AdminPreview`/`LoginForm` reales en `http://127.0.0.1:8791` (solo `127.0.0.1:8791`, sin auth ni D1):
- `checkAdminEditor` pasa en 320×568, 390×844, 844×390, 1024×768 y 1440×900 (apertura inmediata, modal vs panel lateral, acciones visibles, foco inicial en «Cerrar» sin abrir teclado, cancelación que no modifica el borrador, retorno de foco, alta nueva, desbloqueo del fondo).
- `checkAdminEditorSave` pasa en 390×844 (aplica nombre+precio en el `localStorage` del origen de QA y lo restaura).
- `checkAdminEditorSwitch` pasa en 1440×900 (A→B, foco vuelve a B).
- `checkAdminLogin` pasa en 320/390/1440 sin introducir credenciales.
- Toolbar: exactamente 2 botones principales y sin overflow a 390 px. Cobertura SSR en `tests/admin-toolbar.test.ts`.

**Límites explícitos (no confundir con validación total):**

- **[PENDIENTE]** No equivale a Safari/iOS ni a un iPhone físico: no cubre teclado virtual, cámara/galería reales, orientación ni comportamiento de iOS/Android.
- **[PENDIENTE]** No se probó hoy el panel Cloudflare **autenticado** de extremo a extremo contra la D1 remota.
- **[PENDIENTE]** La integración PostgreSQL sigue omitida (trabajo detenido).
- **[DOC]** Durante el QA, un intento de QA con la CLI de Wrangler dio 503 porque tomaba configuración/binding D1 del padre y secretos equivocados: era fallo del **entorno de QA**, no un bug de producción; se sustituyó por Miniflare aislado. Los servidores de QA en el puerto 8792 se cerraron y el puerto quedó sin listener.
- **[DOC]** Las funciones de `tests/browser` rechazan hosts/puertos distintos de `127.0.0.1:8791` y nunca limpian el origen del usuario (solo el origen exclusivo de QA).

---

## 9. Conservación de datos, fotos y copias · restricciones

**Datos del dueño (prioridad máxima):**

- **[DOC]** Los **datos actuales del dueño en D1 prevalecen** sobre el catálogo demo inicial y sobre cualquier nota. No publicar catálogo demo ni ejecutar el script remoto de comprobación sobre la carta del dueño (publica datos de prueba y luego restaura).
- **[DOC]** No importar borradores antiguos de `localhost` automáticamente; pueden tener precios/platos/fotos distintos. No borrar el almacenamiento del navegador.

**Fotos:**

- **[DOC]** BLOB en `inch_images`, deduplicadas por SHA-256. Las imágenes descartadas **no** se borran automáticamente: no eliminar fotos antiguas sin revisar si están publicadas o referenciadas.
- **[DOC]** Límite propio de la prueba: 100 MB de fotos.

**Copias y secretos (rutas privadas documentadas — NO abrir):**

- **[DOC]** Está documentado un respaldo puntual del 29/10 en `backups-private/2026-10-29/`: `inch-d1-cierre.sql` (exportación D1), `restaurantes-cierre.bundle` (copia Git transportable), `configuracion/`, `LEEME.txt` y `MANIFIESTO.json`. La carpeta está excluida de GitHub (`.gitignore`). No se reabrieron ni se revalidaron estas copias al redactar el resumen.
- **[DOC]** La exportación fue validada cargándola en SQLite en memoria (integridad correcta: un borrador, una publicación, una foto). No se configuró **ninguna** automatización: solo existe esta copia puntual.
- **[DOC]** Al repetir una exportación de D1, redirigir el registro a un archivo privado: Wrangler muestra un enlace temporal firmado de descarga. **No pegar ese enlace** en documentación ni respuestas.
- **[DOC]** Secretos: `.dev.vars` (`INCH_CF_PASSWORD_HASH`, `INCH_CF_SESSION_SECRET`), `.cloudflare-build/secrets.json`, `.env.admin.local`, `.env.inch-db.local`, `.netlify/`, `.wrangler/` — todos ignorados por Git. **Nunca** publicar secretos, URLs firmadas de backup ni contraseñas.
- **[DOC]** La autorización de Wrangler se limitó a `account:read`, `user:read`, `pages:write`, `d1:write` y renovación de sesión. Sin permisos R2, sin pagos.

**Restricciones de trabajo (vigentes):**

- **[DOC]** No retomar Netlify ni su integración PostgreSQL sin nueva petición del usuario.
- **[DOC]** No activar R2, planes de pago ni cambiar de plan sin autorización.
- **[DOC]** No restaurar D1 para continuar normalmente: una restauración puede sustituir datos y requiere revisar destino y tener autorización.
- **[DOC]** No crear de nuevo el proyecto Pages con `--force` (ya existe). Pages no admite `account_id` en su configuración.
- **[DOC]** No escribir código Next sin leer las guías de `node_modules/next/dist/docs/` (regla `AGENTS.md`).

---

## 10. Checklist priorizada para la próxima sesión

1. **[HECHO·actualizado]** **Autorización + despliegue del toolbar/estados** completados (solo código, sin sembrar/migrar/restaurar/publicar catálogo). Verificado por HTTP: assets estables = build, API 401 y carta pública con SHA-256 idéntico antes/después. Queda **[PENDIENTE]** la prueba del usuario en iPhone físico.
2. **[PENDIENTE]** Completar la prueba física en iPhone de editar/cancelar, teclado, fotografía y recuperación. La apertura visible del editor ya fue confirmada por el usuario; no pedir repetirla como si siguiera sin corregirse.
3. **[HECHO·actualizado]** Commit y push de los cambios de hoy (código + pruebas + docs) en `feat/bootstrap`.
4. **[PENDIENTE]** Validar con el dueño catálogo/categorías vacías/nombres/precios/imágenes/disponibilidad/**alérgenos**. Los platos iniciales son una selección de prueba.
5. **[PENDIENTE]** Traducir los platos nuevos o modificados al inglés/alemán.
6. **[PENDIENTE]** Decidir si trasladar/exportar el borrador antiguo de `localhost` (importación/exportación explícita, revisar diferencias antes de sustituir; nunca automático).
7. **[PENDIENTE]** Credenciales de entrega, posibles cuentas individuales y recuperación de acceso. **No cambiar contraseñas** por cuenta propia.
8. **[PENDIENTE]** Copias periódicas de D1 + probar una restauración segura (hoy solo existe una copia puntual, sin automatización).
9. **[PENDIENTE]** Limpieza de imágenes huérfanas contrastando borrador y publicación (las descartadas no se borran solas).
10. **[PENDIENTE]** Revisar cuotas reales de Pages/Workers/D1 y el límite propio de 100 MB (no son capacidad ilimitada).
11. **[PENDIENTE]** Decidir si conectar GitHub a despliegues automáticos (hoy un push no publica Cloudflare).
12. **[PENDIENTE]** Antes de la entrega definitiva: validar contenido/acceso y decidir cuándo retirar `noindex`.

**Sugerencias no bloqueantes de la revisión independiente final** (`deleg_5f38b392`; revisión **estática**, sin runtime claims; `passed: true`, `security_concerns: []`, `logic_errors: []`). No convertirlas en fallos activos:

- La comparación de igualdad por `JSON.stringify` depende del orden de claves.
- La rama legacy con `imageStorage === false` y datos con fotos podría quedar `dirty` (no alcanzable con el worker actual, que fuerza `imageStorage: true`).
- `role="status"` (live-region) duplicado.
- Banner de error junto al último snapshot podría confundir.
- `canPublish` con `busy` es redundante (el helper ya desactiva).

---

## 11. Comandos de comprobación seguros y secuencia inicial

Estos comandos consultan Git, ejecutan comprobaciones o generan archivos locales; ninguno despliega ni escribe en D1 remota. La integración Miniflare crea su propia D1 temporal. Ejecutar desde la raíz del proyecto. No aplicar migraciones ni semillas a la D1 local habitual como paso rutinario para retomar.

```bash
# 1) Estado sin modificar nada
git status --short
git log --oneline -5

# 2) Comprobaciones estáticas
npx tsc --noEmit --incremental false
npx eslint src/app/admin/preview/AdminPreview.tsx src/app/admin/preview/useCloudDraft.ts src/lib/admin-panel-state.ts src/lib/cloud-draft.ts src/cloudflare/worker.ts tests/admin-toolbar.test.ts tests/admin-panel-state.test.ts tests/cloud-publication-state.test.ts scripts/check-admin-publication.ts

# 3) Suite completa (esperado: 36 pruebas, 35 pasan, 1 omitida PostgreSQL, 0 fallos)
node --import tsx --test tests/*.test.ts

# 4) Integración real local aislada (Miniflare + D1 efímera; compila el worker antes)
npm run build:cloudflare
npx tsx scripts/check-admin-publication.ts

# 5) QA de componente real (sin auth ni D1) → http://127.0.0.1:8791
npx tsx scripts/preview-admin-editor.ts
#   en consola del navegador de pruebas:
#   await window.checkAdminEditor()        (320/390/844/1024/1440)
#   await window.checkAdminEditorSave()    (390)
#   await window.checkAdminEditorSwitch()  (solo >1050)
#   abrir http://127.0.0.1:8791/?login=1 y await window.checkAdminLogin()

# 6) Entorno Cloudflare LOCAL ya preparado (sin inicializar ni sustituir datos)
npm run dev:cloudflare        # http://127.0.0.1:8788/admin
```

Notas de seguridad:

- Para comprobaciones posteriores usar una **D1 local limpia**; **no** ejecutar el script remoto de comprobación sobre la carta del dueño.
- El despliegue (`npm run deploy:cloudflare` / `wrangler pages deploy … --commit-dirty=true`) **no** se ejecuta en la comprobación; requiere autorización del usuario y aplica antes migraciones si cambia el esquema.
- La semilla usa `INSERT OR IGNORE`: no es un método de restauración.
- El servidor de componente requiere su CSS de QA generado en `.cloudflare-build/admin-editor-qa/app.css`; en esta sesión se copió desde `dist-cloudflare/admin.css`. El script de preview actual no genera ese CSS por sí solo: comprobarlo si se prepara un entorno nuevo, sin confundir una hoja de estilos ausente con un fallo del componente.

Secuencia inicial para retomar (sin tocar nada remoto): `git status --short` → leer `CLOUDFLARE.md` → ejecutar estáticas + suite → (si se quiere ver el panel) arrancar `dev:cloudflare` local. Reutilizar un servidor ya correcto si sigue activo.

---

## 12. Bloque listo para pegar en otra sesión

```
Contexto INCH/Restaurantes (carta digital del restaurante INCH).
Proyecto en C:/Users/Usuario/Desktop/Restaurantes · GitHub jonycusac-bot/restaurantes · rama feat/bootstrap.
Prueba vigente: Cloudflare Pages clásico + D1, sin R2 ni pagos. Carta: https://inch-carta-demo.pages.dev/ · panel /admin.
Lee primero CLOUDFLARE.md y, para este cierre, CONTINUIDAD-2026-10-30.md.
Estado al cierre (30/10/2026): editor móvil (diálogo modal ≤1050px) y login corregidos y DESPLEGADOS; toolbar nuevo
(GUARDAR CAMBIOS / PUBLICAR CARTA, VER CARTA PÚBLICA, «Copias y recuperación» plegable, estados local|connecting|
offline|pending|busy|dirty|published|saved, publishedRevision vía SELECT source_revision existente) DESPLEGADO
en https://8c6fd1e5.inch-carta-demo.pages.dev/ (estable https://inch-carta-demo.pages.dev/) y CON commit+push en feat/bootstrap.
Consultar git status para el inventario actualizado, incluido este documento.
Pendiente prioritario: probar el toolbar y el editor en el iPhone físico del usuario (teclado, cámara, recuperación).
(Estado anterior a este cierre: el toolbar estaba solo en local, sin desplegar y sin commit/push.)
No retomar Netlify ni PostgreSQL (detenidos). No ejecutar el script remoto de comprobación sobre la carta del dueño.
No publicar secretos, URL firmadas de backup ni contraseñas. Los datos del dueño en D1 prevalecen sobre las notas.
No importar borradores antiguos de localhost automáticamente.
Pruebas reales: suite 36 (35 pasan, 1 omitida PostgreSQL, 0 fallos); integración Miniflare+D1 efímera PASÓ;
QA de componente en 127.0.0.1:8791 PASÓ. No equivale a Safari físico.
Para continuar: «Lee CLOUDFLARE.md y CONTINUIDAD-2026-10-30.md y seguimos con INCH».
```

---

## 13. Contradicciones y avisos detectados (con evidencia)

1. **IDs de despliegues de etapas diferentes.** `editor-corregido.md` recoge `0dbfe22e…` para el editor móvil; `CLOUDFLARE.md`, sección «Publicación comprobada», recoge `259d0430…` e incluye además la reparación posterior del login. El historial de esta sesión confirma esa secuencia; no son dos identificadores del mismo despliegue. Al publicar de nuevo, comprobar el dominio estable y registrar la nueva URL real.
2. **Recuentos de pruebas con fecha y alcance diferentes.** `CLOUDFLARE.md` recoge trece pruebas del área INCH/auth/draft en una etapa anterior; la última ejecución de la suite completa dio **36 pruebas (35 pasan, 1 omitida)**, incluidas las nuevas suites (`admin-panel-state`, `admin-toolbar`, `cloud-publication-state`). No presentar trece como el total actual ni confundir suites de distinto alcance.
3. **Enlaces de "estado vigente" en los documentos de handoff.** `CLOUDFLARE.md` abre remitiendo a `VIERNES-2026-10-30.md`, y `VIERNES-2026-10-30.md` cita el despliegue previo `32ec3957…` (anterior al fix móvil). El traspaso vigente del 30/10 es este documento + `CLOUDFLARE.md`; `VIERNES-2026-10-30.md` es el cierre del 29/10.
4. **`RETOMAR-MANANA.md` e `INCH.md`** siguen describiendo Netlify como contexto principal y `INCH.md` ya incluye una sección Cloudflare que lo sustituye. No es un conflicto de datos, sino de vigencia: priorizar `CLOUDFLARE.md` + este documento.
5. **Estado remoto.** Al redactar el resumen, `git` solo comparaba con la referencia remota local. *(actualizado)* Después se consultó el remoto real con `git ls-remote`/`git fetch`: antes del cierre, HEAD local y `origin/feat/bootstrap` coincidían en `20eac42` sin divergencia; tras el commit+push de hoy se verificó de nuevo que la rama local y `origin/feat/bootstrap` quedan en el mismo SHA (ver `.cloudflare-build/release-result.json`).

---

*Este documento se redactó el 30/10/2026 y se **actualizó al cierre del mismo día** tras autorizar y completar el despliegue del toolbar y el commit/push (ver la nota de la cabecera). No declara el proyecto terminado: quedan la validación en iPhone físico y el resto de pendientes de la sección 10.*

*Estado anterior del 30/10, conservado como histórico: «toolbar solo en local / sin desplegar / cambios sin commit ni push».*
