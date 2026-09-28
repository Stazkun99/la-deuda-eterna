'use strict';
(function(){
 function stops(previous,next){const result=new Map(),roll=next.ultimaTirada,newRoll=roll&&roll.id!==previous?.ultimaTirada?.id&&Number.isInteger(roll.hasta);
 for(const p of next.jugadores){const old=previous?.jugadores.find(q=>q.id===p.id);if(!old)continue;const landing=newRoll&&p.id===roll.jugadorId?roll.hasta:old.posicion;if(landing!==p.posicion)result.set(p.id,landing);}return result;}
 const api={stops};if(typeof module!=='undefined')module.exports=api;else globalThis.CardMovement=api;
})();
