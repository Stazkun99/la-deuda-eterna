'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {Game}=require('../lib/game'),strategy=require('../lib/bot-strategy'),Entry=require('../public/entry-link');
function setup(seed=7) {
  let time=100000, n=seed;
  const rand=()=>{n=(n*1664525+1013904223)>>>0;return n;};
  const game=new Game({now:()=>time,dice:()=>rand()%6+1,chooseIndex:count=>rand()%count});
  game.shuffle=cards=>cards.map(c=>c.id).sort(()=> (rand()%3)-1);
  const data={nombre:'Humano',userId:'human_test',sessionToken:'a'.repeat(64),sala:'BOTS',crear:true};
  game.join('human',data);const r=game.rooms.BOTS;
  return {game,r,data,advance:(ms=2000)=>{time+=ms;},start(count=3){
    game.action('human','seleccionarPersonaje',{personaje:'kirby'});
    for(let i=0;i<count;i++)game.action('human','agregarBot');
    game.action('human','tirarDadoInicial');
    for(let i=0;i<count+2;i++){time+=3000;game.tick();}
    game.action('human','iniciarPartida',{monopolio:false});
  }};
}
test('solo anfitrión gestiona bots; plazas y secretos protegidos; se conservan en revancha',()=>{
  const s=setup(),{game,r}=s;
  game.join('guest',{nombre:'Invitado',userId:'guest_test',sessionToken:'b'.repeat(64),sala:'BOTS'});
  assert.throws(()=>game.action('guest','agregarBot'));
  game.action('human','agregarBot');game.action('human','agregarBot');assert.throws(()=>game.action('human','agregarBot'));
  const bot=r.jugadores.find(p=>p.bot);
  assert.throws(()=>game.join('fake',{nombre:'Intruso',userId:bot.userId,sessionToken:'c'.repeat(64),sala:'BOTS'}));
  assert.ok(!JSON.stringify(game.state(r)).includes('tokenHash'));
  assert.throws(()=>game.action('human','quitarBot',{jugadorId:r.jugadores[1].id}));
  game.action('human','quitarBot',{jugadorId:bot.id});assert.equal(r.jugadores.length,3);
  game.action('human','iniciarPartida',{monopolio:false});assert.throws(()=>game.action('human','agregarBot'));
  game.finish(r,'Humano','Prueba');game.action('human','prepararRevancha',{resultadoId:r.resultado.id});
  assert.equal(r.jugadores.filter(p=>p.bot).length,1);assert.ok(!r.jugadores.some(p=>p.dadoInicial));
  game.disconnect('human');assert.ok(r.jugadores.find(p=>p.esLider).bot!==true);
});
test('bots esperan dados, pausa y ausencia humana; reconexión conserva plazos',()=>{
  const s=setup();s.start(1);const {game,r}=s,bot=r.jugadores.find(p=>p.bot);
  r.turnoActual=r.jugadores.indexOf(bot);game.beginTurn(r);
  s.advance(10000);game.tick();const turn=r.turnoId, roll=r.ultimaTirada.id;
  game.tick();assert.equal(r.ultimaTirada.id,roll);assert.equal(r.turnoId,turn);
  game.action('human','pausarPartida',{pausar:true});s.advance(90000);const paused=JSON.stringify(r);game.tick();assert.equal(JSON.stringify(r),paused);
  game.action('human','pausarPartida',{pausar:false});game.disconnect('human');const remaining=r.limiteTurno-game.now();
  s.advance(600000);const offline=JSON.stringify(r);game.tick();assert.equal(JSON.stringify(r),offline);
  game.join('again',{...s.data,crear:false});assert.equal(r.limiteTurno-game.now(),remaining);
  assert.equal(r.jugadores.filter(p=>p.bot).length,1);
  const loaded=new Game({rooms:structuredClone(game.rooms)});assert.equal(loaded.rooms.BOTS.jugadores.find(p=>p.bot).conectado,true);
});
test('estrategia preserva oro útil, reduce dados y no regala propiedades',()=>{
  const s=setup();s.start(1);const {game,r}=s,p=r.jugadores.find(p=>p.bot);r.turnoActual=1;game.beginTurn(r);
  p.deudaPersonal=20500;p.dinero=15000;
  const decision=strategy.plan(game,game.state(r),p);assert.equal(decision.event,'pagarDeuda');assert.ok(p.deudaPersonal-decision.data.monto<20000);
  game.payment(r,p,4500,'Intereses',null,true);p.oro=1;p.dinero=100;
  assert.equal(strategy.plan(game,game.state(r),p).data.usarOro,true);
  r.pendiente.oroPermitido=false;assert.equal(strategy.plan(game,game.state(r),p).data.usarOro,false);
  r.pendiente=null;r.fase='tirada';const c=game.sur(r,'Petróleo');game.transfer(r,c,p.id);r.turnoActual=0;const human=r.jugadores[0];human.dinero=5000;p.dinero=6000;
  game.action('human','proponerComercio',{turnoId:r.turnoId,destinatarioId:p.id,entrego:[],recibo:['Petróleo'],pago:1,cobro:0});
  assert.equal(strategy.plan(game,game.state(r),p).data.aceptar,false);
});
test('invitación contiene solo sala y rechaza códigos inválidos',()=>{
  const link=Entry.invite('https://portada.example/','andes');assert.equal(link,'https://portada.example/?sala=ANDES');
  assert.equal(Entry.invitation(new URL(link).search),'ANDES');assert.equal(Entry.invitation('?sala=../../secret'),null);
  assert.throws(()=>Entry.invite('javascript:alert(1)','ANDES'));
});
test('simulaciones completas: bots resuelven todos los turnos sin acciones inválidas', {timeout:30000},()=>{
  for(const seed of [3,19,73]) {
    const s=setup(seed);s.start();const {game,r}=s;let steps=0;
    while(r.enJuego && steps++<16000) {
      s.advance(2000);
      const human=r.jugadores[0];
      if(!human.enQuiebra && !r.pausa && (!r.pendiente?.vence || r.pendiente.vence>game.now())) {
        const d=strategy.plan(game,game.state(r),human);
        if(d)game.action('human',d.event,d.data);
      }
      game.tick();
      for(const p of r.jugadores) {assert.ok(Number.isSafeInteger(p.dinero));assert.ok(p.deudaPersonal<=30000);assert.ok(p.oro>=0);}
    }
    assert.equal(r.finalizada,true,'Partida sin concluir: semilla '+seed+' fase '+r.fase+' turno '+r.turnoId);
    assert.ok(r.resultado.ganador);
  }
});
