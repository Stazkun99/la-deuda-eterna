import * as THREE from 'three';
import {tileAnchor} from './board3d-layout.mjs';

// A landing describes income already received or rent still awaiting the player's payment choice.
export function createEconomyArrival(scene){
  const root=new THREE.Group();root.name='Cobros y rentas';scene.add(root);
  let started=0,duration=0,coins=[],rings=[],label=null,collect=false,chained=false;
  function finish(){
    const resources=new Set();
    root.traverse(o=>{if(o.geometry)resources.add(o.geometry);if(o.material){resources.add(o.material);if(o.material.map)resources.add(o.material.map);}});
    root.clear();for(const resource of resources)resource.dispose();
    coins=[];rings=[];label=null;duration=0;
  }
  function start(data,now=performance.now()){
    finish();if(!data||!(data.monto>0)||!['cobrar','pagar'].includes(data.direccion))return 0;
    collect=data.direccion==='cobrar';chained=!!data.cadena;started=now;duration=data.fmi?2300:chained?2400:1900;
    const color=data.oro?'#edcd79':data.fmi?'#edcd79':collect?'#f4cb62':'#ef795f',accent=data.fmi?'#8dbbff':collect?'#63e8b0':'#ffac70';
    const anchor=tileAnchor(data.casilla,0,.25),center=new THREE.Vector3(anchor.x,.42,anchor.z);
    const geometry=data.oro?new THREE.BoxGeometry(.16,.065,.09):new THREE.CylinderGeometry(.065,.065,.022,16);
    const material=new THREE.MeshStandardMaterial({color,metalness:.65,roughness:.28,emissive:color,emissiveIntensity:.2,transparent:true});
    const sources=(chained?data.casillas:[data.casilla]).map(id=>{const a=tileAnchor(id,0,-.22);return new THREE.Vector3(a.x,.48,a.z);});
    for(let i=0;i<(data.oro?1:chained?24:10);i++){
      const coin=new THREE.Mesh(geometry,material);const origin=sources[i%sources.length].clone();
      if(!chained){origin.x+=Math.cos(i*2.4)*.35;origin.z+=Math.sin(i*2.4)*.35;}
      coins.push({coin,origin,target:center.clone(),delay:(i%8)*.045});root.add(coin);
    }
    for(const source of sources){
      const ring=new THREE.Mesh(new THREE.RingGeometry(.29,.33,48),new THREE.MeshBasicMaterial({color:accent,side:THREE.DoubleSide,transparent:true,depthWrite:false}));
      ring.rotation.x=-Math.PI/2;ring.position.copy(source);ring.position.y=.27;root.add(ring);rings.push(ring);
      if(chained){const curve=new THREE.QuadraticBezierCurve3(source,new THREE.Vector3((source.x+center.x)/2,1.15,(source.z+center.z)/2),center);
        const line=new THREE.Mesh(new THREE.TubeGeometry(curve,32,.013,5,false),new THREE.MeshBasicMaterial({color:accent,transparent:true,opacity:.6,depthWrite:false}));root.add(line);}
    }
    if(typeof document!=='undefined'){
      const canvas=document.createElement('canvas');canvas.width=768;canvas.height=192;const ctx=canvas.getContext('2d');
      ctx.fillStyle=collect?'#133d32':'#4b2526';ctx.beginPath();ctx.roundRect(4,4,760,184,35);ctx.fill();
      ctx.strokeStyle=accent;ctx.lineWidth=4;ctx.stroke();ctx.textAlign='center';ctx.fillStyle=color;ctx.font='bold 64px sans-serif';
      ctx.fillText(data.oro?'1 lingote':(data.fmi?'−$':collect?'+$':'Renta $')+data.monto.toLocaleString('es-ES'),384,85);
      ctx.fillStyle='#fff7e4';ctx.font='30px sans-serif';ctx.fillText(data.fmi?(data.jugadorNombre||'Jugador')+' · intereses FMI':data.tributo?'Tributo de 12 de Octubre':chained?(data.conjunto==='completo'?'Cadena completa':'Bono de pareja'):(collect?'Producción cobrada':'Por pagar'),384,144);
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
      label=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false}));label.position.copy(center);label.position.y=1.35;label.scale.set(1.85,.4625,1);label.renderOrder=30;root.add(label);
    }
    tick(now);return duration;
  }
  function tick(now,reduced=false){
    if(!duration)return false;const progress=(now-started)/duration;
    if(reduced||progress>=1){finish();return false;}
    const fade=Math.min(1,progress*9,(1-progress)*6);
    for(const {coin,origin,target,delay} of coins){
      const t=THREE.MathUtils.clamp((progress-delay)/.64,0,1),u=collect?t:1-t;
      coin.position.lerpVectors(origin,target,u);coin.position.y+=Math.sin(t*Math.PI)*(chained?.7:.45);
      coin.rotation.set(coin.geometry.type==='BoxGeometry'?0:Math.PI/2,t*8,0);coin.visible=t>0&&t<1;coin.material.opacity=fade;
    }
    for(const ring of rings){ring.scale.setScalar(1+Math.sin(progress*Math.PI*4)*.12);ring.material.opacity=fade*.75;}
    if(label){label.material.opacity=fade;label.position.y=1.35+progress*.22;}
    return true;
  }
  return {start,tick,finish,get active(){return duration>0;},dispose(){finish();scene.remove(root);}};
}
