'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { Game } = require('../lib/game');
function setup(values, pick = 0) {
  const choices = [];
  const game = new Game({ dice: () => { assert.ok(values.length, 'Unexpected extra roll'); return values.shift(); }, chooseIndex: max => { choices.push(max); return pick; } });
  for (let i=0;i<3;i++) game.join('s'+i,{nombre:'Jugador '+i,userId:'usuario_'+i,sessionToken:String(i).repeat(64),sala:'INICIO',crear:i===0});
  const r=game.rooms.INICIO;
  const start=()=>game.action('s0','iniciarPartida',{monopolio:false});
  return {game,r,start,choices};
}
test('inicio: base de 5000 más dado × 200 y empieza el máximo aunque no sea anfitrión', () => {
  const {game,r,start,choices}=setup([1,6,3]);start();
  assert.deepEqual(r.jugadores.map(p=>p.dinero),[5200,6200,5600]);
  assert.ok(r.jugadores.every(p=>p.deudaPersonal===0&&p.posicion===0));
  assert.equal(r.turnoActual,1);assert.equal(r.jugadores[0].esLider,true);
  assert.equal(r.inicioPartida.primeroId,r.jugadores[1].id);assert.equal(r.inicioPartida.empate,false);
  assert.deepEqual(choices,[]);assert.equal(r.ultimaTirada,null);
  const saved=structuredClone(game.rooms), restored=new Game({rooms:saved});
  assert.deepEqual(restored.state(restored.rooms.INICIO).inicioPartida,r.inicioPartida);
  r.fase='gestion';game.action('s1','terminarTurno',{turnoId:r.turnoId});assert.equal(r.turnoActual,2);
});
test('inicio: empate sortea solo los máximos, sin cambiar el dinero', () => {
  const {r,start,choices}=setup([2,6,6],1);start();
  assert.deepEqual(choices,[2]);assert.equal(r.turnoActual,2);
  assert.deepEqual(r.jugadores.map(p=>p.dinero),[5400,6200,6200]);
  assert.equal(r.inicioPartida.empate,true);assert.match(r.registro.join(' '),/desempate/);
});
test('inicio: todos empatados tienen acceso al primer turno y reiniciar renueva el sorteo', () => {
  for(let pick=0;pick<3;pick++) {
    const {r,start}=setup([4,4,4,6,1,2],pick);start();assert.equal(r.turnoActual,pick);
    const old=r.inicioPartida.id;r.enJuego=false;r.jugadores[0].deudaPersonal=10000;
    start();assert.notEqual(r.inicioPartida.id,old);assert.equal(r.turnoActual,0);
    assert.equal(r.jugadores[0].dinero,6200);assert.equal(r.jugadores[0].deudaPersonal,0);
  }
});
test('ayuda BID entrega 1500 sin deuda y registra el importe correcto', () => {
  const {game,r,start}=setup([1,2,3]);start();const p=r.jugadores[2], cash=p.dinero;
  game.land(r,p,30);assert.equal(p.dinero,cash+1500);assert.equal(p.deudaPersonal,0);
  assert.equal(r.interacciones.at(-1).monto,1500);assert.equal(r.interacciones.at(-1).origen,'BID');
});
