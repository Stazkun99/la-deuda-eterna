'use strict';
const {randomUUID}=require('node:crypto');const Rules=require('../public/world-events');
function end(game,r){const e=r.eventoActual;if(!e)return;r.eventoActual=null;r.eventoCambio={id:randomUUID(),tipo:'fin',evento:e};game.log(r,'Finaliza el evento: '+e.titulo+'.');}
function activate(game,r,p){if(r.eventoActual||!r.enJuego)return false;
 if(!r.mazoEventos?.length){r.mazoEventos=game.shuffle(Rules.catalog);if(r.mazoEventos[0]===r.ultimoEventoId)r.mazoEventos.push(r.mazoEventos.shift());}
 const id=r.mazoEventos.shift(),def=Rules.catalog.find(e=>e.id===id);const index=r.jugadores.findIndex(q=>q.id===p.id);
 const order=[...r.jugadores.slice(index+1),...r.jugadores.slice(0,index+1)].filter(q=>!q.enQuiebra).map(q=>q.id);
 const e={...def,instancia:randomUUID(),activadorId:p.id,activador:p.nombre,turnoActivacion:r.turnoId,pendientes:order,usados:[]};
 r.eventoActual=e;r.ultimoEventoId=id;r.eventoCambio={id:randomUUID(),tipo:'inicio',evento:structuredClone(e)};
 game.log(r,'Evento mundial: '+e.titulo+'. '+e.efecto+' Termina tras el próximo turno de '+p.nombre+'.');return true;
}
function begin(game,r){const e=r.eventoActual;if(!e||r.turnoId<=e.turnoActivacion)return;const idx=e.pendientes.indexOf(r.jugadores[r.turnoActual]?.id);if(idx<0)end(game,r);else e.pendientes.splice(0,idx);}
function finishTurn(game,r){const e=r.eventoActual;if(!e||r.turnoId<=e.turnoActivacion)return;const idx=e.pendientes.indexOf(r.jugadores[r.turnoActual]?.id);if(idx>=0)e.pendientes.splice(0,idx+1);if(!e.pendientes.length)end(game,r);}
module.exports={activate,begin,finishTurn,end};
