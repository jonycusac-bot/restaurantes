# INCH · Revisión preliminar del panel móvil

Fecha: 30/10/2026. Código local: `20eac42`, rama `feat/bootstrap`.
Destino observado: `https://inch-carta-demo.pages.dev/admin`.
Alcance: navegación, edición de platos y fotografías. Revisión incompleta por bloqueo de permisos de automatización.

## Resumen

Se abrió el panel autenticado en Chrome del PC, conservando el perfil y los borradores existentes. Se activó la emulación responsive y se verificó visualmente la dimensión 390 × 844 en la barra de DevTools. No es una prueba en un teléfono físico ni una validación de Safari/iOS o Chrome/Android.

Hallazgos: **1 observación en navegador y 2 riesgos identificados únicamente por inspección del código**. Las prioridades de los riesgos son provisionales hasta reproducirlos.

| ID | Prioridad | Área | Estado |
| --- | --- | --- | --- |
| MOB-02 | Alta | Edición | Riesgo por código; reproducción en interfaz pendiente |
| MOB-01 | Media | Navegación/UX | Observado visualmente a 390 × 844 |
| MOB-03 | Media | Fotografía/UX | Detectado en código; prueba de selección pendiente |

## MOB-02 · Descarte de una edición sin aviso

**Fuente:** `src/app/admin/preview/AdminPreview.tsx:25-26,73-77`.

`changeCategory` elimina el estado `editing` sin comprobar si el formulario tiene cambios. Cambiar entre Carta/Sushi llama a esa función. Seleccionar otro plato o añadir uno también reemplaza la edición actual. No se aprecia una confirmación o protección de cambios pendientes en esas rutas.

**Reproducción propuesta, todavía no ejecutada:** abrir un plato, escribir un nombre de prueba sin aplicar y cambiar de categoría. Al regresar, comprobar si el texto sigue disponible o se avisó antes de perderlo. Hacerlo en una copia de pruebas.

**Esperado:** advertir antes de descartar cambios o conservar el formulario. No confundir esta protección con el control de revisión de D1: este último protege guardados en nube, no el formulario sin aplicar.

**Recomendación:** detectar cambios pendientes y ofrecer continuar editando o descartar. Validar también selección de otro plato y alta nueva.

## MOB-01 · Primera pantalla ocupada por controles de guardado

**Evidencia:** `screenshots/panel-390x844.png`.

A 390 × 844, el aviso, cabecera, controles locales, Publicar y bloque de nube ocupan prácticamente toda la primera pantalla. Las categorías empiezan al final y no aparece ningún plato sin desplazarse.

**Reproducción realizada:** abrir el panel autenticado y activar emulación responsive 390 × 844, sin desplazamiento inicial. La captura incluye las dimensiones en DevTools.

**Esperado:** poder localizar rápidamente las secciones, categorías y platos al abrir el panel.

**Recomendación:** compactar la cabecera y las explicaciones y agrupar las acciones secundarias. Conservar la distinción entre aplicar, guardar en nube y publicar. No se propone alterar la identidad visual aprobada.

## MOB-03 · Sin previsualización de la foto en el editor

**Fuente:** `src/app/admin/preview/AdminPreview.tsx:40-49,77`.

El selector prepara la imagen y actualiza su nombre y un mensaje de tamaño. El marcado del editor no renderiza la imagen seleccionada: muestra el selector y el nombre de archivo. El listado sin miniaturas es una decisión previa y no se considera un defecto; esta observación se refiere exclusivamente al editor.

**Reproducción propuesta, todavía no ejecutada:** seleccionar una foto en una copia local de pruebas y verificar orientación, proporciones e identidad antes de aplicar.

**Recomendación:** una previsualización solo en el editor, con estado de procesamiento y manejo del error. La comprobación física de cámara/galería, orientación y teclado sigue pendiente.

## Cobertura y limitaciones

### Realizado

- Acceso al panel mediante la sesión ya iniciada en Chrome, sin copiar cookies ni introducir contraseñas.
- Activación de emulación responsive y vista inicial a 390 × 844.
- Captura de la vista inicial y revisión de los componentes, estilos y preparación de imágenes.
- Inspección visual de la consola recién abierta: no mostraba errores en esa captura. No equivale a monitorización completa del flujo.
- Ejecución de las suites `admin-auth`, `cloud-draft`, `cloudflare-auth`, `inch-draft` e `inch-translations`: **12 pruebas pasan, 1 omitida, 0 fallos**. La omitida corresponde a PostgreSQL real, coherente con el trabajo detenido.

### No realizado

- Navegar por todas las categorías y comprobarlas en varios tamaños.
- Escribir y cancelar modificaciones en los formularios.
- Elegir, comprimir, previsualizar y cancelar una fotografía en interfaz.
- Guardado, publicación, recuperación o pruebas de conflicto en D1 remota.
- Pruebas de escritura sobre una D1 local aislada: no se llegó a arrancar ese entorno.
- Prueba física en móvil, teclado virtual, cámara, galería y comportamiento específico de iOS/Android.

### Bloqueo

Las solicitudes de autorización para escribir en la consola y desplazarse caducaron sin respuesta. Ambas fueron bloqueadas; no se reintentaron ni se intentó obtener el mismo resultado por otra vía. La revisión de interfaz se detuvo en ese punto. La inspección de código y las pruebas unitarias no sustituyen las interacciones pendientes.

## Protección de datos y entrega

No se pulsaron Aplicar al borrador, Guardar borrador local, Guardar borrador en nube, Publicar, Cargar ni Recuperar. No se ejecutó el script remoto de comprobación ni se restauró D1. No se borró almacenamiento del navegador ni se modificó el código de la aplicación. Solo se añadieron este informe, el inventario de hallazgos y una captura local. No se ha hecho commit, push o despliegue.
