# La Deuda Eterna — edición web

Juego multijugador para 2–4 personas, con Node.js, Express y Socket.IO. El tablero utiliza 40 casillas HTML: fichas, propietarios e industrias se dibujan dentro de la casilla correspondiente, sin imagen de fondo ni coordenadas de movimiento en píxeles.

## Ejecutar en local

Requiere Node.js 22 o posterior.

```sh
npm ci
npm test
npm start
```

Abre http://localhost:3001. Para probar una partida tú solo, abre una ventana normal y otra de incógnito. Dos pestañas del mismo perfil comparten identidad: la última conexión sustituye a la anterior.

El anfitrión puede iniciar con al menos dos jugadores conectados. Al iniciar se liberan las plazas desconectadas. Las nuevas partidas reinician todo el tablero y los recursos.

## Qué incluye

- Salas privadas por código, hasta cuatro jugadores y control de anfitrión.
- Tablero HTML con grupos de colores, propietarios, fichas e industrias por casilla; vista compacta para móvil y detalles al pulsar.
- Turnos con fases explícitas: gestión previa, dados, compra/pago/elección, gestión final y fin de turno.
- Identidad pública separada del secreto de reconexión. El servidor guarda solo el hash del secreto y nunca lo envía a los demás jugadores.
- Pagos calculados por el servidor. El navegador solo elige el método de pago y responde a una decisión identificada.
- Validación de eventos, límites de tamaño y frecuencia, protección frente a acciones repetidas y comprobación del turno.
- Chat y nombres renderizados como texto, con política de seguridad de contenido.
- Rentas según el precio y el número de industrias; cadenas en Sur y Norte; relación Cobre–Cables corregida.
- Alianzas con caja y oro comunes, conservando las deudas individuales. Propietarios identificados de forma estable, incluso al salir un jugador.
- Subastas de 30 segundos, pujas validadas y compra del FMI al 50% si no hay ofertas.
- Barrera global; monopolio opcional habilitado por el anfitrión; elecciones para Industrialización, Dumping y el pacto con el FMI.
- Las 17 condiciones del catálogo tienen efectos. Se conserva el catálogo disponible de 20 cartas de Solidaridad, incluida la corrección de Ecuador.
- Mazos barajados al inicio y rotados al sacar cartas.
- Guardado automático de estado, decisiones pendientes y las últimas 100 entradas del registro. El chat es transitorio.

## Persistencia y reconexión

Por defecto se guarda en `data/partidas.json`, fuera de `public/` e ignorado por Git. Cada cambio se escribe primero en un archivo temporal y se renombra; si falla el guardado, se revierte la acción y se notifica al cliente. Un archivo corrupto detiene el arranque con error: no se reemplaza por una partida vacía.

- `DATA_DIR`: carpeta de guardado. Debe ser escribible por el proceso.
- `PORT`: puerto HTTP; por defecto 3001.
- `ALLOWED_ORIGINS`: orígenes adicionales/autorizados, separados por comas, sin barra final. Si no se configura, se utiliza `RENDER_EXTERNAL_URL` cuando existe; en local se admite el mismo origen del servidor.
- `GET /health`: devuelve 200 cuando el servicio está sano, o 503 después de un fallo de guardado.

La sesión se conserva en el almacenamiento del navegador. Si lo borras, pierdes el secreto necesario para recuperar esa plaza. No es un sistema de cuentas con correo y contraseña.

Una desconexión da 60 segundos de margen al jugador actual. Los turnos tienen un máximo de tres minutos. Después se resuelven las decisiones pendientes sin oro: se rechazan compras y pactos con el FMI, y se aplica la primera opción de una elección obligatoria. Para cubrir efectivo negativo por inactividad, se piden préstamos hasta el límite y se liquidan propiedades al 50% si es necesario. Si no queda ningún jugador activo conectado, la partida se pausa. Las salas sin conexiones caducan tras 24 horas de inactividad.

## Subir esta versión a Render

1. Revisa el diff y haz el commit en GitHub.
2. En el servicio existente, usa `npm ci` como comando de instalación y `npm start` como comando de arranque, con Node.js 22 o posterior. También sigue funcionando `node server.js` si ya es tu comando de arranque.
3. Configura `/health` como comprobación de salud.
4. Para conservar partidas entre reinicios y despliegues, conecta un disco persistente y establece, por ejemplo, `DATA_DIR=/var/data/deuda-eterna` si tu disco está montado en `/var/data`.
5. Comprueba una sala con dos navegadores y una reconexión después del despliegue.

**El sistema de archivos normal de Render es efímero.** Guardar JSON en el disco local del servicio no garantiza que sobreviva a un despliegue. El plan gratuito no permite añadir discos persistentes: en ese caso hará falta una base de datos externa o un plan compatible con disco. Documentación: https://render.com/docs/disks y https://render.com/docs/free.

Esta versión está diseñada para **un único proceso/instancia**. No uses varias réplicas ni un clúster de procesos sobre el mismo archivo; escalar requiere mover el estado a un almacén compartido y coordinar las acciones.

El protocolo cambió respecto a la versión anterior: al desplegar, recarga los navegadores. Las partidas de la versión anterior solo existían en memoria y no se pueden migrar desde esta copia local. Planifica el despliegue cuando no haya partidas en curso.

## Adaptación de las reglas

Se contrastó la lógica con el reglamento conservado junto al proyecto. Esta edición no se anuncia como una reproducción completa de todas las variantes oficiales. Diferencias deliberadas:

- Participan 2–4 jugadores y se permite una alianza de hasta cuatro; el texto original describe 3–6 jugadores y parejas/tríos.
- Préstamos en cuotas de $5.000; al llegar al límite personal, un préstamo solicitado por un aliado se imputa al primer miembro de su grupo que conserve capacidad.
- La amortización de hasta $5.000 está disponible antes de tirar o en gestión final, sin visitar el FMI; los intereses ordinarios se cobran al pasar o llegar al FMI. Alcanzar un umbral de devaluación cambia los dados, pero no teletransporta al FMI.
- El peaje de la barrera lo paga un jugador o su caja de alianza; no hay aportaciones voluntarias entre grupos.
- Industrialización permite elegir terreno libre con su primera industria gratis. Si no quedan libres, permite mejorar una industria propia.
- El monopolio opcional compra una propiedad y su exportación; no existe una operación para comprar la cadena completa. Romper una cadena cuesta $4.000 de impuesto.
- La alianza agrupa a quienes acepten la votación; no existe interfaz para negociar regalos, ventas privadas o disolver una alianza.
- La victoria automática se limita al triunfo por KO (las doce propiedades con tres nacionales y tres multinacionales) o al último jugador activo. No se implementan declaraciones de empate ni retirada por los otros grados de triunfo.
- El material disponible en `cartas.js` contiene 20 Solidaridad, aunque el reglamento enumera 21; no se ha inventado una carta adicional.
- Se permiten saldos temporales negativos al cobrar pagos obligatorios, pero deben resolverse antes de terminar o tirar en el siguiente turno.

## Pruebas y estructura

```sh
npm test
npm run check
```

Las pruebas utilizan el ejecutor de Node y el cliente distribuido con Socket.IO; no añaden dependencias. Cubren reglas, autorización, decisiones repetidas, desconexiones, persistencia, fallos de disco, comunicación entre clientes y una simulación prolongada de acciones. Los tests del servidor abren puertos locales temporales y no contactan con producción.

- `server.js`: HTTP, transporte Socket.IO, límites y transacciones de guardado.
- `lib/game.js`: reglas, salas, turnos y proyección pública del estado.
- `lib/data.js`: casillas y grupos.
- `lib/store.js`: carga y guardado atómico.
- `cartas.js`: catálogo de cartas y precios de construcción.
- `public/`: tablero, controles y estilos.
- `test/`: pruebas automáticas.

`public/tablero.jpg` se conserva como referencia del proyecto, pero ya no se carga ni se usa para jugar.
