import * as THREE from 'three';
// Shared, deterministic table finish. No external downloads or per-frame texture work.
export function createTableFinish(table,lots){
 const resources=[],shadows=[];const own=x=>(resources.push(x),x);
 function canvasTexture(paint){const c=document.createElement('canvas');c.width=c.height=256;paint(c.getContext('2d'));const t=own(new THREE.CanvasTexture(c));t.colorSpace=THREE.SRGBColorSpace;return t;}
 const cloth=canvasTexture(ctx=>{ctx.fillStyle='#24483f';ctx.fillRect(0,0,256,256);for(let y=0;y<256;y+=4){ctx.fillStyle=y%8?'#274b42':'#21453c';ctx.fillRect(0,y,256,1);}for(let x=0;x<256;x+=4){ctx.fillStyle='#b9c69c0a';ctx.fillRect(x,0,1,256);}});
 cloth.wrapS=cloth.wrapT=THREE.RepeatWrapping;cloth.repeat.set(14,14);table.material.map=cloth;table.material.color.set('#ffffff');table.material.roughness=.96;table.material.needsUpdate=true;
 const contact=canvasTexture(ctx=>{const g=ctx.createRadialGradient(128,128,18,128,128,125);g.addColorStop(0,'#102a2460');g.addColorStop(.48,'#102a2430');g.addColorStop(1,'#102a2400');ctx.fillStyle=g;ctx.fillRect(0,0,256,256);});
 const material=own(new THREE.MeshBasicMaterial({map:contact,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,toneMapped:false}));
 const geometry=own(new THREE.PlaneGeometry(.87,.74));
 for(const [id,lot]of lots){if([1,2,3,5,6,7,9,11,32].includes(id))continue;const shadow=new THREE.Mesh(geometry,material);shadow.name='Sombra de contacto';shadow.rotation.x=-Math.PI/2;shadow.position.set(0,.058,-1.08);lot.add(shadow);shadows.push(shadow);}
 return{dispose(){table.material.map=null;table.material.needsUpdate=true;for(const s of shadows)s.removeFromParent();for(const r of resources)r.dispose();}};
}
