'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Game, GameError } = require('../lib/game');
function fixture(count = 3) {
  let time = 1_000_000;
  const messages = [];
  const game = new Game({ now: () => time, dice: () => 1, emit: (...args) => messages.push(args) });
  for (let i = 0; i < count; i++) game.join('s' + i, { nombre: 'Jugador ' + i, userId: 'usuario_' + i, sessionToken: String(i).repeat(64), sala: 'PRUEBA', crear: i === 0 });
  const r = game.rooms.PRUEBA;
  const act = (index, event, data = {}) => game.action('s' + index, event, { turnoId: r.turnoId, ...data });
  act(0, 'iniciarPartida', { monopolio: true });
  return { game, r, act, messages, advance: ms => { time += ms; game.tick(); } };
}
const rejects = fn => assert.throws(fn, GameError);
test('sesiones: el identificador público no permite suplantar y el secreto no se publica', () => {
  const { game, r } = fixture();
  rejects(() => game.join('intruso', { nombre: 'Intruso', userId: 'usuario_1', sessionToken: '9'.repeat(64), sala: 'PRUEBA' }));
  assert.equal(r.jugadores[1].socketId, 's1');
  const state = JSON.stringify(game.state(r)); assert.ok(!state.includes('tokenHash')); assert.ok(!state.includes('socketId')); assert.ok(!state.includes('mazos'));
  const joined = game.join('reconectado', { nombre: 'Jugador 1', userId: 'usuario_1', sessionToken: '1'.repeat(64), sala: 'PRUEBA' });
  assert.equal(joined.replacedSocket, 's1'); rejects(() => game.action('s1', 'pedirPrestamo', {}));
});
test('entrada validada: datos malformados, colisión y cambio de sala', () => {
  const { game } = fixture();
  for (const data of [null, {}, [], { sala: '__proto__' }, { nombre: 'a', userId: 'usuario_0', sessionToken: '0'.repeat(64), sala: 'PRUEBA', crear: 'sí' }]) rejects(() => game.join('x', data));
  rejects(() => game.join('s0', { nombre: 'a', userId: 'usuario_0', sessionToken: '0'.repeat(64), sala: 'OTRA', crear: true }));
  rejects(() => game.join('x', { nombre: 'a', userId: 'usuario_9', sessionToken: '9'.repeat(64), sala: 'PRUEBA', crear: true }));
});
test('no acepta pagos inventados ni cambiar el importe de un pago real', () => {
  const { game, r, act } = fixture(); const p = r.jugadores[0];
  rejects(() => act(0, 'responderDecisionPago', { usarOro: false, monto: -10000 }));
  game.payment(r, p, 300, 'Pago real'); const id = r.pendiente.id, cash = p.dinero;
  act(0, 'responderDecisionPago', { decisionId: id, usarOro: false, monto: -10000, dueñoId: r.jugadores[1].id });
  assert.equal(p.dinero, cash - 300); assert.equal(r.jugadores[1].dinero, 1000);
  rejects(() => act(0, 'responderDecisionPago', { decisionId: id, usarOro: false }));
});
test('no repite dados ni acepta movimientos fuera de turno o de turnos anteriores', () => {
  const { r, act } = fixture(); const old = r.turnoId;
  rejects(() => act(1, 'pedirPrestamo')); act(0, 'tirarDado');
  assert.equal(r.jugadores[0].posicion, 2); assert.equal(r.fase, 'compra');
  rejects(() => act(0, 'tirarDado')); rejects(() => act(0, 'terminarTurno'));
  act(0, 'decidirCompraPropiedad', { decisionId: r.pendiente.id, comprar: false }); act(0, 'terminarTurno');
  rejects(() => act(1, 'tirarDado', { turnoId: old }));
});
test('compra, construcción y exportación validan propietario, fase y niveles', () => {
  const { game, r, act } = fixture(); const p = r.jugadores[0], c = r.tablero[2];
  act(0, 'tirarDado'); act(0, 'decidirCompraPropiedad', { decisionId: r.pendiente.id, comprar: true });
  assert.equal(c.dueño, p.id); rejects(() => act(0, 'construirIndustria', { nombrePropiedad: c.nombre, tipo: 'nacional' }));
  game.beginTurn(r); act(0, 'pedirPrestamo');
  rejects(() => act(0, 'construirIndustria', { nombrePropiedad: 'Azúcar', tipo: 'nacional' }));
  act(0, 'construirIndustria', { nombrePropiedad: c.nombre, tipo: 'nacional' }); act(0, 'construirIndustria', { nombrePropiedad: c.nombre, tipo: 'exportacion' });
  rejects(() => act(0, 'construirIndustria', { nombrePropiedad: c.nombre, tipo: 'exportacion' }));
  assert.equal(game.north(r, c).industriasExp, 1);
});
test('las 12 materias primas tienen una exportación única', () => {
  const { game, r } = fixture(); const north = new Set();
  for (const c of r.tablero.filter(c => c.region === 'sur')) { const n = game.north(r, c); assert.ok(n); north.add(n.id); }
  assert.equal(north.size, 12); assert.equal(r.tablero[33].baseSur, 'Cobre');
});
test('rentas por industrias y cadenas, también en el Norte', () => {
  const { game, r } = fixture();
  for (const id of [5, 6, 7]) { r.tablero[id].dueño = r.jugadores[0].id; r.tablero[id].industriasNac = id === 7 ? 1 : 2; const n = game.north(r,r.tablero[id]); n.dueño=r.jugadores[0].id;n.industriasExp=1; }
  assert.equal(game.rent(r,r.tablero[5]),1450); assert.equal(game.rent(r,r.tablero[25]),1800);
  r.tablero[7].industriasNac=0; assert.equal(game.rent(r,r.tablero[5]),500);
});
test('al abandonar, los dueños conservan identidad y no se saltan turnos', () => {
  const { game, r } = fixture(); const owner=r.jugadores[2];r.tablero[5].dueño=owner.id;r.tablero[5].industriasNac=1;r.turnoActual=1;
  game.leave('s0'); assert.equal(r.jugadores[r.turnoActual].socketId,'s1'); assert.equal(game.player(r,r.tablero[5].dueño),owner);
  game.leave('s1'); assert.equal(r.jugadores[0].id,owner.id); assert.equal(r.enJuego,false);
});
test('reiniciar partida limpia propiedades, aliados, posición, oro y estado anterior', () => {
  const { r, act }=fixture();r.enJuego=false;r.finalizada=true;r.jugadores[0].posicion=33;r.jugadores[0].oro=0;r.jugadores[0].alianzaId='old';r.tablero[1].dueño=r.jugadores[0].id;r.tablero[1].industriasNac=3;
  act(0,'iniciarPartida',{monopolio:false});assert.equal(r.jugadores[0].posicion,0);assert.equal(r.jugadores[0].oro,3);assert.equal(r.jugadores[0].alianzaId,null);assert.equal(r.tablero[1].dueño,null);
});
test('intereses al llegar al FMI, oro y continuación de la casilla tras el pago',()=>{
  const {r,act}=fixture();const p=r.jugadores[0];p.posicion=37;p.deudaPersonal=5000;
  act(0,'tirarDado');assert.equal(p.posicion,39);assert.equal(r.pendiente.monto,500);act(0,'responderDecisionPago',{decisionId:r.pendiente.id,usarOro:true});assert.equal(p.oro,2);assert.equal(r.fase,'gestion');
});
test('intereses antes de una oferta al cruzar el FMI',()=>{
  const {game,r,act}=fixture();const p=r.jugadores[0];p.posicion=38;p.deudaPersonal=10000;
  act(0,'tirarDado');assert.equal(p.posicion,1);assert.equal(r.pendiente.monto,1000);act(0,'responderDecisionPago',{decisionId:r.pendiente.id,usarOro:true});assert.equal(r.fase,'compra');assert.equal(r.pendiente.nombrePropiedad,'Azúcar');
});
test('NO PAGAR evita intereses una vez',()=>{const {game,r}=fixture();const p=r.jugadores[0];p.deudaPersonal=10000;p.noPagarVuelta=true;assert.equal(game.interest(p),0);assert.equal(game.interest(p),1000);});
test('Ecuador paga 2400 y las 17 condiciones tienen efectos ejecutables',()=>{
  const {game,r}=fixture();const p=r.jugadores[0];const cash=p.dinero;r.mazos.solidaridad=[10];game.card(r,p,'solidaridad');assert.equal(p.dinero,cash+2400);assert.equal(p.posicion,0);
  for(let id=1;id<=17;id++){const f=fixture();f.r.mazos.condiciones=[id];f.r.jugadores[0].deudaPersonal=10000;assert.doesNotThrow(()=>f.game.card(f.r,f.r.jugadores[0],'condiciones'));}
});
test('cartas colectivas afectan a los jugadores indicados y el 15% depende de la deuda',()=>{
  const {game,r}=fixture();const p=r.jugadores[0];p.deudaPersonal=20000;r.mazos.condiciones=[2];game.card(r,p,'condiciones');assert.equal(r.pendiente.monto,3000);assert.equal(r.pendiente.oroPermitido,false);
  r.mazos.condiciones=[5];r.jugadores[1].deudaPersonal=5000;game.card(r,p,'condiciones');assert.equal(p.dinero,500);assert.equal(r.jugadores[1].dinero,500);assert.equal(r.jugadores[2].dinero,1000);
});
test('barrera global cancela exportaciones, y el peaje la retira para todos',()=>{
  const {game,r,act}=fixture();const p=r.jugadores[0];r.tablero[1].dueño=p.id;r.tablero[1].industriasNac=1;r.tablero[21].dueño=p.id;r.tablero[21].industriasExp=1;
  game.land(r,p,20);assert.equal(r.barreraProteccionista,true);game.land(r,p,21);assert.equal(p.dinero,1000);
  r.fase='gestion';act(0,'pedirPrestamo');act(0,'levantarBarrera');assert.equal(r.barreraProteccionista,false);game.land(r,p,21);assert.equal(p.dinero,4200);
});
test('votación no admite duplicados y comparte caja sin duplicar deuda',()=>{
  const {game,r,act}=fixture();const p=r.jugadores[0],q=r.jugadores[1];p.deudaPersonal=5000;q.deudaPersonal=10000;
  game.startVote(r,p);const id=r.pendiente.id;act(0,'responderVotoAlianza',{decisionId:id,voto:true});rejects(()=>act(0,'responderVotoAlianza',{decisionId:id,voto:true}));
  act(1,'responderVotoAlianza',{decisionId:id,voto:true});act(2,'responderVotoAlianza',{decisionId:id,voto:false});assert.equal(p.dinero,500);assert.equal(q.dinero,500);assert.equal(p.oro,6);assert.equal(p.deudaPersonal,5000);assert.equal(q.deudaPersonal,10000);assert.equal(r.enJuego,true);
  game.money(r,p,200);assert.equal(q.dinero,700);assert.equal(game.state(r).deudaFMIGlobal,15000);
});
test('préstamo de grupo sigue disponible si solo un miembro llega al límite',()=>{
  const {r,act}=fixture();const [p,q]=r.jugadores;p.alianzaId=q.alianzaId='grupo';p.deudaPersonal=30000;
  act(0,'pedirPrestamo');assert.equal(p.deudaPersonal,30000);assert.equal(q.deudaPersonal,5000);assert.equal(p.dinero,q.dinero);
});
test('al salir de una alianza, los bienes continúan en su grupo',()=>{
  const {game,r}=fixture();const [p,q]=r.jugadores;p.alianzaId=q.alianzaId='grupo';r.tablero[1].dueño=p.id;r.tablero[1].industriasNac=2;game.leave('s0');assert.equal(r.tablero[1].dueño,q.id);assert.equal(r.tablero[1].industriasNac,2);
});
test('subasta vende al mejor postor con la exportación y descuenta el precio',()=>{
  const {game,r,act,advance}=fixture();const [p,q]=r.jugadores;p.deudaPersonal=30000;p.dinero=-100;r.tablero[1].dueño=p.id;r.tablero[1].industriasNac=1;r.tablero[21].dueño=p.id;r.tablero[21].industriasExp=1;
  act(0,'subastarPropiedad',{nombrePropiedad:'Azúcar'});const id=r.pendiente.id;assert.equal(r.pendiente.base,275);rejects(()=>act(0,'pujarSubasta',{decisionId:id,monto:300}));act(1,'pujarSubasta',{decisionId:id,monto:300});rejects(()=>act(2,'pujarSubasta',{decisionId:id,monto:299}));advance(30001);assert.equal(r.tablero[1].dueño,q.id);assert.equal(r.tablero[21].dueño,q.id);assert.equal(q.dinero,700);assert.equal(p.dinero,200);
});
test('subasta sin pujas paga el 50% y libera industrias',()=>{
  const {r,act,advance}=fixture();const p=r.jugadores[0];p.deudaPersonal=30000;p.dinero=-100;r.tablero[1].dueño=p.id;r.tablero[1].industriasNac=1;act(0,'subastarPropiedad',{nombrePropiedad:'Azúcar'});advance(30001);assert.equal(p.dinero,25);assert.equal(r.tablero[1].dueño,null);assert.equal(r.tablero[1].industriasNac,0);
});
test('monopolio compra terreno y exportación y solo se permite al caer allí',()=>{
  const {game,r,act}=fixture();const [p,q]=r.jugadores;p.dinero=10000;p.posicion=1;r.tablero[1].dueño=q.id;r.tablero[1].industriasNac=1;r.tablero[21].dueño=q.id;r.tablero[21].industriasExp=1;game.land(r,p,1);act(0,'expropiarPropiedad',{nombrePropiedad:'Azúcar'});assert.equal(p.dinero,7450);assert.equal(q.dinero,1550);assert.equal(r.tablero[21].dueño,p.id);assert.equal(r.pendiente,null);
});
test('reconexión conserva la decisión pendiente y desconexión no bloquea al resto',()=>{
  const {game,r,act,advance}=fixture();act(0,'tirarDado');const id=r.pendiente.id;game.disconnect('s0');assert.equal(r.pendiente.id,id);advance(60001);assert.equal(r.turnoActual,1);assert.equal(r.pendiente,null);assert.equal(r.jugadores[0].dinero,1150);
});
test('inactividad no evita pagar: resuelve intereses y renta antes de pasar turno',()=>{
  const {game,r,advance}=fixture();const p=r.jugadores[0];p.posicion=21;game.payment(r,p,500,'Interés');r.continuacion={posicion:21};advance(180001);assert.equal(p.dinero,300);assert.equal(r.turnoActual,1);
});
test('votación expira sin bloquear el turno',()=>{const {game,r,advance}=fixture();game.startVote(r,r.jugadores[0]);advance(30001);assert.equal(r.pendiente,null);assert.equal(r.fase,'gestion');});
test('guardado recupera una compra pendiente con todas las conexiones marcadas ausentes',()=>{
  const {game,r,act}=fixture();act(0,'tirarDado');const saved=structuredClone(game.rooms);const restored=new Game({rooms:saved});assert.equal(restored.rooms.PRUEBA.pendiente.id,r.pendiente.id);assert.ok(restored.rooms.PRUEBA.jugadores.every(p=>!p.conectado&&p.socketId===null));
});
test('salas sin nadie conectado caducan después de 24 horas',()=>{const {game,advance}=fixture();for(let i=0;i<3;i++)game.disconnect('s'+i);advance(24*3600000+1);assert.equal(Object.keys(game.rooms).length,0);});
test('victoria industrial comprobada al construir, sin otra tirada',()=>{
  const {r,act}=fixture();const p=r.jugadores[0];p.dinero=100000;for(const c of r.tablero.filter(c=>c.region==='sur')){c.dueño=p.id;c.industriasNac=3;}for(const c of r.tablero.filter(c=>c.region==='norte')){c.dueño=p.id;c.industriasExp=3;}r.tablero[21].industriasExp=2;act(0,'construirIndustria',{nombrePropiedad:'Azúcar',tipo:'exportacion'});assert.equal(r.enJuego,false);assert.ok(r.resultado.motivo.includes('KO'));
});
test('lobby restaurado asigna anfitrión conectado e inicia sin plazas ausentes',()=>{
 const {game}=fixture();const saved=structuredClone(game.rooms);saved.PRUEBA.enJuego=false;
 const restored=new Game({rooms:saved});restored.join('nuevo1',{nombre:'Uno',userId:'usuario_1',sessionToken:'1'.repeat(64),sala:'PRUEBA'});restored.join('nuevo2',{nombre:'Dos',userId:'usuario_2',sessionToken:'2'.repeat(64),sala:'PRUEBA'});
 restored.action('nuevo1','iniciarPartida',{monopolio:false});assert.equal(restored.rooms.PRUEBA.jugadores.length,2);assert.equal(restored.rooms.PRUEBA.jugadores[0].esLider,true);
});
test('simulación prolongada mantiene dinero entero, propiedad válida y niveles coherentes',()=>{
 const {game,r,act}=fixture(4);game.dice=(()=>{let seed=57;return()=>{seed=(seed*1664525+1013904223)>>>0;return seed%6+1;};})();
 for(let step=0;step<800&&r.enJuego;step++){
  const p=r.jugadores[r.turnoActual],index=r.jugadores.indexOf(p),d=r.pendiente;
  if(r.fase==='votacion'){
   for(const id of [...d.elegibles]){if(r.fase!=='votacion')break;const i=r.jugadores.findIndex(q=>q.id===id);if(!Object.hasOwn(d.votos,id))act(i,'responderVotoAlianza',{decisionId:d.id,voto:step%2===0});}
  }else if(r.fase==='subasta'){game.finishAuction(r);}
  else if(d?.tipo==='pago')act(index,'responderDecisionPago',{decisionId:d.id,usarOro:d.oroPermitido&&p.oro>0});
  else if(d?.tipo==='compra')act(index,'decidirCompraPropiedad',{decisionId:d.id,comprar:p.dinero>=game.sur(r,d.nombrePropiedad).precio});
  else if(d?.tipo==='eleccion')act(index,'resolverEleccion',{decisionId:d.id,opcion:d.opciones[0].id});
  else{
   game.settleAbsent(r,p);if(!r.enJuego)break;if(p.enQuiebra){game.nextTurn(r);continue;}
   if(r.fase==='tirada'){
    for(const c of game.assets(r,p)){
     const n=game.north(r,c),type=c.industriasNac<3?'nacional':n.industriasExp<3?'exportacion':null;
     if(type){const price=game.info(c)[type==='nacional'?'nac':'exp'][type==='nacional'?c.industriasNac:n.industriasExp];if(p.dinero>=price)act(index,'construirIndustria',{nombrePropiedad:c.nombre,tipo:type});}
    }
    if(r.enJuego)act(index,'tirarDado');
   }else if(r.fase==='gestion')act(index,'terminarTurno');
  }
  for(const q of r.jugadores){assert.ok(Number.isSafeInteger(q.dinero));assert.ok(Number.isSafeInteger(q.deudaPersonal)&&q.deudaPersonal>=0&&q.deudaPersonal<=30000);assert.ok(Number.isInteger(q.oro)&&q.oro>=0);}
  for(const c of r.tablero.filter(c=>c.region==='sur')){assert.ok(c.dueño===null||game.player(r,c.dueño));assert.ok(c.industriasNac>=0&&c.industriasNac<=3);const n=game.north(r,c);assert.ok(n.industriasExp>=0&&n.industriasExp<=c.industriasNac);if(n.industriasExp)assert.equal(n.dueño,c.dueño);}
 }
});

test('Industrialización al caer permite elegir terreno libre sin cobrar y bloquea elecciones ajenas o repetidas', () => {
  const {game,r,act}=fixture();const p=r.jugadores[0];p.posicion=22;
  const money=p.dinero;act(0,'tirarDado');assert.equal(p.posicion,24);
  const d=r.pendiente;assert.equal(d.efecto,'industrializar');assert.equal(d.opciones.length,12);
  rejects(()=>act(1,'resolverEleccion',{decisionId:d.id,opcion:'Cobre'}));
  rejects(()=>act(0,'resolverEleccion',{decisionId:d.id,opcion:'Cobre:nacional'}));
  act(0,'resolverEleccion',{decisionId:d.id,opcion:'Cobre'});
  assert.equal(game.sur(r,'Cobre').dueño,p.id);assert.equal(game.sur(r,'Cobre').industriasNac,1);
  assert.equal(p.dinero,money);assert.equal(r.fase,'gestion');assert.equal(r.pendiente,null);
  rejects(()=>act(0,'resolverEleccion',{decisionId:d.id,opcion:'Cobre'}));
});

test('Industrialización sin terrenos libres mejora nacionales o multinacionales propias gratuitamente', () => {
  for(const type of ['nacional','exportacion']) {
    const {game,r,act}=fixture();const p=r.jugadores[0];p.posicion=22;
    for(const c of r.tablero.filter(c=>c.region==='sur'))c.dueño=r.jugadores[1].id;
    const c=game.sur(r,'Cobre');c.dueño=p.id;c.industriasNac=1;
    const money=p.dinero;act(0,'tirarDado');
    assert.deepEqual(r.pendiente.opciones.map(o=>o.id),['Cobre:nacional','Cobre:exportacion']);
    act(0,'resolverEleccion',{decisionId:r.pendiente.id,opcion:'Cobre:'+type});
    assert.equal(c.industriasNac,type==='nacional'?2:1);
    assert.equal(game.north(r,c).industriasExp,type==='exportacion'?1:0);
    if(type==='exportacion')assert.equal(game.north(r,c).dueño,p.id);
    assert.equal(p.dinero,money);assert.equal(r.fase,'gestion');
  }
});

test('Industrialización sin mejoras disponibles informa y no bloquea el turno',()=>{
  const {r,act}=fixture();r.jugadores[0].posicion=22;
  for(const c of r.tablero.filter(c=>c.region==='sur'))c.dueño=r.jugadores[1].id;
  act(0,'tirarDado');assert.equal(r.pendiente,null);assert.equal(r.fase,'gestion');
  assert.ok(r.registro.some(s=>s.includes('no quedan terrenos libres')));
});

test('la tirada pública contiene los dados reales de 2, 3 o 4 dados y se conserva al recuperar la sala',()=>{
  for(const [debt,count] of [[0,2],[10000,3],[20000,4]]) {
    const {game,r,act}=fixture();r.jugadores[0].deudaPersonal=debt;
    act(0,'tirarDado');const roll=game.state(r).ultimaTirada;
    assert.equal(roll.dados.length,count);assert.equal(roll.total,count);assert.equal(r.jugadores[0].posicion,count);
    assert.ok(roll.id);assert.equal(roll.jugador,r.jugadores[0].nombre);
    const restored=new Game({rooms:structuredClone(game.rooms)});
    assert.deepEqual(restored.state(restored.rooms.PRUEBA).ultimaTirada,roll);
  }
});
