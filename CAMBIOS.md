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

## Ilustraciones del tablero impreso

- Las doce manufacturas del Norte muestran su propio producto original (caramelos, mermelada, chocolate, ropa, cigarrillos, café elaborado, enlatados, zapatos, cables, electrónica, tractores y gasolina), en lugar de repetir el icono de la materia prima del Sur.
- Se añaden los originales de Salida, Ayuda Solidaria, Fuga de Capitales, Golpe Militar, Barrera, Industrialización, Ayuda BID, 12 de Octubre, No Pagar y Sede FMI. Solidaridad y condiciones FMI conservan sus reversos originales.
- Los detalles de cada casilla incluyen la imagen ampliada. Se mantienen los nombres y reglas de la edición web; se explican las diferencias de rótulo de Nacionalización y Ayuda USA en el impreso.
- Los recursos están en `public/assets/tablero/`, con su origen documentado en `manifest.json`. Se pueden regenerar con `python scripts/extract-board-art.py --source "ruta/al/tablero-original.jpg"` (Pillow, solo en desarrollo).
- Revisados en escritorio y móvil de 390 px; todos los iconos cargan correctamente.

## Comercio entre jugadores y documentación completa

- Botón Comerciar para comprar, vender o intercambiar varias propiedades con dinero opcional.
- Oferta con términos explícitos, aceptación del destinatario, rechazo o cancelación del proponente.
- Cada propiedad lleva sus industrias nacionales y multinacionales; se conservan oro y deudas.
- Caja y patrimonio de alianza compartidos; operaciones entre grupos distintos.
- Una oferta por sala, hasta 60 segundos y limitada por el reloj del turno. Los bienes no cambian mientras se espera respuesta.
- Validación de propietario, efectivo, turno, destinatario y estado de las industrias al aceptar; guardado atómico y protección contra doble aceptación.
- Pruebas de caducidad, abandono, reconexión, importes inválidos y fallo de disco. Suite completa: 52 pruebas.
- README reescrito con instalación, reglas actuales, comercio, configuración, Render Free, actualización con Git, recursos y solución de problemas.
