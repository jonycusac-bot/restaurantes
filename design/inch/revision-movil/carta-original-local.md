# INCH · CARTA original aplicada y probada en local

## Alcance autorizado

El usuario ha aplazado las fotografías nuevas, ha pedido conservar las existentes y actualizar precios y cambios de CARTA únicamente para probar en local. No se ha desplegado, hecho commit/push ni ejecutado ninguna escritura en Cloudflare/D1 remota.

Referencia: `design/inch/carta-original-precios-2026-10-31.md`, transcripción contrastada con el archivo aportado por el usuario.

## Resultado

- Ocho categorías de CARTA en el orden original: Entrantes, Ensaladas, Sopas, Salteados, Curry, Arroces, Tallarines y Menú infantil.
- **71 importes originales**, incluidos **3 suplementos**, contrastados uno a uno mediante categoría, línea de la fuente, cantidad y condición de suplemento. Con los siete platos previos de Sushi hay 78 opciones persistidas en el entorno de prueba.
- Gyozas, sopas, curry, arroz y tallarines se presentan por preparación, con descripción común y variantes/precios visibles; sin selectores de pedido ni pestañas por proteína.
- Las raciones se muestran junto al nombre. Se mantienen las notas de verduras/huevo, el arroz al vapor servido con curry y los suplementos correctos.
- Massaman de ternera actualizado a 15,60 €, no al precio anterior de muestra 15,65 €.
- Noodles se muestra como Tallarines en español.
- Las cinco fotos anteriores siguen asignadas al mismo plato/variante y sus archivos se sirven correctamente. No se incorporó ninguna candidata de la búsqueda web.
- Sushi se conserva exactamente como estaba en la prueba local previa; no se amplió su catálogo ni se actualizaron sus precios.
- Gestión y clientes comparten datos y orden. Cada variante conserva su edición independiente y el flujo abrir → cambiar → Guardar.
- Se completaron traducciones de los textos nuevos a inglés y alemán sin inventar descripciones donde el original no aporta ninguna. La variante de la foto también se traduce.

## Diseño y almacenamiento

`src/lib/carta-original.ts` es la referencia estructurada, con `sourceLine` en cada importe e IDs semánticos. `carta-menu.ts` genera las opciones planas, conservando los IDs antiguos de platos que ya existían para no reasignar fotos/ediciones por un cambio de posición.

Los grupos son metadatos de presentación. No se amplió el contrato de AdminDish ni se introdujo una migración D1. `menu-presentation.ts` agrupa únicamente variantes contiguas, conserva el orden y no oculta nombres/descripciones editados. Las imágenes siguen en sus registros originales.

`local-carta-preview.ts` se usa exclusivamente al preparar QA local: aplica la referencia a CARTA, conserva fotos/visibilidad, mantiene Sushi y retiene entradas locales adicionales. No es una importación automática del catálogo del dueño.

## Prueba local disponible

- Clientes: `http://127.0.0.1:8794/`
- Gestión: `http://127.0.0.1:8794/admin`
- Alias de lectura pública para pruebas: `/qa/public`.
- Comando: `npx tsx scripts/preview-live-admin.ts --preserve-local`.

El servidor QA usa Worker compilado y **D1 temporal** con proxy de autenticación exclusivamente loopback. No usa las credenciales reales. La raíz ahora muestra la carta y el enlace Ver carta pública del panel funciona contra la misma base. Sirve los assets de ambas vistas, las fotos WebP y la cabecera PNG.

**Importante:** los Guardar de esta prueba se conservan mientras está activo este proceso. No es almacenamiento definitivo: al detener/reiniciar QA se reconstruye su base; el comando anterior prepara de nuevo la carta original usando el respaldo local. No usar este entorno para cambios definitivos del dueño ni abrirlo a la red cambiando el host a 0.0.0.0.

## Resguardos locales privados

Archivos bajo `.cloudflare-build/live-menu-qa/`, ignorados por Git:

- `before-carta-original.json`: estado anterior del QA (25 platos), HTML publicado y fotos de medios si existían; las cinco fotos observadas eran estáticas.
- `carta-original-before-browser-tests.json`: catálogo completo antes de las pruebas de escritura.

Se retiraron mediante PATCH las modificaciones artificiales de las pruebas, comprobando que solo se restauraban los valores reconocidos de esas pruebas. Una lectura posterior verificó los 78 registros originales, las fotos intactas y los mismos datos en carta y gestión. No se restauró ninguna copia sobre producción.

## Verificación real

- Suite completa: **86 pruebas, 85 correctas, 0 fallos y 1 omitida** (PostgreSQL antiguo).
- TypeScript y ESLint de archivos afectados: correctos.
- `scripts/check-live-menu.ts`: integración Worker/D1 temporal correcta; concurrencia, publicación atómica, fotos, autenticación/origen, validación y rollback.
- `scripts/check-local-carta.ts`: comprobados los 71 importes, nombres/descripciones, cinco fotos accesibles, Sushi intacto, assets y equivalencia de datos entre carta y gestión.
- Navegador: las ocho categorías y sus 71 precios visibles coinciden con la API, sin reordenaciones ni desbordamiento en anchos 1262, 390, 320 y 1440.
- Navegador: búsqueda de langostinos, cambio inglés/alemán y etiqueta traducida de la fotografía; corregido y repetido el caso que dejaba Langostinos sin traducir.
- UI montada → HTTP → Worker/D1: dos clientes conservan cambios de platos y campos independientes; conflicto únicamente por el mismo precio, elección y Guardar directo. Se conserva la copia antigua del navegador.
- Recuperación de edición tras recarga correcta y sin publicación automática.
- Edición de Pad Thai Pollo mientras otro cliente cambia Langostinos: se conservan ambos precios sin conflicto. Todos los precios temporales se retiraron al finalizar.
- Editor de nombre largo comprobado en 1440×900, 844×390, 390×844 y 320×568: panel lateral/modal según tamaño, dentro de pantalla, precio conservado y cancelar sin guardar.
- `npm run build:cloudflare`: correcto, **solo build**, sin despliegue ni aplicación de semillas.

Pruebas de navegador reproducibles: `tests/browser/check-carta.js` expone `checkCartaOriginal()` y `checkCartaSearchAndLanguages()` en el origen QA. Las pruebas de escritura existentes están en `tests/browser/admin-live.tsx`; modifican solo QA y requieren retirar sus datos de prueba antes de presentar la carta al usuario.

Capturas:

- `carta-original-tallarines-movil.png`
- `carta-original-tallarines-escritorio.png`

## Pendientes

1. Revisión visual y de contenido del usuario en la prueba local.
2. Fotos nuevas de las preparaciones seleccionadas, aplazadas por el usuario; no confundir candidatas de Commons con fotografías aprobadas o propias del restaurante.
3. Prueba física PC/iPhone, especialmente teclado y selección de fotos; la emulación no la sustituye.
4. Revisión independiente final del flujo completo antes de desplegar. La delegación con Minimax pasó la prueba mínima, pero la tarea de catálogo volvió a fallar con HTTP 402; el agente principal implementó y verificó el catálogo directamente.
5. Adaptar el script histórico `check-admin-publication.ts`, completar la documentación final de entrega y acordar cuándo trasladar expresamente el catálogo a producción. Desplegar código no debe sustituir automáticamente los datos del dueño.
6. Commit/push y despliegue solo cuando el usuario los solicite.
