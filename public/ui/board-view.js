'use strict';
globalThis.GameBoardView={create(ctx){
const {$,element,amount,updateControls,showProperty,notice}=ctx;
const dialog3d = GameScreen.create($('tablero-3d-dialog'));
globalThis.GameWindows?.install($('tablero-3d-dialog')); 
$('cerrar-3d').onclick = () => dialog3d.close();
const controls3d = Game3DUI.createMount([
  [document.querySelector('.turn-panel'), $('panel-3d')],
  [document.querySelector('#jugadores').closest('.panel'), $('mesa-jugadores-3d')],
  [document.querySelector('.activity'), $('actividad-3d')],
  [$('interaccion'), $('avisos-3d')], [$('ultima-carta'), $('ultima-carta-3d')],
  [$('aviso'), $('notificaciones-3d')],
  ...['conexion','sonido','reglas','copiar','salir'].map(id=>[$(id),$('utilidades-3d')])
]);
dialog3d.addEventListener('close', () => { if(dialog3d.open)return; ctx.board3d?.setActive(false); controls3d.restore(); });
$('abrir-3d').onclick = async () => {
  if (!ctx.state) return;
  dialog3d.showModal(); controls3d.mount(); updateControls();
  if (ctx.board3d) { ctx.board3d.setActive(true); ctx.board3d.update(); return; }
  if (ctx.board3dLoading) return;
  ctx.board3dLoading = true; $('estado-3d').textContent = 'Preparando la mesa…';
  try {
    const room=ctx.state.codigo;
    const module = await import('/board3d.mjs');
    if(!ctx.state||ctx.state.codigo!==room||!dialog3d.open)return;
    ctx.board3d = module.createBoard3D({ host:$('escena-3d'), legend:$('jugadores-3d'), onCinematic:value=>dialog3d.setCinematic(value), onDiceLabel:text=>{$('resultado-dados-3d').textContent=text;}, getState:()=>ctx.state, getArt:()=>({catalog:ctx.catalog,specialCatalog:ctx.specialCatalog}), onSelect:id=>{
      ctx.selected3d=id; $('casilla-3d').value=String(id); $('detalle-3d').disabled=false;
      const cell=ctx.state?.tablero.find(c=>c.id===id); if(cell)$('estado-3d').textContent=cell.nombre + (cell.precio?' · '+amount(cell.precio):'') + (cell.region?' · '+(cell.region==='sur'?'Nacionales: '+(cell.industriasNac||0):'Multinacionales: '+(cell.industriasExp||0))+'/3':'') + (cell.region==='norte'&&ctx.state.barreraProteccionista?' · Barrera activa':'');
    }, onError:()=>{ctx.board3d?.dispose();ctx.board3d=null;controls3d.restore();dialog3d.close();notice('Se ha perdido la vista 3D. Puedes continuar en 2D sin salir de la partida.');} });
    $('casilla-3d').replaceChildren(element('option','Elige una casilla…'));
    $('casilla-3d').firstElementChild.value='';
    for(const c of ctx.state.tablero){const option=element('option',c.id+' · '+c.nombre);option.value=c.id;$('casilla-3d').append(option);}
    ctx.board3d.setAmbient($('ambiente-3d').checked);ctx.board3d.setFollow($('seguir-3d').checked);ctx.board3d.setShadows($('sombras-3d').checked);ctx.board3d.showScenery($('decorados-3d').checked); ctx.board3d.setActive(dialog3d.open); $('estado-3d').textContent='Arrastra para explorar o toca una casilla.';
  } catch { ctx.board3d?.dispose();ctx.board3d=null;$('escena-3d').replaceChildren(); controls3d.restore();dialog3d.close();notice('No se pudo cargar el 3D en este navegador. Puedes seguir jugando en 2D.'); }
  finally { ctx.board3dLoading=false; }
};
$('seguir-3d').onchange=()=>ctx.board3d?.setFollow($('seguir-3d').checked);
$('sombras-3d').onchange=()=>ctx.board3d?.setShadows($('sombras-3d').checked);
$('enfocar-3d').onclick=()=>ctx.board3d?.focus();
$('ambiente-3d').onchange=()=>ctx.board3d?.setAmbient($('ambiente-3d').checked);
$('decorados-3d').onchange=()=>ctx.board3d?.showScenery($('decorados-3d').checked);
$('girar-3d').onclick=()=>ctx.board3d?.rotate();
$('acercar-3d').onclick=()=>ctx.board3d?.zoom(.8);
$('alejar-3d').onclick=()=>ctx.board3d?.zoom(1.25);
$('reset-3d').onclick=()=>ctx.board3d?.reset();
$('cenital-3d').onclick=()=>ctx.board3d?.overhead();
$('casilla-3d').onchange=()=>{if($('casilla-3d').value!=='')ctx.board3d?.select(Number($('casilla-3d').value));};
$('detalle-3d').onclick=()=>{if(ctx.selected3d!==null&&ctx.state)showProperty(ctx.selected3d);};
return {dialog3d,controls3d};
}};
