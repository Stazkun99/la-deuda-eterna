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

## Avisos centrales de movimientos

- El centro del tablero muestra origen, acción, importe o bienes y destinatario de las operaciones confirmadas.
- Pagos de renta y FMI, préstamos, amortización, cobros, construcción, subastas e intercambios; sin avisos duplicados por caja compartida.
- Cola de avisos con cierre y avance manual. La lectura se pausa con diálogos abiertos o pestaña oculta.
- Historial de 60 movimientos en el estado guardado, sin repetir avisos antiguos al entrar en una sala.
- Pruebas de destinatarios, importes, oro, intercambio, alianzas, persistencia y ausencia de avisos si falla el guardado.
- Se estabiliza una prueba de dados que antes podía sacar aleatoriamente una carta de desplazamiento.

## Movimiento y préstamos personalizables
- Recorrido animado casilla a casilla tras los dados, con decisiones al llegar y sincronización al reconectar.
- Formulario de préstamo con importe libre entero, capacidad restante y validación del límite en el servidor.

## Reparto inicial y primer turno
- Capital inicial de $5.000 más un dado × $200, sin deuda inicial.
- Empieza el dado más alto; sorteo uniforme entre empatados, sin favorecer al anfitrión. Resultados visibles y guardados.
- Ayuda al desarrollo (casilla 30): $1.500 en efectivo sin deuda; detalles y aviso actualizados.

## Indexación y contenido público
- Metadatos, canonical, tarjetas sociales y JSON-LD coherente con contenido HTML visible.
- Guía pública en Markdown, llms.txt y sitemap; verificación de Google conservada.
- Redirección de index.html, noindex para endpoints técnicos y CSP con hash del JSON-LD.

## Dados sobre la mesa
- Dados con caras y volumen en CSS, caída, giro y rebotes en el centro del tablero.
- Entre dos y cuatro dados con resultados del servidor, movimiento reducido y retirada automática para mostrar los avisos.

## Sonidos del juego

Efectos sintetizados originales para dados, pasos, cobros y pagos, construcción, intercambio, préstamos, Solidaridad, FMI, ayuda BID y golpe militar. El botón Sonido permite silenciarlos y guarda la preferencia. Se activan después de interactuar con la página, no se reproducen tiradas antiguas al reconectar y se silencian al ocultar la pestaña. No hay descargas de audio ni servicios externos.

## Fichas con figuras
- Carrito, sombrero, bota y balsa en SVG, consistentes en tablero, movimiento y lista de jugadores.
- Figura estable asociada al color del jugador, con tamaños adaptados a móvil y casillas compartidas.

## Edificios del tablero

Las industrias nacionales se representan con una fábrica en tonos tierra; las multinacionales, con torres azules. El número junto al edificio indica el nivel (1–3). Las industrias cerradas aparecen en gris y con el nivel tachado. Los detalles de cada casilla conservan sus costes y reglas.

## Ambientes de las casillas

Al caer suena una escena breve sintetizada: mugido en Ganado, saltos y salpicaduras en Pesca, latas metálicas en Enlatados y pisadas en Zapatos. Las demás propiedades tienen efectos de cosecha, fabricación, motores o electrónica; los eventos conservan su identidad sonora. No se activa el ambiente por cada casilla atravesada ni al recuperar una tirada antigua. Respeta el botón Sonido y la pestaña oculta.

## Barrera visual del Norte

Al activar la barrera proteccionista, bajan persianas con franjas de advertencia sobre las doce casillas del Norte. Permanecen hasta levantar la barrera y señalan que las exportaciones no generan cobros. Se conservan visibles las fichas y los niveles. La animación no se repite al actualizar el turno y respeta movimiento reducido.

## Primera fase del tablero 3D
- Visor opcional con mesa en relieve, 40 casillas e ilustraciones originales.
- Giro, zoom, vista general y cenital; selección de casillas y consulta de detalles.
- Colores de propietarios y estado de barrera sincronizados con la sala.
- Carga local de Three.js bajo demanda, CSP compatible y retorno al tablero habitual.
- Esta fase no incorpora aún fichas, construcciones ni dados al escenario 3D.

## Fichas en el tablero 3D
- Carrito, sombrero, bota y balsa modelados con volumen y color de jugador.
- Aro de turno, enfoque desde el nombre y distribución al compartir casilla.
- Recorrido animado según la tirada del servidor; sin repetir al reconectar o abrir el visor.
- Pausa al cerrar u ocultar la pestaña y compatibilidad con movimiento reducido.

## Decorados 3D en todas las casillas
- Miniaturas temáticas para las 40 casillas, diferenciando materias primas, productos y eventos.
- Franja exterior para el decorado y recorrido interior para las fichas.
- Selección sobre los modelos, acercamiento a la casilla y opción de ocultar decorados.
- Geometría agrupada y material compartido; pruebas de cobertura, dimensiones y separación.

## Dados en el tablero 3D
- Dados biselados con seis caras, caída, giro y rebote para tiradas de 2, 3 o 4 dados.
- Resultado del servidor orientado hacia arriba y desglose accesible.
- Botón de tirar dentro del visor con los mismos bloqueos de turno y conexión.
- Sin repetir animaciones al reconectar; pausa y movimiento reducido respetados.

## Industrias y barrera en 3D
- Fábricas nacionales y torres multinacionales con niveles 1–3 y color de propietario.
- Persiana animada para cada casilla del Norte al activar o levantar la barrera.
- Sin repeticiones al actualizar, reconectar o reabrir; compatible con movimiento reducido.
- Distribución separada de decorados, industrias y fichas; selección de edificios y barreras.

## Partida integrada en la mesa 3D
- Controles completos, decisiones, jugadores, registro y chat compartidos entre 2D y 3D.
- Avisos centrados sobre la escena; cartas y formularios por delante, última carta accesible.
- Acceso rápido al turno en móvil y utilidades de sala dentro de la mesa.
- Restauración de controles y retorno a 2D ante fallos del visor.

## Vista 3D predeterminada
- La mesa 3D se abre automáticamente al entrar o recuperar una sala.
- Botones para cambiar entre 3D y 2D sin abandonar la partida.
- Elegir 2D o caer al modo alternativo no provoca reaperturas en cada actualización.
- Las decisiones de partida siguen apareciendo por delante de la mesa al reconectar.

## Cámara e iluminación de la mesa
- Seguimiento opcional del recorrido y llegada de las fichas, interrumpible manualmente.
- Transiciones de cámara suaves, compatibles con movimiento reducido.
- Luz principal cálida, relleno frío y sombras ajustables sobre una base de mesa.
- Sin animación de cámara permanente y con actualización de sombras bajo demanda.
