import {createEventEnvironment} from './board3d-event-environment.mjs';
import {rigPump} from './board3d-machines.mjs';
import * as THREE from 'three';
import {fitModel} from './board3d-models.mjs';
import {EVENT_MODELS} from './board3d-event-catalog.mjs';
// Reuse imported low-poly art. No stand-in geometry is shown while assets load.
export function createEventStage(scene,{load,onChange=()=>{}}={}){
 const root=new THREE.Group();root.name='Escenario del evento';root.position.set(0,.12,-3.15);scene.add(root);
 const cache=new Map(),resources=new Set(),images=new Set();let environment=null,materials=[],motions=[],key=null,disposed=false,ready=Promise.resolve();
 function release(source){source.traverse(o=>{if(o.geometry)resources.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){resources.add(m);for(const value of Object.values(m))if(value?.isTexture){resources.add(value);if(value.image?.close)images.add(value.image);}}});}
 function disposeResources(){for(const r of resources)r.dispose();for(const i of images)i.close();resources.clear();images.clear();}
 function template(file){if(!cache.has(file))cache.set(file,Promise.resolve().then(()=>load('/assets/modelos-3d/'+file)).then(gltf=>{if(!gltf?.scene)throw Error('Escena vacía');release(gltf.scene);if(disposed){disposeResources();return null;}return gltf.scene;}).catch(error=>{if(!disposed)console.warn('Modelo de evento no disponible: '+file,error);return null;}));return cache.get(file);}
 function clear(){environment?.dispose();environment=null;root.clear();for(const m of materials)m.dispose();materials=[];motions=[];}
 function sync(event){const next=event?.instancia||null;if(next===key)return ready;key=next;clear();onChange();if(!event||!load||disposed)return ready=Promise.resolve();
 environment=createEventEnvironment(root,event.id);
 const specs=[...[-.68,.68].map(x=>({file:'eventos/nature/suelo.glb',x,z:0,y:-.15,width:1.4,height:.10,depth:1.3})),...(EVENT_MODELS[event.id]||[])];
 ready=(async()=>{let index=0;async function worker(){while(index<specs.length){const spec=specs[index++],source=await template(spec.file);if(disposed||key!==next)return;if(!source)continue;const model=fitModel(source,spec);model.userData.assetFile=spec.file;
 if(!event.positivo)model.traverse(o=>{if(!o.isMesh)return;const tint=m=>{const copy=m.clone();if(copy.color){const muted=copy.color.clone().lerp(new THREE.Color('#aa987f'),.38);copy.color.copy(muted);}materials.push(copy);return copy;};o.material=Array.isArray(o.material)?o.material.map(tint):tint(o.material);});
 root.add(model);
 let kind=spec.motion;
 if(spec.file.includes('bomba-petrolera'))kind='pump';
 else if(spec.file.includes('contenedor'))kind=event.id==='pedidos'?'cargo':event.id==='logistica'?'queue':null;
 else if(spec.file.includes('tractor'))kind='tractor';
 else if(spec.file.includes('roca-'))kind=event.id==='metales'?'ore':null;
 else if(spec.file.includes('bolsa-alimentos'))kind='goods';
 else if(spec.file.includes('grua-industrial'))kind='crane';
 if(kind)motions.push({model,kind,base:model.position.clone(),rig:kind==='pump'?rigPump(model):null,positive:event.positivo});onChange();}}
 await Promise.all(Array.from({length:3},worker));})();return ready;
 }
 function tick(now,reduced=false){const t=reduced?0:now/1000;environment?.tick(t,reduced);for(const {model,kind,base,rig,positive}of motions){model.position.copy(base);model.rotation.set(0,0,0);
 if(kind==='pump'){if(reduced)rig?.reset();else rig?.tick(t*(positive?1.3:.25));}
 else if(kind==='boat'){model.position.y=base.y+Math.sin(t*1.4)*.025;model.rotation.z=Math.sin(t)*.025;model.position.z=base.z+Math.sin(t*.55)*.08;}
 else if(kind==='leaves')model.rotation.z=Math.sin(t*1.2+base.x)*.035;
 else if(kind==='cargo'){const cycle=(t*.15)%1;model.position.x=base.x+Math.sin(cycle*Math.PI)*.35;model.position.y=base.y+Math.sin(cycle*Math.PI)*.20;}
 else if(kind==='queue')model.position.z=base.z+Math.sin(t*.4)*.025;
 else if(kind==='vehicle'){model.position.x=base.x+Math.sin(t*.65)*.10;model.rotation.z=Math.sin(t*11)*.006;}
 else if(kind==='tractor'){model.position.x=base.x+Math.sin(t*.55)*.08;model.rotation.z=Math.sin(t*12)*.008;}
 else if(kind==='ore'||kind==='goods')model.position.y=base.y+Math.abs(Math.sin(t*2+base.x))*.055;
 else if(kind==='crane')model.rotation.y=Math.sin(t*.5)*.12;
 }return !reduced&&!!environment;}
 return{root,sync,tick,get ready(){return ready;},dispose(){disposed=true;key=null;clear();scene.remove(root);disposeResources();cache.clear();}};
}
