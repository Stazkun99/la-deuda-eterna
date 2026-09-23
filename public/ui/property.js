'use strict';
globalThis.GameProperty={create(ctx){
const {$,element,button,amount,me,myTurn,myProperty,action,notice,socket,openDialog}=ctx;
function showProperty(id) {
  const original=ctx.state.tablero[id],c=original.region==='norte'?ctx.state.tablero.find(s=>s.nombre===original.baseSur):original;
  ctx.selectedProperty=c.nombre;
  const box=$('detalle-contenido');box.replaceChildren(element('p',(original.region||'CASILLA ESPECIAL').toUpperCase(),'eyebrow'),element('h2',original.nombre));
  if(c.tipo!=='propiedad'){
      const art=ctx.specialCatalog[c.id];
      if(art){const img=element('img');img.src=art.imagen;img.alt='Ilustración original de '+original.nombre;img.className='special-detail-art';box.append(img);}
      box.append(element('p',specialText(c.id)));
      if(art?.rotuloOriginal)box.append(element('p','En el tablero impreso figura como «'+art.rotuloOriginal+'». Esta edición conserva el nombre y el efecto indicados arriba.','card-note'));
      openDialog();return;
    }
  const owner=ctx.state.jugadores.find(j=>j.id===c.dueño),n=ctx.state.tablero.find(s=>s.baseSur===c.nombre),info=ctx.catalog.find(i=>i.nombre===c.nombre);
  box.append(element('p',(owner?'Propiedad de '+owner.nombre:'Terreno disponible')),element('p','Industrias nacionales: '+(c.industriasNac||0)+'/3 · Multinacionales: '+(n?.industriasExp||0)+'/3'));
  if(original.region==='norte' && ctx.specialCatalog[original.id]){const img=element('img');img.src=ctx.specialCatalog[original.id].imagen;img.alt='Ilustración original de '+original.nombre;img.className='special-detail-art';box.append(img);}
    if(info?.imagen){const img=element('img');img.className='property-original';img.src=info.imagen;img.alt='Carta original de '+c.nombre;img.loading='lazy';box.append(img);}
  const actions=element('div',undefined,'detail-actions');
  if(myProperty(c)&&myTurn()){
    for(const [label,type]of [['Construir industria nacional','nacional'],['Construir multinacional','exportacion']]){
      const national=type==='nacional',level=national?(c.industriasNac||0):(n?.industriasExp||0);
      const price=info?.[national?'nac':'exp']?.[level];
      const cost=price===undefined?null:Math.floor(price*(ctx.state.descuento?0.5:1));
      const text=level>=3?label+' · Máximo alcanzado':label+(cost===null?'':' · '+amount(cost));
      const b=button(text,()=>action('construirIndustria',{nombrePropiedad:c.nombre,tipo:type}),'secondary');
      b.disabled=!socket.connected||ctx.busy||level>=3||(!national&&c.industriasNac<=level)||!(ctx.state.fase==='tirada'||ctx.state.fase==='gestion'&&ctx.state.descuento);
      actions.append(b);
    }
    if(me().dinero<0||ctx.state.pendiente?.tipo==='pago'&&me().dinero<ctx.state.pendiente.monto)actions.append(button('Subastar terreno e industrias',()=>action('subastarPropiedad',{nombrePropiedad:c.nombre})));
  }
  if(myTurn()&&ctx.state.monopolio&&c.id===me().posicion&&owner&&!myProperty(c))actions.append(button('Monopolizar terreno e industrias',()=>action('expropiarPropiedad',{nombrePropiedad:c.nombre})));
  box.append(actions);openDialog();
}

function specialText(id){return ({0:'Habilita una votación de alianza. No se vota al iniciar la partida.',4:'Roba una carta de Solidaridad.',8:'Roba una condición si tienes deuda al FMI.',10:'Construye a mitad de precio durante este turno.',12:'Tira un dado y paga $1.000 por punto. No admite oro.',16:'Roba una carta de Solidaridad.',18:'Entregas tu efectivo, salvo que tengas resguardo.',19:'Roba una condición si tienes deuda.',20:'Activa o retira la barrera para todos. Con ella, las multinacionales no generan beneficios.',24:'Elige un terreno libre y recibe su primera industria. Si no hay terrenos libres, mejora una industria propia.',28:'Roba una condición si tienes deuda.',30:'Recibes $1.500 de ayuda al desarrollo del BID, sin generar deuda. Importe de esta edición web.',32:'Quien cae entrega un lingote, si tiene.',36:'Roba una carta de Solidaridad.',38:'No pagarás intereses en el siguiente paso por el FMI.',39:'Al llegar o pasar pagas intereses. Reabren las industrias cerradas.'})[id]||'Consulta el registro para ver el efecto.';}
return {showProperty};
}};
