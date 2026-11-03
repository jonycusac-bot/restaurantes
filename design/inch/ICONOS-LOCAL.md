# Iconos Carta/Admin — publicados

Publicado tras aprobación visual y autorización expresa: `https://ab0af912.inch-carta-demo.pages.dev`, dominio estable `https://inch-carta-demo.pages.dev/`. Carta, /admin y /admin/preview verificadas con nombres e iconos propios; ocho PNG y dos manifiestos comprobados en remoto. Exportaciones completas antes/después con integridad correcta y borrador/publicación/imágenes idénticos: 130 fichas, revisión borrador 40 y 16 BLOB. Las 19 rutas de fotos verificadas. Respaldos privados en `backups-private/2026-11-03-app-icons/`. Sin cambios D1, sin commit ni push. Pendiente comprobación de instalación física en iPhone por el dueño.

## Preparación local (histórico)

Decisión del dueño: mismo emblema rojo de INCH; Carta sin añadido, Admin con franja negra inferior y ADMIN blanco. Nombre del acceso: INCH Carta / INCH Admin. Cada uno abre su ruta (raíz / y /admin).

Fuente: emblema recortado de public/inch/inch-logo.webp (resolución superior a la captura), sin texto externo del logo horizontal. Generador reproducible: scripts/generate-app-icons.py (Pillow y Arial Bold de Windows). PNG opacos cuadrados de 32, 180, 192 y 512 px por aplicación; las esquinas de la página de comparación son simuladas mediante CSS, no horneadas en la imagen.

Implementación:
- src/lib/app-icons.ts: nombres, metadatos apple-touch-icon/apple-mobile-web-app-title, favicon PNG y manifiestos separados con id/start_url propios.
- src/cloudflare/html.tsx: Carta recibe su icono; login y panel Admin comparten el de administración.
- scripts/build-cloudflare.tsx: copia explícita de los ocho PNG y genera ambos .webmanifest en /inch/ (fuera de rutas privadas /admin/*).
- No service worker, cache offline ni cambio de autenticación. No migraciones ni consultas remotas.

Pruebas: regresiones RED→GREEN para metadatos y assets/manifiestos; suite 127 (126 correctas, una omitida), tsc y ESLint acotado correctos. Navegador local verificó imágenes cargadas y metadatos/manifiestos de /, /admin y /admin/preview, con destinos y MIME correctos.

Vista de comparación: http://127.0.0.1:8798/iconos mediante npx tsx scripts/preview-app-icons.ts. Solo loopback, sin D1 ni sesiones; /admin muestra login únicamente para revisar icono, no permite autenticar ni guardar. No se reiniciaron los entornos previos del dueño.

Pendiente: aceptación visual del usuario y prueba real de añadir ambos accesos a inicio de iPhone (no realizada en simulación de escritorio). No desplegado, sin commit ni push. Referencia consultada: documentación Apple Safari Web Content, Configuring Web Applications (apple-touch-icon, apple-mobile-web-app-title y apple-mobile-web-app-capable).
