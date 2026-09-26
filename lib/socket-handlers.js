'use strict';
const {GameError}=require('./game');
const ACTIONS = ['prepararRevancha', 'pausarPartida', 'tirarDadoInicial', 'seleccionarPersonaje', 'proponerComercio', 'responderComercio', 'iniciarPartida', 'tirarDado', 'terminarTurno', 'decidirCompraPropiedad', 'responderDecisionPago', 'tirarDadoFuga', 'resolverEleccion', 'pedirPrestamo', 'pagarDeuda', 'construirIndustria', 'expropiarPropiedad', 'subastarPropiedad', 'levantarBarrera', 'responderVotoAlianza', 'pujarSubasta'];
function installSockets({io,game,transaction,flush}){
  const connectionsByAddress = new Map();
  io.use((socket, next) => {
    const address = socket.handshake.address, count = connectionsByAddress.get(address) || 0;
    if (count >= 40 || io.engine.clientsCount > 1000) return next(new Error('Demasiadas conexiones. Inténtalo más tarde.'));
    connectionsByAddress.set(address, count + 1); next();
  });
  io.on('connection', socket => {
    let windowStart = Date.now(), count = 0, chatAt = 0;
    const requests = new Set();
    socket.use((_packet, next) => {
      if (Date.now() - windowStart >= 10_000) { windowStart = Date.now(); count = 0; }
      if (++count > 60) { socket.emit('errorAccion', 'Demasiadas acciones. Espera unos segundos.'); return; }
      next();
    });
    function run(operation, ack, errorEvent = 'errorAccion') {
      try { const result = transaction(operation); if (typeof ack === 'function') ack({ ok: true }); return result; }
      catch (error) {
        const message = error instanceof GameError ? error.message : 'No se pudo guardar la acción. Inténtalo de nuevo.';
        if (!(error instanceof GameError)) console.error('Error de acción:', error.message);
        socket.emit(errorEvent, message); if (typeof ack === 'function') ack({ ok: false, error: message });
      }
    }
    socket.on('unirseSala', (data, ack) => {
      const joined = run(() => game.join(socket.id, data), ack, 'errorAcceso');
      if (!joined) return;
      socket.join(joined.room);
      if (joined.replacedSocket) {
        const old = io.sockets.sockets.get(joined.replacedSocket);
        if (old) { old.emit('sesionReemplazada', 'Tu sesión se abrió en otra pestaña.'); old.leave(joined.room); old.disconnect(true); }
      }
      game.publish(game.rooms[joined.room]); flush();
    });
    for (const event of ACTIONS) socket.on(event, (data, ack) => {
      if (!data || typeof data.actionId !== 'string' || data.actionId.length > 80) { socket.emit('errorAccion', 'Recarga la página para actualizar el cliente.'); if (typeof ack === 'function') ack({ ok: false }); return; }
      if (requests.has(data.actionId)) { if (typeof ack === 'function') ack({ ok: true, duplicate: true }); return; }
      run(() => game.action(socket.id, event, data), result => {
        if (result.ok) { requests.add(data.actionId); if (requests.size > 256) requests.delete(requests.values().next().value); }
        if (typeof ack === 'function') ack(result);
      });
    });
    socket.on('enviarMensajeChat', (text, ack) => {
      try {
        const { r, p } = game.current(socket.id);
        if (typeof text !== 'string' || !text.trim() || text.length > 300) throw new GameError('El mensaje debe tener entre 1 y 300 caracteres.');
        if (Date.now() - chatAt < 500) throw new GameError('Espera un momento antes de enviar otro mensaje.');
        chatAt = Date.now(); io.to(r.codigo).emit('nuevoMensajeChat', { nombre: p.nombre, color: p.color, texto: text.trim() });
        if (typeof ack === 'function') ack({ ok: true });
      } catch (e) { socket.emit('errorAccion', e instanceof GameError ? e.message : 'No se pudo enviar el mensaje.'); if (typeof ack === 'function') ack({ ok: false }); }
    });
    socket.on('abandonarSala', (_data, ack) => { const room = run(() => game.leave(socket.id), ack); if (room) { socket.leave(room); socket.emit('salaAbandonada'); } });
    socket.on('disconnect', () => {
      const address = socket.handshake.address, count = connectionsByAddress.get(address) || 1;
      if (count <= 1) connectionsByAddress.delete(address); else connectionsByAddress.set(address, count - 1);
      try { transaction(() => game.disconnect(socket.id)); } catch (e) { console.error('No se pudo guardar desconexión:', e.message); }
    });
  });
}
module.exports={installSockets};
