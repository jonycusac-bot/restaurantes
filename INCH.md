# Carta digital exclusiva de INCH

## Dirección del proyecto

Este repositorio `Restaurantes` contiene ahora la carta de INCH como página principal (`/`). `/inch` conserva la misma carta para que los enlaces de la demo sigan funcionando. No es un proyecto separado ni un servicio de varios restaurantes.

## Producto

### Organización en revisión local (sin publicar)

Petición del usuario: dos pestañas superiores «Carta» y «Sushi», sin «Toda la carta». Inicio en Carta → Entrantes. Carta: Entrantes, Ensaladas, Sopas, Salteados, Curry, Arroces, Noodles, Menú infantil. Sushi: Entradas, Tartar, Poke Bowls, Sashimi, Nigiris, Maki, Temaki, Gunkan, Uramaki. Los 25 platos existentes se conservan repartidos una sola vez. Las categorías sin datos indican que sus platos están pendientes de incorporar. La selección de sección y categoría funciona también en inglés y alemán. No publicar esta reorganización hasta que el usuario lo pida.

Carta pública para consultar después de escanear un QR. Prioridad: fotos, nombres y precios; descripciones breves, categorías y buscador. Estética aprobada: papel marfil, tipografía con carácter, líneas finas, acentos bermellón y fotografías debajo de los títulos. No convertir en página promocional. No añadir pedidos, pagos o reservas sin petición.

## Datos y fotos

- Platos: `src/app/inch/menu.ts`.
- Pantalla: `src/app/inch/InchMenu.tsx`.
- Diseño: `src/app/inch/inch.css`.
- Imágenes actuales: cinco WebP en `public/inch/` aportadas como ejemplos.
- Procedencia e historial visual: `design/inch/README.md`.

La carta no consulta la API antigua y funciona sin una conexión a PostgreSQL. Prisma, las migraciones, la API y los componentes del prototipo anterior se conservan como código histórico pendiente de separar; no se ha borrado la base de datos. No confundir la independencia de la carta con una exportación estática terminada del repositorio completo.

## Antes de publicar

1. Confirmar relación exacta entre fotografías y platos, precios, disponibilidad y alérgenos. Las imágenes siguen siendo ejemplos.
2. Resolver el fallo interno de Turbopack al crear el proceso auxiliar de estilos en `next build`.
3. Preparar y comprobar un paquete de publicación que no dependa de la API antigua ni de credenciales PostgreSQL.
4. Publicar una demo con HTTPS y comprobarla desde un móvil fuera de la red local.
5. Generar un QR de la URL estable que sirva la carta. Actualizar la carta no cambia el QR si la URL se conserva.

## Publicación de prueba · 28/10/2026

### Cabecera aprobada para publicar

Se ha sustituido el nombre central de la cabecera por `public/inch/cabecera-inch.png`, copiado de `C:/Users/Usuario/Pictures/Restaurante/Inch/CHino.png`. Altura de 91 px en escritorio y 56 px en móvil, con igual separación entre columnas. El usuario aprobó guardar y publicar esta modificación el 28/10/2026.

La cabecera incorpora el logo aportado `InchBar.webp` en lugar de «Carta digital», y banderas para español, inglés y alemán encima de la carta original. Los 25 platos, categorías, buscador, unidades y avisos están traducidos en `src/app/inch/translations.ts`. El idioma se mantiene al filtrar durante la visita; al recargar se inicia en español. Las banderas tienen etiquetas accesibles y estado seleccionado.

- Sitio: https://restaurant-management-82d26f.netlify.app/
- Proyecto Netlify: `restaurant-management-82d26f` (ID `ac9fb853-0dbd-4589-b007-8e685e2ed9b7`).
- Despliegue publicado con Netlify Drop: `6ae1d4e2628336381105d487`.
- Actualización con logo e idiomas publicada: `6ae1efe2b8750ce6e06ae637`. Verificados alemán en la URL pública e inglés/alemán con búsqueda en la vista previa.
- Paquete subido: `design/inch/carta-netlify.zip`.
- QR de la dirección pública: `design/inch/qr-inch.png`.
- Compilación estática: `npm run build:inch` genera `dist-inch/` desde el mismo componente React y datos. El paquete solo incluye HTML, CSS, JS y las cinco fotos; no incluye `.env`, Prisma ni la API anterior.
- Vista previa del paquete: `npm run preview:inch` (puerto 4173 por defecto; variable `INCH_PREVIEW_PORT` para cambiarlo).
- Se ha comprobado la dirección pública, la búsqueda sin acentos y el filtro de sushi. No se ha probado físicamente el escaneo desde un teléfono.

Durante las pruebas se mantiene `noindex`. No hay repositorio conectado al sitio: los cambios locales aún requieren recompilar y volver a subir `dist-inch/` o su ZIP desde Deploys. `netlify.toml` deja preparados el comando y la carpeta para una futura conexión Git.

El error de Turbopack del build general de Next no se ha reparado. Esta publicación utiliza el paquete estático independiente del servidor, compartiendo los componentes de la carta; no requiere que `next build` pase.
