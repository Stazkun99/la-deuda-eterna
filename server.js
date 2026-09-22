'use strict';
const express = require('express');
const http = require('node:http');
const path = require('node:path');
const { readFileSync } = require('node:fs');
const { createHash } = require('node:crypto');
const { Server } = require('socket.io');
const { Game, GameError } = require('./lib/game');
const { Store } = require('./lib/store');
const ACTIONS = ['seleccionarPersonaje', 'proponerComercio', 'responderComercio', 'iniciarPartida', 'tirarDado', 'terminarTurno', 'decidirCompraPropiedad', 'responderDecisionPago', 'tirarDadoFuga', 'resolverEleccion', 'pedirPrestamo', 'pagarDeuda', 'construirIndustria', 'expropiarPropiedad', 'subastarPropiedad', 'levantarBarrera', 'responderVotoAlianza', 'pujarSubasta'];
function createServer(options = {}) {
  const structuredDataHashes = [...readFileSync(path.join(__dirname, 'public/index.html'), 'utf8').matchAll(/<script type="(?:application\/ld\+json|importmap)">([\s\S]*?)<\/script>/g)]
    .map(match => "'sha256-" + createHash('sha256').update(match[1]).digest('base64') + "'").join(' ');
  const app = express();
  app.disable('x-powered-by');
  const server = http.createServer(app);
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.RENDER_EXTERNAL_URL || '').split(',').map(s => s.trim()).filter(Boolean);
  const originAllowed = req => {
    const origin = req.headers.origin;
    if (!origin) return true;
    try { const url = new URL(origin); return allowedOrigins.includes(url.origin) || (!allowedOrigins.length && ['http:', 'https:'].includes(url.protocol) && url.host === req.headers.host); } catch { return false; }
  };
  const io = new Server(server, { maxHttpBufferSize: 8192, allowRequest: (req, done) => done(null, originAllowed(req)) });
  const store = options.store || new Store(process.env.DATA_DIR || path.join(__dirname, 'data'));
  let healthy = true, events = [];
  const game = new Game({ rooms: store.load(), ...options.gameOptions, emit: (room, event, data) => events.push({ room, event, data }) });
  const flush = () => { const queue = events; events = []; for (const e of queue) io.to(e.room).emit(e.event, e.data); };
  // Commit before broadcasting; restore memory if persistence fails.
  function transaction(operation, onlyIfChanged = false) {
    const previousRooms = structuredClone(game.rooms), previousConnections = new Map(game.connections);
    events = [];
    try { const result = operation(); if (!onlyIfChanged || result) { store.save(game.rooms); healthy = true; } flush(); return result; }
    catch (error) {
      game.rooms = Object.assign(Object.create(null), previousRooms); game.connections = previousConnections; events = [];
      if (!(error instanceof GameError)) healthy = false;
      throw error;
    }
  }
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', `default-src 'self'; script-src 'self' ${structuredDataHashes}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'`);
    if (req.path === '/' || /\.(html|js)$/.test(req.path)) res.setHeader('Cache-Control', 'no-cache');
    next();
  });
  app.get('/index.html', (_req, res) => res.redirect(301, '/'));
  app.use(['/health', '/api'], (_req, res, next) => { res.setHeader('X-Robots-Tag', 'noindex'); next(); });
  app.get('/health', (_req, res) => res.status(healthy ? 200 : 503).json({ ok: healthy }));
  app.get('/api/catalogo', (_req, res) => {
    const art = require('./public/assets/cartas/manifest.json');
    res.json(require('./cartas').CARTAS_PROPIEDADES.map(p => ({ ...p, ...art.propiedades[p.nombre] })));
  });
  // Only the browser modules needed by the 3D view are public, not all node_modules.
  for (const file of ['three.module.js', 'three.core.js']) app.get('/vendor/three/' + file, (_req, res) => res.sendFile(path.join(__dirname, 'node_modules/three/build', file)));
  app.get('/vendor/three/OrbitControls.js', (_req, res) => res.sendFile(path.join(__dirname, 'node_modules/three/examples/jsm/controls/OrbitControls.js')));
  for (const file of ['loaders/GLTFLoader.js','utils/BufferGeometryUtils.js','utils/SkeletonUtils.js']) {
    app.get('/vendor/three/' + file, (_req, res) => res.sendFile(path.join(__dirname, 'node_modules/three/examples/jsm', file)));
  }
  app.use(express.static(path.join(__dirname, 'public')));
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
  const timer = setInterval(() => { try { transaction(() => game.tick(), true); } catch (e) { console.error('Error de mantenimiento:', e.message); } }, 1000);
  timer.unref();
  return { app, server, io, game, close: () => new Promise(resolve => { clearInterval(timer); io.close(() => resolve()); }) };
}
if (require.main === module) {
  const instance = createServer(), port = Number(process.env.PORT || 3001);
  instance.server.listen(port, () => console.log(`La Deuda Eterna disponible en http://localhost:${port}`));
  for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, () => { instance.close().then(() => process.exit(0)); });
}
module.exports = { createServer };
