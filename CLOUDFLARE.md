# INCH · Prueba Cloudflare

Estado al **29/10/2026**. Esta es la continuación vigente del proyecto. `RETOMAR-MANANA.md` e `INCH.md` contienen la historia anterior de Netlify. El usuario decidió probar Cloudflare, conservando el panel editable por el dueño. La gestión de enlaces y códigos dinámicos queda fuera de este proyecto por decisión del usuario.

## Direcciones

- Carta: https://inch-carta-demo.pages.dev/
- Administración: https://inch-carta-demo.pages.dev/admin
- Alias también disponible: `/admin/preview`.
- Local con entorno real de Cloudflare: http://127.0.0.1:8788/
- El servidor Next anterior en localhost:3000 es otra vista, con otro almacenamiento local. No confundirlo con la prueba Cloudflare.
- Netlify continúa disponible y **no se ha modificado su despliegue ni se ha concedido permiso de escritura a su base**.

El administrador entra en la misma web añadiendo `/admin`. Contraseña provisional compartida conservada según la petición del usuario; sus valores y claves privadas no se escriben aquí ni se suben a GitHub. No hay registro de usuarios ni cuentas individuales todavía.

## Funciones que se han implementado

1. Sesión privada verificada en servidor: hash PBKDF2 con sal, firma HMAC, caducidad de ocho horas y cookie HttpOnly/SameSite=Strict/Secure en HTTPS.
2. Límite de ocho intentos de acceso por IP y ventana de cinco minutos. La IP se representa mediante HMAC en D1 y se limpian contadores caducados.
3. Panel Carta/Sushi con las categorías y estética aprobadas; listados sin miniaturas; editor de nombre, descripción, precio, imagen, visibilidad y alta de platos.
4. Aplicar al borrador conserva una copia en el navegador. **Guardar borrador en nube** guarda datos y fotos en D1 para otros dispositivos.
5. **Cargar borrador de la nube** pide confirmación antes de sustituir la copia local y conserva una copia anterior recuperable. No reemplaza automáticamente un borrador local ya existente.
6. Control de revisión: una edición antigua recibe 409 y no sobrescribe una versión más reciente.
7. **Publicar cambios** publica solo la revisión guardada en la nube. Si quedan cambios locales, pide guardarlos primero. Guardar un borrador no modifica la carta pública.
8. La carta pública es HTML generado al publicar, almacenado como una instantánea separada en D1. Se sirve ya renderizado y con los datos necesarios para hidratar los filtros e idiomas. No se reconstruye todo el sitio para cambiar un precio.
9. Fotografías optimizadas automáticamente, subidas al guardar en nube y accesibles desde rutas de contenido inmutable `/media/<sha256>.<ext>`.
10. Cierre de sesión, validación en servidor, origen comprobado para escrituras y errores sin credenciales.

## Fotos y coste de la prueba

Se eligió **Pages + D1, sin R2**, para no activar una suscripción de almacenamiento. Las imágenes se guardan como BLOB binario en una tabla separada de D1; no como Base64 dentro del plato.

- Entrada: JPG/PNG/WebP hasta 20 MB.
- Optimización en navegador: mantiene proporciones, máximo 1600 px en el lado mayor; objetivo máximo 750 KB en Cloudflare.
- El servidor acepta archivos de hasta 1 MB, verifica cabeceras de formato y rechaza SVG/documentos.
- Límite propio de esta prueba: 100 MB de fotos. SHA-256 evita duplicar una misma imagen.
- Las imágenes subidas y luego descartadas no se borran automáticamente todavía. No eliminar fotos antiguas sin revisar si están publicadas o referenciadas.
- La instantánea HTML se limita a 1,8 MB antes de escribirla para evitar superar el límite de fila de D1.
- Esta solución encaja en una prueba pequeña de un restaurante. Si aumenta mucho el catálogo o el tráfico, valorar almacenamiento de objetos y caché; no activar planes de pago sin autorización.

La autorización de Wrangler se limitó a `account:read`, `user:read`, `pages:write`, `d1:write` y renovación de sesión. No se han solicitado permisos R2 ni activado pagos. Mantener vigilancia de las cuotas gratuitas de solicitudes y D1: no es capacidad ilimitada.

## Recursos

- Cuenta Cloudflare: `f732c02bdb73d8bb8d944ba5a6d6481d`.
- Proyecto Pages clásico: `inch-carta-demo`, rama de producción `feat/bootstrap`.
- Base D1: `inch-carta-demo`, ID `c66f1733-19cb-4e41-b5c1-f4491fedc914`, región WEUR.
- Configuración versionada: `wrangler.jsonc`.
- Tablas: `inch_draft`, `inch_publication`, `inch_images`, `inch_login_attempts`.
- Migración: `cloudflare/migrations/0001_menu.sql`.
- Los IDs de recursos no son contraseñas. Los secretos permanecen fuera del repositorio.

## Archivos

| Archivo | Función |
| --- | --- |
| `src/cloudflare/worker.ts` | Rutas, borradores, fotos, publicación y lectura de carta |
| `src/cloudflare/auth.ts` | Acceso, cookies, firmas y límite de intentos |
| `src/cloudflare/html.tsx` | HTML de carta, login y panel |
| `src/cloudflare/types.ts` | Tipos de bindings |
| `src/cloudflare/public-client.tsx` | Hidrata la carta publicada sin leer borradores locales |
| `src/cloudflare/admin-client.tsx` | Hidrata el panel en modo Cloudflare |
| `src/app/admin/preview/AdminPreview.tsx` | Interfaz compartida; funciones Cloudflare habilitadas por prop |
| `src/app/admin/preview/useCloudDraft.ts` | Cargar, guardar, subir fotos y publicar |
| `src/lib/cloud-draft.ts` | Tipos, validación y compatibilidad con la prueba PostgreSQL detenida |
| `src/lib/inch-draft.ts` | Borrador del navegador y validación de fotos estáticas/media |
| `scripts/build-cloudflare.tsx` | Build separado, sin tocar el despliegue Netlify |
| `scripts/check-cloudflare.ts` | Comprobación de extremo a extremo, con restauración |
| `tests/cloudflare-auth.test.ts` | Pruebas de autenticación e imágenes |

Los datos iniciales siguen viniendo de `src/app/inch/menu.ts`. `INSERT OR IGNORE` solo los carga si la base está vacía: posteriores builds/despliegues no sustituyen los platos del dueño.

## Arranque local

```powershell
npm install
npm run build:cloudflare
npx wrangler d1 migrations apply inch-carta-demo --local
npx wrangler d1 execute inch-carta-demo --local --file .cloudflare-build/seed.sql
npm run dev:cloudflare
```

Abrir http://127.0.0.1:8788/admin. Usa `.dev.vars` con los secretos de la prueba. La base local persiste en `.wrangler/`; está separada de la D1 remota. No borrar ese directorio si se quieren conservar pruebas locales.

## Publicación en Cloudflare

```powershell
npm run build:cloudflare
npx wrangler d1 migrations apply inch-carta-demo --remote
npx wrangler d1 execute inch-carta-demo --remote --file .cloudflare-build/seed.sql
npx wrangler pages deploy dist-cloudflare --project-name inch-carta-demo --branch feat/bootstrap --commit-dirty=true
```

El comando abreviado `npm run deploy:cloudflare` recompila y despliega, pero para cambios de esquema hay que aplicar antes las migraciones como arriba. No se ha configurado integración automática GitHub → Cloudflare; un push por sí solo no despliega esta prueba.

Wrangler 4.156.0 intentó delegar la creación de un proyecto Pages nuevo a Workers. Se creó el Pages clásico una sola vez mediante `pages project create ... --force`. **El proyecto ya existe: no volver a usar `--force` en futuros comandos.** Pages no admite `account_id` dentro de su configuración; se selecciona la cuenta autorizada con Wrangler.

## Configuración privada

- `.dev.vars`: `INCH_CF_PASSWORD_HASH` y `INCH_CF_SESSION_SECRET` para desarrollo Cloudflare.
- `.cloudflare-build/secrets.json`: copia privada para la carga inicial de secretos; no imprimirla ni subirla.
- Los mismos secretos están cargados en el entorno production de Pages con `wrangler pages secret bulk`.
- `.cloudflare-build/seed.sql` y `dist-cloudflare/` son generados y reproducibles.
- Todos esos archivos, `.wrangler/` y las credenciales antiguas `.env*`/`.netlify/` están ignorados en Git.
- La cookie Cloudflare tiene un nombre diferente de la sesión Next/Netlify. Conservar la configuración de ambos servicios sin mezclarla.

## Comprobaciones realizadas

Build Cloudflare, TypeScript y ESLint correctos. Trece pruebas unitarias del área INCH/auth/draft correctas; la integración PostgreSQL queda omitida porque su proceso se detuvo por petición del usuario.

Se probó el flujo completo con la D1 local y en https://inch-carta-demo.pages.dev/: sin sesión → rechazo, contraseña errónea → rechazo, acceso correcto, origen ajeno → rechazo, datos inválidos → rechazo, carga y lectura de foto, guardado separado de publicación, revisión antigua → conflicto, publicación que aparece en la carta, plato oculto que no se renderiza y lectura desde otra sesión. **Tras la prueba se restauró la carta inicial.**

El script remoto está restringido a una demo nueva con revisión 1 y una variable explícita. No ejecutarlo sobre la carta del dueño: publica datos de prueba y después restaura. Para comprobaciones posteriores usar una D1 local limpia. Las pruebas no migraron ni borraron los borradores del navegador del usuario.

## Estado del trabajo anterior y próximos pasos

La conexión PostgreSQL Netlify quedó detenida antes de obtener permisos de escritura: no se ha creado su esquema de platos ni publicado esa integración. Hay archivos de ese trabajo en el repositorio para no perderlo, pero el panel Cloudflare no los utiliza ni intenta conectarse a PostgreSQL.

Pendiente para una entrega definitiva: validar catálogo/fotos/precios con el dueño, decidir credenciales de entrega, valorar cuentas individuales y recuperación de acceso, probar desde móvil, definir limpieza de fotos y copias de seguridad, y preparar importación/exportación explícita del borrador local antiguo si se quiere trasladar. Los textos nuevos o editados mantienen español hasta añadir traducciones propias.

Para continuar basta con pedir: **«Lee CLOUDFLARE.md y continuamos la prueba de INCH»**. No retomar la integración Netlify salvo nueva petición.

## Publicación comprobada

Último despliegue de esta prueba: https://32ec3957.inch-carta-demo.pages.dev/ (dominio estable https://inch-carta-demo.pages.dev/). Comprobados además en navegador el acceso, la carga de D1, «Guardar borrador en nube» y «Publicar cambios». Capturas: `design/inch/cloudflare-admin-publicado.png` y `design/inch/cloudflare-carta-publicada.png`. La carta inicial permanece restaurada; los borradores antiguos de localhost no se han trasladado automáticamente.
