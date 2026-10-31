# INCH · Mismo orden en gestión y carta pública

## Requisito del dueño

El orden de secciones, categorías y platos debe coincidir entre gestión y la carta de clientes. En Entrantes, el orden guardado empieza por Poh Pia; una foto o un cambio de precio no deben adelantar un plato ni cambiar su posición. Los platos ocultos siguen disponibles en gestión, pero no se muestran a clientes; los restantes mantienen el mismo orden relativo.

## Causa y corrección local

`InchMenu.tsx` ordenaba los resultados poniendo primero los platos con imagen. Tempura tenía foto y adelantaba a Poh Pia aunque su posición guardada era posterior. Se ha eliminado esa ordenación: los filtros conservan el orden de los datos compartidos con gestión.

Las publicaciones existentes contienen HTML ya renderizado y los datos públicos en `inch-menu-data`. El Worker ahora puede renderizar esa misma instantánea pública con la presentación corregida, sin consultar ni publicar el borrador privado y sin modificar D1. Si encuentra una publicación antigua sin datos compatibles, conserva su HTML original; nunca lo sustituye por datos de ejemplo.

## Verificaciones realizadas

- Regresión RED→GREEN reproduce exactamente Tempura delante de Poh Pia y comprueba después la secuencia del panel.
- Cambiar precio o añadir foto no mueve platos; ocultar uno conserva el orden relativo restante.
- Una instantánea antigua se renderiza con el orden actual conservando exactamente sus datos públicos; la prueba impide consultar el borrador o escribir en la base.
- Suite completa: **80 pruebas, 79 correctas, 1 omitida** de PostgreSQL anterior, sin fallos.
- TypeScript y ESLint del cambio correctos.
- Integración Worker/D1 temporal (`scripts/check-live-menu.ts`) correcta, incluidos concurrencia y rollback real.

## Entrega y límites

Corrección únicamente en código local, junto con el nuevo modo Guardar directo todavía sin desplegar. No se ha modificado la carta de Cloudflare ni los datos del dueño. El proceso QA iniciado en 127.0.0.1:8794 compiló su Worker al arrancar: no asume estos cambios hasta actualizar ese proceso. No afirmar que el navegador abierto o la web publicada ya muestran el ajuste sin comprobarlo.

Al verificar el siguiente despliegue, comparar los datos embebidos de la publicación antes/después (nombres, precios, fotos, visibilidad y orden guardado). El HTML puede cambiar legítimamente por la corrección de presentación, aunque los datos públicos sean los mismos. No volver a publicar un borrador para corregir únicamente el orden visual.
