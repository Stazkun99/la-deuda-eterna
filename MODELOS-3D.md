# Modelos 3D del tablero

Selección de modelos de Kenney, Quaternius y Poly by Google. Se usan **34 GLB del catálogo inicial en 33 casillas, además de los modelos compartidos con eventos**, combinados con decorados propios en las 40 casillas. Los modelos de Kenney y Quaternius son CC0; la bomba petrolera y el tractor son CC-BY 3.0 y tienen atribución pública en `/creditos-modelos.html`. La carpeta pública incluye únicamente los modelos seleccionados, texturas y licencias.

## Casillas con modelo

| Casilla | Modelo o composición |
| --- | --- |
| 0 · Salida | Arco de carrera, línea a cuadros, banderines de colores y dos palmeras |
| 2 · Banano | Fruto de banano de Food Kit |
| 4, 16, 36 · Solidaridad | Cajas, bolsa de alimentos y pan |
| 9 · Pesca | Canoa de Nature y pescado de Food Kit |
| 10 · Ayuda Solidaria | Tractor, grúa y suministros |
| 13 · Cobre | Entrada de cueva, roca y caja |
| 14 · Estaño | Entrada de cueva, otra roca y caja |
| 15 · Hierro | Entrada de cueva, piedra y caja |
| 20 · Barrera Proteccionista | Portón de madera de Nature |
| 21 · Caramelos | Fábrica, caramelo y caja |
| 23 · Chocolate | Fábrica, tableta de chocolate y caja |
| 24 · Industrialización | Grúa, brazo industrial y caja |
| 27 · Café Elaborado | Fábrica, taza de café y caja |
| 29 · Enlatados | Planta industrial, conserva y caja |
| 30 · Ayuda USA | Oficina, suministros y bandera |
| 34 · Electrónica | Planta industrial, pantalla y brazo industrial |
| 37 · Gasolina | Refinería, depósito y tubería con válvula |
| 39 · Sede FMI | Edificio de oficinas bajo |
| 11 · Ganado | Vaca de Quaternius, dentro del corral propio |
| 17 · Petróleo | Oil pump de Poly by Google |
| 18 · Golpe Militar | Tank de Quaternius |
| 32 · 12 Octubre 1492 | Velero mediano de Kenney, sobre agua y muelle propios |
| 35 · Tractores | Tractor de Poly by Google |

Estos son modelos de maqueta. Las rocas son genéricas, no reproducciones geológicas de cada mineral; los nombres `roca-cobre`, `roca-estano` y `roca-hierro` indican su destino en el tablero. Ayuda USA/FMI usan edificios de oficinas genéricos. El portón de Nature sirve como representación provisional de aduana; la barrera activa sobre las industrias mantiene su propia animación. Banano combina el fruto importado con una plantación propia.

## Posibles sustituciones descargadas: 11 casillas

Estas casillas ya tienen decorados propios. La lista identifica posibles sustituciones futuras, no casillas vacías.

| Casilla | Buscar un modelo de… | Palabras útiles para buscar |
| --- | --- | --- |
| 1 · Azúcar | Cañaveral o cañas de azúcar | sugar cane, sugarcane field |
| 3 · Cacao | Cacaotero o mazorcas | cacao tree, cocoa pod |
| 5 · Algodón | Planta o fardo de algodón | cotton plant, cotton bale |
| 6 · Tabaco | Planta u hojas de tabaco | tobacco plant, tobacco leaves |
| 7 · Café | Cafeto o saco de granos | coffee plant, coffee beans sack |
| 12 · Fuga de Capitales | Maleta con dinero o avión | money suitcase, airplane |
| 22 · Mermelada | Tarro de mermelada | jam jar |
| 25 · Ropa | Prendas o máquina de coser | clothes, sewing machine |
| 26 · Cigarrillos | Cajetilla o cigarrillos | cigarette pack |
| 33 · Cables | Bobina de cable | cable reel, wire spool |
| 38 · No Pagar | Pancarta o símbolo de protesta | protest sign, protest banner |

Para próximas incorporaciones: preferir GLB/glTF con materiales y licencia incluida. Una textura de 1K–2K y geometría moderada suelen ser suficientes para este tamaño de maqueta; revisar el modelo en el tablero antes de añadir variantes más pesadas. Los cultivos de bambú, maíz y trigo del kit Nature no se han utilizado como sustitutos de las especies que faltan.

## Archivos y mantenimiento

- `public/assets/modelos-3d/`: únicamente los GLB seleccionados, sus texturas, licencias y créditos y `origenes.json`.
- `origenes.json`: nombre original, paquete, autor, licencia y huellas del archivo original y el adaptado. También registra conversiones: vaca y tanque pasan de OBJ/MTL a GLB estático con materiales PBR; la textura del tractor se extrae sin recomprimir para cargar mediante URL local.
- `public/board3d-model-catalog.mjs`: asignaciones por casilla y límites de tamaño. Permite cambiar el modelo sin tocar reglas, fichas ni industrias compradas.
- `public/board3d-models.mjs`: carga local de cuatro archivos simultáneos como máximo, reutilización entre copias, ajuste proporcional a la parcela y liberación de recursos al cerrar.
- Los formatos alternativos FBX/OBJ/DAE/STL, miniaturas, accesos directos y modelos no seleccionados se retiran de `public` para no incluirlos en GitHub ni servirlos en producción. Los paquetes originales se conservan fuera del repositorio, en el archivo local de trabajo.

Créditos: **Kenney — https://kenney.nl — Creative Commons Zero (CC0)**. Los textos originales de licencia se encuentran en `public/assets/modelos-3d/licencias/`.

## Composición híbrida

Las 40 casillas tienen escenografía. Azúcar, banano, cacao, algodón, tabaco y café usan cultivos propios, con terreno, surcos y detalles. Se conservan los GLB adecuados como complementos de fábricas, minas, muelles y oficinas. Las demás recuperan las miniaturas locales. Una malla de colores por parcela reduce el número de objetos dibujados. Los decorados mantienen libre la franja de fichas y construcciones.

Enlaces gratuitos verificados: [MODELOS-GRATUITOS.md](MODELOS-GRATUITOS.md).

## Archivo de los nuevos packs

Los 420 archivos originales (aprox. 41,5 MB), con OBJ, MTL, FBX, Blend, vistas previas y alternativas, están en:
`C:/Users/alfredo/Documents/Codex/2026-09-09/re/work/modelos-nuevos-originales-2026-09-20`.

Se verificaron las huellas SHA-256 antes y después del traslado. Inventario: `work/modelos-nuevos-inventario.json`, junto al archivo. No se borraron originales. Vaca y tanque se usan estáticos; los originales con animaciones permanecen guardados. Se eligió un velero sin decoración pirata, no una réplica histórica. Las otras especies, variantes de tanque y piezas del kit de barcos quedan disponibles en el archivo, sin descargarse con el juego.


### Escenarios con modelos descargados
Se retiran las maquetas geométricas del centro. Los 12 eventos combinan los GLB del tablero con diez modelos CC0 recuperados de los packs archivados: vegetación genérica, surcos, suelo, contenedor, cono, muelle, barco y barril. Se guardan en `public/assets/modelos-3d/eventos`, junto a sus texturas; procedencia y huellas en `origenes.json`. No se sustituyen especies concretas de las casillas por cultivos genéricos. Carga por evento, caché, animación suave de vegetación/barco y materiales propios para el tono apagado de los eventos negativos, sin alterar los originales.

## Identidad de ayudas, Solidaridad, FMI y calzado

Solidaridad combina un centro de reparto con alimentos. Ayuda Solidaria para el desarrollo conserva su descuento del 50% y representa una obra con tractor y grúa. Ayuda USA para el desarrollo usa oficina, suministros y bandera: se corrigió el nombre BID para coincidir con la imagen original, sin cambiar los 1500 de ayuda. Condiciones FMI incorpora oficina, expediente y sello; Zapatos incorpora una fábrica y un par de zapatos con suela y cordones. Estos detalles respetan el carril de las fichas.

## Industrias con producto pendiente de sustituir

Ropa (25), Cigarrillos (26), Mermelada (22) y Cables (33) combinan ahora fábricas Kenney existentes, el producto frontal sin rótulo superior. Los cuatro productos siguen siendo geometría local provisional: no se han presentado como descargas nuevas. Se reutilizan archivos para no aumentar las descargas del tablero. Las otras siete casillas sin GLB conservan su escenografía hasta encontrar una sustitución apropiada.

Descargas propuestas, gratuitas según sus fichas consultadas:

- Ropa: [T-Shirts — folded, 2 piles, de sirkitree](https://poly.pizza/m/25zQhboZIxa), Creative Commons Attribution. Alternativa: [T-shirt de Poly by Google](https://poly.pizza/m/bdOMzzh-fSl).
- Cigarrillos: [Cigarette Low Poly, de pixelAlp](https://sketchfab.com/3d-models/cigarette-low-poly-502485ef22814166b395211895036b5f), ficha de descarga gratuita con CC Attribution. La lectura directa devolvió 403; disponibilidad observada en el resultado indexado y pendiente de confirmar al descargar.
- Mermelada: [Jam jar, de Poly by Google](https://poly.pizza/m/1LVZPYOkD7h), Creative Commons Attribution.

Preferir GLB o glTF con sus texturas y licencia. Revisar orientación, escala y color al recibir los archivos; la selección es una propuesta, no una verificación visual dentro del juego. Para Cables y los cultivos se mantiene el modelo actual: no se eligió un sustituto que desentone solo para eliminar geometría propia.

### Carteles de las casillas

Solo se conservan los carteles de Condiciones FMI (azul) y Solidaridad (rojo). Las industrias y ayudas se identifican por su modelo y la ilustración de la casilla, sin carteles superiores.

### Salida: arco de carrera

Línea a cuadros y arco de salida con banderines de colores inspirados en Latinoamérica, sin presentar una bandera regional oficial. Dos palmeras pequeñas enmarcan la escena. Se retiran el barco, muelle y agua de esta casilla; continúan disponibles en los eventos. El obelisco permanece archivado fuera del repositorio.

### Packs descargados el 29 de septiembre

Integrados tres vehículos de Kenney Car Kit (ambulancia, reparto y camión) y un arbusto con textura de Quaternius Ultimate Stylized Nature para eventos. Licencias y procedencia conservadas. Los diez ZIP recibidos (ocho de modelos y dos de audio) están fuera del repositorio en work/descargas-originales-2026-09-29, con inventario y huellas; solo se publican los archivos seleccionados.
