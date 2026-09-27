'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {Game}=require('../lib/game');
function setup(){let now=10000;const game=new Game({now:()=>now,dice:()=>1,chooseIndex:()=>0});
 for(const [socket,user] of [['a','usuario_a'],['b','usuario_b']])game.join(socket,{nombre:socket,userId:user,sessionToken:socket.repeat(64),sala:'SANDINO',crear:socket==='a'});
 game.action('a','iniciarPartida',{monopolio:false});const r=game.rooms.SANDINO,p=r.jugadores[0];
 const draw=(id,type='condiciones')=>{r.mazos[type]=[id];game.card(r,p,type);};
 const choose=opcion=>game.action('a','resolverEleccion',{turnoId:r.turnoId,decisionId:r.pendiente.id,opcion});
 return {game,r,p,draw,choose,advance:ms=>now+=ms};}
test('Sandino se reparte a todos; anula una carta elegida y solo consume el sombrero del usuario',()=>{
 const s=setup(),{game,r,p}=s;s.draw(4,'solidaridad');assert.ok(r.jugadores.every(p=>p.sombreroSandino));
 const cash=p.dinero;s.draw(14);assert.equal(p.dinero,cash);assert.equal(r.pendiente.efecto,'sandino');const stale=r.pendiente.id;
 s.choose('usar');assert.equal(p.dinero,cash);assert.equal(p.sombreroSandino,false);assert.equal(r.jugadores[1].sombreroSandino,true);
 assert.throws(()=>game.action('a','resolverEleccion',{turnoId:r.turnoId,decisionId:stale,opcion:'usar'}));
 s.draw(14);assert.equal(p.dinero,cash-1500);assert.equal(r.pendiente,null);
});
test('guardar aplica la carta sin volver a robar; conserva decisiones FMI y se restaura al reconectar',()=>{
 const s=setup(),{r,p}=s;p.sombreroSandino=true;p.deudaPersonal=10000;s.draw(2);
 const saved=new Game({rooms:structuredClone(s.game.rooms)});assert.equal(saved.rooms.SANDINO.pendiente.cartaId,2);
 s.choose('guardar');assert.equal(p.sombreroSandino,true);assert.equal(r.pendiente.tipo,'pago');assert.equal(r.pendiente.monto,1500);
 r.pendiente=null;r.fase='gestion';s.draw(12);s.choose('guardar');assert.equal(r.pendiente.efecto,'pactoFmi');s.choose('aceptar');assert.equal(p.sinPactos,true);assert.equal(p.sombreroSandino,true);
});
test('inactividad conserva sombrero y resuelve el cargo sin inmunidad permanente',()=>{
 const s=setup(),{game,r,p}=s;p.sombreroSandino=true;const cash=p.dinero;s.draw(14);s.advance(200000);game.tick();
 assert.equal(p.dinero,cash-1500);assert.equal(p.sombreroSandino,true);assert.equal(r.pendiente,null);
});
test('Sur propio y cadenas no cobran; Norte propio paga renta de exportación',()=>{
 const {game,r,p}=setup();
 for(const name of ['Azúcar','Banano','Cacao']) {const c=game.sur(r,name);game.transfer(r,c,p.id);c.industriasNac=2;const n=game.north(r,c);n.dueño=p.id;n.industriasExp=1;}
 const cash=p.dinero;game.land(r,p,1);assert.equal(p.dinero,cash);assert.equal(r.pendiente,null);
 game.land(r,p,21);assert.equal(p.dinero,cash+900);
});
