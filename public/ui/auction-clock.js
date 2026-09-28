'use strict';
// One cue per second and bid deadline, shared by all visible auction clocks.
globalThis.GameAuctionClock=(()=>{
 let round=null,heard=new Set();
 function update(state,now=Date.now()){
 const d=state?.pendiente;if(d?.tipo!=='subasta'){round=null;heard.clear();return;}
 const key=d.id+':'+d.vence;if(key!==round){round=key;heard.clear();}
 const seconds=Math.max(0,Math.ceil((d.vence-(state.pausa?.desde??now))/1000));
 const nodes=document.querySelectorAll('[data-auction-clock]');
 for(const node of nodes){node.style.setProperty('--auction-progress',Math.min(1,seconds/10));node.classList.toggle('urgent',seconds>0&&seconds<=3&&!state.pausa);node.textContent=state.pausa?'Ⅱ':seconds>0?String(seconds):'…';node.setAttribute('aria-label',state.pausa?'Subasta pausada':seconds>0?seconds+' segundos para cerrar':'Esperando adjudicación');}
 if(nodes.length&&!state.pausa&&!document.hidden&&seconds>=1&&seconds<=3&&!heard.has(seconds)){heard.add(seconds);globalThis.GameAudio?.play('auctionTick');}
 }
 return{update};
})();
