import * as THREE from 'three';
export const DECK_POSITIONS={solidaridad:{x:-2.57,z:-1.36},condiciones:{x:2.55,z:1.39}};
export function createDeckLayer({scene,loadTexture,onChange=()=>{}}){
 const root=new THREE.Group();root.name='Mazos de Solidaridad y FMI';scene.add(root);
 const owned=new Set(),textures=new Map();let disposed=false,motion=null,seen=null;
 const own=r=>(owned.add(r),r);
 const body=own(new THREE.BoxGeometry(2.02,.042,1.19));
 const paper=own(new THREE.MeshStandardMaterial({color:'#fff9e9',roughness:.9}));
 function texture(url){if(textures.has(url))return textures.get(url);const t=loadTexture(url,()=>{if(!disposed)onChange();});t.colorSpace=THREE.SRGBColorSpace;owned.add(t);textures.set(url,t);return t;}
 const materials={};
 for(const [type,p] of Object.entries(DECK_POSITIONS)){
  const deck=new THREE.Group();deck.position.set(p.x,.11,p.z);deck.name='Mazo '+type;root.add(deck);
  for(let i=0;i<5;i++){const sheet=new THREE.Mesh(body,paper);sheet.position.set((i%2)*.018,i*.044,0);sheet.castShadow=true;sheet.receiveShadow=true;deck.add(sheet);}
  const back=texture('/assets/cartas/reversos/'+type+'.webp');back.center.set(.5,.5);back.rotation=Math.PI/2;
  const top=own(new THREE.MeshStandardMaterial({map:back,roughness:.8,side:THREE.DoubleSide}));materials[type]=top;
  const face=new THREE.Mesh(own(new THREE.PlaneGeometry(2.02,1.19)),top);face.rotation.x=-Math.PI/2;face.position.y=.202;deck.add(face);
 }
 const faceMat=own(new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.8,side:THREE.DoubleSide}));
 const card=new THREE.Mesh(own(new THREE.PlaneGeometry(1.19,2.02)),faceMat);card.visible=false;card.castShadow=true;root.add(card);
 function finish(){if(!motion)return;const resolve=motion.resolve;motion=null;card.visible=false;resolve();onChange();}
 function draw(data,now=performance.now()){
  if(disposed||!DECK_POSITIONS[data?.tipo]||!data.roboId||seen===data.roboId)return Promise.resolve();
  finish();seen=data.roboId;
  return new Promise(resolve=>{motion={start:now,resolve,type:data.tipo,front:data.imagen?texture(data.imagen):null};card.visible=true;tick(now);onChange();});
 }
 function tick(now){if(!motion)return false;const t=Math.max(0,Math.min(1,(now-motion.start)/1100));if(t>=1){finish();return false;}
  const p=DECK_POSITIONS[motion.type],e=t*t*(3-2*t);
  card.position.set(p.x*(1-e),.34+Math.sin(t*Math.PI)*1.25+e*1.1,p.z*(1-e));
  card.rotation.set(-Math.PI/2+e*.95,0,(1-e)*Math.PI/2);
  // The physical back leaves the selected pile; the face appears during the lift.
  const map=t<.48?materials[motion.type].map:motion.front||materials[motion.type].map;
  if(faceMat.map!==map){faceMat.map=map;faceMat.needsUpdate=true;}card.scale.setScalar(1+e*.15);return true;
 }
 return{root,card,draw,tick,finish,dispose(){if(disposed)return;disposed=true;finish();scene.remove(root);for(const r of owned)r.dispose();owned.clear();textures.clear();}};
}
