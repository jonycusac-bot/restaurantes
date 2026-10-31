# INCH · Estado actual y próximos pasos (31/10/2026)

Este documento es la referencia **actual**; `CONTINUIDAD-2026-10-31.md`, `CLOUDFLARE.md` y `design/inch/revision-movil/carta-original-local.md` conservan detalles y etapas históricas, incluidas afirmaciones antiguas de «solo local» que ya no describen el estado de hoy.

## Qué está funcionando

- Carta pública: https://inch-carta-demo.pages.dev/ · Gestión: https://inch-carta-demo.pages.dev/admin. Último despliegue de código comprobado: `https://aa9b0e1f.inch-carta-demo.pages.dev/` (corrección de compresión de fotos). Proyecto Pages y D1 `inch-carta-demo`; no se usa la antigua integración Netlify/PostgreSQL.
- Flujo del dueño: abrir un plato/variante → cambiar precio, texto, visibilidad o foto → **Guardar**. Publica el cambio en la misma operación. Gestión y clientes respetan el mismo orden. Las modificaciones independientes se combinan; una colisión del mismo campo pide elegir. No hay un segundo botón Publicar.
- CARTA original: ocho categorías, 71 importes de la referencia del usuario (incluidos tres suplementos) y siete opciones conservadas de Sushi. Referencia textual `design/inch/carta-original-precios-2026-10-31.md`; datos `src/lib/carta-original.ts`. Las variantes comparten ficha visual, pero son editables por separado. No mezclar esos precios de partida con ediciones posteriores del dueño en D1.
- El usuario confirmó en su **iPhone con Safari** que, después de la corrección, pudo subir la foto y verla en la web del PC. La foto nueva se verificó también por lectura pública en Pollo con Sésamo; no se inventaron imágenes ni se publicaron candidatas de internet.

## Qué quedó guardado y dónde

- Código, pruebas, precios transcritos, notas y capturas: repositorio `C:/Users/Usuario/Desktop/Restaurantes`, rama `feat/bootstrap`; commit de funcionalidad `9def6153890d80f2cbfa91fbb6170da730332401`. Ese SHA se comprobó también en `origin/feat/bootstrap` antes de redactar esta nota. Para identificar el commit más reciente de documentación, consultar `git rev-parse HEAD` y compararlo con `git ls-remote --heads origin feat/bootstrap`.
- Estado real del catálogo y fotos en D1: exportación privada **posterior a la prueba del iPhone** en `backups-private/2026-10-31-release-live/final-owner-state.sql`. No subirla a GitHub ni reproducir sus datos/cookies/secretos. Verificación local: integridad SQLite correcta; borrador revisión 22, publicación revisión 19 con origen 22; 78 registros, seis imágenes binarias, cuatro referencias `/media/`, hashes de fotos correctos y referencias existentes. La carta estable devolvió los mismos datos publicados que esta exportación. Estos números son una foto puntual: pueden cambiar si el dueño sigue editando.
- Artefactos generados `.cloudflare-build/`, `dist-cloudflare/` y todos los respaldos privados están ignorados en Git. El commit de código **no** es un respaldo de D1; la exportación privada está en este PC, no es una copia externa independiente.

## Comprobaciones y límites

- Última suite completa: **91 pruebas, 90 correctas, 0 fallos, 1 omitida** (integración PostgreSQL histórica); `npx tsc --noEmit --incremental false`, ESLint acotado, `npm run build:cloudflare` y `git diff --check` correctos. `npx tsx scripts/check-live-menu.ts` probó Worker/D1 aislados, guardado simultáneo, fotos, conflictos y rollback. La compresión de una foto grande y su Guardar se probaron en QA aislada; esa QA se detuvo.
- La foto en Safari sí fue confirmada por el usuario. **No** se ha reproducido la percepción de retraso del PC: la carta responde con `Cache-Control: no-store` y en las consultas realizadas se actualizó sin retardo medible. No afirmar que esté solucionado si vuelve a ocurrir.
- Una revisión independiente señaló posibles mejoras de HEIC, memoria/transparencia de imágenes y endurecimiento CSRF. El fallo concreto de compresión quedó resuelto en la foto probada; esas mejoras no son garantía de compatibilidad con cualquier foto ni un motivo para reescribir la carta sin evidencia. El servidor valida archivos subidos, sesión y origen.

## Pendientes priorizados

1. **Validación con el dueño del restaurante:** revisar precios vigentes, descripciones, variantes, alérgenos, disponibilidad y fotos de cada plato, especialmente Sushi de muestra. Aceptación: aprobación expresa de la carta final. No sustituir ediciones recientes por el catálogo inicial.
2. **Si reaparece el retraso PC/iPhone:** anotar plato, valor anterior/nuevo, hora de Guardar, confirmación mostrada y direcciones exactas de ambas pestañas; comparar lectura pública nueva en ambos dispositivos sin borrar sus borradores. Aceptación: reproducción y causa medida antes de modificar la caché o el guardado.
3. **Ampliar comprobación física móvil:** cámara/galería con más formatos (HEIC si aparece), teclado, orientación, altas/ocultación, errores de red y conflicto simultáneo real entre PC e iPhone. La confirmación de una foto no cubre todas las combinaciones.
4. **Fotos adicionales, aplazadas por el usuario:** primeras cuatro preparaciones por sección, o todas si hay menos; escoger fotos propias o candidatas fieles con licencia/atribución verificadas y aprobación del dueño. Los JSON en `design/inch/fotos-candidatas-*.json` son investigación, **no** fotos autorizadas ni publicadas.
5. **Mantenimiento:** actualizar/retirar el harness legado `scripts/check-admin-publication.ts` (flujo viejo de Guardar/Publicar), y consolidar documentación histórica que hoy puede inducir a ejecutar semillas o migraciones innecesarias. Para probar escrituras usar solo D1 efímera y `scripts/check-live-menu.ts`.
6. **Operación y seguridad para entrega definitiva:** acordar credenciales/cuentas y recuperación, copias periódicas de D1 más una copia externa protegida y ensayo de restauración, limpieza segura de imágenes sin referencia, vigilancia de cuotas y posible refuerzo CSRF. No activar pagos ni borrar fotos/ediciones sin autorización.

## Cómo retomar sin riesgo

Leer este archivo y `AGENTS.md`; comprobar `git status --short` y el SHA remoto. Distinguir **código en GitHub**, **código desplegado** y **datos/fotos en D1**. No ejecutar semillas, restauraciones ni pruebas de escritura contra la carta real para verificar una mejora visual. Antes de cualquier escritura remota, leer el estado actual, respaldarlo y pedir la confirmación concreta al usuario; preservar cambios posteriores al respaldo.

**Frase para continuar:** «Lee `CONTINUIDAD-ACTUAL-2026-10-31.md` en Restaurantes y seguimos con los pendientes de INCH; pregúntame antes de publicar o modificar datos reales».
