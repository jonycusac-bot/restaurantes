# INCH · Documento para retomar el proyecto

**Actualizado: 29/10/2026, Europe/Madrid.** Estado vigente posterior: **leer primero `CLOUDFLARE.md`**. La integración PostgreSQL Netlify se detuvo y ahora se prueba Cloudflare Pages con D1, edición, fotos y publicación. Este archivo conserva el contexto histórico; no hace falta recuperar el chat.

## Objetivo y decisiones aprobadas

- Carta digital exclusiva de INCH. El repositorio conserva el nombre Restaurantes y código del prototipo, pero no se está creando una plataforma de múltiples restaurantes.
- «Diseño ante todo»: CARTA, no página promocional. Papel marfil, tinta oscura, bermellón, títulos serif, líneas finas, descripciones cortas y fotografías protagonistas debajo del nombre del plato. Referencia visual: carta retro Burger & Co. del chat; consultar las capturas guardadas.
- No añadir pedidos, reservas ni pagos sin petición. No rehacer desde cero la estética aprobada.
- Dos pestañas superiores, **Carta** y **Sushi**, sin «Toda la carta».
- Carta: Entrantes → Ensaladas → Sopas → Salteados → Curry → Arroces → Noodles → Menú infantil.
- Sushi: Entradas → Tartar → Poke Bowls → Sashimi → Nigiris → Maki → Temaki → Gunkan → Uramaki.
- Cabecera: logo a la izquierda; arte central en lugar del nombre escrito; banderas pequeñas es/en/de a la derecha encima del enlace a la carta original. Igual separación entre columnas. Arte central: 91 px escritorio, 56 px móvil.
- El usuario pide consultar dudas de producto. Mantener las decisiones ya aprobadas y no pedir de nuevo autorización para acciones concretas ya autorizadas.
- La base de datos se autorizó **solo si podía usarse gratis**. No activar pagos ni cambiar de plan.

## Ubicaciones y enlaces

| Elemento | Ubicación |
| --- | --- |
| Carpeta PC | `C:/Users/Usuario/Desktop/Restaurantes` |
| GitHub | https://github.com/jonycusac-bot/restaurantes |
| Rama actual | `feat/bootstrap` |
| Carta publicada | https://restaurant-management-82d26f.netlify.app/ |
| Panel publicado | https://restaurant-management-82d26f.netlify.app/admin |
| Proyecto Netlify | `restaurant-management-82d26f` |
| ID sitio | `ac9fb853-0dbd-4589-b007-8e685e2ed9b7` |
| Último deploy comprobado | `6ae38a6bfe1214b59761ab58` |
| Historial y fuentes | `INCH.md`, `design/inch/README.md` |


## Qué funciona

### Carta

25 platos de ejemplo en código, filtros de sección y categoría, búsqueda sin depender de acentos e idiomas español/inglés/alemán. Hay categorías vacías con aviso. Las traducciones cubren los platos originales; los textos de platos nuevos o modificados permanecen en español si no coinciden con el original, evitando traducciones antiguas engañosas.


### Panel

- `/admin` y `/admin/preview` equivalentes, local y publicado.
- Contraseña compartida provisional solicitada por el usuario, sin cuentas individuales. El valor no se escribe en este documento ni en GitHub: la configuración privada ya existe en este PC y Netlify.
- Validación en servidor, hash scrypt, sesión HMAC de ocho horas. Cookie HttpOnly, SameSite=Strict y Secure por HTTPS; cierre de sesión. No es una contraseña comprobada solo en JavaScript cliente.
- Función Netlify configurada con límite de 20 peticiones/minuto por combinación IP/dominio.
- Dos secciones Carta/Sushi, categorías y listado sin miniaturas. Al seleccionar un plato: nombre, precio, descripción, imagen, ocultar. Permite añadir platos.
- **«Aplicar al borrador» guarda el plato inmediatamente**, cierra el editor si hay éxito y conserva el formulario ante fallo de almacenamiento. El usuario ya encontró ese botón y confirmó su funcionamiento.
- «Guardar borrador local» está deshabilitado mientras el editor está abierto. Recuperación automática del borrador y sincronización entre pestañas del mismo origen.
- **Publicar cambios sigue deshabilitado.** No hay todavía guardado de platos en servidor.

### Fotos

JPG/PNG/WebP hasta 20 MB. Reescalado en navegador con proporciones conservadas, lado mayor máximo 1600 px, sin ampliar fotos pequeñas. Compresión WebP cuando el navegador lo admite, objetivo 750 KB y límite final 2 MB. Muestra el tamaño obtenido. Prueba real: 2,5 MB → 248 KB con `public/inch/sushi-editorial.png`; se canceló esa edición para preservar la imagen del usuario.

## Borradores: advertencia de estado, no confundir con nube

La carta pública aún lee `src/app/inch/menu.ts`, no PostgreSQL. Los borradores se guardan en `localStorage`, clave `inch-admin-preview-draft-v1`.

**Los borradores del navegador no están en los archivos del proyecto ni se respaldan con GitHub.** No borrar datos del navegador ni asumir que un borrador viaja al cambiar de ordenador, dominio o puerto. `localhost:3000` y Netlify tienen datos independientes. Hará falta una función explícita de exportación/importación o migración.

En desarrollo y solo en localhost/127.0.0.1, `/` y `/inch` aplican el borrador y muestran la franja «Borrador local del administrador». En producción se ignora: el enlace del panel se llama «Ver carta pública».

Última comprobación local: Poh Pia a 15,00 € y un plato en Menú infantil. Son pruebas del usuario, no precios publicados. Antes se probaron otros valores: comprobar el borrador real antes de migrarlo. En la carta pública Poh Pia seguía a 6,30 €, precio del código. No sobrescribir ni migrar automáticamente esos borradores.

## Base de datos: creada, todavía sin integrar

- PostgreSQL Netlify Database creada el 29/10/2026 mediante API oficial `createSiteDatabase`, vinculada al mismo sitio INCH.
- Conexión comprobada mediante `SELECT 1`.
- **Sin tablas INCH, sin importación de platos y sin conexión al panel.** Crear la base no implementa esos pasos.
- Equipo Comunidades, slug `jonycusac`, ID `690e1577945a3c93d1e73725`.
- API de cuenta confirmó plan **Free**, 300 créditos incluidos, `accumulate_overages.included=false`. No se cambió el plan ni se activaron pagos.
- El uso consume créditos compartidos. Sin recarga automática; si se agotan, Netlify pausa los proyectos hasta el próximo ciclo. No es capacidad ilimitada.
- Ajustes devueltos por API: `min_cu=0.25`, `max_cu=0.25`, `sleep_timeout_seconds=300`.
- Las respuestas y la conexión se guardaron bajo `.netlify/`, ignorado por Git. **No imprimir ni adjuntar esos archivos.**
- Netlify Blobs se propuso para imágenes, pero aún no está implementado.
- La antigua base Prisma del prototipo es distinta y no se ha migrado ni borrado.

Fuentes: https://docs.netlify.com/build/data-and-storage/netlify-database/getting-started/ y https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/. Verificar condiciones vigentes antes de cualquier cambio de plan.

## Archivos principales

| Archivo | Uso |
| --- | --- |
| `src/app/inch/InchMenu.tsx` | Carta, filtros, idioma y borrador local |
| `src/app/inch/menu.ts` | Platos, secciones y categorías estáticas |
| `src/app/inch/translations.ts` | Traducciones es/en/de |
| `src/app/inch/inch.css` | Estética aprobada |
| `src/app/admin/preview/AdminPreview.tsx` | Listados, editor y borradores |
| `src/app/admin/preview/admin.css` | Estilos del panel |
| `src/app/admin/preview/page.tsx` | Protección local con sesión |
| `src/app/admin/page.tsx` | Alias `/admin` |
| `src/app/admin/LoginForm.tsx` | Formulario de acceso |
| `src/app/api/admin/login/route.ts`, `logout/route.ts` | Autenticación local Next |
| `src/lib/admin-auth.ts` | Contraseña, sesión, cookies y validación |
| `src/lib/inch-draft.ts` | Validación, guardado y aplicación de borradores |
| `src/lib/prepare-dish-image.ts` | Reducción de fotografías |
| `src/inch-static.tsx`, `src/admin-static.tsx` | Hidratación estática |
| `scripts/build-inch.tsx` | Compilación esbuild/React SSR |
| `scripts/admin-function.ts` | Panel y endpoints protegidos en Netlify |
| `scripts/generated.d.ts` | Tipos para HTML generado |
| `netlify.toml` | Comando, carpeta pública y funciones |
| `public/inch/` | Fotos, logo, arte central y banderas |
| `design/inch/` | Capturas, QR, referencias y carta original |

Fuentes de fotos del usuario: `C:/Users/Usuario/Pictures/Restaurante/Inch`. Logo original `InchBar.webp`; arte central `CHino.png`. Los archivos usados ya están copiados a `public/inch/`. Las imágenes antiguas de Tripadvisor y las generadas se conservan como referencia histórica y ya no se muestran.

## Arranque y validación

```powershell
Set-Location 'C:/Users/Usuario/Desktop/Restaurantes'
git status --short
npm run dev
```

Abrir `http://localhost:3000/` y `http://localhost:3000/admin`. Si 3000 ya está en uso por el servidor correcto, reutilizarlo. Cambiar de puerto cambia el almacenamiento del borrador. En una instalación nueva ejecutar antes `npm install` y configurar los secretos locales.

```powershell
npm run build:inch
npx tsx --test tests/admin-auth.test.ts tests/inch-draft.test.ts tests/inch-translations.test.ts tests/home-page.test.ts
npx tsc --noEmit
npx eslint src/app/admin src/app/api/admin src/lib/admin-auth.ts src/lib/prepare-dish-image.ts src/admin-static.tsx scripts/admin-function.ts scripts/build-inch.tsx
```

Última publicación: ocho pruebas específicas de autenticación/imágenes/borradores/traducciones correctas; página de inicio también comprobada en pruebas previas. TypeScript, ESLint del cambio y `build:inch` correctos. Las pruebas generales antiguas necesitan su propia base del prototipo.

## Despliegue correcto

```powershell
npm run build:inch
npx netlify-cli deploy --prod --no-build --dir dist-inch --functions .netlify/inch-functions --site ac9fb853-0dbd-4589-b007-8e685e2ed9b7
```

El CLI oficial fue autorizado por el usuario en este PC. Si caduca, usar login oficial; no copiar tokens a documentos.

El build genera `dist-inch/` (carta y recursos admin), `.netlify/inch-html.mjs` (HTML intermedio) y `.netlify/inch-functions/admin.mjs` (servidor). Son reproducibles e ignorados por Git.

**No publicar `design/inch/carta-netlify.zip`**: es una copia histórica de la etapa estática, sin la función del panel. Netlify Drop solo con ese ZIP dejaría fuera la autenticación. Se conserva como archivo, no como procedimiento vigente.

`npm run preview:inch` sirve solo archivos estáticos en 4173, configurable con `INCH_PREVIEW_PORT`; no ejecuta el admin protegido. Probar el panel con Next o deploy de prueba Netlify. No publicar repetidamente para guardar documentación: cada producción consume créditos.

## Errores resueltos y pendientes

- **Resuelto:** aviso Next 16.4.3 de `Date.now()` durante prerender de `validSession`. `ProtectedPanel` ahora espera `await connection()` antes de cookies/sesión, dentro de Suspense. Verificado sin aviso. Commit `36f03f9`; captura `design/inch/panel-sesion-corregida.png`.
- **Pendiente histórico:** `npm run build` general de Next/Turbopack falla al crear un proceso auxiliar de estilos. No se ha reparado ni se utiliza para publicar INCH.
- Dos pruebas de `tests/menu-api.test.ts` fallaron por acceso `EACCES` a la base anterior. No confundir con la nueva base ni con la carta INCH.
- Antes de escribir código Next, leer las guías pertinentes en `node_modules/next/dist/docs/` según `AGENTS.md`.

## Seguridad y alcance del respaldo

El respaldo GitHub incluye código, documentación, fotos del proyecto, capturas, QR e historial. `.env*`, `.netlify/`, `.next/`, `node_modules/` y `dist-inch/` se quedan en el PC y se excluyen de GitHub.

`.env.admin.local` tiene `INCH_ADMIN_PASSWORD_HASH` y `INCH_ADMIN_SESSION_SECRET`. También están configuradas en Netlify. `.netlify/database-created.json` contiene la conexión privada de PostgreSQL. No imprimir valores, subirlos a GitHub, incluirlos en ZIP públicos ni reemplazar la conexión de Prisma sin identificar sus consumidores.

`netlify env:import` imprime valores: redirigir su salida a un archivo privado bajo `.netlify/` y comunicar solo el resultado. No cambiar claves ni borrar datos del navegador durante la siguiente fase sin necesidad.

## Próxima fase propuesta, aún no implementada

1. Esquema INCH de platos/categorías y versiones separadas borrador/publicada.
2. Endpoints de servidor protegidos para guardar y consultar; secretos fuera del cliente.
3. Panel conectado a la nube con Guardar borrador y Publicar separados: guardar no debe cambiar la carta pública.
4. Almacenamiento de fotos y referencias a archivos; evitar imágenes Base64 grandes en filas de platos.
5. Importación explícita del borrador local sin perder datos; gestión de conflictos entre administradores.
6. Carta pública que lea solo la versión publicada, con recuperación ante errores y evitando consultas innecesarias que gasten créditos.
8. Validar contenido definitivo con restaurante y decidir retirada de `noindex`.

Para retomar: **«Lee RETOMAR-MANANA.md y continuamos conectando el panel a la base de datos, manteniendo el plan gratuito».** La petición de cierre actual solo guarda y documenta; no ha iniciado esa integración.
