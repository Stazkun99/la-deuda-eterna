'use strict';
globalThis.GameScreen={create(root){
 const panel=document.getElementById('panel-3d'),toggle=document.getElementById('ir-turno-3d');
 let minimized=false;
 const paint=()=>{root.classList.toggle('hud-minimized',minimized);toggle.textContent=minimized?'Mostrar acciones':'Ocultar acciones';toggle.setAttribute('aria-expanded',String(!minimized));panel.inert=minimized||root.classList.contains('cinematic');};
 toggle.addEventListener('click',()=>{minimized=!minimized;paint();});
 document.getElementById('pantalla-completa-3d').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{document.getElementById('estado-3d').textContent='Puedes ampliar el navegador con F11.';}};
 document.addEventListener('fullscreenchange',()=>{document.getElementById('pantalla-completa-3d').textContent=document.fullscreenElement?'Salir de pantalla completa':'Pantalla completa';});
 // Only one utility drawer at a time, leaving the board easy to reach.
 for(const drawer of root.querySelectorAll('details.screen-drawer'))drawer.addEventListener('toggle',()=>{if(drawer.open)for(const other of root.querySelectorAll('details.screen-drawer'))if(other!==drawer)other.open=false;});
 return {
  get open(){return !root.hidden;},
  showModal(){root.hidden=false;document.body.classList.add('playing-3d');document.querySelector('main').inert=true;minimized=false;paint();},
  close(){if(root.hidden)return;root.hidden=true;document.body.classList.remove('playing-3d');document.querySelector('main').inert=false;root.dispatchEvent(new Event('close'));document.getElementById('abrir-3d').focus();},
  addEventListener(...args){root.addEventListener(...args);},
  setCinematic(value){if(root.classList.contains('cinematic')===!!value)return;root.classList.toggle('cinematic',!!value);paint();},
  setWaiting(value){root.classList.toggle('waiting-room',value);}
 };
}};
