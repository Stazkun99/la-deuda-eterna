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
const cells = new Map();
const icons = { 'Azúcar':'◈','Banano':'◒','Cacao':'◆','Algodón':'✿','Tabaco':'❧','Café':'☕','Pesca':'≈','Ganado':'♜','Cobre':'◇','Estaño':'⬡','Hierro':'⚒','Petróleo':'◕' };
const groups = { cafe_agricola:'#c99a4b',textil_agricola:'#bfa64e',ganaderia_pesca:'#6d9372',mineria:'#749da8',energia:'#ac8ba6' };
const me = () => state?.jugadores.find(p => p.userId === userId);
const myTurn = () => !!state?.enJuego && state.jugadores[state.turnoActual]?.id === me()?.id && !me()?.enQuiebra;
const myProperty = c => !!me() && (c.dueño === me().id || !!me().alianzaId && state.jugadores.some(p => p.id === c.dueño && p.alianzaId === me().alianzaId));
function notice(text) { clearTimeout(noticeTimer); $('aviso').textContent = text; $('aviso').hidden = false; noticeTimer = setTimeout(() => $('aviso').hidden = true, 7000); }
function remember(key, value) { if (storageAvailable) { try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch { storageAvailable = false; } } }
function action(event, data = {}) {
  if (!socket.connected || busy) return;
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
$('crear').onclick = () => join(true);
$('acceso').onsubmit = e => { e.preventDefault(); join(false); };
$('salir').onclick = () => {
  if (confirm('¿Abandonar la sala? Tu plaza se eliminará y tus propiedades se liberarán o pasarán a tu alianza.')) socket.emit('abandonarSala', {}, result => { if (!result?.ok) notice('No se pudo abandonar la sala.'); });
};
$('copiar').onclick = async () => { try { await navigator.clipboard.writeText(state.codigo); notice('Código copiado: ' + state.codigo); } catch { notice('Código de sala: ' + state.codigo); } };
$('iniciar').onclick = () => action('iniciarPartida', { monopolio: $('monopolio').checked });
$('tirar').onclick = () => action('tirarDado');
$('terminar').onclick = () => action('terminarTurno');
$('prestamo').onclick = () => action('pedirPrestamo');
$('amortizar').onclick = () => action('pagarDeuda');
$('levantar').onclick = () => action('levantarBarrera');
$('propiedades').onclick = showProperties;
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
socket.on('disconnect', () => { busy = false; $('conexion').textContent = 'Reconectando…'; updateControls(); renderDecision(true); });
socket.on('connect_error', () => { $('conexion').textContent = 'Sin conexión · reintentando'; updateControls(); });
socket.on('sesionReemplazada', message => { socket.disconnect(); $('conexion').textContent = 'Sesión en otra pestaña'; notice(message); });
socket.on('errorAcceso', message => { notice(message); if (!joinedRoom) remember('deuda_eterna_sala', null); });
socket.on('errorAccion', notice);
socket.on('salaAbandonada', () => { joinedRoom = null; state = null; remember('deuda_eterna_sala', null); $('codigo').value = ''; $('mesa').hidden = true; $('login').hidden = false; $('detalle').close(); $('carta-dialog').close(); $('registro').replaceChildren(); $('chat').replaceChildren(); lastResult = null; lastCardShown = null; currentCard = null; });
socket.on('nuevoMensajeChat', data => log($('chat'), data.texto, data.nombre, data.color));
socket.on('mensajeLog', text => log($('registro'), text));
socket.on('mostrarCartaModal', data => { renderLastCard(data); showCard(data, true); });
socket.on('finDeJuegoModal', showResult);
socket.on('actualizarEstado', next => {
  state = next;
  if (!me()) return;
  joinedRoom = state.codigo;
  $('login').hidden = true; $('mesa').hidden = false;
  $('sala-codigo').textContent = state.codigo;
  $('deuda').textContent = amount(state.deudaFMIGlobal);
  $('barrera').textContent = state.barreraProteccionista ? 'BARRERA ACTIVA' : 'COMERCIO ABIERTO';
  $('registro').replaceChildren();
  for (const message of state.registro || []) log($('registro'), message);
  renderLastCard(state.ultimaCarta);
  renderBoard(); renderPlayers(); updateControls(); renderDecision(); updateClock();
  if (state.resultado) showResult(state.resultado);
  else if (!state.finalizada) lastResult = null;
});
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
    const specialArt = [4, 16, 36].includes(c.id) ? '/assets/cartas/reversos/solidaridad.webp' : [8, 19, 28].includes(c.id) ? '/assets/cartas/reversos/condiciones.webp' : null;
    const iconUrl = art?.icono || specialArt;
    if (iconUrl) {
      const host = tile.querySelector('.tile-icon');
      if (host.dataset.src !== iconUrl) {
        const img = element('img'); img.src = iconUrl; img.alt = ''; img.width = 42; img.height = 30; img.decoding = 'async';
        host.replaceChildren(img); host.dataset.src = iconUrl; host.classList.add('original-art');
      }
    }
    const active = state.enJuego && state.jugadores[state.turnoActual]?.posicion === c.id;
    tile.className = 'tile ' + (c.region === 'norte' ? 'norte' : c.region === 'sur' ? 'sur' : 'special') + (active ? ' active' : '');
    const base = c.baseSur ? state.tablero.find(s => s.nombre === c.baseSur) : c;
    tile.style.setProperty('--group', groups[base.grupo] || '#a6b49a');
    const owner = state.jugadores.find(p => p.id === c.dueño);
    tile.style.setProperty('--owner', owner?.color || 'transparent');
    const n = c.region === 'sur' ? c.industriasNac : c.industriasExp;
    tile.querySelector('.tile-industries').textContent = n ? '▰'.repeat(n) : '';
    const tokens = tile.querySelector('.tile-tokens'); tokens.replaceChildren();
    for (const p of state.jugadores.filter(p => p.posicion === c.id && !p.enQuiebra)) {
      const token = element('span', p.nombre.slice(0, 1).toUpperCase(), 'token'); token.style.setProperty('--player', p.color); token.title = p.nombre; tokens.append(token);
    }
    tile.setAttribute('aria-label', `${c.id}. ${c.nombre}${owner ? '. Propietario: ' + owner.nombre : ''}${n ? '. Industrias: ' + n : ''}`);
  }
}
function renderPlayers() {
  $('jugadores').replaceChildren(); $('cantidad').textContent = state.jugadores.length + ' / 4';
  for (const p of state.jugadores) {
    const row = element('div', undefined, 'player' + (state.enJuego && state.jugadores[state.turnoActual]?.id === p.id ? ' current' : ''));
    const avatar = element('span', p.nombre.slice(0, 1).toUpperCase(), 'avatar'); avatar.style.setProperty('--player', p.color);
    const content = element('div'); content.append(element('div', p.nombre + (p.userId === userId ? ' · tú' : '') + (p.esLider ? ' ♛' : ''), 'player-name'));
    const stats = element('div', undefined, 'player-stats'); stats.append(element('span', amount(p.dinero)), element('span', 'Deuda ' + amount(p.deudaPersonal)), element('span', '◆ ' + p.oro)); content.append(stats);
    content.append(element('div', [!p.conectado && 'Desconectado', p.enQuiebra && 'En quiebra', p.enAlianza && 'Alianza · caja común', p.industriasCerradas && 'Industrias cerradas', p.turnosPerdidos > 0 && 'Desempleo: ' + p.turnosPerdidos, p.deudaPersonal >= 30000 && 'Límite de deuda'].filter(Boolean).join(' · '), 'player-status'));
    row.append(avatar, content); $('jugadores').append(row);
  }
}
function updateControls() {
  $('crear').disabled = $('unirse').disabled = !socket.connected;
  if (!state) return;
  const p = me(), current = state.jugadores[state.turnoActual], mine = myTurn(), locked = busy || !socket.connected;
  $('turno').textContent = state.enJuego ? mine ? 'Tu turno, ' + p.nombre : 'Turno de ' + current?.nombre : state.finalizada ? 'Partida terminada' : 'Esperando jugadores';
  $('turno-centro').textContent = state.enJuego ? current?.nombre : 'En espera';
  const phases = { tirada:'Construye o gestiona tu deuda antes de tirar.', gestion:state.descuento ? 'Ayuda Solidaria: construye al 50% antes de terminar.' : 'Resuelve tus finanzas y termina el turno.', compra:'Hay una compra pendiente.', pago:'Hay un pago pendiente.', votacion:'La mesa está votando una alianza.', subasta:'Subasta abierta: 30 segundos para pujar.', eleccion:'Hay una elección pendiente.' };
  $('fase').textContent = state.enJuego ? phases[state.fase] || '' : 'Mínimo dos conectados. Al iniciar se liberan las plazas desconectadas.';
  $('inicio').hidden = state.enJuego || !p?.esLider;
  $('iniciar').disabled = locked || state.jugadores.filter(j => j.conectado).length < 2;
  $('acciones').hidden = !state.enJuego;
  $('tirar').hidden = state.fase !== 'tirada'; $('tirar').disabled = locked || !mine;
  $('terminar').hidden = state.fase !== 'gestion'; $('terminar').disabled = locked || !mine;
  const collective = ['subasta','votacion'].includes(state.fase);
  $('prestamo').disabled = locked || !mine || collective || !state.jugadores.some(q => (q.id === p.id || p.alianzaId && q.alianzaId === p.alianzaId) && q.deudaPersonal < 30000);
  $('amortizar').disabled = locked || !mine || !['tirada','gestion'].includes(state.fase) || p.deudaPersonal <= 0 || p.dinero < Math.min(5000,p.deudaPersonal);
  $('levantar').hidden = !state.barreraProteccionista;
  $('levantar').disabled = locked || !mine || !['tirada','gestion'].includes(state.fase) || p.dinero < 2000;
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
  const d = state.pendiente, p = me(), container = $('decision');
  const key = JSON.stringify([d, state.turnoId, p?.dinero, p?.oro, socket.connected, busy]);
  if (!force && key === lastDecisionKey) return;
  lastDecisionKey = key; container.replaceChildren();
  if (!d || !p) return;
  const mine = d.jugadorId === p.id;
  const add = (text, event, data, disabled = false, primary = false) => { const b = button(text, () => action(event, { ...data, decisionId: d.id }), primary ? 'primary choice' : 'ghost choice'); b.disabled = disabled || busy || !socket.connected; container.append(b); };
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
      container.append(element('h3','Elige tu siguiente movimiento'));
      for(const option of d.opciones)add(option.label,'resolverEleccion',{opcion:option.id});
    }
  } else container.append(element('p','Esperando la decisión de '+(state.jugadores.find(j=>j.id===d.jugadorId)?.nombre||'otro jugador')+'.'));
}
function openDialog() { if (!$('detalle').open) $('detalle').showModal(); }
function showProperty(id) {
  const original=state.tablero[id],c=original.region==='norte'?state.tablero.find(s=>s.nombre===original.baseSur):original;
  selectedProperty=c.nombre;
  const box=$('detalle-contenido');box.replaceChildren(element('p',(original.region||'CASILLA ESPECIAL').toUpperCase(),'eyebrow'),element('h2',original.nombre));
  if(c.tipo!=='propiedad'){box.append(element('p',specialText(c.id)));openDialog();return;}
  const owner=state.jugadores.find(j=>j.id===c.dueño),n=state.tablero.find(s=>s.baseSur===c.nombre),info=catalog.find(i=>i.nombre===c.nombre);
  box.append(element('p',(owner?'Propiedad de '+owner.nombre:'Terreno disponible')+' · '+amount(c.precio)),element('p','Industrias nacionales: '+(c.industriasNac||0)+'/3 · Multinacionales: '+(n?.industriasExp||0)+'/3'));
  if(info?.imagen){const img=element('img');img.className='property-original';img.src=info.imagen;img.alt='Carta original de '+c.nombre;img.loading='lazy';box.append(img,element('p','Carta original de referencia. Los valores de esta edición se muestran en la tabla.','card-note'));}
  if(info){const table=element('table'),header=element('tr');['Nivel','Nacional','Multinacional'].forEach(x=>header.append(element('th',x)));table.append(header);for(let i=0;i<3;i++){const row=element('tr');[i+1,amount(info.nac[i]),amount(info.exp[i])].forEach(x=>row.append(element('td',x)));table.append(row);}box.append(table);}
  const actions=element('div',undefined,'detail-actions');
  if(myProperty(c)&&myTurn()){
    for(const [label,type]of [['Construir industria nacional','nacional'],['Construir multinacional','exportacion']]){const b=button(label,()=>action('construirIndustria',{nombrePropiedad:c.nombre,tipo:type}),'secondary');b.disabled=!socket.connected||busy||!(state.fase==='tirada'||state.fase==='gestion'&&state.descuento);actions.append(b);}
    if(me().dinero<0||state.pendiente?.tipo==='pago'&&me().dinero<state.pendiente.monto)actions.append(button('Subastar terreno e industrias',()=>action('subastarPropiedad',{nombrePropiedad:c.nombre})));
  }
  if(myTurn()&&state.monopolio&&c.id===me().posicion&&owner&&!myProperty(c))actions.append(button('Monopolizar terreno e industrias',()=>action('expropiarPropiedad',{nombrePropiedad:c.nombre})));
  box.append(actions);openDialog();
}
function showProperties(){
  selectedProperty=null;const box=$('detalle-contenido');box.replaceChildren(element('p','PATRIMONIO','eyebrow'),element('h2','Mis propiedades'));
  const list=element('div',undefined,'detail-list'),properties=state.tablero.filter(c=>c.region==='sur'&&myProperty(c));
  if(!properties.length)list.append(element('p','Todavía no tienes propiedades.'));
  for(const c of properties)list.append(button(c.nombre+' ↗',()=>showProperty(c.id),'secondary'));
  box.append(list);openDialog();
}
function specialText(id){return ({0:'Habilita una votación de alianza. No se vota al iniciar la partida.',4:'Roba una carta de Solidaridad.',8:'Roba una condición si tienes deuda al FMI.',10:'Construye a mitad de precio durante este turno.',12:'Tira un dado y paga $1.000 por punto. No admite oro.',16:'Roba una carta de Solidaridad.',18:'Entregas tu efectivo, salvo que tengas resguardo.',19:'Roba una condición si tienes deuda.',20:'Activa o retira la barrera para todos. Con ella, las multinacionales no generan beneficios.',24:'Elige un terreno libre y recibe su primera industria. Si no hay terrenos libres, mejora una industria propia.',28:'Roba una condición si tienes deuda.',30:'Recibes $50 de ayuda del BID.',32:'Cada jugador entrega un lingote, si tiene.',36:'Roba una carta de Solidaridad.',38:'No pagarás intereses en el siguiente paso por el FMI.',39:'Al llegar o pasar pagas intereses. Reabren las industrias cerradas.'})[id]||'Consulta el registro para ver el efecto.';}
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
    ['Tu turno','Gestiona tus industrias antes de tirar. Después resuelve la casilla y pulsa Terminar turno. Tienes tres minutos; una desconexión conserva tu turno durante un minuto.'],
    ['Construcción','Compra materias primas en el Sur. Puedes construir hasta tres industrias nacionales y tres multinacionales; cada nivel de exportación necesita el mismo nivel nacional. Ayuda Solidaria permite construir después de tirar al 50%.'],
    ['Dinero y oro','Las rentas son el precio de casilla por las industrias. Las cadenas suman sus rentas. El oro paga manufacturas e intereses, pero no cartas, industrias, fuga de capitales ni monopolios.'],
    ['Deudas','Préstamos en cuotas de $5.000 hasta $30.000 por jugador. Puedes amortizar hasta $5.000 en la fase de gestión o antes de tirar. Se usan dos dados; tres desde $10.000 y cuatro desde $20.000. Los intereses se cobran al pasar o llegar al FMI.'],
    ['Alianzas y subastas','La alianza comparte efectivo, oro y propiedades, conservando las deudas individuales. En embargo y sin efectivo, subasta una propiedad durante 30 segundos; sin ofertas, el FMI paga el 50% y libera el terreno.'],
    ['Final','Gana el último jugador activo o el grupo que alcance las doce propiedades con tres industrias nacionales y tres multinacionales en cada una. Unirse en alianza no da una victoria automática.'],
    ['Adaptación web','Esta edición admite 2–4 jugadores, alianzas de hasta cuatro, amortización sin visitar el FMI y no obliga a desplazarse al FMI al alcanzar una devaluación. El monopolio opcional compra una propiedad y su exportación, no una cadena completa. No incluye venta privada ni negociación de regalos.']
  ])box.append(element('h3',title),element('p',text));openDialog();
};
fetch('/api/catalogo').then(r=>{if(!r.ok)throw new Error();return r.json();}).then(data=>{catalog=data;if(state)renderBoard();}).catch(()=>notice('No se pudieron cargar los precios de construcción. Recarga la página.'));
if(!storageAvailable)notice('Este navegador no permite guardar la sesión. No podrás recuperar tu plaza al cerrarlo.');
socket.connect();
