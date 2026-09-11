# Cambios preparados para revisión

## Tablero e interfaz

- Se sustituye el tablero de imagen por una cuadrícula HTML de 40 casillas.
- Fichas e industrias se añaden dentro de su casilla. Se elimina la tabla de coordenadas manuales.
- Nueva vista de escritorio y móvil, detalles de propiedad al pulsar, estados de conexión y decisiones pendientes visibles.
- Nuevo botón de terminar turno; construcción previa a los dados y descuento durante Ayuda Solidaria.

## Servidor y reglas

- Se separan transporte, motor de juego, datos y persistencia.
- Se corrigen suplantación por userId, pagos manipulables, acciones fuera de turno, HTML en el chat e identificadores que cambiaban al abandonar.
- Se implementan votaciones de alianza, subastas con pujas, barrera global y efectos ausentes de las cartas existentes.
- Se corrigen rentas, exportaciones, intereses al llegar al FMI, niveles industriales y reinicio de partida.
- Se incorporan recuperación de decisiones, guardado atómico, registro limitado e inactividad controlada.

## Antes del commit/despliegue

- `npm test` y `npm run check`.
- Revisar las adaptaciones de reglas en Readme.md.
- Configurar almacenamiento persistente en Render si se quiere conservar partidas entre despliegues.
- Publicar durante una pausa de juego y recargar los clientes de la versión anterior.

No se han creado commits ni se ha modificado el despliegue de producción.

## Cartas originales e iconos

- Iconos de las doce materias primas extraídos de las tarjetas PDF, en las casillas del Sur y sus exportaciones del Norte.
- Reversos originales en las casillas de Solidaridad y condiciones FMI.
- Imagen completa al sacar cualquiera de las 20 Solidaridad o 17 condiciones FMI; opción de volver a abrir la última carta.
- Tarjeta original en los detalles de cada propiedad.
- Recursos WebP incluidos y extracción reproducible, sin nuevas dependencias para Render.
- Pruebas de cobertura de recursos, correspondencia de cartas, repetición y recuperación de salas.

## Industrialización y dados

- Industrialización abre una ventana con los terrenos libres y sus iconos para elegir terreno y primera industria gratuitos.
- Si todos los terrenos están ocupados, muestra las mejoras nacionales o multinacionales disponibles en propiedades propias o de la alianza. Si no hay mejoras posibles, lo explica en el registro sin bloquear el turno.
- Se puede cerrar la ventana y reabrir la elección desde el panel de acciones.
- Los dados se animan brevemente y terminan en los valores confirmados por el servidor, con dos, tres o cuatro dados según la deuda. La última tirada queda visible y se recupera al reconectar; se respeta la preferencia de movimiento reducido.
- Verificación: 42 pruebas automáticas y selección manual en navegador de terreno libre y multinacional gratuita con todos los terrenos ocupados.
