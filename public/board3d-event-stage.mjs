import * as THREE from 'three';
import {fitModel} from './board3d-models.mjs';
import {EVENT_MODELS} from './board3d-event-catalog.mjs';
// Reuse imported low-poly art. No stand-in geometry is shown while assets load.
export function createEventStage(scene,{load,onChange=()=>{}}={}){
 const root=new THREE.Group();root.name='Escenario del evento';root.position.set(0,.12,-3.15);scene.add(root);
 const cache=new Map(),resources=new Set(),images=new Set();let materials=[],motions=[],key=null,disposed=false,ready=Promise.resolve();
 function release(source){source.traverse(o=>{if(o.geometry)resources.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){resources.add(m);for(const value of Object.values(m))if(value?.isTexture){resources.add(value);if(value.image?.close)images.add(value.image);}}});}
 function disposeResources(){for(const r of resources)r.dispose();for(const i of images)i.close();resources.clear();images.clear();}
 function template(file){if(!cache.has(file))cache.set(file,Promise.resolve().then(()=>load('/assets/modelos-3d/'+file)).then(gltf=>{if(!gltf?.scene)throw Error('Escena vacía');release(gltf.scene);if(disposed){disposeResources();return null;}return gltf.scene;}).catch(error=>{if(!disposed)console.warn('Modelo de evento no disponible: '+file,error);return null;}));return cache.get(file);}
 function clear(){root.clear();for(const m of materials)m.dispose();materials=[];motions=[];}
 function sync(event){const next=event?.instancia||null;if(next===key)return ready;key=next;clear();onChange();if(!event||!load||disposed)return ready=Promise.resolve();
 const specs=[...[-.68,.68].map(x=>({file:'eventos/nature/suelo.glb',x,z:0,y:-.08,width:1.4,height:.16,depth:1.3})),...(EVENT_MODELS[event.id]||[])];
 ready=(async()=>{let index=0;async function worker(){while(index<specs.length){const spec=specs[index++],source=await template(spec.file);if(disposed||key!==next)return;if(!source)continue;const model=fitModel(source,spec);model.userData.assetFile=spec.file;
 if(!event.positivo)model.traverse(o=>{if(!o.isMesh)return;const tint=m=>{const copy=m.clone();if(copy.color){const muted=copy.color.clone().lerp(new THREE.Color('#aa987f'),.38);copy.color.copy(muted);}materials.push(copy);return copy;};o.material=Array.isArray(o.material)?o.material.map(tint):tint(o.material);});
 root.add(model);if(spec.motion)motions.push({model,kind:spec.motion,base:model.position.clone()});onChange();}}
 await Promise.all(Array.from({length:3},worker));})();return ready;
 }
 function tick(now,reduced=false){const t=reduced?0:now/1000;for(const {model,kind,base}of motions){if(kind==='boat'){model.position.y=base.y+Math.sin(t*1.4)*.025;model.rotation.z=Math.sin(t)*.025;}else if(kind==='leaves')model.rotation.z=Math.sin(t*1.2+base.x)*.035;}return !reduced&&motions.length>0;}
 return{root,sync,tick,get ready(){return ready;},dispose(){disposed=true;key=null;clear();scene.remove(root);disposeResources();cache.clear();}};
}
