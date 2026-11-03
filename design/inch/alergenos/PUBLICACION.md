# Alérgenos: leyenda y ejemplo publicados

Autorización: el dueño confirmó publicar la leyenda general y únicamente el ejemplo de Poh Phia Sod, dejando el editor de alérgenos en administración para después.

Despliegue verificado: https://2e40a4a7.inch-carta-demo.pages.dev
Dominio estable: https://inch-carta-demo.pages.dev/

## Alcance

- Leyenda final de 14 dibujos originales y nombres traducidos al idioma seleccionado (es/en/de), con diseño móvil compacto aprobado.
- Única asignación: `carta-poh-pia-sod`, nombre vivo `Poh Phia Sod`, categoría `entrantes`: `gluten`, `crustaceans`, `eggs`.
- Iconos debajo de fotografía y a la derecha de descripción, pasando a una fila inferior si no caben.
- Ejemplo piloto definido en código por ID estable en `DishAllergens.tsx`, NO aún editable ni almacenado como campo de D1. Al implementar administración, migrar esa asignación al dato persistido y retirar el piloto fijo para que se pueda editar/quitar sin que reaparezca.
- Sin cambios en catálogo, precios, descripciones, fotos, orden ni visibilidad. No se infiere ausencia de alérgenos en otros platos.

## Verificación

La revisión independiente `deleg_43b56204` no emitió dictamen: terminó por HTTP 429 de Google (cuota diaria). No debe registrarse como aprobada. Las comprobaciones que siguen fueron realizadas por el agente principal; la revisión independiente queda pendiente.

Exportaciones completas anterior/posterior en `backups-private/2026-11-02-allergen-pilot/`, integridad SQLite correcta. Esta vez la descarga del export funcionó. Borrador revisión 38, 130 fichas y 16 BLOB. Comparación de borrador, publicación e imágenes idéntica antes y después; no se escribió D1.

Suite: 119 pruebas, 118 correctas, una omitida. TypeScript, ESLint acotado y build correctos. Navegador local con catálogo y fotos reales: nueve combinaciones (320/390/1280 px × tres idiomas), ubicación e iconos correctos, sin desbordamiento. Ajustado ancho de cada etiqueta del plato a 60 px para evitar cortar Crustáceos; comprobado después en producción.

Dominio público: JSON de platos idéntico al respaldo, exactamente tres iconos asignados al ejemplo y 14 de leyenda, 19 rutas de fotos verificadas, 14 iconos idénticos a los assets originales y API administrativa sin sesión devuelve 401. Navegador en producción a 390 px: tres idiomas, etiquetas correctas, posición bajo foto, imágenes cargadas y sin desbordamiento. Evidencia `qa-published.json`. Pendiente revisión física del dueño en iPhone.

No se hizo commit ni push. Próximo paso: diseñar y autorizar la gestión de tipos y selección por plato desde administración manteniendo Guardar único.
