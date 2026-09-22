'use strict';

const { randomUUID, randomInt, createHash, timingSafeEqual } = require('node:crypto');
const { TABLERO, GRUPOS_CADENAS, COLORES } = require('./data');
const { CARTAS_CONDICIONES, CARTAS_SOLIDARIDAD, CARTAS_PROPIEDADES } = require('../cartas');
const CHARACTERS = require('../public/characters');
const CARD_ART = require('../public/assets/cartas/manifest.json');

class GameError extends Error {}
function requireRule(condition, message) { if (!condition) throw new GameError(message); }
const hash = token => createHash('sha256').update(token).digest('hex');
const copy = value => structuredClone(value);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

class Game {
  constructor({ rooms = {}, emit = () => {}, now = Date.now, dice = () => randomInt(1, 7), chooseIndex = randomInt } = {}) {
    this.rooms = Object.assign(Object.create(null), rooms);
    this.emit = emit;
    this.now = now;
    this.dice = dice;
    this.chooseIndex = chooseIndex;
    this.connections = new Map();
    for (const r of Object.values(this.rooms)) {
      for (const p of r.jugadores) { p.conectado = false; p.socketId = null; }
      r.desconectadoDesde = this.now();
    }
  }

  log(r, message) { r.registro = [...(r.registro || []), message].slice(-100); this.emit(r.codigo, 'mensajeLog', message); }
  player(r, id) { return r.jugadores.find(p => p.id === id); }
  team(r, p) { return p.alianzaId ? r.jugadores.filter(q => q.alianzaId === p.alianzaId) : [p]; }
  sameTeam(a, b) { return !!a && !!b && (a.id === b.id || !!a.alianzaId && a.alianzaId === b.alianzaId); }
  owns(r, p, c) { return this.sameTeam(p, this.player(r, c.dueño)); }
  interaction(r, from, action, to, amount = null, detail = '') {
    const name = who => typeof who === 'string' ? who : who.nombre + (who.alianzaId ? ' (alianza)' : '');
    const item = { id: randomUUID(), fecha: this.now(), origen: name(from), accion: action, destino: name(to), monto: amount, detalle: detail, color: typeof from === 'string' ? '#214f43' : from.color };
    r.interacciones = [...(r.interacciones || []), item].slice(-60);
  }
  money(r, p, delta, meta = {}) {
    for (const q of this.team(r, p)) q.dinero += delta;
    if (delta && meta !== false) this.interaction(r, delta < 0 ? p : meta.contraparte || 'Banca', meta.accion || (delta < 0 ? 'Pago' : 'Cobro'), delta < 0 ? meta.contraparte || 'Banca' : p, Math.abs(delta), meta.detalle || '');
  }
  gold(r, p, delta, notify = true) {
    for (const q of this.team(r, p)) q.oro += delta;
    if (delta && notify) this.interaction(r, delta < 0 ? p : 'Banca', delta < 0 ? 'Entrega de oro' : 'Entrega de oro', delta < 0 ? 'Banca' : p, null, Math.abs(delta) + (Math.abs(delta) === 1 ? ' lingote' : ' lingotes'));
  }
  sur(r, name) { return r.tablero.find(c => c.region === 'sur' && c.nombre === name); }
  north(r, c) { return r.tablero.find(n => n.baseSur === c.nombre); }
  info(c) { return CARTAS_PROPIEDADES.find(p => p.nombre === (c.baseSur || c.nombre)); }
  assets(r, p) { return r.tablero.filter(c => c.region === 'sur' && this.owns(r, p, c)); }
  group(r, c) {
    const base = c.region === 'sur' ? c : this.sur(r, c.baseSur);
    const south = GRUPOS_CADENAS[base.grupo].map(id => r.tablero[id]);
    const cells = c.region === 'sur' ? south : south.map(s => this.north(r, s));
    const field = c.region === 'sur' ? 'industriasNac' : 'industriasExp';
    return cells.every(s => s[field] > 0 && this.sameTeam(this.player(r, s.dueño), this.player(r, c.dueño))) ? cells : [c];
  }
  rent(r, c) {
    const field = c.region === 'sur' ? 'industriasNac' : 'industriasExp';
    return this.group(r, c).reduce((total, s) => total + s.precio * (s[field] || 0), 0);
  }
  investment(r, c) {
    const i = this.info(c), n = this.north(r, c);
    return c.precio + i.nac.slice(0, c.industriasNac).reduce((a, b) => a + b, 0) + i.exp.slice(0, n.industriasExp).reduce((a, b) => a + b, 0);
  }
  transfer(r, c, owner) {
    c.dueño = owner;
    const n = this.north(r, c);
    n.dueño = n.industriasExp > 0 ? owner : null;
    if (owner === null) { c.industriasNac = 0; n.industriasExp = 0; n.dueño = null; }
  }
  state(r) {
    const state = copy(r);
    delete state.mazos;
    for (const p of state.jugadores) {
      delete p.tokenHash;
      delete p.socketId;
      p.enAlianza = !!p.alianzaId;
      p.barreraProteccionista = r.barreraProteccionista;
      p.propiedades = r.tablero.filter(c => this.owns(r, this.player(r, p.id), c)).map(c => c.nombre);
    }
    state.deudaFMIGlobal = r.jugadores.reduce((sum, p) => sum + p.deudaPersonal, 0);
    return state;
  }
  publish(r) { r.actualizado = this.now(); this.emit(r.codigo, 'actualizarEstado', this.state(r)); }
  pending(r, type, p, data = {}) {
    r.pendiente = { id: randomUUID(), tipo: type, jugadorId: p.id, ...data };
    r.fase = type;
  }
  join(socketId, data) {
    requireRule(object(data), 'Datos de acceso inválidos.');
    const { nombre, userId, sessionToken, sala, crear = false } = data;
    requireRule(typeof crear === 'boolean', 'Modo de acceso inválido.');
    requireRule(typeof nombre === 'string' && nombre.trim().length >= 1 && nombre.trim().length <= 40, 'El nombre debe tener entre 1 y 40 caracteres.');
    requireRule(typeof sala === 'string' && /^[A-Za-z0-9_-]{3,12}$/.test(sala.trim()), 'El código debe tener entre 3 y 12 letras, números, guiones o guiones bajos.');
    requireRule(typeof userId === 'string' && /^[A-Za-z0-9_-]{8,80}$/.test(userId), 'Identificador inválido. Recarga la página.');
    requireRule(typeof sessionToken === 'string' && /^[a-f0-9]{64}$/.test(sessionToken), 'Sesión inválida. Recarga la página.');
    const code = sala.trim().toUpperCase();
    const current = this.connections.get(socketId);
    requireRule(!current || current.room === code && this.player(this.rooms[code], current.id)?.userId === userId, 'Abandona tu sala antes de entrar en otra.');
    let r = this.rooms[code];
    requireRule(!crear || !r || !!current, 'Ese código ya existe. Crea otra sala.');
    if (!r) {
      requireRule(crear, 'La sala no existe. Comprueba el código o crea una nueva.');
      requireRule(Object.keys(this.rooms).length < 200, 'El servidor está lleno. Inténtalo más tarde.');
      r = this.rooms[code] = { codigo: code, enJuego: false, finalizada: false, jugadores: [], tablero: copy(TABLERO), turnoActual: 0, turnoId: 0, fase: 'espera', pendiente: null, actualizado: this.now(), barreraProteccionista: false, mazos: {}, monopolio: false };
    }
    let p = r.jugadores.find(j => j.userId === userId);
    let replacedSocket = null;
    if (p) {
      requireRule(timingSafeEqual(Buffer.from(p.tokenHash, 'hex'), Buffer.from(hash(sessionToken), 'hex')), 'No puedes recuperar esta plaza con esta sesión.');
      replacedSocket = p.socketId !== socketId ? p.socketId : null;
      if (replacedSocket) this.connections.delete(replacedSocket);
      p.nombre = nombre.trim();
    } else {
      requireRule(!r.enJuego, 'La partida ya comenzó.');
      requireRule(r.jugadores.length < 4, 'La sala está llena (máximo 4 jugadores).');
      p = { id: randomUUID(), userId, tokenHash: hash(sessionToken), nombre: nombre.trim(), esLider: r.jugadores.length === 0, color: COLORES.find(c => !r.jugadores.some(j => j.color === c)) };
      p.personaje = null;
      this.resetPlayer(p);
      r.jugadores.push(p);
    }
    p.socketId = socketId;
    p.conectado = true;
    if (!r.enJuego && !r.jugadores.some(q => q.esLider && q.conectado)) {
      for (const q of r.jugadores) q.esLider = q.id === p.id;
    }
    this.connections.set(socketId, { room: code, id: p.id });
    if (r.jugadores[r.turnoActual]?.conectado) r.desconectadoDesde = null;
    else if (r.desconectadoDesde == null) r.desconectadoDesde = this.now();
    if (r.enJuego && r.jugadores[r.turnoActual]?.id === p.id) r.limiteTurno = Math.max(r.limiteTurno, this.now() + 60_000);
    this.log(r, `${p.nombre} entró en la sala ${code}.`);
    return { room: code, replacedSocket };
  }
  resetPlayer(p) {
    Object.assign(p, { posicion: 0, dinero: 0, deudaPersonal: 0, oro: 3, enQuiebra: false, alianzaId: null, turnosPerdidos: 0, resguardoGolpe: false, resguardoFuga: false, sombreroSandino: false, noPagarVuelta: false, industriasCerradas: false, interesEspecial: null, sinPactos: false });
  }
  shuffle(cards) {
    const ids = cards.map(c => c.id);
    for (let i = ids.length - 1; i > 0; i--) { const j = randomInt(i + 1); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    return ids;
  }
  draw(r, type) { const deck = r.mazos[type]; const id = deck.shift(); deck.push(id); return (type === 'solidaridad' ? CARTAS_SOLIDARIDAD : CARTAS_CONDICIONES).find(c => c.id === id); }
  current(socketId) {
    const ref = this.connections.get(socketId), r = ref && this.rooms[ref.room], p = r && this.player(r, ref.id);
    requireRule(p && p.socketId === socketId, 'Primero entra en una sala.');
    return { r, p };
  }
  action(socketId, event, data = {}) {
    requireRule(object(data), 'Datos de acción inválidos.');
    const { r, p } = this.current(socketId);
    if (event === 'seleccionarPersonaje') {
      requireRule(!r.enJuego, 'El personaje se elige antes de empezar la partida.');
      requireRule(CHARACTERS.some(c => c.id === data.personaje), 'Personaje no válido.');
      requireRule(!r.jugadores.some(q => q.id !== p.id && q.personaje === data.personaje), 'Ese personaje ya lo tiene otro jugador.');
      p.personaje = data.personaje;
      this.publish(r);
      return;
    }
    if (event === 'iniciarPartida') {
      requireRule(p.esLider && !r.enJuego, 'Solo el anfitrión puede iniciar la partida.');
      requireRule(r.jugadores.filter(j => j.conectado).length >= 2, 'Se necesitan al menos dos jugadores conectados.');
      requireRule(typeof data.monopolio === 'boolean', 'Indica si se permite monopolio.');
      r.jugadores = r.jugadores.filter(j => j.conectado);
      for (const q of r.jugadores) if (!CHARACTERS.some(c => c.id === q.personaje)) {
        q.personaje = CHARACTERS.find(c => !r.jugadores.some(j => j.personaje === c.id)).id;
      }
      r.tablero = copy(TABLERO);
      r.barreraProteccionista = false;
      r.monopolio = data.monopolio;
      r.finalizada = false; r.resultado = null; r.enJuego = true; r.pendiente = null;
      r.registro = []; r.interacciones = []; r.ultimaCarta = null; r.ultimaTirada = null;
      const tiradas = r.jugadores.map(q => {
        this.resetPlayer(q);
        const dado = this.dice(); q.dinero = 5000 + dado * 200;
        this.log(r, `${q.nombre} sacó ${dado}: $5.000 + $${dado * 200} = $${q.dinero} iniciales.`);
        return { jugadorId: q.id, nombre: q.nombre, dado, dinero: q.dinero };
      });
      const mayor = Math.max(...tiradas.map(t => t.dado));
      const empatados = tiradas.filter(t => t.dado === mayor);
      // Uniform draw among tied players; neither joining order nor host status breaks a tie.
      const primero = empatados.length === 1 ? empatados[0] : empatados[this.chooseIndex(empatados.length)];
      r.inicioPartida = { id: randomUUID(), tiradas, primeroId: primero.jugadorId, empate: empatados.length > 1 };
      if (empatados.length > 1) this.log(r, `Empate a ${mayor} entre ${empatados.map(t => t.nombre).join(', ')}. Sorteo de desempate: empieza ${primero.nombre}.`);
      else this.log(r, `${primero.nombre} empieza por sacar el dado más alto (${mayor}).`);
      r.mazos = { solidaridad: this.shuffle(CARTAS_SOLIDARIDAD), condiciones: this.shuffle(CARTAS_CONDICIONES) };
      r.turnoActual = r.jugadores.findIndex(q => q.id === primero.jugadorId); this.beginTurn(r);
      this.log(r, '¡Comienza la partida! Gestiona tus industrias antes de tirar los dados.');
    } else {
      requireRule(r.enJuego && !p.enQuiebra, 'La partida no está activa para este jugador.');
      if (event === 'responderVotoAlianza') this.vote(r, p, data);
      else if (event === 'responderComercio') this.respondTrade(r, p, data);
      else if (event === 'pujarSubasta') this.bid(r, p, data);
      else {
        requireRule(r.jugadores[r.turnoActual]?.id === p.id && data.turnoId === r.turnoId, 'Esta acción no corresponde al turno actual.');
        requireRule(!['votacion', 'subasta', 'comercio'].includes(r.fase), 'Resuelve primero la votación, subasta u oferta de comercio.');
        switch (event) {
          case 'proponerComercio': this.proposeTrade(r, p, data); break;
          case 'tirarDado': this.roll(r, p); break;
          case 'terminarTurno':
            requireRule(r.fase === 'gestion', 'Primero tira los dados y resuelve las decisiones.');
            this.solvent(r, p); this.nextTurn(r); break;
          case 'decidirCompraPropiedad': this.buy(r, p, data); break;
          case 'tirarDadoFuga': this.rollFlight(r, p, data); break;
          case 'responderDecisionPago': this.pay(r, p, data); break;
          case 'resolverEleccion': this.choose(r, p, data); break;
          case 'pedirPrestamo': this.loan(r, p, data.monto); break;
          case 'pagarDeuda':
            requireRule(['tirada', 'gestion'].includes(r.fase), 'Resuelve primero la decisión pendiente.');
            requireRule(p.deudaPersonal > 0, 'No tienes deuda pendiente.');
            { const amount = data.monto === undefined ? Math.min(5000, p.deudaPersonal) : data.monto; requireRule(Number.isSafeInteger(amount) && amount > 0 && amount <= p.deudaPersonal, 'Introduce un importe entero entre $1 y tu deuda pendiente.'); requireRule(p.dinero >= amount, 'No tienes efectivo suficiente.'); this.money(r, p, -amount, {accion:'Amortización',contraparte:'FMI'}); p.deudaPersonal -= amount; this.log(r, `${p.nombre} amortizó $${amount}.`); }
            break;
          case 'construirIndustria': this.build(r, p, data); break;
          case 'expropiarPropiedad': this.expropriate(r, p, data); break;
          case 'subastarPropiedad': this.auction(r, p, data); break;
          case 'levantarBarrera':
            requireRule(['tirada', 'gestion'].includes(r.fase) && r.barreraProteccionista, 'No hay una barrera que puedas levantar ahora.');
            requireRule(p.dinero >= 2000, 'Necesitas $2.000.');
            this.money(r, p, -2000, {accion:'Pago de barrera',contraparte:'FMI'}); r.barreraProteccionista = false; this.log(r, `${p.nombre} levantó la barrera para todos.`); break;
          default: throw new GameError('Acción desconocida.');
        }
      }
      this.checkVictory(r);
    }
    this.publish(r);
  }
  beginTurn(r) {
    r.turnoId++; r.fase = 'tirada'; r.pendiente = null; r.continuacion = null; r.descuento = false; r.monopolizado = false;
    r.limiteTurno = this.now() + 180_000;
    r.desconectadoDesde = r.jugadores[r.turnoActual]?.conectado ? null : this.now();
  }
  nextTurn(r) {
    if (!r.enJuego) return;
    const count = r.jugadores.length;
    for (let i = 0; i < count; i++) {
      r.turnoActual = (r.turnoActual + 1) % count;
      if (!r.jugadores[r.turnoActual].enQuiebra && r.jugadores[r.turnoActual].conectado) { this.beginTurn(r); return; }
    }
    // No connected player: preserve the game rather than rolling unattended.
    this.beginTurn(r);
  }
  loan(r, p, requested) {
    const borrower = p.deudaPersonal < 30000 ? p : this.team(r, p).find(q => q.deudaPersonal < 30000);
    requireRule(borrower, 'Tu grupo ha alcanzado el límite de deuda.');
    const capacity = 30000 - borrower.deudaPersonal;
    const amount = requested === undefined ? Math.min(5000, capacity) : requested;
    requireRule(Number.isSafeInteger(amount) && amount > 0 && amount <= capacity, `Introduce un importe entero entre $1 y $${capacity}.`);
    borrower.deudaPersonal += amount; this.money(r, borrower, amount, {accion:'Préstamo',contraparte:'FMI'});
    this.log(r, `${borrower.nombre} recibió un préstamo de $${amount}.`);
  }
  solvent(r, p) {
    if (p.dinero >= 0) return;
    const canBorrow = this.team(r, p).some(q => q.deudaPersonal < 30000);
    if (!canBorrow && !this.assets(r, p).length) { this.bankrupt(r, p); return; }
    requireRule(false, canBorrow ? 'Cubre el saldo negativo con un préstamo antes de terminar.' : 'Subasta una propiedad para cubrir el saldo negativo.');
  }
  bankrupt(r, p) {
    for (const q of this.team(r, p)) { q.enQuiebra = true; q.dinero = 0; }
    this.log(r, `${p.nombre} y su grupo han quedado en quiebra.`);
    this.checkVictory(r);
  }
  debit(r, p, amount, recipient = null, detail = '') {
    requireRule(Number.isSafeInteger(amount) && amount >= 0, 'Importe inválido.');
    this.money(r, p, -amount, false);
    if (recipient) this.money(r, recipient, amount, false);
    if (amount) this.interaction(r, p, detail.startsWith('Renta') ? 'Pago de renta' : 'Pago', recipient || 'FMI', amount, detail);
  }
  payment(r, p, amount, reason, ownerId = null, oroPermitido = true) {
    if (amount <= 0) return;
    this.pending(r, 'pago', p, { monto: amount, motivo: reason, dueñoId: ownerId, oroPermitido });
  }
  validateDecision(r, p, data, type) {
    requireRule(r.fase === type && r.pendiente?.tipo === type && r.pendiente.jugadorId === p.id && r.pendiente.id === data.decisionId, 'Esta decisión ya no está pendiente.');
    return r.pendiente;
  }
  pay(r, p, data) {
    const pending = this.validateDecision(r, p, data, 'pago');
    requireRule(typeof data.usarOro === 'boolean', 'Selecciona efectivo u oro.');
    if (data.usarOro) {
      requireRule(pending.oroPermitido && p.oro > 0, 'No puedes usar oro para este pago.');
      this.gold(r, p, -1, false);
      const recipient = this.player(r, pending.dueñoId);
      if (recipient) this.gold(r, recipient, 1, false);
      this.interaction(r, p, 'Pago con oro', recipient || 'FMI', null, '1 lingote · ' + pending.motivo);
    } else this.debit(r, p, pending.monto, this.player(r, pending.dueñoId), pending.motivo);
    this.log(r, `${p.nombre} pagó ${data.usarOro ? 'un lingote' : '$' + pending.monto}: ${pending.motivo}.`);
    r.pendiente = null; r.fase = 'gestion';
    if (r.continuacion) { const position = r.continuacion.posicion; r.continuacion = null; this.land(r, p, position); }
  }
  rollFlight(r, p, data) {
    this.validateDecision(r, p, data, 'fuga');
    const value = this.dice(), amount = value * 1000;
    r.ultimaTirada = { id: randomUUID(), tipo: 'fuga', jugador: p.nombre, jugadorId: p.id, dados: [value], total: value };
    this.debit(r, p, amount, null, 'Fuga de capitales');
    this.log(r, `${p.nombre} tiró ${value} en Fuga de Capitales y pagó $${amount}.`);
    r.pendiente = null; r.fase = 'gestion';
  }
  roll(r, p) {
    requireRule(r.fase === 'tirada', 'Ya has tirado o tienes una decisión pendiente.');
    this.solvent(r, p);
    if (!r.enJuego) return;
    if (p.enQuiebra) { this.nextTurn(r); return; }
    if (p.turnosPerdidos > 0) { p.turnosPerdidos--; this.log(r, `${p.nombre} pierde este turno por desempleo.`); this.nextTurn(r); return; }
    const count = p.deudaPersonal >= 20000 ? 4 : p.deudaPersonal >= 10000 ? 3 : 2;
    const dice = Array.from({ length: count }, () => this.dice());
    const distance = dice.reduce((a, b) => a + b, 0), old = p.posicion;
    p.posicion = (old + distance) % 40;
    r.fase = 'gestion';
    r.ultimaTirada = { id: randomUUID(), jugador: p.nombre, jugadorId: p.id, desde: old, hasta: p.posicion, dados: dice, total: distance };
    this.log(r, `${p.nombre} tiró ${dice.join(' + ')} y cayó en ${r.tablero[p.posicion].nombre}.`);
    if (old < 39 && old + distance >= 39) {
      p.industriasCerradas = false;
      const interest = this.interest(p);
      if (interest > 0) { r.continuacion = { posicion: p.posicion }; this.payment(r, p, interest, 'Intereses al pasar por el FMI'); return; }
    }
    this.land(r, p, p.posicion);
  }
  interest(p, rate = p.interesEspecial || 0.10) {
    const amount = p.noPagarVuelta ? 0 : Math.floor(p.deudaPersonal * rate / 50) * 50;
    p.noPagarVuelta = false; p.interesEspecial = null;
    return amount;
  }
  land(r, p, position) {
    p.posicion = position;
    const c = r.tablero[position];
    if (c.tipo === 'propiedad') {
      const owner = this.player(r, c.dueño), own = this.owns(r, p, c);
      if (c.region === 'sur') {
        if (c.dueño === null) { this.pending(r, 'compra', p, { nombrePropiedad: c.nombre }); return; }
        if (!own && c.industriasNac > 0 && !owner.industriasCerradas && !owner.turnosPerdidos) this.payment(r, p, this.rent(r, c), `Renta de ${c.nombre}`, owner.id, false);
      } else {
        const base = this.sur(r, c.baseSur);
        if (this.owns(r, p, base) && base.industriasNac > 0 && !own) return;
        if (own) {
          if (!r.barreraProteccionista && !p.industriasCerradas && !p.turnosPerdidos) this.money(r, p, this.rent(r, c), {accion:'Cobro de exportación',detalle:c.nombre});
        } else if (r.barreraProteccionista || !owner || owner.industriasCerradas || owner.turnosPerdidos) this.payment(r, p, c.precio, `Manufactura ${c.nombre} (FMI)`);
        else this.payment(r, p, this.rent(r, c), `Renta de ${c.nombre}`, owner.id);
      }
      return;
    }
    switch (position) {
      case 0: this.startVote(r, p); break;
      case 4: case 16: case 36: this.card(r, p, 'solidaridad'); break;
      case 8: case 19: case 28: if (p.deudaPersonal > 0) this.card(r, p, 'condiciones'); break;
      case 10: r.descuento = true; this.log(r, 'Construcciones al 50% hasta terminar este turno.'); break;
      case 12:
        if (p.resguardoFuga) p.resguardoFuga = false;
        else this.pending(r, 'fuga', p, {});
        break;
      case 18:
        if (p.resguardoGolpe) p.resguardoGolpe = false;
        else this.money(r, p, -Math.max(0, p.dinero), {accion:'Golpe Militar'});
        break;
      case 20: r.barreraProteccionista = !r.barreraProteccionista; this.log(r, r.barreraProteccionista ? 'Barrera activada para todos.' : 'Barrera retirada para todos.'); break;
      case 24: this.industrialize(r, p); break;
      case 30: this.money(r, p, 1500, {accion:'Ayuda al desarrollo',contraparte:'BID'}); this.log(r, `${p.nombre} recibió $1.500 de ayuda al desarrollo del BID, sin deuda.`); break;
      case 32: if (p.oro > 0) this.gold(r, p, -1); break;
      case 38: p.noPagarVuelta = true; break;
      case 39: p.industriasCerradas = false; break;
    }
  }
  buy(r, p, data) {
    const pending = this.validateDecision(r, p, data, 'compra');
    requireRule(typeof data.comprar === 'boolean', 'Decisión de compra inválida.');
    const c = this.sur(r, pending.nombrePropiedad);
    requireRule(c.dueño === null, 'La propiedad ya tiene dueño.');
    if (data.comprar) { requireRule(p.dinero >= c.precio, 'Necesitas efectivo o un préstamo para comprar.'); this.money(r, p, -c.precio, {accion:'Compra de propiedad',detalle:c.nombre}); c.dueño = p.id; this.log(r, `${p.nombre} compró ${c.nombre}.`); }
    else { this.money(r, p, c.precio, {accion:'Cobro de materia prima',detalle:c.nombre}); this.log(r, `${p.nombre} cobró $${c.precio} por la materia prima.`); }
    r.pendiente = null; r.fase = 'gestion';
  }
  build(r, p, data) {
    requireRule(r.fase === 'tirada' || r.fase === 'gestion' && r.descuento, 'Construye antes de tirar, o durante Ayuda Solidaria.');
    const c = this.sur(r, data.nombrePropiedad);
    requireRule(c && this.owns(r, p, c), 'Esa materia prima no pertenece a tu grupo.');
    requireRule(['nacional', 'exportacion'].includes(data.tipo), 'Tipo de industria inválido.');
    const n = this.north(r, c), national = data.tipo === 'nacional';
    const level = national ? c.industriasNac : n.industriasExp;
    requireRule(level < 3 && (national || c.industriasNac > level), 'Necesitas una industria nacional por cada multinacional (máximo tres).');
    const amount = Math.floor(this.info(c)[national ? 'nac' : 'exp'][level] * (r.descuento ? 0.5 : 1));
    requireRule(p.dinero >= amount, 'Efectivo insuficiente.');
    this.money(r, p, -amount, {accion:'Construcción',detalle:(national ? c.nombre : n.nombre) + ' · ' + (national ? 'industria nacional' : 'multinacional')});
    if (national) c.industriasNac++; else { n.industriasExp++; n.dueño = c.dueño; }
    this.log(r, `${p.nombre} construyó en ${national ? c.nombre : n.nombre} por $${amount}.`);
  }
  expropriate(r, p, data) {
    requireRule(r.monopolio, 'El anfitrión no habilitó monopolios en esta partida.');
    const c = this.sur(r, data.nombrePropiedad);
    const pending = r.pendiente;
    requireRule(c && c.id === p.posicion && c.dueño !== null && !this.owns(r, p, c), 'Debes caer en una propiedad ajena del Sur.');
    requireRule(r.fase === 'gestion' || r.fase === 'pago' && pending?.dueñoId === c.dueño, 'No puedes monopolizar ahora.');
    requireRule(!r.monopolizado, 'Ya monopolizaste este turno.');
    const investment = this.investment(r, c), tax = this.group(r, c).length > 1 ? 4000 : 2000;
    requireRule(p.dinero >= investment + tax, 'No tienes efectivo suficiente para terreno, industrias e impuesto.');
    this.debit(r, p, investment, this.player(r, c.dueño), 'Monopolio: ' + c.nombre); this.money(r, p, -tax, {accion:'Impuesto de monopolio',contraparte:'FMI'}); this.transfer(r, c, p.id);
    r.monopolizado = true; r.pendiente = null; r.fase = 'gestion';
    this.log(r, `${p.nombre} monopolizó ${c.nombre}, incluyendo su exportación.`);
  }
  eachWallet(r, fn) {
    const seen = new Set();
    for (const p of r.jugadores.filter(q => !q.enQuiebra)) { const id = p.alianzaId || p.id; if (!seen.has(id)) { seen.add(id); fn(p); } }
  }
  card(r, p, type) {
    const c = this.draw(r, type);
    r.ultimaCarta = {
      tipo: type, id: c.id, roboId: randomUUID(), jugador: p.nombre,
      titulo: c.pais || c.titulo, texto: c.desc,
      imagen: CARD_ART[type][String(c.id)]
    };
    this.emit(r.codigo, 'mostrarCartaModal', r.ultimaCarta);
    this.log(r, `${p.nombre}: ${c.pais || c.titulo}. ${c.desc}`);
    if (type === 'condiciones' && p.sombreroSandino) { this.log(r, 'El sombrero neutralizó la condición.'); return; }
    if (type === 'solidaridad') {
      const rewards = { 2: 2600, 5: 3400, 6: 2800, 7: 3000, 8: 4000, 10: 2400, 12: 2200, 13: 3600, 14: 3200, 15: 2000, 17: 3800 };
      if (rewards[c.id]) { this.money(r, p, rewards[c.id], {accion:'Solidaridad',contraparte:'Solidaridad',detalle:c.pais}); return; }
      switch (c.id) {
        case 1: this.land(r, p, 24); break;
        case 3: this.land(r, p, 10); break;
        case 4: for (const q of r.jugadores) q.sombreroSandino = true; break;
        case 9: p.resguardoGolpe = true; break;
        case 11: for (const q of r.jugadores.filter(q => !q.enQuiebra)) this.money(r, q, 2000, {accion:'Solidaridad',contraparte:'Solidaridad',detalle:c.pais}); break;
        case 16: this.gold(r, p, Math.max(0, 3 * this.team(r, p).length - p.oro)); break;
        case 18: for (const q of r.jugadores) q.posicion = 0; this.startVote(r, p); break;
        case 19: { const oil = this.sur(r, 'Petróleo'); if (oil.dueño !== null && oil.industriasNac < 3) oil.industriasNac++; break; }
        case 20: p.resguardoFuga = true; break;
      }
    } else {
      const active = r.jugadores.filter(q => !q.enQuiebra), index = active.findIndex(q => q.id === p.id);
      switch (c.id) {
        case 1: { let pos = (p.posicion + 1) % 40; while (r.tablero[pos].region !== 'norte') pos = (pos + 1) % 40; p.posicion = pos; const cell = r.tablero[pos]; if (cell.dueño === null) this.payment(r, p, cell.precio * 2, c.titulo, null, false); else { this.land(r, p, pos); if (r.pendiente?.tipo === 'pago') r.pendiente.oroPermitido = false; } break; }
        case 2: case 4: p.posicion = 39; p.industriasCerradas = false; this.payment(r, p, this.interest(p, 0.15), c.titulo, null, false); break;
        case 3: p.posicion = 32; this.gold(r, p, -p.oro); break;
        case 5: this.eachWallet(r, q => { if (this.team(r, q).some(j => j.deudaPersonal > 0)) this.money(r, q, -Math.floor(Math.max(0, q.dinero) / 2)); }); break;
        case 6: { const q = active[(index + 1) % active.length]; q.posicion = 39; q.industriasCerradas = false; const amount = this.interest(q); this.debit(r, q, amount, null, 'Intereses FMI · ' + c.titulo); this.log(r, `${q.nombre} se presenta ante el FMI por ${c.titulo} y paga $${amount} de intereses.`); break; }
        case 7: p.turnosPerdidos = 2; break;
        case 8: this.debit(r, p, 100); break;
        case 9: this.debit(r, p, 1000); this.debit(r, active[(index + active.length - 1) % active.length], 1000); break;
        case 10: for (const q of active) { q.posicion = 39; q.industriasCerradas = false; this.debit(r, q, this.interest(q)); } break;
        case 11: p.industriasCerradas = true; break;
        case 12: if (!p.alianzaId && !p.sinPactos) this.pending(r, 'eleccion', p, { efecto: 'pactoFmi', opciones: [{ id: 'aceptar', label: 'Recibir $10.000 y renunciar a alianzas' }, { id: 'rechazar', label: 'Rechazar' }] }); break;
        case 13: this.debit(r, p, this.assets(r, p).reduce((sum, s) => sum + s.industriasNac * 200 + this.north(r, s).industriasExp * 400, 0)); break;
        case 14: this.debit(r, p, 1500); break;
        case 15: p.interesEspecial = 0.20; break;
        case 16: { const options = this.assets(r, p).filter(s => s.industriasNac > 0).map(s => ({ id: s.nombre, label: `Devolver ${s.nombre} y sus industrias` })); if (options.length) this.pending(r, 'eleccion', p, { efecto: 'dumping', opciones: options }); break; }
        case 17: for (const q of active) this.debit(r, q, 750); break;
      }
    }
  }
  industrialize(r, p) {
    let options = r.tablero.filter(c => c.region === 'sur' && c.dueño === null).map(c => ({ id: c.nombre, label: `${c.nombre}: terreno y primera industria` }));
    if (!options.length) {
      for (const c of this.assets(r, p)) {
        if (c.industriasNac < 3) options.push({ id: c.nombre + ':nacional', label: `${c.nombre}: industria nacional` });
        if (this.north(r, c).industriasExp < c.industriasNac) options.push({ id: c.nombre + ':exportacion', label: `${c.nombre}: multinacional` });
      }
    }
    if (options.length) this.pending(r, 'eleccion', p, { efecto: 'industrializar', opciones: options });
    else this.log(r, 'Industrialización: no quedan terrenos libres ni industrias que puedas mejorar.');
  }
  choose(r, p, data) {
    const pending = this.validateDecision(r, p, data, 'eleccion');
    requireRule(pending.opciones.some(o => o.id === data.opcion), 'Elige una de las opciones disponibles.');
    if (pending.efecto === 'pactoFmi' && data.opcion === 'aceptar') { p.sinPactos = true; this.money(r, p, 10000, {accion:'Pacto con el FMI',contraparte:'FMI'}); }
    if (pending.efecto === 'dumping') { this.transfer(r, this.sur(r, data.opcion), null); this.interaction(r, p, 'Devuelve propiedad', 'FMI', null, data.opcion + ' y sus industrias'); }
    if (pending.efecto === 'industrializar') {
      const [name, type] = data.opcion.split(':'), c = this.sur(r, name);
      if (!type) { c.dueño = p.id; c.industriasNac = 1; }
      else if (type === 'nacional') c.industriasNac++;
      else { const n = this.north(r, c); n.dueño = c.dueño; n.industriasExp++; }
      this.interaction(r, 'Industrialización', 'Mejora gratuita', p, null, name + (type ? ' · ' + type : ' · terreno y primera industria'));
      this.log(r, `${p.nombre}: Industrialización gratuita en ${name}${type ? ' (' + type + ')' : ' (terreno y primera industria)'}.`);
    }
    r.pendiente = null; r.fase = 'gestion';
  }
  tradeTerms(r, p, q, data) {
    requireRule(q && q.conectado && p.conectado && !q.enQuiebra && !p.enQuiebra && !this.sameTeam(p, q), 'Elige un jugador conectado de otro grupo.');
    for (const key of ['entrego', 'recibo']) {
      requireRule(Array.isArray(data[key]) && data[key].length <= 12 && data[key].every(x => typeof x === 'string') && new Set(data[key]).size === data[key].length, 'Lista de propiedades inválida.');
    }
    requireRule(data.entrego.length + data.recibo.length > 0, 'Incluye al menos una propiedad en la oferta.');
    requireRule(!data.entrego.some(x => data.recibo.includes(x)), 'No puedes intercambiar una propiedad consigo misma.');
    for (const key of ['pago', 'cobro']) requireRule(Number.isSafeInteger(data[key]) && data[key] >= 0 && data[key] <= 1_000_000_000, 'El importe debe ser un entero entre 0 y 1.000.000.000.');
    requireRule(!(data.pago && data.cobro), 'Indica dinero en una sola dirección.');
    requireRule(p.dinero >= data.pago && q.dinero >= data.cobro, 'Una de las partes no tiene efectivo suficiente.');
    requireRule(Number.isSafeInteger(p.dinero - data.pago + data.cobro) && Number.isSafeInteger(q.dinero + data.pago - data.cobro), 'El saldo resultante supera el límite permitido.');
    for (const [names, owner] of [[data.entrego, p], [data.recibo, q]]) for (const name of names) {
      const c = this.sur(r, name);
      requireRule(c && this.owns(r, owner, c), 'Una propiedad ya no pertenece al grupo indicado.');
    }
  }
  proposeTrade(r, p, data) {
    requireRule(['tirada', 'gestion'].includes(r.fase) && !r.pendiente, 'Resuelve la casilla antes de comerciar.');
    const q = this.player(r, data.destinatarioId);
    this.tradeTerms(r, p, q, data);
    const faseAnterior = r.fase;
    const terms = { entrego: [...data.entrego], recibo: [...data.recibo], pago: data.pago, cobro: data.cobro };
    const propiedades = [...terms.entrego, ...terms.recibo].map(name => {
      const c = this.sur(r, name); return { nombre: name, dueño: c.dueño, nacionales: c.industriasNac, multinacionales: this.north(r, c).industriasExp };
    });
    this.pending(r, 'comercio', p, { ...terms, destinatarioId: q.id, faseAnterior, propiedades, turnoId: r.turnoId, vence: Math.min(this.now() + 60_000, r.limiteTurno) });
    this.log(r, `${p.nombre} propone un trato a ${q.nombre}.`);
  }
  closeTrade(r, message) {
    const d = r.pendiente;
    if (d?.tipo !== 'comercio') return;
    r.fase = d.faseAnterior; r.pendiente = null;
    this.log(r, message);
  }
  respondTrade(r, actor, data) {
    const d = r.pendiente;
    requireRule(d?.tipo === 'comercio' && d.id === data.decisionId && d.turnoId === r.turnoId && data.turnoId === r.turnoId, 'Esta oferta ya no está disponible.');
    requireRule(typeof data.aceptar === 'boolean', 'Indica si aceptas o rechazas la oferta.');
    requireRule(actor.id === d.destinatarioId || actor.id === d.jugadorId && !data.aceptar, 'Solo el destinatario puede aceptar; el proponente puede cancelar.');
    requireRule(d.vence > this.now(), 'La oferta ha caducado.');
    if (!data.aceptar) { this.closeTrade(r, `${actor.nombre} ${actor.id === d.jugadorId ? 'canceló' : 'rechazó'} la oferta.`); return; }
    const p = this.player(r, d.jugadorId), q = this.player(r, d.destinatarioId);
    requireRule(p && q, 'Una de las partes abandonó la partida.');
    this.tradeTerms(r, p, q, d);
    for (const saved of d.propiedades) {
      const c = this.sur(r, saved.nombre);
      requireRule(c.dueño === saved.dueño && c.industriasNac === saved.nacionales && this.north(r, c).industriasExp === saved.multinacionales, 'La propiedad ha cambiado. Cancela y crea otra oferta.');
    }
    this.money(r, p, d.cobro - d.pago, false); this.money(r, q, d.pago - d.cobro, false);
    for (const name of d.entrego) this.transfer(r, this.sur(r, name), q.id);
    for (const name of d.recibo) this.transfer(r, this.sur(r, name), p.id);
    const summary = `${p.nombre} entrega ${d.entrego.join(', ') || 'ninguna propiedad'} y $${d.pago}; ${q.nombre} entrega ${d.recibo.join(', ') || 'ninguna propiedad'} y $${d.cobro}.`;
    this.interaction(r, p, 'Intercambio aceptado', q, null, summary + ' Las propiedades incluyen sus industrias.');
    this.closeTrade(r, 'Trato aceptado: ' + summary);
  }
  startVote(r, p) {
    const eligible = r.jugadores.filter(q => !q.enQuiebra && q.conectado && !q.sinPactos && !q.alianzaId);
    if (eligible.length < 2) return;
    this.pending(r, 'votacion', p, { elegibles: eligible.map(q => q.id), votos: {}, vence: this.now() + 30_000 });
  }
  vote(r, p, data) {
    const v = r.pendiente;
    requireRule(v?.tipo === 'votacion' && v.id === data.decisionId && v.vence > this.now() && v.elegibles.includes(p.id), 'No hay una votación disponible para ti.');
    requireRule(typeof data.voto === 'boolean' && !Object.hasOwn(v.votos, p.id), 'Tu voto ya se registró o es inválido.');
    v.votos[p.id] = data.voto;
    if (v.elegibles.every(id => Object.hasOwn(v.votos, id))) this.finishVote(r);
  }
  finishVote(r) {
    const voters = r.jugadores.filter(p => r.pendiente.votos[p.id] === true && !p.enQuiebra);
    if (voters.length >= 2) {
      const id = randomUUID();
      for (const p of voters) this.debit(r, p, this.interest(p));
      const cash = voters.reduce((n, p) => n + p.dinero, 0), gold = voters.reduce((n, p) => n + p.oro, 0);
      for (const p of voters) { p.alianzaId = id; p.dinero = cash; p.oro = gold; p.posicion = 0; }
      this.log(r, 'Alianza formada: efectivo, oro y propiedades comunes; deudas personales separadas.');
    } else this.log(r, 'La propuesta de alianza no prosperó.');
    r.pendiente = null; r.fase = 'gestion';
  }
  auction(r, p, data) {
    requireRule(['tirada', 'gestion', 'pago'].includes(r.fase), 'No puedes subastar durante esta decisión.');
    requireRule(p.dinero < 0 || r.pendiente?.tipo === 'pago' && p.dinero < r.pendiente.monto, 'Solo puedes subastar para cubrir un pago que no puedes afrontar.');
    requireRule(this.team(r, p).every(q => q.deudaPersonal >= 30000), 'Aún hay capacidad de préstamo en tu grupo.');
    const c = this.sur(r, data.nombrePropiedad);
    requireRule(c && this.owns(r, p, c), 'Debes subastar una materia prima de tu grupo.');
    const previous = { fase: r.fase, pendiente: r.pendiente };
    this.pending(r, 'subasta', p, { nombrePropiedad: c.nombre, base: Math.floor(this.investment(r, c) / 2), oferta: null, vence: this.now() + 30_000, anterior: previous });
    this.log(r, `Subasta de ${c.nombre}: 30 segundos para pujar.`);
  }
  bid(r, p, data) {
    const a = r.pendiente;
    requireRule(a?.tipo === 'subasta' && a.id === data.decisionId && a.vence > this.now(), 'La subasta ha terminado.');
    requireRule(!this.sameTeam(p, this.player(r, a.jugadorId)), 'No puedes pujar por bienes de tu propio grupo.');
    requireRule(Number.isSafeInteger(data.monto) && data.monto >= a.base && (!a.oferta || data.monto > a.oferta.monto) && data.monto <= p.dinero, 'La puja debe superar la oferta y estar cubierta por tu efectivo.');
    a.oferta = { jugadorId: p.id, monto: data.monto };
  }
  finishAuction(r) {
    const a = r.pendiente, seller = this.player(r, a.jugadorId), c = this.sur(r, a.nombrePropiedad);
    const buyer = a.oferta && this.player(r, a.oferta.jugadorId);
    if (buyer && !buyer.enQuiebra && buyer.dinero >= a.oferta.monto) { this.debit(r, buyer, a.oferta.monto, seller, 'Subasta: ' + c.nombre); this.transfer(r, c, buyer.id); }
    else { this.money(r, seller, a.base, {accion:'Compra en subasta',contraparte:'FMI',detalle:c.nombre}); this.transfer(r, c, null); }
    r.fase = a.anterior.fase; r.pendiente = a.anterior.pendiente;
    this.log(r, `Subasta de ${c.nombre} finalizada.`);
  }
  checkVictory(r) {
    if (!r.enJuego) return;
    const active = r.jugadores.filter(p => !p.enQuiebra);
    if (!active.length) return this.finish(r, 'FMI', 'Todos los jugadores han quebrado.');
    // An alliance alone does not win merely by voting together.
    if (active.length === 1 && r.jugadores.length > 1) return this.finish(r, active[0].nombre, 'Último jugador activo.');
    for (const p of active) if (this.assets(r, p).length === 12 && this.assets(r, p).every(c => c.industriasNac === 3 && this.north(r, c).industriasExp === 3)) return this.finish(r, this.team(r, p).map(q => q.nombre).join(' + '), 'Triunfo por KO: doce propiedades con tres industrias nacionales y tres multinacionales.');
  }
  finish(r, winner, reason) {
    r.enJuego = false; r.finalizada = true; r.fase = 'finalizada'; r.pendiente = null;
    r.resultado = { ganador: winner, motivo: reason };
    this.emit(r.codigo, 'finDeJuegoModal', r.resultado);
  }
  leave(socketId) {
    const { r, p } = this.current(socketId);
    if (r.fase === 'comercio') this.closeTrade(r, 'Oferta cancelada: un jugador abandonó la sala.');
    if (r.fase === 'subasta') this.finishAuction(r);
    if (r.fase === 'votacion') { r.pendiente.elegibles = r.pendiente.elegibles.filter(id => id !== p.id); delete r.pendiente.votos[p.id]; this.finishVote(r); }
    const remainingAlly = this.team(r, p).find(q => q.id !== p.id && !q.enQuiebra);
    for (const c of r.tablero.filter(c => c.region === 'sur' && c.dueño === p.id)) this.transfer(r, c, remainingAlly?.id ?? null);
    const activeId = r.jugadores[r.turnoActual]?.id;
    const index = r.jugadores.indexOf(p);
    r.jugadores.splice(index, 1); this.connections.delete(socketId);
    if (!r.jugadores.length) { delete this.rooms[r.codigo]; return r.codigo; }
    if (p.esLider) (r.jugadores.find(q => q.conectado) || r.jugadores[0]).esLider = true;
    if (activeId === p.id) { r.turnoActual = (index - 1 + r.jugadores.length) % r.jugadores.length; this.nextTurn(r); }
    else r.turnoActual = r.jugadores.findIndex(q => q.id === activeId);
    if (r.pendiente?.dueñoId === p.id) r.pendiente.dueñoId = remainingAlly?.id ?? null;
    if (r.enJuego && r.jugadores.length === 1) this.finish(r, r.jugadores[0].nombre, 'Los demás jugadores abandonaron.');
    this.checkVictory(r); this.publish(r); return r.codigo;
  }
  disconnect(socketId) {
    const ref = this.connections.get(socketId);
    if (!ref) return;
    const r = this.rooms[ref.room], p = this.player(r, ref.id);
    this.connections.delete(socketId); p.socketId = null; p.conectado = false;
    if (r.jugadores[r.turnoActual]?.id === p.id) r.desconectadoDesde = this.now();
    if (!r.enJuego && p.esLider) { const replacement = r.jugadores.find(q => q.conectado); if (replacement) { p.esLider = false; replacement.esLider = true; } }
    this.publish(r);
  }
  settleAbsent(r, p) {
    while (p.dinero < 0) {
      const borrower = this.team(r, p).find(q => q.deudaPersonal < 30000);
      if (borrower) { this.loan(r, borrower); continue; }
      const asset = this.assets(r, p)[0];
      if (!asset) { this.bankrupt(r, p); return; }
      this.money(r, p, Math.floor(this.investment(r, asset) / 2), {accion:'Liquidación',contraparte:'FMI',detalle:asset.nombre}); this.transfer(r, asset, null);
    }
  }
  tick() {
    let changed = false;
    for (const r of Object.values(this.rooms)) {
      if (!r.jugadores.some(p => p.conectado) && this.now() - r.actualizado > 24 * 3600_000) { delete this.rooms[r.codigo]; changed = true; continue; }
      if (!r.enJuego || !r.jugadores.some(p => p.conectado && !p.enQuiebra)) continue;
      const pending = r.pendiente;
      if (pending?.vence && pending.vence <= this.now()) {
        if (pending.tipo === 'votacion') this.finishVote(r);
        if (pending.tipo === 'subasta') this.finishAuction(r);
        if (pending.tipo === 'comercio') this.closeTrade(r, 'La oferta de comercio caducó sin realizar cambios.');
        this.publish(r); changed = true;
      }
      const p = r.jugadores[r.turnoActual];
      const expired = this.now() >= r.limiteTurno || !p.conectado && this.now() - r.desconectadoDesde >= 60_000;
      if (expired && !['subasta', 'votacion'].includes(r.fase)) {
        // Resolve every outstanding obligation, including the landing after FMI interest.
        for (let i = 0; i < 8 && r.pendiente; i++) {
          const d = r.pendiente, data = { decisionId: d.id };
          if (d.tipo === 'pago') this.pay(r, p, { ...data, usarOro: false });
          else if (d.tipo === 'fuga') this.rollFlight(r, p, data);
          else if (d.tipo === 'compra') this.buy(r, p, { ...data, comprar: false });
          else if (d.tipo === 'comercio') this.closeTrade(r, 'Oferta cancelada por fin de turno.');
          else if (d.tipo === 'eleccion') this.choose(r, p, { ...data, opcion: d.efecto === 'pactoFmi' ? 'rechazar' : d.opciones[0].id });
          else break;
        }
        if (!r.pendiente) { this.settleAbsent(r, p); this.log(r, `${p.nombre}: turno finalizado por inactividad.`); this.nextTurn(r); }
        this.checkVictory(r); this.publish(r); changed = true;
      }
    }
    return changed;
  }
}

module.exports = { Game, GameError };
