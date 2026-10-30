# INCH · Corrección del bloqueo al guardar por conflicto de revisiones

Fecha: 30/10/2026. Estado de esta corrección: **revisada y desplegada** en `https://dd290f1b.inch-carta-demo.pages.dev/`, disponible en el dominio estable. Sustituye el código del despliegue previo `8c6fd1e5`, sin publicar ni sustituir contenido del dueño.

## Problema y causa reproducida

La captura del usuario muestra cambios del plato aplicados, el estado «Cambios sin guardar» y el error de revisión de la nube. El navegador conserva la revisión asociada a su borrador; un GET puede conocer una revisión posterior sin que el usuario haya adoptado su contenido. Antes, un PUT con la revisión anterior recibía 409 y solo mostraba un mensaje, sin un flujo visible para guardar la copia revisada. Recuperar la copia anterior podía volver al mismo conflicto.

No se conocen las revisiones ni los contenidos actuales del teléfono: no se accedió a su sesión ni a sus datos privados. El 409 no se elimina y no se atribuye automáticamente el problema al despliegue.

## Corrección local

- El primer guardado mantiene la revisión real del borrador del navegador; nunca la cambia silenciosamente por la de un GET nuevo. Si no hay una revisión válida, exige revisión antes de escribir.
- Ante un 409 se consulta la copia reciente con GET y se muestran diferencias de platos, campos y fotos, sin reemplazar el borrador local.
- Acciones explícitas: cancelar y conservar las copias; usar la nube con confirmación y respaldo del borrador; guardar la copia local con confirmación de que sustituirá el borrador completo de la nube, sin publicarlo. No es una fusión automática: hay que revisar también los platos que aparecen solo en la nube.
- Antes del guardado revisado se guarda un respaldo local de ambas copias, incluidas fotos y revisiones. Si falla el respaldo, no se hace el PUT.
- Si cambia la nube durante la revisión, el servidor vuelve a rechazar el guardado y exige otra revisión. Si cambia el borrador en otra pestaña durante la consulta o después de mostrarlo, se presenta la copia actual y no se sustituye sin revisión.
- «Copias y recuperación» permite recuperar la copia local del conflicto y cargar la copia anterior de la nube mediante confirmación. La recuperación de una copia sin revisión no hereda una revisión posterior.
- Guardar y publicar quedan bloqueados mientras hay un conflicto abierto. Se mantienen los dos botones principales y el editor móvil/login existentes.

Claves locales: `inch-admin-conflict-backup-v1` contiene las dos copias del último guardado revisado; `inch-admin-before-cloud-load-v1` conserva la copia anterior a una carga. Son copias de este navegador, no copias remotas periódicas. No borrar el almacenamiento para resolver el problema.

## Verificaciones efectivamente ejecutadas

- Regresiones RED→GREEN del primer PUT con revisión antigua, revisión ausente, cambio local durante GET, cambio local antes de adoptar nube y recuperación de copia sin revisión.
- Suite completa: **53 pruebas, 52 correctas, 1 omitida de PostgreSQL preexistente, 0 fallos**.
- TypeScript, ESLint de archivos tocados, build Cloudflare y `git diff --check` correctos; solo avisos Git de fin de línea CRLF.
- Worker compilado + Miniflare/D1 efímera: 409, relectura, guardado explícito de la copia elegida y revisión posterior; el HTML público no cambia al resolver. Fotos y publicación separada comprobadas. Sin escrituras remotas.
- Componente y hook reales en navegador aislado `127.0.0.1:8791/?conflict=1`: comparación, cancelación, confirmación, segunda revisión por carrera, respaldo de ambas copias y cero publicaciones. Pasa a 320×568, 390×844 y 1440×900. **La frontera HTTP de esta fixture es simulada**: no equivale a navegador→D1 real ni a probar la sesión del dueño.
- Regresiones del editor a 390×844 y 1440×900, retorno de foco A→B en escritorio y login a 390×844 correctos.

## Pendientes y límites

El subagente de implementación se interrumpió; el agente principal completó la corrección y las comprobaciones anteriores. Una nueva revisión independiente acotada (`deleg_f9f9b00b`) terminó con `passed: true`, sin errores de lógica ni problemas de seguridad detectados en su alcance estático. El despliegue correctivo se realizó en el contexto de la entrega solicitada por el usuario; no se ejecutaron migraciones, semillas, restauraciones ni pruebas de publicación sobre la D1 del dueño.

Verificación posterior real en el dominio estable: `admin.js` y `admin.css` coinciden por SHA-256 con el build corregido, el HTML público coincide exactamente con el baseline previo, `/admin` muestra el acceso y la API privada devuelve 401 sin sesión. No se ejercitó la resolución sobre el borrador real del usuario. Falta su comprobación en el iPhone. El estado Git de la entrega se confirma con el commit/push y la lectura del remoto al final del proceso; el SHA no se fija dentro del documento que viaja en ese mismo commit.

Fuentes: `src/app/admin/preview/useCloudDraft.ts`, `AdminPreview.tsx`, `admin.css`, `src/lib/cloud-conflict.ts`, `src/lib/admin-panel-state.ts`, `tests/cloud-conflict*.test.ts`, `tests/browser/admin-conflict.tsx`, `scripts/check-admin-publication.ts` y resultados de herramientas de esta sesión.
