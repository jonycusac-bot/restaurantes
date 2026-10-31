# INCH · Continuidad del 31/10/2026

> **Estado actualizado:** leer primero `CONTINUIDAD-ACTUAL-2026-10-31.md`. Las secciones históricas de este documento pueden describir un entorno anterior al despliegue y al commit/push.

## Corrección de fotos publicada y confirmada en iPhone

El usuario informó desde Safari/iPhone de `No se pudo reducir esta imagen al tamaño permitido` al seleccionar una foto antigua de su teléfono; la foto de Pollo con Sésamo no quedó asociada, aunque el precio sí llegó a publicarse. En `src/lib/prepare-dish-image.ts` se añadió JPEG alternativo cuando la petición WebP devuelve PNG y reducción progresiva de dimensiones si el tamaño continúa excedido. `tests/prepare-dish-image.test.ts` falló con el mensaje original antes del cambio y pasó después; suite: 90 correctas, una omitida, TypeScript/ESLint/build correctos. En QA aislada se seleccionó una imagen sintética grande con WebP→PNG simulado, se obtuvo JPEG de menos de 750 KB y Guardar la publicó con foto servida por `/media/` en D1 temporal. Esa QA se detuvo para no dejar la foto de prueba. El subagente revisó y planteó asuntos adicionales (HEIC/MIME de origen, memoria, transparencia), no demostrados como causa de este error concreto; el servidor valida los bytes subidos y el resultado de la prueba cumplió el límite.

Con permiso explícito se desplegó **solo código** en `https://aa9b0e1f.inch-carta-demo.pages.dev/`. Se comprobó el dominio estable: `admin.js` coincide byte a byte con el build, carta pública y catálogo idénticos antes/después, API privada sin sesión 401, y D1 conservó revisiones 18/15 y 2 imágenes en ese momento. **El usuario confirmó después que la foto sube desde su iPhone y se ve en la web.** La latencia de actualización del precio observada en su PC no se reprodujo: la carta real se sirve con `Cache-Control: no-store` y las comprobaciones HTTP leyeron la versión publicada en menos de medio segundo.

## Lanzamiento comprobado el 31/10/2026

Con autorización del usuario se publicó el código de **Guardar directo** y la CARTA original con precios confirmados. Despliegue Pages: `https://8e97ccb3.inch-carta-demo.pages.dev/`; dominio estable: `https://inch-carta-demo.pages.dev/` y administración en `/admin`. No se ejecutaron migraciones ni semillas. La D1 remota se respaldó en `backups-private/2026-10-31-release-live/` (antes, preflight y después); no añadir esa carpeta a Git. Se verificó que el preflight coincidía exactamente con el respaldo antes de modificar D1. Se ensayó la publicación en Miniflare y también con `wrangler d1 execute --local --file`, incluido el trigger temporal.

La escritura remota terminó y se leyó de vuelta: borrador y HTML coinciden exactamente con los artefactos aprobados; revisión del borrador 13, publicación 10 con origen 13; las imágenes de D1 no cambiaron, quedaron las cinco fotos y las siete opciones de Sushi, y el trigger temporal se eliminó. El dominio estable devuelve el catálogo aprobado, el panel de acceso carga, y la API privada sin sesión responde 401. En navegador se comprobó Tallarines/Pad Thai y sus seis precios a 390 px sin desbordamiento. Pasaron 88 pruebas, una omitida, TypeScript, ESLint acotado, build y prueba de Worker/D1 aislada; la QA anterior en el puerto 8794 no estaba activa. La revisión independiente del subagente sí se ejecutó esta vez; señaló dudas sobre CSRF y el parser de SQL: la segunda se comprobó con Wrangler local y la primera queda para endurecimiento futuro (cookie SameSite Strict, sesión y comprobación de origen siguen activos). **No se ha probado Guardar en un iPhone físico ni se ha hecho commit/push**; el despliegue se realizó desde el árbol local con `--commit-dirty=true`.

## Estado anterior al lanzamiento: CARTA original aplicada solo en local (histórico)

El usuario ha aplazado las fotos nuevas y ha autorizado actualizar CARTA para pruebas locales conservando las existentes. Ya están integrados y contrastados los **71 importes del listado original (incluidos 3 suplementos)**, las variantes agrupadas, raciones y notas comunes. Las cinco fotografías existentes y Sushi se conservan. Gestión y clientes comparten datos/orden; se mantiene Guardar directo por variante. El cambio del catálogo no se ha aplicado a D1 remota.

Prueba activa: clientes `http://127.0.0.1:8794/`, gestión `http://127.0.0.1:8794/admin`. La raíz ya no abre el editor, sino la carta pública, y Ver carta pública apunta al mismo entorno. Servidor `npx tsx scripts/preview-live-admin.ts --preserve-local`, con D1 **temporal**, solo loopback. No prometer persistencia al detener/reiniciar este proceso. Hay respaldo privado del QA anterior y del catálogo antes de las pruebas. Se retiraron todos los precios artificiales después de verificar el guardado.

Últimas comprobaciones: **86 pruebas, 85 correctas, 1 omitida**, TypeScript, ESLint, integración Worker/D1 y build Cloudflare correctos. Navegador: ocho categorías y precios completos; anchos 320/390/1262/1440, búsqueda e idiomas; editor en escritorio y móvil/landscape; guardado entre clientes, variantes independientes, conflicto del mismo precio y recuperación tras recarga. Sin despliegue, commit ni push. iPhone físico y revisión independiente final siguen pendientes.

Detalles, archivos, respaldo y límites: **`design/inch/revision-movil/carta-original-local.md`**. Referencia de precios: `design/inch/carta-original-precios-2026-10-31.md`; datos estructurados con líneas de procedencia: `src/lib/carta-original.ts`.

> Revisión anterior del orden (histórica; el QA ya se recompiló en la actualización de arriba): gestión y clientes deben respetar el mismo orden guardado. Se corrigió la prioridad de platos con foto que adelantaba Tempura a Poh Pia y se cubrió la presentación de instantáneas antiguas sin publicar borradores ni escribir D1. Aquella suite tenía 80 pruebas; la vigente figura arriba. Detalles: `design/inch/revision-movil/orden-carta.md`.

## Decisión vigente del usuario

Sustituir el flujo antiguo de guardar borradores y publicar por **abrir plato → cambiar → Guardar**, con publicación inmediata del cambio. Teléfono y PC deben compartir una carta central. Combinar automáticamente cambios independientes; preguntar únicamente por el mismo dato modificado de forma incompatible. No volver a presentar decisiones sobre copias completas como parte del uso diario.

Esta decisión posterior sustituye las instrucciones históricas de separar Guardar/Publicar en `CONTINUIDAD-2026-10-30.md` y `CLOUDFLARE.md`. Conservar esos documentos como historia, no como especificación actual del nuevo panel.

## Estado comprobado hoy

Proyecto: `C:/Users/Usuario/Desktop/Restaurantes`; rama `feat/bootstrap`; HEAD local `87383979d0a5dff51dc9e84a3f5095c7669efffa` (corrección anterior del conflicto con copias). El último despliegue documentado es `https://dd290f1b.inch-carta-demo.pages.dev/`. No se ha vuelto a consultar el despliegue remoto para elaborar esta nota.

**El nuevo modo directo sigue en local, sin commit, push ni despliegue.** Hay cambios y archivos nuevos en el árbol de trabajo. No se perdieron con la interrupción anterior. La petición de guardar avances anterior no llegó a completarse; esta nota deja ahora el estado y los pendientes por escrito.

### Implementado en local

- `LiveAdminPreview.tsx`: panel central y un Guardar dentro del editor, sin botón Publicar ni reemplazo de menús completos en el flujo normal.
- `useLiveMenu.ts`: GET de la carta central, PATCH únicamente con campos modificados, actualización periódica/foco, protección frente a respuestas antiguas y doble pulsación, subida de foto y elección del campo conflictivo.
- `src/lib/live-menu.ts`: contrato, validación y combinación por campo; imagen y nombre de archivo tratados como un par.
- `src/cloudflare/worker.ts`: GET/PATCH `/api/admin/menu`; guardado del contenido y publicación correspondiente en una transacción D1 con control interno de concurrencia. No requiere migración de esquema.
- Las escrituras antiguas PUT `/api/admin/draft` y POST `/api/admin/publish` devuelven 426 para pedir actualizar las pestañas antiguas, sin modificar datos. Su lectura anterior permanece disponible.
- `live-edit-storage.ts`: formularios conservados por separado, sin sobrescribir ni borrar la copia antigua del navegador; recuperación secundaria de ediciones sin terminar y copias anteriores. No se importan ni publican automáticamente.
- `AdminPreview.tsx`: Cloudflare usa el panel nuevo; la vista local histórica y sus pruebas se conservan como `LegacyAdminPreview`.
- Nuevas pruebas unitarias, script API/D1 y fixture de navegador con servidor real aislado.

### Verificaciones reales del 31/10

Ejecutadas desde la raíz del proyecto:

- `node --import tsx --test tests/*.test.ts`: **76 pruebas, 75 correctas, 0 fallos, 1 omitida** (integración PostgreSQL anterior).
- `npx tsc --noEmit --incremental false`: correcto.
- ESLint de los archivos nuevos/modificados principales, tests y scripts: correcto.
- `npx tsx scripts/check-live-menu.ts`: correcto, Worker real compilado y D1 efímera. Probados cambios simultáneos en distintos platos y distintos campos, conflicto solo del mismo dato, resolución, publicación con el guardado, fotos, alta idempotente, validación, autenticación/origen, bloqueo de protocolos antiguos y rollback real mediante fallo inducido en la publicación.

Estas pruebas no modificaron D1 remota ni el catálogo del dueño. No equivalen a probar la interfaz nueva en navegador ni en un iPhone físico.

## Pendientes por orden

1. **COMPROBADO en QA local:** `window.checkLiveCentral()` pasó con UI montada, HTTP y Worker/D1 real temporal: conserva cambios independientes, pregunta solo por el mismo dato y Guardar publica. Añadida comprobación de dos variantes distintas de Pad Thai. No equivale a iPhone físico.
2. **COMPROBADO:** `window.prepareLiveReload()`, recarga y `window.checkLiveResume()` conservan la edición y recuperarla no publica automáticamente. Se canceló la edición de prueba y se restauraron los precios originales solo en QA.
3. **Revisión parcial del editor nuevo:** cancelación y límites móvil/escritorio ya comprobados con una variante de nombre largo; guardado, conflictos y recuperación montados también pasan. Se conservaron y verificaron las cinco fotos existentes. Sigue pendiente ampliar la prueba de UI a carga nueva de foto, alta, ocultación y errores de red, y cámara/galería/teclado en iPhone físico; las pruebas API/unitarias no sustituyen esas interacciones.
4. **Completar la revisión independiente** del nuevo flujo y corregir lo que se detecte. Los subagentes de implementación se interrumpieron por el proveedor; el agente principal terminó el código y las comprobaciones registradas, pero falta una revisión independiente de esta versión.
5. **Actualizar herramientas/documentación antiguas.** `scripts/check-admin-publication.ts` conserva el flujo retirado PUT+borrador/POST+publicar: el intento de sustituirlo fue rechazado por la protección de escritura, por lo que aún no se adaptó. Usar `scripts/check-live-menu.ts` para las pruebas vigentes. Revisar README de QA y notas de despliegue antes de entregar.
6. **Build Cloudflare COMPROBADO con el catálogo local actual** mediante `npm run build:cloudflare`, junto con la suite completa y TypeScript/ESLint. Repetir tras correcciones adicionales y antes de cualquier futura entrega; no se ha desplegado este build ni aplicado su semilla.
7. **Desplegar solo el código**, sin semillas, migraciones ni restauraciones. Capturar HTML público antes y después: desplegar no debe publicar automáticamente los borradores existentes. Los futuros Guardar explícitos sí publican según la nueva decisión.
8. **Verificar dominio estable:** assets del build nuevo, login, API sin sesión 401 y contenido público intacto durante el despliegue. No ejecutar pruebas de escritura sobre los datos del dueño.
9. **Commit/push y continuidad actualizada**, comprobar SHA remoto igual al local y árbol limpio. No usar force/reset/stash para resolver divergencias.
10. **Prueba real del usuario con iPhone y PC.** Confirmar un Guardar, precio visible en carta, fotos y cambio de dispositivo sin decisiones técnicas habituales.

## Pendientes de producto posteriores

Validar catálogo/precios/fotos/disponibilidad/alérgenos con el dueño; traducciones nuevas en inglés/alemán; credenciales y recuperación de acceso; copias periódicas D1 y restauración segura; limpieza de imágenes huérfanas y vigilancia de cuotas. No activar pagos/R2 ni retomar Netlify/PostgreSQL sin petición.

## Precauciones

- Los datos actuales del dueño prevalecen sobre el catálogo de prueba y los documentos.
- No borrar caché, localStorage, borradores antiguos ni fotos para resolver sincronización.
- No ejecutar `scripts/check-cloudflare.ts` remoto sobre la carta real: puede publicar datos de prueba.
- No leer ni publicar secretos, contraseñas, tokens o enlaces firmados de backups.
- No afirmar que la versión nueva está desplegada o guardada en Git: todavía no lo está.

## Para retomar

«Lee CONTINUIDAD-2026-10-31.md y seguimos con el panel de Guardar directo. Empieza probando la interfaz contra el Worker/D1 aislados; no vuelvas al flujo de copias completas ni publiques datos de prueba en producción».
