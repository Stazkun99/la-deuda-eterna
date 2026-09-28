'use strict';
const {randomUUID}=require('node:crypto');const Rules=require('../public/world-events');
function active(r){return r.jugadores.filter(p=>!p.enQuiebra);}
function end(game,r){const e=r.eventoActual;if(!e)return;r.eventoActual=null;r.eventoCambio={id:randomUUID(),tipo:'fin',evento:e};if(r.pendiente?.bonoEvento){delete r.pendiente.bonoEvento;delete r.pendiente.eventoInstancia;}if(r.pendiente?.casillaRenta!==undefined)r.pendiente.monto=game.rent(r,r.tablero[r.pendiente.casillaRenta]);game.log(r,'Finaliza el evento: '+e.titulo+'. Se restablecen todos sus efectos.');}
function update(game,r){const e=r.eventoActual;if(e&&(r.eventosHabilitados===false||active(r).every(p=>(p.vueltasCompletadas||0)>=e.vueltaObjetivo)))end(game,r);}
function activate(game,r,p){if(r.eventoActual||!r.enJuego||r.eventosHabilitados===false)return false;
 if(!r.mazoEventos?.length){r.mazoEventos=game.shuffle(Rules.catalog);if(r.mazoEventos[0]===r.ultimoEventoId)r.mazoEventos.push(r.mazoEventos.shift());}
 const id=r.mazoEventos.shift(),def=Rules.catalog.find(e=>e.id===id);
 const goal=Math.min(...active(r).map(q=>q.vueltasCompletadas||0))+1;
 const e={...def,instancia:randomUUID(),activadorId:p.id,activador:p.nombre,vueltaObjetivo:goal,usados:[]};
 r.eventoActual=e;r.ultimoEventoId=id;r.eventoCambio={id:randomUUID(),tipo:'inicio',evento:structuredClone(e)};
 game.log(r,'Evento mundial: '+e.titulo+'. '+e.efecto+' Hasta que todos alcancen la vuelta '+(goal+1)+'.');return true;
}
function cross(game,r,p){if(r.eventoActual){update(game,r);return false;}return activate(game,r,p);}
module.exports={activate,cross,begin:update,finishTurn:update,update,end};
