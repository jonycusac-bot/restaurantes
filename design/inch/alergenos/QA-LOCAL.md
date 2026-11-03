# Verificación local de la leyenda

Estado: terminada en local, NO desplegada, sin commit/push ni escritura remota.

- Dibujos originales recortados sin avisos ni rótulos bilingües de la imagen.
- Ajuste móvil posterior solicitado: iconos 25 % menores (55 → 41,25 px), separación vertical 22 → 11 px, horizontal 12 → 6 px y dibujo-nombre 8 → 4 px; texto mantiene 12 px y escritorio sin cambios. Build y seis pruebas focalizadas correctos; repetidas las 12 combinaciones de navegador con resultado correcto tras carga de imágenes.
- Nombres debajo según el selector es/en/de; sección antes del pie en Carta y Sushi.
- Build Cloudflare incluye los 14 assets; prueba comprueba igualdad de bytes con public/.
- TDD: prueba assets falló por archivo ausente antes de corregir builder; prueba navegador falló por display block antes de CSS grid.
- Suite: 115 pruebas, 114 correctas, una omitida, cero fallidas. TypeScript y ESLint acotado correctos.
- Navegador local http://127.0.0.1:4177: 12 combinaciones correctas (320/390/768/1280 px × español/inglés/alemán); imágenes cargadas, etiquetas debajo, nombres exactos, sin desbordamiento horizontal.
- Se corrigió un desbordamiento preexistente de las pestañas Carta/Sushi en alemán a 320 px reduciendo exclusivamente su espaciado en pantallas <=360 px.
- Ajuste horizontal posterior: columnas móviles fijas de 68 px centradas en lugar de columnas elásticas; gap de 6 px. Conserva iconos y texto. Verificadas otra vez las 12 combinaciones, todas correctas; build local correcto.
- Evidencias: `qa-results.json`, `qa-mobile-es.png`. Regresión reutilizable: `tests/browser/check-allergen-legend.js`.
- Durante la primera comprobación hubo un decode rechazado al iniciar la carga/hidratación; se repitió la matriz después de completar la carga: 12/12 correctas. No se ha probado en iPhone físico ni Safari.
- Prueba del navegador es sobre build estático local con catálogo de ejemplo: no afirma haber ejercitado D1 remoto. Inspección de worker.ts confirma que renderPublishedSnapshot utiliza datos de la publicación, no del borrador, para actualizar presentación sin reescritura del catálogo.
- Subagente Google se detuvo por cuota 429; el agente principal completó y verificó el trabajo.

Pendiente: autorización expresa para desplegar; asignaciones por plato y edición de alérgenos en admin siguen fuera de este cambio.
