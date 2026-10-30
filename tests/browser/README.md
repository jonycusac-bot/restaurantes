# Regresión del editor de platos

Prueba del componente real `AdminPreview` en un origen local aislado. No usa sesión de Cloudflare, D1, contraseñas ni datos del dueño. No sirve el directorio del proyecto: el servidor solo permite los archivos públicos de esta prueba.

## Ejecutar

Desde la raíz del proyecto:

```bash
npx tsx scripts/preview-admin-editor.ts
```

Abrir `http://127.0.0.1:8791` en un navegador de pruebas. En automatización, evaluar:

```js
await window.checkAdminEditor()
await window.checkAdminEditorSave()
// En escritorio (>1050 px), comprueba abrir A → seleccionar B → cerrar B:
await window.checkAdminEditorSwitch()
```

Para comprobar también la pantalla sin sesión, abrir `http://127.0.0.1:8791/?login=1` y evaluar `await window.checkAdminLogin()`. Comprueba visibilidad y distribución del formulario real sin introducir ni enviar credenciales. Esta regresión evita que una regla de un diálogo cerrado oculte la sección de acceso que comparte la clase CSS.

La primera función comprueba apertura inmediata, nombre seleccionado, límites del modal, acciones visibles, foco inicial sin abrir el teclado, cancelación sin modificar el borrador, restauración del foco y apertura de un alta. En anchos mayores de 1050 px comprueba el panel lateral no modal. La segunda aplica nombre y precio mediante el formulario real y comprueba su guardado en el almacenamiento exclusivo de este origen de QA, restaurándolo después.

Tamaños comprobados: 320×568, 390×844, 844×390, 1024×768 y 1440×900. También se comprobó cambiar entre móvil y escritorio con texto sin aplicar, y cerrar mediante Escape.

La prueba falló antes del cambio porque el editor era una sección situada después del listado. Tras el cambio, pasa con un diálogo modal en los tamaños apilados y un editor lateral en escritorio.

No equivale a probar el teclado virtual, cámara o Safari en un iPhone físico. El despliegue Cloudflare y la carta pública permanecen sin modificar durante estas pruebas. No ejecutar estas funciones en el origen del dueño; el archivo de prueba rechaza otros hosts y puertos.

## Guardado y publicación en D1 temporal

```bash
npm run build:cloudflare
npx tsx scripts/check-admin-publication.ts
```

Ejecuta el Worker compilado con Miniflare y una D1 temporal, sin descubrir configuraciones de Wrangler ni leer secretos reales. El script genera autenticación exclusiva de prueba en memoria y no admite una URL de destino: no puede apuntarse a la carta remota. Comprueba rechazo sin sesión, subida y lectura de foto, edición sin guardar, guardado separado de la publicación, conflicto de revisión 409 y estado publicado persistente tras recargar. Cierra el Worker y descarta la base temporal al terminar, también si falla una aserción.

La prueba D1 verifica la API y el cálculo de estados; no sustituye una prueba del panel autenticado en Safari. Las regresiones del componente y el acceso descritas arriba se han repetido después de simplificar la cabecera. La nueva barra también tiene cobertura SSR en `tests/admin-toolbar.test.ts`.
