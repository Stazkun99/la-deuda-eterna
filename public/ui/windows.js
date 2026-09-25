'use strict';
globalThis.GameWindows={install(root){
 const ids=['finanzas-3d','panel-3d'];
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function position(node,x,y,save=false){
  const rect=node.getBoundingClientRect();
  x=clamp(x,4,innerWidth-rect.width-4);y=clamp(y,68,Math.max(68,innerHeight-rect.height-82));
  node.style.left=x+'px';node.style.top=y+'px';node.style.right='auto';node.style.bottom='auto';
  if(save)try{localStorage.setItem('mesa-window-'+node.id,JSON.stringify({x:x/innerWidth,y:y/innerHeight}));}catch{}
 }
 for(const id of ids){
  const node=document.getElementById(id),handle=node.querySelector('.window-handle');let drag=null;
  function restore(){try{const p=JSON.parse(localStorage.getItem('mesa-window-'+id));if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y))position(node,p.x*innerWidth,p.y*innerHeight);}catch{}}
  handle.addEventListener('pointerdown',e=>{if(e.button!==0)return;const rect=node.getBoundingClientRect();drag={x:e.clientX-rect.left,y:e.clientY-rect.top};handle.setPointerCapture(e.pointerId);e.preventDefault();});
  handle.addEventListener('pointermove',e=>{if(drag)position(node,e.clientX-drag.x,e.clientY-drag.y);});
  handle.addEventListener('pointerup',e=>{if(!drag)return;position(node,e.clientX-drag.x,e.clientY-drag.y,true);drag=null;});
  handle.addEventListener('lostpointercapture',()=>drag=null);
  handle.addEventListener('keydown',e=>{const delta={ArrowLeft:[-20,0],ArrowRight:[20,0],ArrowUp:[0,-20],ArrowDown:[0,20]}[e.key];if(!delta)return;e.preventDefault();const rect=node.getBoundingClientRect();position(node,rect.left+delta[0],rect.top+delta[1],true);});
  new ResizeObserver(()=>{if(!root.hidden)restore();}).observe(node);
  window.addEventListener('resize',()=>{if(!root.hidden)restore();});
 }
 document.getElementById('restaurar-ventanas').onclick=()=>{for(const id of ids){document.getElementById(id).removeAttribute('style');try{localStorage.removeItem('mesa-window-'+id);}catch{}}};
}};
