import * as THREE from 'three';
export function createBoardMessages(scene){
 let sprite=null,started=0,duration=0;
 function finish(){if(sprite){scene.remove(sprite);sprite.material.map.dispose();sprite.material.dispose();sprite=null;}duration=0;}
 function start(item,point,now=performance.now()){
  finish();const canvas=document.createElement('canvas');canvas.width=1024;
  const ctx=canvas.getContext('2d'),lines=[];ctx.font='28px sans-serif';let line='';
  for(const word of (item.detalle||'').split(' ')){const next=line?line+' '+word:word;if(ctx.measureText(next).width>940&&line){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);
  canvas.height=200+lines.length*35;ctx.fillStyle='#123b32';ctx.beginPath();ctx.roundRect(3,3,1018,canvas.height-6,24);ctx.fill();ctx.strokeStyle='#d9bd78';ctx.lineWidth=3;ctx.stroke();ctx.textAlign='center';ctx.fillStyle='#f7dfa3';
  function text(value,y,size,color){ctx.fillStyle=color;ctx.font='600 '+size+'px sans-serif';while(ctx.measureText(value).width>950&&size>12)ctx.font='600 '+(--size)+'px sans-serif';ctx.fillText(value,512,y);}
  text(item.accion,52,38,'#f7dfa3');text(item.origen+' → '+item.destino,101,31,'#fff5df');
  const amount=item.monto===null?'':new Intl.NumberFormat('es-ES',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(item.monto);
  text(amount+(item.multiplicador?' · ×'+Number(item.multiplicador.toFixed(2)):''),151,36,'#f7dfa3');lines.forEach((line,i)=>text(line,192+i*35,27,'#dce9da'));
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false}));sprite.position.set(point.x,1.25,point.z);sprite.scale.set(4.8,4.8*canvas.height/1024,1);sprite.renderOrder=35;scene.add(sprite);started=now;duration=3000;return duration;
 }
 function tick(now){if(!sprite)return false;const t=(now-started)/duration;if(t>=1){finish();return false;}sprite.material.opacity=Math.min(1,t*8,(1-t)*8);return true;}
 return {start,tick,finish,dispose:finish};
}
