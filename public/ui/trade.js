'use strict';
globalThis.GameTrade={create(ctx){
const {$,element,button,amount,me,myTurn,myProperty,action,notice,socket,openDialog}=ctx;
function tradeOwns(player, property) {
  return property.dueño === player.id || !!player.alianzaId && ctx.state.jugadores.some(q=>q.id===property.dueño && q.alianzaId===player.alianzaId);
}
function showTradeForm() {
  if(!myTurn() || !['tirada','gestion'].includes(ctx.state.fase) || ctx.busy || !socket.connected)return;
  const box=$('comercio-contenido'),p=me();box.replaceChildren();
  $('comercio-titulo').textContent='Proponer un trato';
  const rivals=ctx.state.jugadores.filter(q=>q.id!==p.id&&q.conectado&&!q.enQuiebra&&!(p.alianzaId&&q.alianzaId===p.alianzaId));
  if(!rivals.length){box.append(element('p','No hay jugadores conectados de otro grupo para comerciar.'));$('comercio-dialog').showModal();return;}
  box.append(element('p','Selecciona lo que entregas y lo que recibes. Cada propiedad incluye todas sus industrias nacionales y multinacionales. El trato solo se realiza si la otra persona acepta.'));
  const form=element('form'),label=element('label','Negociar con'),select=element('select');select.id='comercio-rival';label.htmlFor=select.id;
  for(const q of rivals){const opt=element('option',q.nombre);opt.value=q.id;select.append(opt);}
  form.append(label,select);
  const sides=element('div',undefined,'trade-columns');form.append(sides);
  let giveList,receiveList,payInput,chargeInput;
  const side=(title,owner,key)=>{
    const area=element('section',undefined,'trade-side');area.append(element('h3',title));
    const list=element('div',undefined,'trade-properties');
    const props=ctx.state.tablero.filter(c=>c.region==='sur'&&tradeOwns(owner,c));
    for(const c of props){
      const row=element('label',undefined,'trade-property'),input=element('input');input.type='checkbox';input.value=c.nombre;
      const img=element('img');img.src=ctx.catalog.find(x=>x.nombre===c.nombre)?.icono||'';img.alt='';
      const north=ctx.state.tablero.find(n=>n.baseSur===c.nombre);
      row.append(input,img,element('span',c.nombre+' · '+c.industriasNac+' nac. / '+(north?.industriasExp||0)+' mult.'));list.append(row);
    }
    if(!props.length)list.append(element('p','Sin propiedades. Puedes ofrecer dinero.'));
    const moneyLabel=element('label','Dinero ($)'),input=element('input');input.type='number';input.min='0';input.max=String(Math.min(1_000_000_000,Math.max(0,owner.dinero)));input.step='1';input.value='0';input.required=true;input.id='trade-'+key;moneyLabel.htmlFor=input.id;
    area.append(list,moneyLabel,input);sides.append(area);return [list,input];
  };
  const fill=()=>{sides.replaceChildren();[giveList,payInput]=side('Tú entregas',p,'pago');[receiveList,chargeInput]=side('Tú recibes',rivals.find(q=>q.id===select.value),'cobro');};
  select.onchange=fill;fill();
  form.append(element('p','Para comprar: ofrece dinero y selecciona la propiedad que recibes. Para vender: selecciona la que entregas e indica cuánto cobras. También puedes intercambiar varias propiedades.','card-note'));
  const send=element('button','Enviar oferta · esperar aceptación','primary');send.type='submit';form.append(send);
  form.onsubmit=e=>{
    e.preventDefault();
    if(!myTurn()||!['tirada','gestion'].includes(ctx.state.fase))return notice('Tu turno cambió. Cierra y vuelve a abrir el comercio.');
    const entrego=[...giveList.querySelectorAll('input:checked')].map(i=>i.value),recibo=[...receiveList.querySelectorAll('input:checked')].map(i=>i.value);
    if(!entrego.length&&!recibo.length)return notice('Selecciona al menos una propiedad.');
    const pago=Number(payInput.value),cobro=Number(chargeInput.value);
    if(pago&&cobro)return notice('Indica dinero solo en una dirección.');
    action('proponerComercio',{destinatarioId:select.value,entrego,recibo,pago,cobro});
  };
  box.append(form);if(!$('comercio-dialog').open)$('comercio-dialog').showModal();
}
function showTradeOffer(d, force=false) {
  const p=me(),mine=p.id===d.jugadorId,first=ctx.tradeShown!==d.id;
  const dialog=$('comercio-dialog'),box=$('comercio-contenido');
  ctx.tradeShown=d.id;box.replaceChildren();
  const sender=ctx.state.jugadores.find(q=>q.id===d.jugadorId),receiver=ctx.state.jugadores.find(q=>q.id===d.destinatarioId);
  $('comercio-titulo').textContent=mine?'Tu oferta a '+receiver?.nombre:'Oferta de '+sender?.nombre;
  const terms=(title,names,cash)=>{
    const area=element('section',undefined,'trade-side');area.append(element('h3',title));
    for(const name of names){const snap=d.propiedades.find(c=>c.nombre===name);area.append(element('p',name+' · '+snap.nacionales+' nacionales / '+snap.multinacionales+' multinacionales'));}
    if(!names.length)area.append(element('p','Sin propiedades'));
    area.append(element('strong',amount(cash)));return area;
  };
  const cols=element('div',undefined,'trade-columns');
  cols.append(terms(sender?.nombre+' entrega',d.entrego,d.pago),terms(receiver?.nombre+' entrega',d.recibo,d.cobro));box.append(cols);
  box.append(element('p','Incluye todas las industrias indicadas. No se transfieren deudas ni oro. La oferta caduca en un máximo de 60 segundos.','card-note'));
  const answer=(label,accept,style)=>{const b=button(label,()=>action('responderComercio',{decisionId:d.id,aceptar:accept}),style);b.disabled=ctx.busy||!socket.connected;box.append(b);};
  if(mine)answer('Cancelar oferta',false,'secondary');
  else {answer('Aceptar este trato',true,'primary');answer('Rechazar',false,'secondary');}
  if((first||force)&&!dialog.open)dialog.showModal();
}

return {showTradeForm,showTradeOffer};
}};
