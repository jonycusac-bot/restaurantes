# Carta digital exclusiva de INCH

## Dirección del proyecto

Este repositorio `Restaurantes` contiene ahora la carta de INCH como página principal (`/`). `/inch` conserva la misma carta para que los enlaces de la demo sigan funcionando. No es un proyecto separado ni un servicio de varios restaurantes.

## Producto

### Organización publicada el 29/10/2026

Petición del usuario: dos pestañas superiores «Carta» y «Sushi», sin «Toda la carta». Inicio en Carta → Entrantes. Carta: Entrantes, Ensaladas, Sopas, Salteados, Curry, Arroces, Noodles, Menú infantil. Sushi: Entradas, Tartar, Poke Bowls, Sashimi, Nigiris, Maki, Temaki, Gunkan, Uramaki. Los 25 platos existentes se conservan repartidos una sola vez. Las categorías sin datos indican que sus platos están pendientes de incorporar. La selección de sección y categoría funciona también en inglés y alemán. Publicación autorizada por el usuario el 29/10/2026. Despliegue Netlify: 6ae37962417bc9a45f607aca. Verificadas ambas pestañas en la URL pública.

Carta pública para consultar después de escanear un QR. Prioridad: fotos, nombres y precios; descripciones breves, categorías y buscador. Estética aprobada: papel marfil, tipografía con carácter, líneas finas, acentos bermellón y fotografías debajo de los títulos. No convertir en página promocional. No añadir pedidos, pagos o reservas sin petición.

## Datos y fotos

### Panel de administración · primera vista previa local

Ruta: `/admin/preview`. Contiene secciones Carta/Sushi, categorías, listados sin fotos, editor de nombre/precio/descripción/visibilidad e imagen, y alta de platos. Guardar y recuperar borrador utiliza exclusivamente `localStorage` con la clave `inch-admin-preview-draft-v1`. No es un panel autenticado ni una API; no modifica datos de la carta pública. «Publicar cambios» permanece desactivado. No incluir esta ruta en el paquete estático de Netlify.

Corrección del flujo local: «Aplicar al borrador» guarda inmediatamente en el navegador, conserva el formulario si el almacenamiento falla y sincroniza el listado y la carta local entre pestañas. Los borradores se recuperan automáticamente al abrir el panel. `/` y `/inch` muestran el borrador únicamente en desarrollo y en localhost, con una franja que indica que no está publicado. El paquete de producción ignora estos borradores. Los platos ocultos se omiten; se muestran platos nuevos, precios y fotos personalizados. Los textos nuevos o modificados siguen en español hasta disponer de traducciones, evitando errores o traducciones antiguas engañosas. La implementación común está en `src/lib/inch-draft.ts`.

Siguiente fase: PostgreSQL en la nube (Netlify Database es una opción nativa verificada), almacenamiento de imágenes (Netlify Blobs), servicio de autenticación y autorización de cuentas administradoras, y operaciones de borrador/publicación en servidor. La base local Prisma del prototipo no está conectada a esta vista ni se ha migrado. No se ha creado todavía una base de datos en la nube ni cuentas de acceso.

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


## Panel protegido y fotos optimizadas · 29/10/2026

Estado actual (sustituye las indicaciones de la primera vista previa): `/admin` y `/admin/preview` requieren la contraseña compartida provisional solicitada por el propietario. La validación sucede en servidor; sesión firmada de ocho horas en cookie HttpOnly, SameSite=Strict y Secure por HTTPS. Cerrar sesión elimina la cookie. Netlify limita el panel y sus endpoints a 20 peticiones por minuto y dirección IP. La contraseña no está en los recursos públicos: su hash y la clave de sesión se configuran como variables privadas `INCH_ADMIN_PASSWORD_HASH` e `INCH_ADMIN_SESSION_SECRET`. En desarrollo se usa `.env.admin.local` (ignorado por Git). No añadir este archivo a un ZIP ni mostrar sus valores.

El panel continúa guardando borradores en el navegador, sin base de datos ni publicación de platos. Los borradores locales anteriores se conservan. En producción el enlace «Ver carta pública» abre la carta publicada, que no lee esos borradores. Publicar platos sigue deshabilitado.

Imágenes: admite JPG, PNG o WebP hasta 20 MB. El navegador mantiene las proporciones, reduce el lado mayor a un máximo de 1600 px sin ampliar fotos pequeñas y comprime en WebP (objetivo 750 KB; máximo 2 MB). Se informa del tamaño obtenido; hay que aplicar al borrador para guardar. Comprobado con una imagen de 2,5 MB: resultado 248 KB. Si falla el almacenamiento, el formulario conserva el cambio.

Despliegue actualizado: `npm run build:inch` genera la carta y recursos del panel en `dist-inch/`, y una función de autenticación en `.netlify/inch-functions/admin.mjs`. No subir únicamente el ZIP con Netlify Drop: dejaría fuera la función. Utilizar Netlify CLI autorizado, con las variables privadas configuradas en el sitio:

```
npx netlify deploy --prod --no-build --dir dist-inch --functions .netlify/inch-functions --site ac9fb853-0dbd-4589-b007-8e685e2ed9b7
```

Al importar variables, redirigir la salida del CLI a un archivo privado bajo `.netlify/`, porque `env:import` muestra los valores. No incluir esa salida en el repositorio ni en informes. El servidor estático `preview:inch` solo comprueba la carta; para probar el panel usar Next local o Netlify.

Validación: build específico, TypeScript y ESLint correctos; pruebas de contraseña, sesión, manipulación, caducidad, origen, cierre, dimensiones y borradores correctas. Dos pruebas históricas de `/api/menu` requieren la base PostgreSQL anterior y fallan por acceso a esa base; no se usan en INCH.

Publicado y comprobado en el dominio estable. Deploy: `6ae38855004dd70e44035182`. Verificados formulario de acceso, contraseña, sesión y listado de platos en `/admin`. Evidencia: `design/inch/panel-admin-publicado.png`.
