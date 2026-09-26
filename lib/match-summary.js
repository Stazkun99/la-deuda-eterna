'use strict';
// Totals are independent of the bounded activity log and use stable player IDs.
function start(r,now){r.estadisticas={desde:now,turnoBase:r.turnoId,pausaMs:0,completas:true,jugadores:{},momentos:[]};}
function ensure(r,now){if(!r.estadisticas)r.estadisticas={desde:now,turnoBase:r.turnoId,pausaMs:0,completas:false,jugadores:{},momentos:[]};return r.estadisticas;}
function record(r,p,now){const s=ensure(r,now);const row=s.jugadores[p.id]??= {id:p.id,nombre:p.nombre,color:p.color,personaje:p.personaje,rentasCobradas:0,rentasPagadas:0,oroCobrado:0,oroPagado:0,prestamos:0,intereses:0,deudaMaxima:p.deudaPersonal||0};row.deudaMaxima=Math.max(row.deudaMaxima,p.deudaPersonal||0);return row;}
function observe(game,r,now){
 const s=ensure(r,now);
 for(const p of r.jugadores){
  const row=record(r,p,now),assets=game.assets(r,p),investment=assets.reduce((sum,c)=>sum+game.investment(r,c),0);
  Object.assign(row,{nombre:p.nombre,color:p.color,personaje:p.personaje,dinero:p.dinero,deuda:p.deudaPersonal,oro:p.oro,propiedades:assets.length,inversion:investment,patrimonio:p.dinero+investment-p.deudaPersonal,enQuiebra:p.enQuiebra,alianza:!!p.alianzaId,deudaMaxima:Math.max(row.deudaMaxima,p.deudaPersonal)});
 }
 return s;
}
function interaction(r,from,to,item,now){
 if(!r.enJuego)return;
 const a=typeof from==='object'&&from?record(r,from,now):null,b=typeof to==='object'&&to?record(r,to,now):null;
 const rent=item.accion==='Pago de renta'||item.accion==='Pago con oro'&&item.detalle.includes('Renta de ');
 if(rent){if(item.monto!=null){if(a)a.rentasPagadas+=item.monto;if(b)b.rentasCobradas+=item.monto;}else{if(a)a.oroPagado++;if(b)b.oroCobrado++;}}
 if(item.accion==='Préstamo'&&b)b.prestamos+=item.monto||0;
 if(item.detalle.toLowerCase().includes('intereses')&&a&&item.monto!=null)a.intereses+=item.monto;
 const s=ensure(r,now);
 if(['Cadena completa','Intercambio aceptado','Mejora gratuita'].includes(item.accion)||rent&&item.monto>0){
  const moment={accion:item.accion,origen:item.origen,destino:item.destino,monto:item.monto,detalle:item.detalle,fecha:now};
  if(rent){if(!s.mayorRenta||item.monto>s.mayorRenta.monto)s.mayorRenta=moment;}
  else s.momentos=[...s.momentos,moment].slice(-8);
 }
}
function finish(game,r,now){
 const s=observe(game,r,now),paused=s.pausaMs+(r.pausa?now-r.pausa.desde:0);
 return {completas:s.completas,duracionMs:Math.max(0,now-s.desde-paused),turnos:Math.max(0,r.turnoId-s.turnoBase),jugadores:Object.values(s.jugadores).map(p=>({...p})),momentos:[...(s.mayorRenta?[{...s.mayorRenta,accion:'Mayor renta de la partida'}]:[]),...s.momentos].slice(0,9)};
}
module.exports={start,observe,interaction,finish};
