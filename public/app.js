'use strict';
const $ = id => document.getElementById(id);
const element = (tag, text, className) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; };
const amount = n => '$' + Number(n).toLocaleString('es-ES');
const secureId = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2, '0')).join('');
let userId, sessionToken, storageAvailable = true;
try {
  userId = localStorage.getItem('deuda_eterna_userid') || 'usr_' + secureId().slice(0, 24);
  sessionToken = localStorage.getItem('deuda_eterna_session') || secureId();
  localStorage.setItem('deuda_eterna_userid', userId); localStorage.setItem('deuda_eterna_session', sessionToken);
  $('nombre').value = localStorage.getItem('deuda_eterna_nombre') || '';
  $('codigo').value = localStorage.getItem('deuda_eterna_sala') || '';
} catch { storageAvailable = false; userId = 'usr_' + secureId().slice(0, 24); sessionToken = secureId(); }
const socket = io({ autoConnect: false });
let state = null, catalog = [], busy = false, joinedRoom = null, noticeTimer, selectedProperty = null;
let lastDecisionKey = null, lastResult = null, lastCardShown = null, currentCard = null;
let seenRoll = null, diceTimer, specialCatalog = {}, tradeShown = null;
let interactionRoom = null, seenInteractions = new Set(), interactionQueue = [], interactionTimer, showingInteraction = false;
let movement = null, pendingCard = null, pendingLanding = null, animateNextState = false;
const cells = new Map();
const icons = { 'Azúcar':'◈','Banano':'◒','Cacao':'◆','Algodón':'✿','Tabaco':'❧','Café':'☕','Pesca':'≈','Ganado':'♜','Cobre':'◇','Estaño':'⬡','Hierro':'⚒','Petróleo':'◕' };
const groups = { cafe_agricola:'#c99a4b',textil_agricola:'#bfa64e',ganaderia_pesca:'#6d9372',mineria:'#749da8',energia:'#ac8ba6' };
const me = () => state?.jugadores.find(p => p.userId === userId);
const myTurn = () => !!state?.enJuego && state.jugadores[state.turnoActual]?.id === me()?.id && !me()?.enQuiebra;
const myProperty = c => !!me() && (c.dueño === me().id || !!me().alianzaId && state.jugadores.some(p => p.id === c.dueño && p.alianzaId === me().alianzaId));
function notice(text) { clearTimeout(noticeTimer); $('aviso').textContent = text; $('aviso').hidden = false; noticeTimer = setTimeout(() => $('aviso').hidden = true, 7000); }
function remember(key, value) { if (storageAvailable) { try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch { storageAvailable = false; } } }
function action(event, data = {}) {
  if (!socket.connected || busy || movement) return;
  busy = true; updateControls();
  socket.timeout(8000).emit(event, { ...data, turnoId: state?.turnoId, actionId: secureId().slice(0, 32) }, (error, result) => {
    busy = false; updateControls();
    if (error) notice('No llegó la confirmación. Comprueba el estado antes de repetir.');
    else if (!result?.ok && result?.error) notice(result.error);
    if (result?.ok && $('detalle').open && selectedProperty) $('detalle').close();
    renderDecision(true);
  });
}
function button(text, handler, className = 'ghost') { const b = element('button', text, className); b.type = 'button'; b.addEventListener('click', handler); return b; }
function log(container, text, prefix, color) {
  const p = element('p');
  if (prefix) { const strong = element('strong', prefix + ': '); strong.style.color = color; p.append(strong); }
  p.append(document.createTextNode(text)); container.append(p);
  while (container.children.length > 150) container.firstElementChild.remove();
  container.scrollTop = container.scrollHeight;
}
function join(crear) {
  const nombre = $('nombre').value.trim(), sala = crear ? secureId().slice(0, 6).toUpperCase() : $('codigo').value.trim().toUpperCase();
  if (!nombre || nombre.length > 40) return notice('Introduce un nombre de entre 1 y 40 caracteres.');
  if (!/^[A-Z0-9_-]{3,12}$/.test(sala)) return notice('Introduce un código de sala válido.');
  if (!socket.connected) return notice('Estamos conectando. Espera un momento.');
  socket.timeout(8000).emit('unirseSala', { nombre, sala, crear, userId, sessionToken }, (error, result) => {
    if (error) return notice('El servidor tarda en responder. Espera a que conecte.');
    if (result?.ok) { joinedRoom = sala; remember('deuda_eterna_nombre', nombre); remember('deuda_eterna_sala', sala); }
  });
}
$('interaccion-siguiente').onclick = nextInteraction;
$('crear').onclick = () => join(true);
$('acceso').onsubmit = e => { e.preventDefault(); join(false); };
$('salir').onclick = () => {
  if (confirm('¿Abandonar la sala? Tu plaza se eliminará y tus propiedades se liberarán o pasarán a tu alianza.')) socket.emit('abandonarSala', {}, result => { if (!result?.ok) notice('No se pudo abandonar la sala.'); });
};
$('copiar').onclick = async () => { try { await navigator.clipboard.writeText(state.codigo); notice('Código copiado: ' + state.codigo); } catch { notice('Código de sala: ' + state.codigo); } };
$('iniciar').onclick = () => action('iniciarPartida', { monopolio: $('monopolio').checked });
$('tirar').onclick = () => action('tirarDado');
$('terminar').onclick = () => action('terminarTurno');
const loanBorrower = () => {
  const p = me();
  return p?.deudaPersonal < 30000 ? p : state?.jugadores.find(q => !q.enQuiebra && p?.alianzaId && q.alianzaId === p.alianzaId && q.deudaPersonal < 30000);
};
$('prestamo').onclick = () => {
  const borrower = loanBorrower(); if (!borrower || $('prestamo').disabled) return;
  const max = 30000 - borrower.deudaPersonal, input = $('prestamo-importe');
  input.max = max; input.value = Math.min(5000, max);
  $('prestamo-capacidad').textContent = 'Deuda a nombre de ' + borrower.nombre + '. Puedes pedir hasta ' + amount(max) + '.';
  $('prestamo-dialog').showModal(); input.focus(); input.select();
};
$('cerrar-prestamo').onclick = () => $('prestamo-dialog').close();
$('prestamo-form').onsubmit = e => {
  e.preventDefault();
  const borrower = loanBorrower(), input = $('prestamo-importe');
  if (!borrower || $('prestamo').disabled) { $('prestamo-dialog').close(); return; }
  input.max = 30000 - borrower.deudaPersonal;
  if (!input.reportValidity()) return;
  action('pedirPrestamo', { monto: Number(input.value) }); $('prestamo-dialog').close();
};
$('amortizar').onclick = () => action('pagarDeuda');
$('levantar').onclick = () => action('levantarBarrera');
$('propiedades').onclick = showProperties;
$('comerciar').onclick = showTradeForm;
$('cerrar-comercio').onclick = () => $('comercio-dialog').close();
$('cerrar-industrial').onclick = () => $('industrial-dialog').close();
$('cerrar-detalle').onclick = () => $('detalle').close();
$('cerrar-carta').onclick = $('continuar-carta').onclick = () => $('carta-dialog').close();
$('carta-dialog').addEventListener('click', e => { if (e.target === $('carta-dialog')) $('carta-dialog').close(); });
$('detalle').addEventListener('click', e => { if (e.target === $('detalle')) $('detalle').close(); });
$('tab-registro').onclick = () => switchTab(false);
$('tab-chat').onclick = () => switchTab(true);
function switchTab(chat) { $('registro').hidden = chat; $('chat-panel').hidden = !chat; $('tab-chat').setAttribute('aria-selected', String(chat)); $('tab-registro').setAttribute('aria-selected', String(!chat)); }
$('chat-form').onsubmit = e => {
  e.preventDefault(); const text = $('mensaje').value.trim();
  if (!text || !socket.connected) return;
  socket.emit('enviarMensajeChat', text, result => { if (result?.ok) $('mensaje').value = ''; });
};
socket.on('connect', () => {
  $('conexion').textContent = 'Conectado';
  const saved = joinedRoom || $('codigo').value.trim();
  if (saved && $('nombre').value.trim()) socket.emit('unirseSala', { nombre: $('nombre').value.trim(), sala: saved, userId, sessionToken }, result => { if (result?.ok) joinedRoom = saved; });
  updateControls();
});
socket.on('disconnect', () => { globalThis.GameAudio?.stop(); cancelMovement(); animateNextState = false; pendingCard = null; pendingLanding = null; busy = false; $('conexion').textContent = 'Reconectando…'; updateControls(); renderDecision(true); });
socket.on('connect_error', () => { $('conexion').textContent = 'Sin conexión · reintentando'; updateControls(); });
socket.on('sesionReemplazada', message => { socket.disconnect(); $('conexion').textContent = 'Sesión en otra pestaña'; notice(message); });
socket.on('errorAcceso', message => { notice(message); if (!joinedRoom) remember('deuda_eterna_sala', null); });
socket.on('errorAccion', notice);
socket.on('salaAbandonada', () => { globalThis.GameAudio?.stop(); cancelMovement(); animateNextState = false; pendingCard = null; pendingLanding = null; $('prestamo-dialog').close(); joinedRoom = null; state = null; remember('deuda_eterna_sala', null); $('codigo').value = ''; $('mesa').hidden = true; $('login').hidden = false; $('detalle').close(); $('carta-dialog').close(); $('registro').replaceChildren(); $('chat').replaceChildren(); lastResult = null; lastCardShown = null; currentCard = null; seenRoll = null; clearTimeout(diceTimer); $('industrial-dialog').close(); $('comercio-dialog').close(); tradeShown = null; resetInteractions(); $('dados-panel').hidden = true; });
socket.on('nuevoMensajeChat', data => log($('chat'), data.texto, data.nombre, data.color));
socket.on('mensajeLog', text => log($('registro'), text));
socket.on('mostrarCartaModal', data => { pendingCard = data; });
socket.on('finDeJuegoModal', () => {}); // The following state renders the result after movement.
socket.on('actualizarEstado', next => {
  const previousState = state, previousRoom = state?.codigo;
  state = next;
  if (!me()) return;
  const roll = state.ultimaTirada;
  if (animateNextState && previousRoom === state.codigo && state.enJuego) {
    if (roll && roll.id !== previousState?.ultimaTirada?.id && Number.isInteger(roll.hasta)) pendingLanding = roll.hasta;
    else {
      const moved = state.jugadores.find(p => previousState?.jugadores.some(q => q.id === p.id && q.posicion !== p.posicion));
      if (moved) pendingLanding = moved.posicion;
    }
  } else pendingLanding = null;
  const animate = animateNextState && previousRoom === state.codigo && !document.hidden && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (previousRoom !== state.codigo || !state.enJuego || !roll || (movement && movement.rollId !== roll.id)) cancelMovement();
  if (animate && roll && roll.id !== seenRoll && Number.isInteger(roll.desde) && state.jugadores.some(p => p.id === roll.jugadorId)) {
    movement = { rollId: roll.id, playerId: roll.jugadorId, position: roll.desde, total: roll.total, node: null, animation: null };
  }
  animateNextState = true;
  renderDice(roll, animate);
  joinedRoom = state.codigo;
  $('login').hidden = true; $('mesa').hidden = false;
  $('sala-codigo').textContent = state.codigo;
  $('deuda').textContent = amount(state.deudaFMIGlobal);
  $('barrera').textContent = state.barreraProteccionista ? 'BARRERA ACTIVA' : 'COMERCIO ABIERTO';
  $('registro').replaceChildren();
  for (const message of state.registro || []) log($('registro'), message);
  renderStart(); renderLastCard(state.ultimaCarta); renderInteractions();
  renderBoard(); renderPlayers(); updateControls(); renderDecision(); updateClock();
  if (movement && !movement.started) { movement.started = true; void movePiece(movement); }
  if (!movement) flushLanding();
  if (state.resultado && !movement) showResult(state.resultado);
  else if (!state.finalizada) lastResult = null;
});
function renderStart() {
  const initial = state.inicioPartida, box = $('sorteo-inicial');
  box.hidden = !initial;
  if (!initial) { delete box.dataset.startId; return; }
  if (box.dataset.startId === initial.id) return;
  box.dataset.startId = initial.id; box.open = !state.ultimaTirada;
  const content = $('sorteo-resultados'); content.replaceChildren();
  for (const t of initial.tiradas) {
    const row = element('p');
    row.append(element('span', ['⚀','⚁','⚂','⚃','⚄','⚅'][t.dado - 1], 'initial-die'), document.createTextNode(t.nombre + ': ' + t.dado + ' → ' + amount(t.dinero)));
    if (t.jugadorId === initial.primeroId) row.append(element('strong', ' · Empieza'));
    content.append(row);
  }
  content.append(element('p', '$5.000 + dado × $200. ' + (initial.empate ? 'Primer turno sorteado entre quienes empataron con el dado más alto.' : 'Empieza el dado más alto.'), 'muted'));
}
function pieceFor(player) {
  // Colors belong to the player and remain stable if another player leaves the room.
  const pieces = { '#e74c3c':['carrito','Carrito'], '#2ecc71':['sombrero','Sombrero'], '#3498db':['bota','Bota'], '#f1c40f':['balsa','Balsa'] };
  const [asset,name] = pieces[player.color?.toLowerCase()] || pieces['#e74c3c'];
  return { asset, name };
}
function decoratePiece(node, player) {
  const piece = pieceFor(player), img = element('img');
  img.src = '/assets/fichas/' + piece.asset + '.svg'; img.alt = ''; img.draggable = false;
  node.replaceChildren(img); node.title = player.nombre + ' · ' + piece.name;
}
function displayPosition(p) { return p?.id === movement?.playerId ? movement.position : p?.posicion; }
function flushLanding() {
  if (!state || movement) return;
  if (pendingLanding !== null) { globalThis.GameAudio?.land(pendingLanding); pendingLanding = null; }
  renderInteractions(); renderDecision(true);
  if (pendingCard) { const card = pendingCard; pendingCard = null; renderLastCard(card); showCard(card, true); }
  if (state.resultado) showResult(state.resultado);
}
function cancelMovement() {
  const old = movement; movement = null;
  old?.animation?.cancel(); old?.node?.remove();
  if (state) { renderBoard(); updateControls(); }
}
async function movePiece(run) {
  // Positions come from the rendered cells, so the route follows every responsive layout.
  await new Promise(resolve => setTimeout(resolve, 900));
  if (movement !== run) return;
  const player = state.jugadores.find(p => p.id === run.playerId);
  const node = element('span', String(state.jugadores.indexOf(player) + 1), 'token token-current moving-token');
  decoratePiece(node, player);
  node.style.setProperty('--player', player.color); node.setAttribute('aria-hidden', 'true');
  run.node = node; $('tablero').append(node); renderBoard();
  const point = id => {
    const board = $('tablero').getBoundingClientRect(), tile = cells.get(id).getBoundingClientRect();
    return `translate(${tile.left - board.left + tile.width / 2 - node.offsetWidth / 2}px, ${tile.top - board.top + tile.height / 2 - node.offsetHeight / 2}px)`;
  };
  try {
    for (let step = 0; step < run.total; step++) {
      if (movement !== run) return;
      const next = (run.position + 1) % 40, from = point(run.position), to = point(next);
      node.style.transform = to;
      run.animation = node.animate([{ transform: from }, { transform: to }], { duration: 170, easing: 'ease-in-out' });
      await run.animation.finished;
      if (movement !== run) return;
      run.position = next; globalThis.GameAudio?.play('step'); renderBoard();
    }
  } catch { /* Cancellation snaps to the latest authoritative state. */ }
  finally {
    node.remove();
    if (movement === run) { movement = null; renderBoard(); updateControls(); flushLanding(); }
  }
}
document.addEventListener('visibilitychange', () => { if (document.hidden && movement) { cancelMovement(); flushLanding(); } });
function position(id) {
  // A perimeter of 40 cells in an 11×11 grid. Pieces belong to cells, never pixels.
  if (id <= 10) return [11, 11 - id];
  if (id <= 20) return [21 - id, 1];
  if (id <= 30) return [1, id - 19];
  return [id - 29, 11];
}
function renderBoard() {
  for (const c of state.tablero) {
    let tile = cells.get(c.id);
    if (!tile) {
      tile = button('', () => showProperty(c.id), 'tile');
      const [row, column] = position(c.id); tile.style.gridRow = row; tile.style.gridColumn = column;
      tile.dataset.casilla = c.id;
      tile.append(element('span', String(c.id).padStart(2, '0'), 'tile-number'), element('span', icons[c.baseSur || c.nombre] || (c.nombre.includes('Solidaridad') ? '✦' : c.nombre.includes('FMI') ? '▥' : '↗'), 'tile-icon'), element('span', c.nombre.replace('América Latina (SALIDA)', 'Latinoamérica').replace('Barrera Proteccionista', 'Barrera').replace('12 Octubre 1492', '12 de Octubre'), 'tile-name'), element('span', c.precio ? amount(c.precio) : '', 'tile-price'), element('span', '', 'tile-industries'), element('span', '', 'tile-tokens'), element('span', '', 'tile-owner'));
      cells.set(c.id, tile); $('tablero').append(tile);
    }
    const art = catalog.find(p => p.nombre === (c.baseSur || c.nombre));
    const specialArt = specialCatalog[c.id]?.imagen || ([4, 16, 36].includes(c.id) ? '/assets/cartas/reversos/solidaridad.webp' : [8, 19, 28].includes(c.id) ? '/assets/cartas/reversos/condiciones.webp' : null);
    const iconUrl = specialCatalog[c.id]?.icono || specialArt || art?.icono;
    if (iconUrl) {
      const host = tile.querySelector('.tile-icon');
      if (host.dataset.src !== iconUrl) {
        const img = element('img'); img.src = iconUrl; img.alt = ''; img.width = 42; img.height = 30; img.decoding = 'async';
        host.replaceChildren(img); host.dataset.src = iconUrl; host.classList.add('original-art');
          host.classList.toggle('special-original', !!specialCatalog[c.id] && !c.region);
      }
    }
    const active = state.enJuego && displayPosition(state.jugadores[state.turnoActual]) === c.id;
    tile.className = 'tile ' + (c.region === 'norte' ? 'norte' : c.region === 'sur' ? 'sur' : 'special') + (active ? ' active' : '');
    const base = c.baseSur ? state.tablero.find(s => s.nombre === c.baseSur) : c;
    tile.style.setProperty('--group', groups[base.grupo] || '#a6b49a');
    const owner = state.jugadores.find(p => p.id === c.dueño);
    tile.style.setProperty('--owner', owner?.color || 'transparent');
    const n = c.region === 'sur' ? c.industriasNac : c.industriasExp;
    const industry = tile.querySelector('.tile-industries');
    const industryType = c.region === 'sur' ? 'nacional' : 'multinacional';
    const closed = !!owner?.industriasCerradas;
    const industryKey = `${industryType}:${n || 0}:${closed}`;
    if (industry.dataset.key !== industryKey) {
      industry.dataset.key = industryKey; industry.replaceChildren();
      industry.className = 'tile-industries ' + industryType + (closed ? ' industry-closed' : '');
      industry.title = n ? `${n} industria${n > 1 ? 's' : ''} ${industryType === 'nacional' ? 'nacional' : 'multinacional'}${n > 1 ? 'es' : ''}${closed ? ' · Cerradas' : ''}` : '';
      if (n) {
        const building = element('img'); building.src = '/assets/industrias/' + industryType + '.svg'; building.alt = ''; building.draggable = false;
        industry.append(building, element('strong', String(n), 'industry-level'));
        industry.setAttribute('aria-hidden', 'true');
      }
    }
    tile.classList.toggle('has-industries', !!n);
    const tokens = tile.querySelector('.tile-tokens'); tokens.replaceChildren();
    const occupants = state.jugadores.filter(p => displayPosition(p) === c.id && !p.enQuiebra);
    tile.classList.toggle('has-players', occupants.length > 0);
    tokens.classList.toggle('crowded', occupants.length > 2);
    for (const p of occupants) {
      const current = state.enJuego && state.jugadores[state.turnoActual]?.id === p.id;
      const token = element('span', String(state.jugadores.indexOf(p) + 1), 'token' + (current ? ' token-current' : ''));
      if (movement?.node && p.id === movement.playerId) token.style.visibility = 'hidden';
      token.style.setProperty('--player', p.color);
      decoratePiece(token, p);
      token.title = p.nombre + ' · ' + pieceFor(p).name + (p.userId === userId ? ' · tú' : '') + (current ? ' · en turno' : '');
      token.setAttribute('aria-hidden', 'true'); tokens.append(token);
    }
    tile.setAttribute('aria-label', `${c.id}. ${c.nombre}${owner ? '. Propietario: ' + owner.nombre : ''}${n ? '. Industrias ' + (c.region === 'sur' ? 'nacionales' : 'multinacionales') + ': ' + n + (owner?.industriasCerradas ? ', cerradas' : '') : ''}${occupants.length ? '. Fichas: ' + occupants.map(p=>p.nombre).join(', ') : ''}`);
  }
}
function renderPlayers() {
  $('jugadores').replaceChildren(); $('cantidad').textContent = state.jugadores.length + ' / 4';
  for (const p of state.jugadores) {
    const row = element('div', undefined, 'player' + (state.enJuego && state.jugadores[state.turnoActual]?.id === p.id ? ' current' : ''));
    const avatar = element('span', String(state.jugadores.indexOf(p) + 1), 'avatar'); avatar.style.setProperty('--player', p.color); decoratePiece(avatar, p);
    const content = element('div'); content.append(element('div', p.nombre + (p.userId === userId ? ' · tú' : '') + (p.esLider ? ' ♛' : ''), 'player-name'));
    content.append(element('div', 'Ficha: ' + pieceFor(p).name, 'piece-name'));
    const stats = element('div', undefined, 'player-stats'); stats.append(element('span', amount(p.dinero)), element('span', 'Deuda ' + amount(p.deudaPersonal)), element('span', '◆ ' + p.oro)); content.append(stats);
    content.append(element('div', [!p.conectado && 'Desconectado', p.enQuiebra && 'En quiebra', p.enAlianza && 'Alianza · caja común', p.industriasCerradas && 'Industrias cerradas', p.turnosPerdidos > 0 && 'Desempleo: ' + p.turnosPerdidos, p.deudaPersonal >= 30000 && 'Límite de deuda'].filter(Boolean).join(' · '), 'player-status'));
    row.append(avatar, content); $('jugadores').append(row);
  }
}
function updateControls() {
  $('crear').disabled = $('unirse').disabled = !socket.connected;
  if (!state) return;
  const p = me(), current = state.jugadores[state.turnoActual], mine = myTurn(), locked = busy || !!movement || !socket.connected || state.fase === 'comercio';
  $('turno').textContent = state.enJuego ? mine ? 'Tu turno, ' + p.nombre : 'Turno de ' + current?.nombre : state.finalizada ? 'Partida terminada' : 'Esperando jugadores';
  $('turno-centro').textContent = state.enJuego ? current?.nombre : 'En espera';
  const phases = { tirada:'Construye o gestiona tu deuda antes de tirar.', gestion:state.descuento ? 'Ayuda Solidaria: construye al 50% antes de terminar.' : 'Resuelve tus finanzas y termina el turno.', compra:'Hay una compra pendiente.', pago:'Hay un pago pendiente.', votacion:'La mesa está votando una alianza.', subasta:'Subasta abierta: 30 segundos para pujar.', comercio:'Hay una oferta de comercio pendiente.', eleccion:'Hay una elección pendiente.' };
  $('fase').textContent = movement ? 'Moviendo ficha casilla a casilla…' : state.enJuego ? phases[state.fase] || '' : 'Mínimo dos conectados. Al iniciar se liberan las plazas desconectadas.';
  $('inicio').hidden = state.enJuego || !p?.esLider;
  $('iniciar').disabled = locked || state.jugadores.filter(j => j.conectado).length < 2;
  $('acciones').hidden = !state.enJuego;
  $('comerciar').disabled = locked || !mine || !['tirada','gestion'].includes(state.fase);
  $('tirar').hidden = state.fase !== 'tirada'; $('tirar').disabled = locked || !mine;
  $('terminar').hidden = state.fase !== 'gestion'; $('terminar').disabled = locked || !mine;
  const collective = ['subasta','votacion'].includes(state.fase);
  $('prestamo').disabled = locked || !mine || collective || !state.jugadores.some(q => (q.id === p.id || p.alianzaId && q.alianzaId === p.alianzaId) && q.deudaPersonal < 30000);
  $('amortizar').disabled = locked || !mine || !['tirada','gestion'].includes(state.fase) || p.deudaPersonal <= 0 || p.dinero < Math.min(5000,p.deudaPersonal);
  $('levantar').hidden = !state.barreraProteccionista;
  $('levantar').disabled = locked || !mine || !['tirada','gestion'].includes(state.fase) || p.dinero < 2000;
}
function resetInteractions() {
  clearTimeout(interactionTimer); interactionRoom=null; seenInteractions.clear(); interactionQueue=[]; showingInteraction=false; $('interaccion').hidden=true;
}
function renderInteractions() {
  if (movement) return;
  const items=state.interacciones || [];
  if(interactionRoom!==state.codigo){resetInteractions();interactionRoom=state.codigo;for(const item of items)seenInteractions.add(item.id);return;}
  if(!items.length){resetInteractions();interactionRoom=state.codigo;return;}
  const fresh=items.filter(item=>!seenInteractions.has(item.id));
  for(const item of fresh)seenInteractions.add(item.id);
  if(seenInteractions.size>180)seenInteractions=new Set(items.map(item=>item.id));
  interactionQueue.push(...fresh);
  if(!showingInteraction&&interactionQueue.length)nextInteraction();
}
function nextInteraction() {
  clearTimeout(interactionTimer);
  const item=interactionQueue.shift();
  if(!item){showingInteraction=false;$('interaccion').hidden=true;return;}
  showingInteraction=true;
  globalThis.GameAudio?.interaction(item, me()?.nombre);
  if (!$('dados-panel').classList.contains('rolling')) $('dados-panel').hidden = true;
  const box=$('interaccion');box.hidden=false;box.style.setProperty('--actor',item.color||'#214f43');
  $('interaccion-accion').textContent=item.accion;
  $('interaccion-partes').textContent=item.origen+' → '+item.destino;
  $('interaccion-importe').textContent=item.monto===null?'':amount(item.monto);
  $('interaccion-importe').hidden=item.monto===null;
  $('interaccion-detalle').textContent=item.detalle||'';
  $('interaccion-siguiente').textContent=interactionQueue.length?'Siguiente aviso ('+interactionQueue.length+')':'Cerrar aviso';
  let remaining=item.detalle?.length>140?9000:6000,last=performance.now();
  const tick=()=>{
    const now=performance.now();
    if(!document.hidden&&!document.querySelector('dialog[open]'))remaining-=now-last;
    last=now;
    if(remaining<=0)nextInteraction();else interactionTimer=setTimeout(tick,250);
  };
  interactionTimer=setTimeout(tick,250);
}
function diceCube(value) {
  const cube = element('span', undefined, 'dice-cube');
  const dots = { 1:[5], 2:[1,9], 3:[1,5,9], 4:[1,3,7,9], 5:[1,3,5,7,9], 6:[1,3,4,6,7,9] };
  const top = [2,3,1,1,3,2][value-1], right = [3,1,2,5,6,4][value-1];
  for (const [side,n] of [['front',value],['back',7-value],['top',top],['bottom',7-top],['right',right],['left',7-right]]) {
    const face = element('span', undefined, 'dice-face face-'+side);
    for (const cell of dots[n]) { const dot = element('i', undefined, 'dice-pip'); dot.style.gridArea = `${Math.ceil(cell/3)} / ${(cell-1)%3+1}`; face.append(dot); }
    cube.append(face);
  }
  return cube;
}
function renderDice(roll, animate) {
  const panel = $('dados-panel');
  if (!roll) { seenRoll = null; clearTimeout(diceTimer); panel.hidden = true; panel.classList.remove('rolling'); return; }
  if (roll.id === seenRoll) return;
  seenRoll = roll.id; clearTimeout(diceTimer);
  const faces = $('dados-caras'), label = $('dados-resultado');
  panel.hidden = false; panel.classList.remove('rolling'); faces.replaceChildren();
  faces.dataset.count = roll.dados.length;
  roll.dados.forEach((value,i) => {
    const landing = element('span', undefined, 'dice-landing');
    landing.style.setProperty('--delay', (i*45)+'ms');
    landing.style.setProperty('--drift', (i%2 ? 65 : -65)+'px');
    landing.style.setProperty('--tilt', [-12,14,8,-8][i]+'deg');
    landing.append(diceCube(value)); faces.append(landing);
  });
  const finish = () => {
    panel.classList.remove('rolling');
    label.textContent = roll.jugador + ': ' + roll.dados.join(' + ') + ' = ' + roll.total;
    diceTimer = setTimeout(() => { panel.hidden = true; }, 2600);
  };
  if (!animate || matchMedia('(prefers-reduced-motion: reduce)').matches) { finish(); return; }
  globalThis.GameAudio?.play('dice', roll.dados.length);
  panel.classList.add('rolling'); label.textContent = roll.jugador + ' está tirando…';
  diceTimer = setTimeout(finish, 850);
}
function updateClock() {
  const node = $('reloj');
  node.hidden = !state?.enJuego;
  if (!state?.enJuego) return;
  const deadline = state.pendiente?.vence || state.limiteTurno;
  const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  node.textContent = (state.pendiente?.vence ? 'Decisión' : 'Turno') + ': ' + Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0') + ' restantes';
}
setInterval(updateClock, 1000);
function renderDecision(force = false) {
  if (!state) return;
  if (movement) { $('decision').replaceChildren(); return; }
  const d = state.pendiente, p = me(), container = $('decision');
  if (d?.tipo !== 'comercio' && tradeShown) { $('comercio-dialog').close(); tradeShown = null; }
  const key = JSON.stringify([d, state.turnoId, p?.dinero, p?.oro, socket.connected, busy]);
  if (!force && key === lastDecisionKey) return;
  lastDecisionKey = key; container.replaceChildren();
  if (d?.efecto !== 'industrializar' || d.jugadorId !== p?.id) $('industrial-dialog').close();
  if (!d || !p) return;
  const mine = d.jugadorId === p.id;
  const add = (text, event, data, disabled = false, primary = false) => { const b = button(text, () => action(event, { ...data, decisionId: d.id }), primary ? 'primary choice' : 'ghost choice'); b.disabled = disabled || busy || !socket.connected; container.append(b); };
  if (d.tipo === 'comercio') {
    container.append(element('h3','Oferta de comercio'),element('p','Esperando la respuesta de '+(state.jugadores.find(q=>q.id===d.destinatarioId)?.nombre||'otro jugador')+'.'));
    const involved = [d.jugadorId,d.destinatarioId].includes(p.id);
    if(involved){container.append(button('Ver oferta ⇄',()=>showTradeOffer(d,true),'primary'));showTradeOffer(d);}
    return;
  }
  if (d.tipo === 'votacion') {
    container.append(element('h3','Propuesta de alianza'),element('p','Caja, oro y propiedades comunes; cada jugador conserva su deuda. Los votos sin respuesta cuentan como rechazo.'));
    if (d.elegibles.includes(p.id) && !Object.hasOwn(d.votos,p.id)) { add('Unirme a la alianza','responderVotoAlianza',{voto:true},false,true); add('Seguir por mi cuenta','responderVotoAlianza',{voto:false}); }
    else container.append(element('p','Esperando a los demás jugadores…'));
  } else if (d.tipo === 'subasta') {
    container.append(element('h3','Subasta: '+d.nombrePropiedad),element('p','Base '+amount(d.base)+'. Mejor oferta: '+(d.oferta?amount(d.oferta.monto):'ninguna')));
    const owner = state.jugadores.find(j=>j.id===d.jugadorId);
    if (!mine && !p.enQuiebra && !(p.alianzaId && p.alianzaId===owner?.alianzaId)) {
      const input=element('input');input.type='number';input.min=d.oferta?d.oferta.monto+1:d.base;input.step='1';input.max=p.dinero;input.value=input.min;input.setAttribute('aria-label','Importe de la puja');container.append(input);
      const b=button('Pujar',()=>action('pujarSubasta',{decisionId:d.id,monto:Number(input.value)}),'primary');b.disabled=busy||!socket.connected;container.append(b);
    }
  } else if (mine && myTurn()) {
    if (d.tipo === 'compra') {
      const c=state.tablero.find(c=>c.nombre===d.nombrePropiedad);
      container.append(element('h3',d.nombrePropiedad),element('p','Compra el terreno por '+amount(c.precio)+' o cobra la materia prima.'));
      add('Comprar · '+amount(c.precio),'decidirCompraPropiedad',{comprar:true},p.dinero<c.precio,true);add('Cobrar materia prima · '+amount(c.precio),'decidirCompraPropiedad',{comprar:false});
    } else if (d.tipo === 'pago') {
      container.append(element('h3','Pago pendiente · '+amount(d.monto)),element('p',d.motivo));
      add('Pagar con efectivo','responderDecisionPago',{usarOro:false},false,true);
      if(d.oroPermitido)add('Usar un lingote de oro','responderDecisionPago',{usarOro:true},p.oro<1);
      if(state.monopolio){const c=state.tablero[p.posicion];if(c.region==='sur'&&c.dueño===d.dueñoId)add('Ver opción de monopolio','expropiarPropiedad',{nombrePropiedad:c.nombre});}
    } else if (d.tipo === 'eleccion') {
      container.append(element('h3',d.efecto === 'industrializar' ? 'Industrialización gratuita' : 'Elige tu siguiente movimiento'));
      if (d.efecto === 'industrializar') {
        const dialog = $('industrial-dialog'), options = $('industrial-opciones');
        const freeLand = d.opciones.some(o => !o.id.includes(':'));
        $('industrial-ayuda').textContent = freeLand ? 'Elige un terreno disponible. Lo recibes con su primera industria, sin pagar.' : 'Todos los terrenos tienen dueño. Elige una industria gratuita para una propiedad tuya o de tu alianza.';
        options.replaceChildren();
        for (const option of d.opciones) {
          const b = button(option.label + ' · Gratis', () => action('resolverEleccion', { decisionId: d.id, opcion: option.id }), 'secondary choice');
          b.disabled = busy || !socket.connected;
          const art = catalog.find(c => c.nombre === option.id.split(':')[0]);
          if (art?.icono) { const img = element('img'); img.src = art.icono; img.alt = ''; b.prepend(img); }
          options.append(b);
        }
        container.append(button('Elegir propiedad o industria →', () => { if (!dialog.open) dialog.showModal(); }, 'primary'));
        if (!dialog.open) dialog.showModal();
      } else for(const option of d.opciones)add(option.label,'resolverEleccion',{opcion:option.id});
    }
  } else container.append(element('p','Esperando la decisión de '+(state.jugadores.find(j=>j.id===d.jugadorId)?.nombre||'otro jugador')+'.'));
}
function openDialog() { if (!$('detalle').open) $('detalle').showModal(); }
function showProperty(id) {
  const original=state.tablero[id],c=original.region==='norte'?state.tablero.find(s=>s.nombre===original.baseSur):original;
  selectedProperty=c.nombre;
  const box=$('detalle-contenido');box.replaceChildren(element('p',(original.region||'CASILLA ESPECIAL').toUpperCase(),'eyebrow'),element('h2',original.nombre));
  if(c.tipo!=='propiedad'){
      const art=specialCatalog[c.id];
      if(art){const img=element('img');img.src=art.imagen;img.alt='Ilustración original de '+original.nombre;img.className='special-detail-art';box.append(img);}
      box.append(element('p',specialText(c.id)));
      if(art?.rotuloOriginal)box.append(element('p','En el tablero impreso figura como «'+art.rotuloOriginal+'». Esta edición conserva el nombre y el efecto indicados arriba.','card-note'));
      openDialog();return;
    }
  const owner=state.jugadores.find(j=>j.id===c.dueño),n=state.tablero.find(s=>s.baseSur===c.nombre),info=catalog.find(i=>i.nombre===c.nombre);
  box.append(element('p',(owner?'Propiedad de '+owner.nombre:'Terreno disponible')),element('p','Industrias nacionales: '+(c.industriasNac||0)+'/3 · Multinacionales: '+(n?.industriasExp||0)+'/3'));
  if(original.region==='norte' && specialCatalog[original.id]){const img=element('img');img.src=specialCatalog[original.id].imagen;img.alt='Ilustración original de '+original.nombre;img.className='special-detail-art';box.append(img);}
    if(info?.imagen){const img=element('img');img.className='property-original';img.src=info.imagen;img.alt='Carta original de '+c.nombre;img.loading='lazy';box.append(img);}
  const actions=element('div',undefined,'detail-actions');
  if(myProperty(c)&&myTurn()){
    for(const [label,type]of [['Construir industria nacional','nacional'],['Construir multinacional','exportacion']]){
      const national=type==='nacional',level=national?(c.industriasNac||0):(n?.industriasExp||0);
      const price=info?.[national?'nac':'exp']?.[level];
      const cost=price===undefined?null:Math.floor(price*(state.descuento?0.5:1));
      const text=level>=3?label+' · Máximo alcanzado':label+(cost===null?'':' · '+amount(cost));
      const b=button(text,()=>action('construirIndustria',{nombrePropiedad:c.nombre,tipo:type}),'secondary');
      b.disabled=!socket.connected||busy||level>=3||(!national&&c.industriasNac<=level)||!(state.fase==='tirada'||state.fase==='gestion'&&state.descuento);
      actions.append(b);
    }
    if(me().dinero<0||state.pendiente?.tipo==='pago'&&me().dinero<state.pendiente.monto)actions.append(button('Subastar terreno e industrias',()=>action('subastarPropiedad',{nombrePropiedad:c.nombre})));
  }
  if(myTurn()&&state.monopolio&&c.id===me().posicion&&owner&&!myProperty(c))actions.append(button('Monopolizar terreno e industrias',()=>action('expropiarPropiedad',{nombrePropiedad:c.nombre})));
  box.append(actions);openDialog();
}
function tradeOwns(player, property) {
  return property.dueño === player.id || !!player.alianzaId && state.jugadores.some(q=>q.id===property.dueño && q.alianzaId===player.alianzaId);
}
function showTradeForm() {
  if(!myTurn() || !['tirada','gestion'].includes(state.fase) || busy || !socket.connected)return;
  const box=$('comercio-contenido'),p=me();box.replaceChildren();
  $('comercio-titulo').textContent='Proponer un trato';
  const rivals=state.jugadores.filter(q=>q.id!==p.id&&q.conectado&&!q.enQuiebra&&!(p.alianzaId&&q.alianzaId===p.alianzaId));
  if(!rivals.length){box.append(element('p','No hay jugadores conectados de otro grupo para comerciar.'));$('comercio-dialog').showModal();return;}
  box.append(element('p','Selecciona lo que entregas y lo que recibes. Cada propiedad incluye todas sus industrias nacionales y multinacionales. El trato solo se realiza si la otra persona acepta.'));
  const form=element('form'),label=element('label','Negociar con'),select=element('select');select.id='comercio-rival';label.htmlFor=select.id;
  for(const q of rivals){const opt=element('option',q.nombre);opt.value=q.id;select.append(opt);}
  form.append(label,select);
  const sides=element('div',undefined,'trade-columns');form.append(sides);
  let giveList,receiveList,payInput,chargeInput;
  const side=(title,owner,key)=>{
    const area=element('section',undefined,'trade-side');area.append(element('h3',title));
    const list=element('div',undefined,'trade-properties');
    const props=state.tablero.filter(c=>c.region==='sur'&&tradeOwns(owner,c));
    for(const c of props){
      const row=element('label',undefined,'trade-property'),input=element('input');input.type='checkbox';input.value=c.nombre;
      const img=element('img');img.src=catalog.find(x=>x.nombre===c.nombre)?.icono||'';img.alt='';
      const north=state.tablero.find(n=>n.baseSur===c.nombre);
      row.append(input,img,element('span',c.nombre+' · '+c.industriasNac+' nac. / '+(north?.industriasExp||0)+' mult.'));list.append(row);
    }
    if(!props.length)list.append(element('p','Sin propiedades. Puedes ofrecer dinero.'));
    const moneyLabel=element('label','Dinero ($)'),input=element('input');input.type='number';input.min='0';input.max=String(Math.min(1_000_000_000,Math.max(0,owner.dinero)));input.step='1';input.value='0';input.required=true;input.id='trade-'+key;moneyLabel.htmlFor=input.id;
    area.append(list,moneyLabel,input);sides.append(area);return [list,input];
  };
  const fill=()=>{sides.replaceChildren();[giveList,payInput]=side('Tú entregas',p,'pago');[receiveList,chargeInput]=side('Tú recibes',rivals.find(q=>q.id===select.value),'cobro');};
  select.onchange=fill;fill();
  form.append(element('p','Para comprar: ofrece dinero y selecciona la propiedad que recibes. Para vender: selecciona la que entregas e indica cuánto cobras. También puedes intercambiar varias propiedades.','card-note'));
  const send=element('button','Enviar oferta · esperar aceptación','primary');send.type='submit';form.append(send);
  form.onsubmit=e=>{
    e.preventDefault();
    if(!myTurn()||!['tirada','gestion'].includes(state.fase))return notice('Tu turno cambió. Cierra y vuelve a abrir el comercio.');
    const entrego=[...giveList.querySelectorAll('input:checked')].map(i=>i.value),recibo=[...receiveList.querySelectorAll('input:checked')].map(i=>i.value);
    if(!entrego.length&&!recibo.length)return notice('Selecciona al menos una propiedad.');
    const pago=Number(payInput.value),cobro=Number(chargeInput.value);
    if(pago&&cobro)return notice('Indica dinero solo en una dirección.');
    action('proponerComercio',{destinatarioId:select.value,entrego,recibo,pago,cobro});
  };
  box.append(form);if(!$('comercio-dialog').open)$('comercio-dialog').showModal();
}
function showTradeOffer(d, force=false) {
  const p=me(),mine=p.id===d.jugadorId,first=tradeShown!==d.id;
  const dialog=$('comercio-dialog'),box=$('comercio-contenido');
  tradeShown=d.id;box.replaceChildren();
  const sender=state.jugadores.find(q=>q.id===d.jugadorId),receiver=state.jugadores.find(q=>q.id===d.destinatarioId);
  $('comercio-titulo').textContent=mine?'Tu oferta a '+receiver?.nombre:'Oferta de '+sender?.nombre;
  const terms=(title,names,cash)=>{
    const area=element('section',undefined,'trade-side');area.append(element('h3',title));
    for(const name of names){const snap=d.propiedades.find(c=>c.nombre===name);area.append(element('p',name+' · '+snap.nacionales+' nacionales / '+snap.multinacionales+' multinacionales'));}
    if(!names.length)area.append(element('p','Sin propiedades'));
    area.append(element('strong',amount(cash)));return area;
  };
  const cols=element('div',undefined,'trade-columns');
  cols.append(terms(sender?.nombre+' entrega',d.entrego,d.pago),terms(receiver?.nombre+' entrega',d.recibo,d.cobro));box.append(cols);
  box.append(element('p','Incluye todas las industrias indicadas. No se transfieren deudas ni oro. La oferta caduca en un máximo de 60 segundos.','card-note'));
  const answer=(label,accept,style)=>{const b=button(label,()=>action('responderComercio',{decisionId:d.id,aceptar:accept}),style);b.disabled=busy||!socket.connected;box.append(b);};
  if(mine)answer('Cancelar oferta',false,'secondary');
  else {answer('Aceptar este trato',true,'primary');answer('Rechazar',false,'secondary');}
  if((first||force)&&!dialog.open)dialog.showModal();
}
function showProperties(){
  selectedProperty=null;const box=$('detalle-contenido');box.replaceChildren(element('p','PATRIMONIO','eyebrow'),element('h2','Mis propiedades'));
  const list=element('div',undefined,'detail-list'),properties=state.tablero.filter(c=>c.region==='sur'&&myProperty(c));
  if(!properties.length)list.append(element('p','Todavía no tienes propiedades.'));
  for(const c of properties)list.append(button(c.nombre+' ↗',()=>showProperty(c.id),'secondary'));
  box.append(list);openDialog();
}
function specialText(id){return ({0:'Habilita una votación de alianza. No se vota al iniciar la partida.',4:'Roba una carta de Solidaridad.',8:'Roba una condición si tienes deuda al FMI.',10:'Construye a mitad de precio durante este turno.',12:'Tira un dado y paga $1.000 por punto. No admite oro.',16:'Roba una carta de Solidaridad.',18:'Entregas tu efectivo, salvo que tengas resguardo.',19:'Roba una condición si tienes deuda.',20:'Activa o retira la barrera para todos. Con ella, las multinacionales no generan beneficios.',24:'Elige un terreno libre y recibe su primera industria. Si no hay terrenos libres, mejora una industria propia.',28:'Roba una condición si tienes deuda.',30:'Recibes $1.500 de ayuda al desarrollo del BID, sin generar deuda. Importe de esta edición web.',32:'Cada jugador entrega un lingote, si tiene.',36:'Roba una carta de Solidaridad.',38:'No pagarás intereses en el siguiente paso por el FMI.',39:'Al llegar o pasar pagas intereses. Reabren las industrias cerradas.'})[id]||'Consulta el registro para ver el efecto.';}
function renderLastCard(data) {
  currentCard = data || null;
  const box = $('ultima-carta');
  if (!data) { box.replaceChildren(element('span', 'LA MESA ESTÁ LISTA', 'eyebrow'), element('p', 'Una decisión puede cambiar toda la partida.')); return; }
  const content = element('div', undefined, 'last-card-copy');
  content.append(element('span', data.titulo, 'eyebrow'), element('p', data.texto));
  const open = button('Ver carta original ↗', () => showCard(currentCard), 'card-reopen'); content.append(open);
  box.replaceChildren();
  if (data.imagen) { const thumb = element('img'); thumb.src = data.imagen; thumb.alt = ''; thumb.className = 'last-card-thumb'; thumb.width = 42; thumb.height = 63; box.append(thumb); }
  box.append(content);
}
function showCard(data, automatic = false) {
  if (!data) return;
  if (automatic && data.roboId && data.roboId === lastCardShown) return;
  if (automatic) globalThis.GameAudio?.play(data.tipo === 'solidaridad' ? 'solidarity' : 'fmi');
  lastCardShown = data.roboId || null;
  $('carta-tipo').textContent = data.tipo === 'solidaridad' ? 'SOLIDARIDAD' : 'CONDICIONES FMI';
  $('carta-titulo').textContent = data.titulo;
  $('carta-jugador').textContent = data.jugador ? data.jugador + ' ha sacado esta carta.' : '';
  $('carta-efecto').textContent = data.texto;
  const img = $('carta-imagen');
  img.hidden = !data.imagen;
  img.onload = () => { img.hidden = false; };
  img.onerror = () => { img.hidden = true; };
  if (data.imagen) { img.alt = 'Carta original: ' + data.titulo; img.src = data.imagen; }
  else img.removeAttribute('src');
  if (!$('carta-dialog').open) $('carta-dialog').showModal();
}
function showResult(result){
  const key=JSON.stringify(result);if(key===lastResult)return;lastResult=key;selectedProperty=null;
  $('detalle-contenido').replaceChildren(element('p','FIN DE PARTIDA','eyebrow'),element('h2',result.ganador),element('p',result.motivo));openDialog();
}
$('reglas').onclick=()=>{
  selectedProperty=null;const box=$('detalle-contenido');box.replaceChildren(element('p','EDICIÓN WEB','eyebrow'),element('h2','Cómo jugar'));
  for(const [title,text]of [
    ['Inicio','Todos reciben $5.000 más un dado × $200: entre $5.200 y $6.200, sin deuda inicial. Empieza quien saque el dado más alto; los empates se resuelven por sorteo entre los empatados. Después se sigue el orden de la mesa.'],
    ['Tu turno','Gestiona tus industrias antes de tirar. Después resuelve la casilla y pulsa Terminar turno. Tienes tres minutos; una desconexión conserva tu turno durante un minuto.'],
    ['Construcción','Compra materias primas en el Sur. Puedes construir hasta tres industrias nacionales y tres multinacionales; cada nivel de exportación necesita el mismo nivel nacional. Ayuda Solidaria permite construir después de tirar al 50%.'],
    ['Dinero y oro','Las rentas son el precio de casilla por las industrias. Las cadenas suman sus rentas. El oro paga manufacturas e intereses, pero no cartas, industrias, fuga de capitales ni monopolios.'],
    ['Deudas','Préstamos por el importe que elijas, hasta $30.000 de deuda por jugador. Puedes amortizar hasta $5.000 en la fase de gestión o antes de tirar. Se usan dos dados; tres desde $10.000 y cuatro desde $20.000. Los intereses se cobran al pasar o llegar al FMI.'],
    ['Comercio','En tu turno, antes de tirar o tras resolver la casilla, puedes proponer propiedades y dinero a otro grupo. Cada terreno incluye sus industrias. El destinatario acepta o rechaza; la oferta caduca en 60 segundos como máximo. Cerrar la ventana no cancela la oferta.'],
    ['Alianzas y subastas','La alianza comparte efectivo, oro y propiedades, conservando las deudas individuales. En embargo y sin efectivo, subasta una propiedad durante 30 segundos; sin ofertas, el FMI paga el 50% y libera el terreno.'],
    ['Final','Gana el último jugador activo o el grupo que alcance las doce propiedades con tres industrias nacionales y tres multinacionales en cada una. Unirse en alianza no da una victoria automática.'],
    ['Adaptación web','Esta edición admite 2–4 jugadores, alianzas de hasta cuatro, amortización sin visitar el FMI y no obliga a desplazarse al FMI al alcanzar una devaluación. El monopolio opcional compra una propiedad y su exportación, no una cadena completa. El comercio permite acordar propiedades y dinero; no incluye negociación de oro o deudas.']
  ])box.append(element('h3',title),element('p',text));openDialog();
};
fetch('/api/catalogo').then(r=>{if(!r.ok)throw new Error();return r.json();}).then(data=>{catalog=data;if(state)renderBoard();}).catch(()=>notice('No se pudieron cargar los precios de construcción. Recarga la página.'));
if(!storageAvailable)notice('Este navegador no permite guardar la sesión. No podrás recuperar tu plaza al cerrarlo.');
fetch('/assets/tablero/manifest.json').then(r=>{if(!r.ok)throw new Error();return r.json();}).then(data=>{specialCatalog=data;if(state)renderBoard();}).catch(()=>notice('No se pudieron cargar las ilustraciones del tablero. Recarga la página.'));
socket.connect();
