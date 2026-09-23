'use strict';
const express = require('express');
const {installHttp}=require('./lib/http-routes');
const {installSockets}=require('./lib/socket-handlers');
const http = require('node:http');
const path = require('node:path');
const { Server } = require('socket.io');
const { Game, GameError } = require('./lib/game');
const { Store } = require('./lib/store');
function createServer(options = {}) {
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
  installHttp(app,()=>healthy);
  installSockets({io,game,transaction,flush});
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
