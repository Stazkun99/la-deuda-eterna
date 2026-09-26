'use strict';
globalThis.GameResults={create(ctx){
 const {$,element,button,amount,me,action}=ctx;let shown=null,rendered=null;
 function reset(){shown=null;rendered=null;$('resultado-dialog').close();}
 function show(result,force=false){
  if(!result)return;
  const key=result.id||JSON.stringify(result),dialog=$('resultado-dialog');
  if(!force&&shown===key&&!dialog.open)return;
  const viewKey=JSON.stringify([key,me()?.esLider,ctx.busy,ctx.socket.connected]);
  if(rendered===viewKey){if(force&&!dialog.open)dialog.showModal();return;}
  shown=key;rendered=viewKey;
  const box=$('resultado-contenido'),summary=result.resumen;
  box.replaceChildren(element('p','FIN DE PARTIDA','eyebrow'));
  const title=element('h2',result.ganador);title.id='resultado-titulo';box.append(title,element('p',result.motivo,'result-reason'));
  if(summary){
   const minutes=Math.floor(summary.duracionMs/60000),seconds=Math.floor(summary.duracionMs/1000)%60;
   box.append(element('p',minutes+' min '+seconds+' s de juego · '+summary.turnos+' turnos','result-duration'));
   if(!summary.completas)box.append(element('p','Partida anterior a las estadísticas: actividad contabilizada desde esta actualización.','card-note'));
   const grid=element('div',undefined,'result-players');
   for(const p of summary.jugadores){
    const card=element('section',undefined,'result-player');card.style.setProperty('--player',p.color||'#d4b970');
    if(p.personaje){const img=element('img');img.src='/assets/fichas/'+p.personaje+'.svg';img.alt='';card.append(img);}
    card.append(element('h3',p.nombre));
    if(p.retirado||p.enQuiebra)card.append(element('small',p.retirado?'Abandonó la partida':'En quiebra'));
    const list=element('dl');
    for(const [label,value] of [['Patrimonio neto',amount(p.patrimonio)],['Efectivo',amount(p.dinero)],['Terrenos e industrias',amount(p.inversion)+' · '+p.propiedades+' terrenos'],['Lingotes',p.oro],['Deuda final / máxima',amount(p.deuda)+' / '+amount(p.deudaMaxima)],['Préstamos recibidos',amount(p.prestamos)],['Rentas cobradas',amount(p.rentasCobradas)+' · '+p.oroCobrado+' lingotes'],['Rentas pagadas',amount(p.rentasPagadas)+' · '+p.oroPagado+' lingotes'],['Intereses en efectivo',amount(p.intereses)]])list.append(element('dt',label),element('dd',String(value)));
    card.append(list);if(p.alianza)card.append(element('p','Efectivo, oro y propiedades compartidos con su alianza.','card-note'));grid.append(card);
   }
   box.append(grid,element('p','Patrimonio neto = efectivo + inversión en terrenos e industrias − deuda. Los lingotes se muestran aparte. Las rentas se atribuyen a quien recibe o realiza el pago; no se duplican entre aliados.','card-note'));
   if(summary.momentos?.length){box.append(element('h3','Momentos destacados'));const list=element('ol',undefined,'result-highlights');for(const m of summary.momentos)list.append(element('li',m.accion+' · '+m.origen+' → '+m.destino+(m.monto!=null?' · '+amount(m.monto):'')+(m.detalle?' · '+m.detalle:'')));box.append(list);}
  }else box.append(element('p','Este resultado se guardó antes de incorporar las estadísticas detalladas.','card-note'));
  const footer=element('div',undefined,'result-actions');
  if(me()?.esLider){const rematch=button('Preparar revancha ↻',()=>action('prepararRevancha',{resultadoId:result.id||null}),'primary');rematch.disabled=ctx.busy||!ctx.socket.connected;footer.append(rematch);}
  else footer.append(element('p','El anfitrión puede preparar la revancha para toda la mesa.'));
  footer.append(button('Volver al tablero',()=>dialog.close(),'secondary'));box.insertBefore(footer,box.querySelector('.result-players'));box.append(element('p','La revancha conserva sala y personajes. Se reinician dinero, deuda, propiedades y dados iniciales.','card-note'));
  if(!dialog.open)dialog.showModal();
 }
 $('cerrar-resultado').onclick=()=>$('resultado-dialog').close();
 $('ver-resultado').onclick=()=>show(ctx.state?.resultado,true);
 return{show,reset};
}};
