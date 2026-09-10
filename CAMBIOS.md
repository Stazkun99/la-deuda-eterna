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
