'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { once } = require('node:events');
const Entry = require('../public/entry-link');
const { build } = require('../scripts/build-landing');
const { createServer } = require('../server');
const { io } = require('../node_modules/socket.io/client-dist/socket.io.js');

test('formulario espera salud real, evita doble envío y cancelar impide una redirección tardía', async () => {
  const vm = require('node:vm'), handlers = {}, nodes = {}, requests = [], navigations = [];
  for (const id of ['entry-form', 'nombre', 'codigo', 'entry-status', 'cancelar', 'crear', 'unirse']) nodes[id] = { value: '', addEventListener(event, fn) { handlers[id + ':' + event] = fn; }, setAttribute() {}, removeAttribute() {}, focus() {} };
  const context = {
    document: { getElementById: id => nodes[id], body: { dataset: { gameUrl: 'https://game.example/' } } },
    window: { addEventListener() {}, location: { assign: url => navigations.push(url) } },
    localStorage: { getItem: () => null, setItem() {} }, GameEntry: Entry, URL, AbortSignal, crypto: require('node:crypto').webcrypto,
    fetch: () => new Promise(resolve => requests.push(resolve)), setTimeout, Date
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../landing/landing.js'), 'utf8'), context);
  nodes.nombre.value = 'Luna'; nodes.codigo.value = 'ANDES';
  const event = { preventDefault() {}, submitter: { value: 'unirse' } };
  const first = handlers['entry-form:submit'](event);
  await handlers['entry-form:submit'](event);
  assert.equal(requests.length, 1); assert.equal(nodes.nombre.disabled, true); assert.equal(navigations.length, 0);
  nodes.cancelar.onclick();
  requests.shift()({ ok: true, json: async () => ({ ok: true }) }); await first;
  assert.equal(navigations.length, 0); assert.equal(nodes.nombre.disabled, false);
  const second = handlers['entry-form:submit'](event);
  requests.shift()({ ok: true, json: async () => ({ ok: true }) }); await second;
  assert.equal(navigations.length, 1);
  assert.deepEqual(Entry.parse(new URL(navigations[0]).hash), { nombre: 'Luna', sala: 'ANDES', crear: false });
});

test('entrada conserva acentos y caracteres especiales sin transferir credenciales', () => {
  const data = { nombre: 'Staz & Perú #1', sala: 'ANDES', crear: true };
  const link = new URL(Entry.build('https://juego.example/', data));
  assert.equal(link.search, '');
  assert.deepEqual(Entry.parse(link.hash), data);
  assert.deepEqual(Entry.parse('#entrada=unirse&nombre=Luna&sala=andes&sessionToken=ajeno'), { nombre: 'Luna', sala: 'ANDES', crear: false });
  for (const hash of ['#entrada=borrar&nombre=X&sala=ABC', '#entrada=crear&nombre=&sala=ABC', '#entrada=unirse&nombre=X&sala=../', '#entrada=crear&nombre=' + 'x'.repeat(41) + '&sala=ABC', '#entrada=crear&nombre=X&sala=ABC' + 'x'.repeat(1600)]) assert.equal(Entry.parse(hash), null);
  assert.throws(() => Entry.build('javascript:alert(1)', data));
});

test('compilación genera SEO del origen real y solo publica archivos de portada', t => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'deuda-landing-'));
  t.after(() => { if (path.dirname(output) === path.resolve(os.tmpdir()) && path.basename(output).startsWith('deuda-landing-')) fs.rmSync(output, { recursive: true, force: true }); });
  build({ siteUrl: 'https://portada.example', gameUrl: 'https://partidas.example', output });
  const html = fs.readFileSync(path.join(output, 'index.html'), 'utf8');
  assert.match(html, /canonical" href="https:\/\/portada.example\/"/);
  assert.match(html, /data-game-url="https:\/\/partidas.example\/"/);
  assert.ok(!html.includes('__SITE_URL__'));
  const json = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(json.url, 'https://portada.example/');
  assert.match(fs.readFileSync(path.join(output, 'sitemap.xml'), 'utf8'), /<loc>https:\/\/portada.example\/<\/loc>/);
  assert.match(fs.readFileSync(path.join(output, 'robots.txt'), 'utf8'), /Sitemap: https:\/\/portada.example\/sitemap.xml/);
  assert.ok(fs.existsSync(path.join(output, 'preview.png')));
  assert.ok(!fs.existsSync(path.join(output, 'app.js')));
  assert.throws(() => build({ siteUrl: 'https://same.example', gameUrl: 'https://same.example', output }));
  assert.throws(() => build({ siteUrl: 'https://user:pass@example.org', output }));
});

test('entrada de portada crea, une y recupera plaza sin duplicarla; health público no abre API privada', { timeout: 15000 }, async t => {
  let snapshot = {};
  const instance = createServer({ store: { load: () => snapshot, save: r => { snapshot = structuredClone(r); } } });
  instance.server.listen(0, '127.0.0.1'); await once(instance.server, 'listening');
  t.after(() => instance.close());
  const url = 'http://127.0.0.1:' + instance.server.address().port;
  const health = await fetch(url + '/health', { headers: { Origin: 'https://portada.example' } });
  assert.equal(health.headers.get('access-control-allow-origin'), '*');
  assert.equal(health.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await health.json(), { ok: true });
  assert.equal((await fetch(url + '/api/catalogo')).headers.get('access-control-allow-origin'), null);
  const connect = async () => { const socket = io(url, { transports: ['websocket'], forceNew: true, reconnection: false }); t.after(() => socket.disconnect()); await once(socket, 'connect'); return socket; };
  const emit = (socket, data) => new Promise((resolve, reject) => socket.timeout(3000).emit('unirseSala', data, (e, r) => e ? reject(e) : resolve(r)));
  const hostData = { ...Entry.parse(new URL(Entry.build(url, { nombre: 'Staz', sala: 'ANDES', crear: true })).hash), userId: 'usuario_staz', sessionToken: 'a'.repeat(64) };
  const host = await connect(); assert.equal((await emit(host, hostData)).ok, true);
  assert.equal((await emit(host, hostData)).ok, true);
  assert.equal(instance.game.rooms.ANDES.jugadores.length, 1);
  const guest = await connect();
  assert.equal((await emit(guest, { ...Entry.parse('#entrada=unirse&nombre=Luna&sala=ANDES'), userId: 'usuario_luna', sessionToken: 'b'.repeat(64) })).ok, true);
  assert.equal(instance.game.rooms.ANDES.jugadores.length, 2);
  host.disconnect(); const reconnected = await connect();
  assert.equal((await emit(reconnected, { ...hostData, crear: false })).ok, true);
  assert.equal(instance.game.rooms.ANDES.jugadores.length, 2);
  const missing = await connect();
  assert.equal((await emit(missing, { nombre: 'Nadie', sala: 'NOEXISTE', crear: false, userId: 'usuario_nadie', sessionToken: 'c'.repeat(64) })).ok, false);
  assert.equal(instance.game.rooms.NOEXISTE, undefined);
});
