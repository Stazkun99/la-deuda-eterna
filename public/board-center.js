'use strict';
// The original print is sampled directly: no invented replacement for its lettering.
globalThis.GameCenter={
  paint(canvas,changed=()=>{}){
    canvas.width=canvas.height=2048;const ctx=canvas.getContext('2d');ctx.fillStyle='#addefe';ctx.fillRect(0,0,2048,2048);
    const image=new Image();let disposed=false;
    image.onload=()=>{if(disposed)return;ctx.fillStyle='#addefe';ctx.fillRect(0,0,2048,2048);ctx.save();ctx.translate(2048,368.64);ctx.rotate(Math.PI/2);ctx.beginPath();ctx.roundRect(0,0,1310.72,2048,230);ctx.clip();ctx.drawImage(image,1110,1050,3200,5000,0,0,1310.72,2048);ctx.restore();changed();};
    image.src='/tablero.jpg';return ()=>{disposed=true;image.onload=null;};
  },
  async drawCard(data){
    if(document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const deck=document.getElementById('mazo-'+data.tipo),board=document.querySelector('.board-center');if(!deck||!board)return;
    const a=deck.getBoundingClientRect(),b=board.getBoundingClientRect();if(!a.width)return;
    const card=document.createElement('img');card.src='/assets/cartas/reversos/'+data.tipo+'.webp';card.alt='';card.className='drawing-card';board.append(card);
    const width=Math.min(150,b.width*.26);card.style.width=width+'px';card.style.left=(a.left-b.left+a.width/2-width/2)+'px';card.style.top=(a.top-b.top)+'px';
    const dx=b.width/2-(a.left-b.left+a.width/2),dy=b.height*.40-(a.top-b.top);
    const animation=card.animate([{transform:'translate(0,0) rotate(90deg) scale(.65)',opacity:1},{transform:`translate(${dx*.6}px,${dy*.5-35}px) rotate(30deg) scale(.9)`,offset:.5},{transform:`translate(${dx}px,${dy}px) rotate(0deg) scale(1)`,opacity:1}],{duration:1000,easing:'ease-in-out',fill:'forwards'});
    const stop=()=>{if(document.hidden)animation.cancel();};document.addEventListener('visibilitychange',stop);
    try{await Promise.race([animation.finished,new Promise(resolve=>setTimeout(resolve,1200))]);}catch{}finally{animation.cancel();document.removeEventListener('visibilitychange',stop);card.remove();}
  }
};
document.addEventListener('DOMContentLoaded',()=>{const canvas=document.getElementById('centro-original');if(canvas)GameCenter.paint(canvas);});
