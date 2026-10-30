# INCH · Editor móvil visible al seleccionar un plato

## Cambio local

El problema comunicado por el usuario en el iPhone es coherente con la implementación anterior: el formulario se insertaba después del listado, sin moverlo al primer plano.

Ahora el editor usa un diálogo nativo. Hasta 1050 px se abre como modal a pantalla completa, con nombre del plato, cierre superior y acciones inferiores visibles. Los campos se desplazan dentro del editor; el fondo queda bloqueado. En escritorio amplio se conserva el panel lateral no modal. Se mantiene el mismo flujo de aplicar al borrador, guardar en nube y publicar.

No se cambia el contenido de los platos, la preparación de fotografías ni el diseño de la carta pública. Los mensajes de validación/preparación también se muestran dentro del editor para que no queden detrás del modal.

## Verificación realizada

- La prueba de navegador falló antes del cambio: el editor era una sección y no un diálogo visible.
- Tras el cambio, pasan las comprobaciones en 320×568, 390×844, 844×390, 1024×768 y 1440×900.
- Comprobados apertura inmediata, alta nueva, acciones visibles, foco inicial en Cerrar, cancelación sin modificar el borrador, restauración del foco y desbloqueo del fondo.
- Comprobado Aplicar con nombre y precio en el almacenamiento del origen local exclusivo de QA, restaurado después de la prueba.
- Cambiar entre móvil y escritorio conserva los valores sin aplicar. Escape cierra correctamente.
- La revisión independiente encontró un fallo de foco al abrir A, seleccionar B y cerrar B en escritorio. Se reprodujo con una prueba que falló; la corrección separa el ciclo abierto/cerrado del cambio de plato y captura el botón de apertura explícitamente. La regresión ahora pasa y devuelve el foco al segundo plato.
- Suites INCH/auth/draft: 12 pruebas pasan, 1 integración PostgreSQL omitida, 0 fallos.
- TypeScript, ESLint y build Cloudflare correctos.

La prueba del componente se ejecuta sin autenticación ni D1 en `http://127.0.0.1:8791`. No es una prueba en Safari de un iPhone real. No se guardó ni publicó nada en la base remota del dueño.

Captura: `screenshots/editor-movil-corregido.png`.
Reproducción: `tests/browser/README.md` y `npx tsx scripts/preview-admin-editor.ts`.

## Estado de entrega

Revisión independiente final aprobada, sin problemas de seguridad ni lógica detectados. Desplegado en Cloudflare el 30/10/2026: `https://0dbfe22e.inch-carta-demo.pages.dev/`, con el panel disponible en el dominio estable `https://inch-carta-demo.pages.dev/admin`. Se verificaron las nuevas versiones de admin.js y admin.css y el rechazo 401 de la API privada sin sesión. El HTML de la carta pública tiene exactamente el mismo SHA-256 antes y después del despliegue: `2839d0f403e4899502d96220f358d4c2e60bf59a358b8204ead129739c84b7df`. No se ejecutaron migraciones, semillas ni escrituras de contenido en D1. Pendiente validación del usuario en su iPhone físico. Los cambios siguen locales en Git: sin commit ni push de esta corrección; el despliegue se realizó con `--commit-dirty=true`.
