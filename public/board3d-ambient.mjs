import * as THREE from 'three';
const farms=[1,2,3,5,6,7],water=[9,32],mines=[13,14,15],factories=[17,21,22,23,25,26,27,29,31,33,34,35,37];
export function ambientKind(id){if(farms.includes(id))return 'wind';if(water.includes(id))return 'water';if(mines.includes(id))return 'mine';if(factories.includes(id))return 'steam';if(id===11)return 'cattle';if([4,10,16,30,36].includes(id))return 'aid';if([8,19,28,39].includes(id))return 'fmi';if(id===24)return 'gear';return 'signal';}
export function createAmbientLayer(lots){
 const groups=[],resources=new Set(),motions=[],winds=[],subjects=new Map();let enabled=true,disposed=false;
 const own=x=>(resources.add(x),x),sphere=own(new THREE.SphereGeometry(1,7,5)),ring=own(new THREE.TorusGeometry(.065,.006,4,16)),cube=own(new THREE.BoxGeometry(1,1,1));
 function mesh(group,geo,color,x,y,z,sx,sy=sx,sz=sx,opacity=1){const material=own(new THREE.MeshStandardMaterial({color,roughness:.85,transparent:opacity<1,opacity,depthWrite:opacity===1}));const object=new THREE.Mesh(geo,material);object.position.set(x,y,z);object.scale.set(sx,sy,sz);group.add(object);return object;}
 for(const [id,lot] of lots){
  const group=new THREE.Group();group.name='Ambiente '+id;lot.add(group);groups.push(group);const kind=ambientKind(id),phase=id*.73;
  if(kind==='wind'){
   const scenery=lot.children.find(o=>o.name==='Escena de casilla');if(scenery){const original=scenery.material,mat=own(original.clone()),time={value:0};scenery.material=mat;
    mat.onBeforeCompile=shader=>{shader.uniforms.ambientTime=time;shader.vertexShader='uniform float ambientTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nfloat sway = max(0.0, position.y - 0.12); transformed.x += sin(ambientTime * 1.25 + position.z * 5.0) * sway * 0.035; transformed.z += cos(ambientTime + position.x * 4.0) * sway * 0.016;');};
    mat.customProgramCacheKey=()=> 'deuda-wind-v1';winds.push({time,scenery,original,phase});}
  }else if(kind==='water'){
   for(let i=0;i<3;i++){const o=mesh(group,ring,'#e0faff',-.20+i*.19,.05,-.76,1,1,1,.5);o.rotation.x=-Math.PI/2;motions.push({o,kind,phase:phase+i*2});}
  }else if(kind==='steam'){
   for(let i=0;i<3;i++){const o=mesh(group,sphere,'#d1d7d0',-.34,.30,-1.35,.035,.04,.035,.35);motions.push({o,kind,phase:phase+i*2.1});}
  }else if(kind==='mine'){
   const cart=new THREE.Group();cart.position.set(0,.09,-.8);group.add(cart);mesh(cart,cube,'#80633b',0,0,0,.12,.07,.10);mesh(cart,sphere,'#969384',0,.05,0,.045);motions.push({o:cart,kind,phase});
  }else if(kind==='gear'){
   const o=mesh(group,ring,'#c2a85d',.31,.22,-.75,1,1,1);for(let i=0;i<6;i++){const tooth=mesh(o,cube,'#c2a85d',Math.cos(i*Math.PI/3)*.075,Math.sin(i*Math.PI/3)*.075,0,.032,.028,.018);}motions.push({o,kind,phase});
  }else if(kind==='cattle'){
   const fly=mesh(group,sphere,'#d9b344',.28,.30,-1.10,.012,.007,.018);motions.push({o:fly,kind,phase});
  }else{
   const color=kind==='aid'?'#cd7856':kind==='fmi'?'#6f83bc':id===18?'#c2764e':'#cfb658';
   const o=mesh(group,cube,color,.34,.18,-1.37,.045,.065,.012);mesh(group,cube,'#7e8178',.34,.10,-1.37,.009,.15,.009);motions.push({o,kind,phase});
  }
 }
 function reset(){for(const w of winds)w.time.value=-w.phase;for(const [o,base] of subjects){o.position.copy(base.position);o.rotation.copy(base.rotation);o.scale.copy(base.scale);}for(const g of groups)g.visible=false;}
 function tick(now,reduced=false){if(disposed||!enabled||reduced){reset();return false;}const t=now/1000;
  for(const g of groups)g.visible=true;for(const w of winds)w.time.value=t+w.phase;
  for(const m of motions){const a=t+m.phase,o=m.o;
   if(m.kind==='water'){const pulse=(a*.32)%1;o.scale.setScalar(.4+pulse*1.5);o.material.opacity=(1-pulse)*.45;}
   else if(m.kind==='steam'){const p=(a*.24)%1;o.position.y=.26+p*.30;o.position.x=-.34+Math.sin(a*.7)*.02;o.scale.setScalar(.025+p*.025);o.material.opacity=(1-p)*.32;}
   else if(m.kind==='mine')o.position.z=-.91+Math.sin(a*.55)*.11;
   else if(m.kind==='gear')o.rotation.z=a*.45;
   else if(m.kind==='cattle'){o.position.x=.22+Math.sin(a)*.08;o.position.y=.27+Math.cos(a*1.2)*.035;}
   else{o.rotation.y=Math.sin(a*.9)*.20;o.material.emissive.set(o.material.color);o.material.emissiveIntensity=.08+(Math.sin(a*1.1)+1)*.10;}
  }
  for(const [id,lot] of lots)for(const o of lot.children){const file=o.userData.assetFile;if(!file||!['naturaleza/velero.glb','naturaleza/canoa.glb','naturaleza/vaca.glb'].includes(file))continue;if(!subjects.has(o))subjects.set(o,{position:o.position.clone(),rotation:o.rotation.clone(),scale:o.scale.clone()});const base=subjects.get(o);if(id===11)o.scale.y=base.scale.y*(1+Math.sin(t*.9)*.009);else{o.position.y=base.position.y+Math.sin(t*1.1+id)*.009;o.rotation.z=base.rotation.z+Math.sin(t*.8+id)*.022;}}
  return true;
 }
 return {tick,setEnabled(value){enabled=!!value;if(!enabled)reset();},dispose(){if(disposed)return;reset();disposed=true;for(const w of winds)w.scenery.material=w.original;for(const g of groups)g.removeFromParent();for(const r of resources)r.dispose();subjects.clear();}};
}
