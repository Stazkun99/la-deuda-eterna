import * as THREE from 'three';
// Shared, deterministic table finish. No external downloads or per-frame texture work.
export function createTableFinish(table,lots){
 const resources=[],shadows=[];const own=x=>(resources.push(x),x);
 function canvasTexture(paint){const c=document.createElement('canvas');c.width=c.height=256;paint(c.getContext('2d'));const t=own(new THREE.CanvasTexture(c));t.colorSpace=THREE.SRGBColorSpace;return t;}
 // A subdued walnut surface keeps the colourful board in focus. Generated once.
 const c=document.createElement('canvas');c.width=c.height=1024;const ctx=c.getContext('2d');
 ctx.fillStyle='#30231f';ctx.fillRect(0,0,1024,1024);
 let seed=4817;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let plank=0;plank<8;plank++){
   const y=plank*128;ctx.fillStyle=plank%2?'#342722':'#30231f';ctx.fillRect(0,y,1024,128);
   for(let line=0;line<80;line++){
     const row=y+random()*128,amp=1+random()*3,phase=random()*Math.PI*2;
     ctx.strokeStyle=line%3?'rgba(171,124,83,0.065)':'rgba(10,8,9,0.13)';ctx.lineWidth=.4+random();ctx.beginPath();
     for(let x=0;x<=1024;x+=8){const py=row+Math.sin(x/1024*Math.PI*4+phase)*amp;x?ctx.lineTo(x,py):ctx.moveTo(x,py);}ctx.stroke();
   }
   ctx.fillStyle='rgba(8,6,6,0.22)';ctx.fillRect(0,y,1024,1);
 }
 const wood=own(new THREE.CanvasTexture(c));wood.colorSpace=THREE.SRGBColorSpace;
 wood.wrapS=wood.wrapT=THREE.RepeatWrapping;wood.repeat.set(10,10);wood.anisotropy=4;
 table.material.map=wood;table.material.color.set('#ffffff');table.material.roughness=.88;table.material.needsUpdate=true;
 // Soft warm pool of light, baked into a transparent plane; no extra shadow light.
 const glow=canvasTexture(ctx=>{const g=ctx.createRadialGradient(128,128,12,128,128,128);g.addColorStop(0,'#d9a46d20');g.addColorStop(.5,'#d9a46d0b');g.addColorStop(1,'#d9a46d00');ctx.fillStyle=g;ctx.fillRect(0,0,256,256);});
 const halo=new THREE.Mesh(own(new THREE.PlaneGeometry(30,30)),own(new THREE.MeshBasicMaterial({map:glow,transparent:true,depthWrite:false,toneMapped:false})));
 halo.rotation.x=-Math.PI/2;halo.position.y=table.position.y+.095;table.parent.add(halo);shadows.push(halo);
 const contact=canvasTexture(ctx=>{const g=ctx.createRadialGradient(128,128,18,128,128,125);g.addColorStop(0,'#102a2460');g.addColorStop(.48,'#102a2430');g.addColorStop(1,'#102a2400');ctx.fillStyle=g;ctx.fillRect(0,0,256,256);});
 const material=own(new THREE.MeshBasicMaterial({map:contact,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,toneMapped:false}));
 const geometry=own(new THREE.PlaneGeometry(.87,.74));
 for(const [id,lot]of lots){if([1,2,3,5,6,7,9,11,32].includes(id))continue;const shadow=new THREE.Mesh(geometry,material);shadow.name='Sombra de contacto';shadow.rotation.x=-Math.PI/2;shadow.position.set(0,.058,-1.08);lot.add(shadow);shadows.push(shadow);}
 return{dispose(){table.material.map=null;table.material.needsUpdate=true;for(const s of shadows)s.removeFromParent();for(const r of resources)r.dispose();}};
}
