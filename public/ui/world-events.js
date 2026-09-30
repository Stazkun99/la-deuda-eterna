'use strict';
(function(){
const icons={sprout:'🌿',sun:'☀',cargo:'🚢','idle-cargo':'▣',market:'🐟',cross:'✚',up:'↗',down:'↘',energy:'⚡',warning:'!',link:'🤝',crane:'⚓'};
let room=null,seen=null,current=null,queue=[],timer=null,resolve=null;
const root=document.createElement('aside');root.id='world-events-ui';root.innerHTML='<details id="world-event-banner" hidden><summary><span class="event-icon"></span><span><strong></strong><small></small></span></summary><p class="event-story"></p><p class="event-effect"></p><p class="event-end"></p></details><section id="world-event-toast" role="status" aria-live="polite" hidden><span class="event-kicker"></span><div class="event-symbol"></div><h2></h2><p class="event-story"></p><p class="event-effect"></p><small></small><div class="event-progress"></div></section>';
document.body.append(root);const banner=root.querySelector('details'),toast=root.querySelector('section');
function duration(e){return 'Hasta que todos lleguen a la vuelta '+(e.vueltaObjetivo+1)+(e.faltan?.length?' · Faltan: '+e.faltan.join(', '):'');}
function paint(){banner.hidden=!current;if(!current)return;banner.dataset.mood=current.positivo?'good':'bad';banner.querySelector('.event-icon').textContent=icons[current.visual];banner.querySelector('strong').textContent=current.titulo;banner.querySelector('small').textContent=duration(current);banner.querySelector('.event-story').textContent=current.historia;banner.querySelector('.event-effect').textContent=current.efecto;banner.querySelector('.event-end').textContent='Los cruces por Salida no sustituyen ni alargan este evento. Pausar no consume turnos.';
 for(const tile of document.querySelectorAll('#tablero .tile')){tile.classList.toggle('world-affected',current.casillas.includes(Number(tile.dataset.cellId)));tile.classList.toggle('world-negative',!current.positivo);}}
function clearHighlights(){for(const tile of document.querySelectorAll('.world-affected'))tile.classList.remove('world-affected','world-negative');}
function cancel(){clearTimeout(timer);toast.hidden=true;resolve?.();resolve=null;}
globalThis.WorldEventUI={
 capture(state,animate){if(!state){cancel();room=null;seen=null;queue=[];current=null;banner.hidden=true;clearHighlights();return;}
 if(room!==state.codigo){cancel();room=state.codigo;queue=[];seen=state.eventoCambio?.id;}
 current=state.enJuego?state.eventoActual:null;const change=state.eventoCambio;
 if(change?.id!==seen){seen=change?.id;if(change&&animate&&state.enJuego)queue.push(change);}
 if(!animate){queue=[];cancel();paint();if(!current)clearHighlights();}},
 present(focusScene){paint();if(!current)clearHighlights();queue=queue.filter(c=>c.tipo==='fin'||c.evento.instancia===current?.instancia);if(!queue.length)return null;const change=queue.shift(),e=change.evento,ending=change.tipo==='fin';
 toast.classList.toggle('scene-focus',!ending&&!!focusScene?.());
 toast.dataset.mood=e.positivo?'good':'bad';toast.dataset.visual=e.visual;toast.querySelector('.event-kicker').textContent=ending?'EL MERCADO VUELVE A LA NORMALIDAD':'ACONTECIMIENTO MUNDIAL · '+(e.positivo?'OPORTUNIDAD':'CRISIS');toast.querySelector('.event-symbol').textContent=icons[e.visual];toast.querySelector('h2').textContent=e.titulo;toast.querySelector('.event-story').textContent=ending?'Este acontecimiento ha terminado. El próximo cruce por Salida podrá activar uno nuevo.':e.historia;toast.querySelector('.event-effect').textContent=ending?'Se restablecen las rentas y los costes habituales.':e.efecto;toast.querySelector('small').textContent=ending?'Evento finalizado':duration(e);toast.hidden=false;banner.hidden=true;
 const bar=toast.querySelector('.event-progress');bar.getAnimations().forEach(a=>a.cancel());if(!matchMedia('(prefers-reduced-motion: reduce)').matches)bar.animate([{transform:'scaleX(1)'},{transform:'scaleX(0)'}],{duration:5000,fill:'forwards'});
 return new Promise(done=>{resolve=done;timer=setTimeout(()=>{toast.hidden=true;paint();resolve=null;done();},5000);});}
};
})();
