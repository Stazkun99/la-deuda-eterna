import {createEventEnvironment} from './board3d-event-environment.mjs';
import {rigPump} from './board3d-machines.mjs';
import * as THREE from 'three';
import {fitModel} from './board3d-models.mjs';
import {EVENT_MODELS} from './board3d-event-catalog.mjs';
export function eventPhase(seconds){
 const phase=((seconds%18)+18)%18/18,smooth=x=>{x=THREE.MathUtils.clamp(x,0,1);return x*x*(3-2*x);};
 return {dock:smooth(phase/.20)*(1-smooth((phase-.80)/.20)),lift:smooth((phase-.24)/.12)*(1-smooth((phase-.60)/.12)),transfer:smooth((phase-.36)/.24),work:smooth((phase-.20)/.10)*(1-smooth((phase-.70)/.10))};
}
// Reuse imported low-poly art. No stand-in geometry is shown while assets load.
export function createEventStage(scene,{load,onChange=()=>{}}={}){
 const root=new THREE.Group();root.name='Escenario del evento';root.position.set(0,.12,-3.15);scene.add(root);
 const cache=new Map(),resources=new Set(),images=new Set();let epoch=null,eventId=null,environment=null,materials=[],motions=[],key=null,disposed=false,ready=Promise.resolve();
 function release(source){source.traverse(o=>{if(o.geometry)resources.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){resources.add(m);for(const value of Object.values(m))if(value?.isTexture){resources.add(value);if(value.image?.close)images.add(value.image);}}});}
 function disposeResources(){for(const r of resources)r.dispose();for(const i of images)i.close();resources.clear();images.clear();}
 function template(file){if(!cache.has(file))cache.set(file,Promise.resolve().then(()=>load('/assets/modelos-3d/'+file)).then(gltf=>{if(!gltf?.scene)throw Error('Escena vacía');release(gltf.scene);if(disposed){disposeResources();return null;}return gltf.scene;}).catch(error=>{if(!disposed)console.warn('Modelo de evento no disponible: '+file,error);return null;}));return cache.get(file);}
 function clear(){epoch=null;environment?.dispose();environment=null;root.clear();for(const m of materials)m.dispose();materials=[];motions=[];}
 function sync(event){const next=event?.instancia||null;if(next===key)return ready;key=next;clear();onChange();if(!event||!load||disposed)return ready=Promise.resolve();
 eventId=event.id;environment=createEventEnvironment(root,event.id);
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
 function tick(now,reduced=false){epoch??=now;const t=reduced?0:Math.max(0,(now-epoch)/1000),phase=eventPhase(t);environment?.tick(t,reduced);for(const {model,kind,base,rig,positive}of motions){model.position.copy(base);model.rotation.set(0,0,0);
 if(kind==='pump'){if(reduced||!positive)rig?.reset();else rig?.tick(t*.8);}
 else if(kind==='boat'){model.position.y=base.y+Math.sin(t*1.4)*.012;model.rotation.z=Math.sin(t)*.015;model.position.z=base.z+(reduced?0:(1-phase.dock)*.14);model.position.x=base.x+(reduced?0:(1-phase.dock)*.12);}
 else if(kind==='leaves')model.rotation.z=Math.sin(t*1.2+base.x)*.035;
 else if(kind==='cargo'){model.position.x=base.x+(reduced?0:Math.sin(phase.transfer*Math.PI)*.28);model.position.y=base.y+(reduced?0:phase.lift*.22);}
 else if(kind==='queue')model.position.z=base.z+(reduced?0:phase.work*.025);
 else if(kind==='vehicle'){const driving=!reduced&&(phase.dock<.98);model.position.x=base.x+(reduced?0:(1-phase.dock)*.12);model.rotation.z=driving?Math.sin(t*11)*.004:0;}
 else if(kind==='tractor'){model.position.x=base.x+(reduced?0:Math.sin(phase.transfer*Math.PI)*.08);model.rotation.z=reduced?0:Math.sin(t*12)*.004*phase.work;}
 else if(kind==='ore')model.rotation.y=Math.sin(t*.6+base.x)*.025;
 else if(kind==='goods')model.rotation.z=Math.sin(t*.8+base.x)*.012;
 else if(kind==='crane')model.rotation.y=reduced?0:eventId==='pedidos'?Math.sin(phase.transfer*Math.PI)*.18:Math.sin(t*.4)*.06*phase.work;
 }return !reduced&&!!environment;}
 return{root,sync,tick,get ready(){return ready;},dispose(){disposed=true;key=null;clear();scene.remove(root);disposeResources();cache.clear();}};
}
