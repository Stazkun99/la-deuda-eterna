# Modelos 3D del tablero

Selección de los cinco paquetes locales de Kenney: Food Kit, Factory Kit, City Kit Commercial, City Kit Industrial y Nature Kit. Todos incluyen licencia CC0. Se usan **30 GLB en 20 casillas**, con un total aproximado de **1,65 MB** más cuatro paletas de textura compartidas.

## Casillas con modelo

| Casilla | Modelo o composición |
| --- | --- |
| 0 · Salida | Obelisco y dos palmeras de Nature |
| 2 · Banano | Fruto de banano de Food Kit |
| 4, 16, 36 · Solidaridad | Cajas, bolsa de alimentos y pan |
| 9 · Pesca | Canoa de Nature y pescado de Food Kit |
| 10 · Ayuda Solidaria | Suministros de alimentos |
| 13 · Cobre | Entrada de cueva, roca y caja |
| 14 · Estaño | Entrada de cueva, otra roca y caja |
| 15 · Hierro | Entrada de cueva, piedra y caja |
| 20 · Barrera Proteccionista | Portón de madera de Nature |
| 21 · Caramelos | Fábrica, caramelo y caja |
| 23 · Chocolate | Fábrica, tableta de chocolate y caja |
| 24 · Industrialización | Grúa, brazo industrial y caja |
| 27 · Café Elaborado | Fábrica, taza de café y caja |
| 29 · Enlatados | Planta industrial, conserva y caja |
| 30 · Ayuda BID | Edificio comercial bajo usado como oficinas |
| 34 · Electrónica | Planta industrial, pantalla y brazo industrial |
| 37 · Gasolina | Refinería, depósito y tubería con válvula |
| 39 · Sede FMI | Edificio de oficinas bajo |

Estos son modelos de maqueta. Las rocas son genéricas, no reproducciones geológicas de cada mineral; los nombres `roca-cobre`, `roca-estano` y `roca-hierro` indican su destino en el tablero. BID/FMI usan edificios de oficinas genéricos. El portón de Nature sirve como representación provisional de aduana; la barrera activa sobre las industrias mantiene su propia animación. Banano combina el fruto importado con una plantación propia.

## Posibles sustituciones descargadas: 20 casillas

Estas casillas ya tienen decorados propios. La lista identifica posibles sustituciones futuras, no casillas vacías. Las tres casillas de Condiciones FMI pueden compartir un único modelo.

| Casilla | Buscar un modelo de… | Palabras útiles para buscar |
| --- | --- | --- |
| 1 · Azúcar | Cañaveral o cañas de azúcar | sugar cane, sugarcane field |
| 3 · Cacao | Cacaotero o mazorcas | cacao tree, cocoa pod |
| 5 · Algodón | Planta o fardo de algodón | cotton plant, cotton bale |
| 6 · Tabaco | Planta u hojas de tabaco | tobacco plant, tobacco leaves |
| 7 · Café | Cafeto o saco de granos | coffee plant, coffee beans sack |
| 8, 19, 28 · Condiciones FMI | Contrato o carpeta con documentos | contract, documents, paper folder |
| 11 · Ganado | Vaca o corral con ganado | cow, cattle |
| 12 · Fuga de Capitales | Maleta con dinero o avión | money suitcase, airplane |
| 17 · Petróleo | Bomba extractora o pozo | oil pumpjack, oil well |
| 18 · Golpe Militar | Tanque o puesto militar | tank, military checkpoint |
| 22 · Mermelada | Tarro de mermelada | jam jar |
| 25 · Ropa | Prendas o máquina de coser | clothes, sewing machine |
| 26 · Cigarrillos | Cajetilla o cigarrillos | cigarette pack |
| 31 · Zapatos | Zapatos o botas | shoes, boots |
| 32 · 12 Octubre 1492 | Carabela o velero antiguo | caravel, old sailing ship |
| 33 · Cables | Bobina de cable | cable reel, wire spool |
| 35 · Tractores | Tractor agrícola | farm tractor |
| 38 · No Pagar | Pancarta o símbolo de protesta | protest sign, protest banner |

Para próximas incorporaciones: preferir GLB/glTF con materiales y licencia incluida. Una textura de 1K–2K y geometría moderada suelen ser suficientes para este tamaño de maqueta; revisar el modelo en el tablero antes de añadir variantes más pesadas. Los cultivos de bambú, maíz y trigo del kit Nature no se han utilizado como sustitutos de las especies que faltan.

## Archivos y mantenimiento

- `public/assets/modelos-3d/`: únicamente los GLB seleccionados, sus texturas, cinco licencias y `origenes.json`.
- `origenes.json`: nombre original, paquete, autor, licencia y huellas del archivo original y el adaptado. Solo se han corregido nombres y rutas de textura, conservando materiales y geometría.
- `public/board3d-model-catalog.mjs`: asignaciones por casilla y límites de tamaño. Permite cambiar el modelo sin tocar reglas, fichas ni industrias compradas.
- `public/board3d-models.mjs`: carga local de cuatro archivos simultáneos como máximo, reutilización entre copias, ajuste proporcional a la parcela y liberación de recursos al cerrar.
- Los formatos alternativos FBX/OBJ/DAE/STL, miniaturas, accesos directos y modelos no seleccionados se retiran de `public` para no incluirlos en GitHub ni servirlos en producción. Los paquetes originales se conservan en una copia ZIP local fuera del repositorio.

Créditos: **Kenney — https://kenney.nl — Creative Commons Zero (CC0)**. Los textos originales de licencia se encuentran en `public/assets/modelos-3d/licencias/`.

## Composición híbrida

Las 40 casillas tienen escenografía. Azúcar, banano, cacao, algodón, tabaco y café usan cultivos propios, con terreno, surcos y detalles. Se conservan los GLB adecuados como complementos de fábricas, minas, muelles y oficinas. Las demás recuperan las miniaturas locales. Una malla de colores por parcela reduce el número de objetos dibujados. Los decorados mantienen libre la franja de fichas y construcciones.

Enlaces gratuitos verificados: [MODELOS-GRATUITOS.md](MODELOS-GRATUITOS.md).
