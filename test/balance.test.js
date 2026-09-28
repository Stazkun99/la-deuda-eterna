'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {Game}=require('../lib/game');const strategy=require('../lib/bot-strategy');
function setup(){let time=10000;const g=new Game({now:()=>time,dice:()=>1,chooseIndex:n=>n-1});
 for(let i=0;i<2;i++)g.join('s'+i,{nombre:'Jugador '+i,userId:'user_test_'+i,sessionToken:String(i).repeat(64),sala:'BALANCE',crear:i===0});
 g.action('s0','iniciarPartida',{monopolio:false});const r=g.rooms.BALANCE,p=r.jugadores[0];r.turnoActual=0;g.beginTurn(r);
 const own=(ids,level=1)=>{for(const id of ids){const c=r.tablero[id];g.transfer(r,c,p.id);c.industriasNac=level;}};
 return {g,r,p,own,advance:ms=>time+=ms};}
test('pareja regional y cadena completa; cobro Sur incluye el bono sin doble acumulación',()=>{
 const {g,r,p,own}=setup();own([1,3]);assert.equal(g.rent(r,r.tablero[1]),150);
 const cash=p.dinero;g.land(r,p,1);assert.equal(p.dinero,cash+75);
 assert.equal(g.rent(r,r.tablero[21]),0);own([2]);assert.equal(g.rent(r,r.tablero[1]),450);
 g.land(r,p,1);assert.equal(p.dinero,cash+300);
 for(const id of [21,23]){r.tablero[id].dueño=p.id;r.tablero[id].industriasExp=1;}
 assert.equal(g.rent(r,r.tablero[21]),300);assert.equal(g.rent(r,r.tablero[22]),0);
 r.tablero[23].dueño=r.jugadores[1].id;assert.equal(g.rent(r,r.tablero[21]),200);
});
test('Sur no paga sin industria, durante cierre/desempleo; pesca y petróleo conservan su regla',()=>{
 const {g,r,p,own}=setup();own([1],0);let cash=p.dinero;g.land(r,p,1);assert.equal(p.dinero,cash);
 own([1]);p.industriasCerradas=true;g.land(r,p,1);assert.equal(p.dinero,cash);
 p.industriasCerradas=false;p.turnosPerdidos=1;g.land(r,p,1);assert.equal(p.dinero,cash);
 p.turnosPerdidos=0;own([9,11]);assert.equal(g.rent(r,r.tablero[9]),900);own([17]);assert.equal(g.rent(r,r.tablero[17]),1200);
});
test('Fuga desbloquea caras por vuelta, conserva resguardo y techo seis',()=>{
 for(const laps of [0,1,2,3,4,5,9]){const {g,r,p}=setup();p.vueltasCompletadas=laps;g.dice=()=>6;
 const max=Math.min(6,laps+1),cash=p.dinero;g.land(r,p,12);assert.equal(r.pendiente.maximo,max);
 g.rollFlight(r,p,{decisionId:r.pendiente.id});assert.equal(r.ultimaTirada.total,max);assert.equal(p.dinero,cash-max*1000);}
 const {g,r,p}=setup();p.resguardoFuga=true;g.land(r,p,12);assert.equal(r.pendiente,null);assert.equal(p.resguardoFuga,false);
});
test('Golpe reduce la pérdida solo en vueltas uno y dos, con redondeo y resguardo',()=>{
 const {g,r,p}=setup();for(const [lap,expected] of [[0,501],[1,501],[2,0]]){p.vueltasCompletadas=lap;p.dinero=1001;g.land(r,p,18);assert.equal(p.dinero,expected);}
 p.dinero=-300;g.land(r,p,18);assert.equal(p.dinero,-300);p.dinero=1000;p.resguardoGolpe=true;g.land(r,p,18);assert.equal(p.dinero,1000);
});
test('FMI detiene en 39, persiste continuación y completa una sola vuelta sin repetir tirada',()=>{
 const {g,r,p}=setup();p.posicion=38;p.deudaPersonal=10000;g.roll(r,p);
 assert.equal(p.posicion,39);assert.equal(p.vueltasCompletadas,0);assert.equal(r.ultimaTirada.total,3);assert.equal(r.ultimaTirada.pasos,1);assert.equal(r.continuacion.pasos,2);
 const loaded=new Game({rooms:structuredClone(g.rooms)}),saved=loaded.rooms.BALANCE,q=saved.jugadores[0];
 const gold=q.oro;loaded.pay(saved,q,{decisionId:saved.pendiente.id,usarOro:true});
 assert.equal(q.oro,gold-1);assert.equal(q.posicion,1);assert.equal(q.vueltasCompletadas,1);assert.equal(saved.ultimaTirada.tipo,'continuacion');assert.deepEqual(saved.ultimaTirada.dados,[]);assert.equal(saved.pendiente.tipo,'compra');
 assert.throws(()=>loaded.pay(saved,q,{decisionId:'old',usarOro:true}));
});
test('sin intereses se cruza directamente; traslados no suman y revancha reinicia vueltas',()=>{
 const {g,r,p}=setup();p.posicion=39;g.roll(r,p);assert.equal(p.vueltasCompletadas,1);g.land(r,p,0);assert.equal(p.vueltasCompletadas,1);
 const saved=new Game({rooms:structuredClone(g.rooms)});assert.equal(saved.rooms.BALANCE.jugadores[0].vueltasCompletadas,1);
 g.resetPlayer(p);assert.equal(p.vueltasCompletadas,0);
});
test('FMI de 10000 excluido de mazos nuevos, antiguos y ofertas pendientes',()=>{
 const {g,r,p}=setup();assert.ok(!r.mazos.condiciones.includes(12));r.mazos.condiciones=[12,14];assert.equal(g.draw(r,'condiciones').id,14);
 r.mazos.condiciones=[12];assert.notEqual(g.draw(r,'condiciones').id,12);
 const cash=p.dinero;g.pending(r,'eleccion',p,{efecto:'pactoFmi',opciones:[{id:'aceptar'}]});
 const loaded=new Game({rooms:structuredClone(g.rooms)});assert.equal(loaded.rooms.BALANCE.pendiente,null);
 g.choose(r,p,{decisionId:r.pendiente.id,opcion:'aceptar'});assert.equal(p.dinero,cash);assert.equal(p.sinPactos,false);
});
test('bot financia descuento rentable y construye; evita préstamo de inversión en deuda alta',()=>{
 const {g,r,p,own}=setup();own([17]);r.descuento=true;r.fase='gestion';p.dinero=200;
 const plan=strategy.plan(g,g.state(r),p);assert.equal(plan.event,'pedirPrestamo');assert.ok(plan.data.monto<=3000);
 g.actionFor(r,p,plan.event,plan.data);const next=strategy.plan(g,g.state(r),p);assert.equal(next.event,'construirIndustria');g.actionFor(r,p,next.event,next.data);
 p.deudaPersonal=20500;p.dinero=200;assert.notEqual(strategy.plan(g,g.state(r),p).event,'pedirPrestamo');
});
test('rutas visuales respetan el tramo FMI y la continuación',async()=>{
 const {rollPath}=await import('../public/board3d-layout.mjs');
 assert.deepEqual(rollPath({id:'p',posicion:38},{id:'p',posicion:39},{id:'a',jugadorId:'p',desde:38,hasta:39,total:12,pasos:1},null),[38,39]);
 assert.deepEqual(rollPath({id:'p',posicion:39},{id:'p',posicion:2},{id:'b',jugadorId:'p',desde:39,hasta:2,total:3,pasos:3},'a'),[39,0,1,2]);
});

test('bots guardados reciben los nombres Marvel sin cambiar identidades',()=>{const {g,r,p}=setup();p.bot=true;p.nombre='Cóndor · Bot';const restored=new Game({rooms:structuredClone(g.rooms)});assert.equal(restored.rooms.BALANCE.jugadores[0].nombre,'Spider-Man · Bot');assert.equal(restored.rooms.BALANCE.jugadores[0].id,p.id);});
