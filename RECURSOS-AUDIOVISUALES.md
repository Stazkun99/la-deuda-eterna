# Dirección visual y sonidos

## Implementado

Los 12 eventos tienen entorno propio además de los GLB: puerto con agua y muelle, campos con surcos y lluvia/polvo, puesto de mercado, carreteras industriales y barreras de actividad. Barcos, carga, maquinaria, minerales y vegetación siguen ciclos propios. La bomba petrolera utiliza su articulación real. Los entornos y materiales se retiran al terminar el evento.

Las 40 casillas tienen reacción de llegada de 1,5 segundos, antes de avisos/cartas en vista 3D, además de ambiente en reposo. Ejemplos: pasos alternos en zapatos, arco eléctrico en cables, salto del pescado, movimiento de productos y costura/paquetes, maquinaria, cosechas al viento y partículas según temática. Las familias comparten lenguaje visual; no son 40 animaciones esqueléticas. Se conserva el disparo del tanque. El humo queda limitado a petróleo, café elaborado y combustible. Movimiento reducido, desactivación de ambiente y pestaña oculta respetados.

Los 40 sonidos de llegada tienen secuencias diferenciadas. Son síntesis original; no se han añadido grabaciones realistas ni convertido los modelos existentes en recursos HD. Los archivos descargados de audio requieren selección y mezcla posterior.

## Bibliotecas de modelos recomendadas

- [Kenney](https://kenney.nl/assets): mejor continuidad con las piezas actuales. [Factory Kit](https://kenney.nl/assets/factory-kit), 140 recursos CC0; [Pirate Kit](https://kenney.nl/assets/pirate-kit), 70 recursos CC0. Estos packs ya están archivados localmente: no hace falta descargarlos de nuevo.
- [Quaternius](https://quaternius.com/): catálogo amplio de naturaleza, vehículos y personajes. [Ultimate Stylized Nature](https://quaternius.com/packs/ultimatestylizednature.html), 63 modelos, texturas y licencia CC0; candidato para vegetación de mayor riqueza visual, sin sustituir especies agrícolas por plantas incorrectas.
- [Poly Pizza](https://poly.pizza/): piezas concretas de distintos autores. Mantener colores mates, geometría moderada, escala coherente y comprobar licencia individual.
- [KayKit](https://kaylousberg.com/game-assets): catálogo estilizado para comparar recursos y mobiliario. Revisar la edición gratuita y licencia del pack elegido; no todo el catálogo debe darse por gratuito.

Para el salto visual, priorizar materiales y composición coherentes antes que juntar modelos fotorealistas con maquetas low-poly.

## Sonido natural pendiente

Fuentes y lista de grabaciones prioritarias en [public/sonidos/nuevos/LEEME.md](public/sonidos/nuevos/LEEME.md). Mantener originales con licencia. WAV/OGG preferidos; efectos cortos y sin música para las llegadas. Seleccionar y comprimir antes de subir bibliotecas grandes a GitHub.

## Descargas integradas

15 grabaciones OGG (420.330 bytes): pasos, metales, latas, cristal, madera, motor, electrónica y explosión. Precarga limitada a tres archivos simultáneos tras el primer gesto; si una grabación aún no está lista, se usa inmediatamente la síntesis y nunca se reproduce atrasada. Silenciar detiene también las grabaciones. Ambulancia para crisis sanitaria, reparto para cooperación, camión para atasco logístico y arbusto con textura en cosechas/mercados. Los ZIP completos quedan archivados fuera de public.
