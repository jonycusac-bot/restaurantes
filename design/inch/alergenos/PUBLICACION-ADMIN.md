# Publicación del selector de alérgenos y ajuste de separación

## Estado

Publicado con autorización expresa del usuario («guardamos los cambios y publicamos, de momento no hacemos git»). Sin commit ni push. Despliegue: https://000c536e.inch-carta-demo.pages.dev. Dominio estable verificado: https://inch-carta-demo.pages.dev/.

## Funciones

- Crear/editar plato: desplegable Alérgenos con selección múltiple entre los 14 tipos y dibujos aprobados.
- Guardar único persiste la selección y actualiza la carta. Cancelar no escribe.
- Campo opcional validado `allergens`: identificadores conocidos, sin duplicados ni valores mal formados. Se conserva en nube, borrador, recuperación de edición y presentación.
- Modificaciones independientes mantienen precio/foto/texto actuales; un cambio concurrente de alérgenos genera conflicto en ese campo.
- Las variantes agrupadas muestran sus propias asignaciones, sin heredar la de otra variante.
- Compatibilidad del piloto: cuando falta el campo en el antiguo Poh Phia Sod se muestran los tres confirmados. Un array guardado, incluido `[]`, siempre prevalece: desmarcar todos no hace reaparecer el piloto. No se ejecutó migración ni SQL de modificación de datos. El fallback es únicamente para registros heredados sin campo.
- Espaciado compacto por plato: ancho según nombre, iconos 28 px y texto 10 px conservados. Leyenda general conserva diseño aprobado.
- No se copiaron datos de las pruebas locales a producción. Gestión de nuevos tipos de alérgeno (pestaña/lista global) no incluida todavía.

## Verificación

- Suite completa: 125 pruebas, 124 correctas, una omitida. TypeScript y ESLint acotado correctos. Build correcto.
- Script `check-live-menu.ts`: Worker/D1 temporales, validación, auth/origen, conservación de cambios independientes, conflictos y rollback.
- Navegador → UI real → Worker compilado → D1 temporal aislada en puerto 8796: seleccionar, cancelar sin escribir, quitar todo, guardar, reabrir sin reaparición del piloto, restaurar selección, crear nuevo plato con alérgeno y comprobar JSON de publicación; correcto a 320, 390 y 1262 px. No se modificó el entorno de pruebas del usuario en 8794.
- La primera apertura de la fixture 8796 falló por protección de origen del arnés (aceptaba solo 8794); se añadió explícitamente 8796 a la lista local y se repitió correctamente. No se relajó ninguna protección de producción.
- El respaldo inicial falló por autenticación Cloudflare (10000). OAuth renovado con account:read/user:read/pages:write/d1:write. `offline_access` no se acepta como argumento de scopes en esta versión; se retiró tras consultar la lista oficial del CLI. Se repitió respaldo completo con éxito antes de desplegar.
- Exportaciones SQL anterior y posterior: integridad SQLite correcta, borrador/publicación/imágenes idénticos, 130 fichas, revisión borrador 38, 16 BLOB. Copias privadas en `backups-private/2026-11-02-allergen-admin-release/`.
- Dominio estable: payload público idéntico al respaldo, 3 alérgenos del piloto, 14 iconos de leyenda, 19 rutas de fotos comprobadas. Iconos idénticos a originales. API administrativa sin sesión 401.
- `admin.js`, `admin.css`, `carta.js` y `carta.css` remotos idénticos byte a byte al build verificado. No se hicieron pruebas de escritura en el panel real.

Pendiente únicamente revisión física del dueño en su móvil y futuras funciones de gestión de tipos. No crear commits ni hacer push sin nueva petición.
