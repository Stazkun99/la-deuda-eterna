import * as THREE from 'three';
import {tilePosition,tileAngle} from './board3d-layout.mjs';
import {BOARD_MODELS} from './board3d-model-catalog.mjs';
import {createLotScene} from './board3d-scenes.mjs';

export function fitModel(source,spec) {
  const root=new THREE.Group(),model=source.clone(true);root.add(model);
  model.rotation.y+=spec.rotation||0;model.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3());
  if(bounds.isEmpty()||![size.x,size.y,size.z].every(Number.isFinite))throw new Error('Modelo sin geometría válida');
  const scale=Math.min(spec.width/Math.max(size.x,.0001),spec.height/Math.max(size.y,.0001),spec.depth/Math.max(size.z,.0001));
  root.scale.setScalar(scale);
  model.position.x-=(bounds.min.x+bounds.max.x)/2;
  model.position.y-=bounds.min.y;
  model.position.z-=(bounds.min.z+bounds.max.z)/2;
  root.position.set(spec.x,spec.y||0,spec.z);
  root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  return root;
}

// Limit concurrent downloads and cache each GLB once per viewer. Clones share
// geometry/textures; pending loads are safely released if the viewer closes.
export function createModelLayer({scene,board,load,onChange=()=>{},onStatus=()=>{},catalog=BOARD_MODELS,createScenery=createLotScene}) {
  const root=new THREE.Group();root.name='Modelos descargados';scene.add(root);
  const lots=new Map(),templates=new Map(),resources=new Set(),images=new Set();
  const wanted=new Map();let disposed=false,loaded=0,failed=0;
  const padGeometry=new THREE.BoxGeometry(.96,.79,1.06);
  const padMaterial=new THREE.MeshStandardMaterial({color:'#796449',roughness:.85});
  const sceneryMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8});
  for(const cell of board) {
    const lot=new THREE.Group(),p=tilePosition(cell.id);
    lot.position.set(p.x,.215,p.z);lot.rotation.y=tileAngle(cell.id);lot.userData.id=cell.id;root.add(lot);lots.set(cell.id,lot);
    const pad=new THREE.Mesh(padGeometry,padMaterial);pad.position.set(0,-.385,-1.01);pad.receiveShadow=true;lot.add(pad);
    const sceneryGeometry=createScenery(cell.id,!!catalog[cell.id]?.length);resources.add(sceneryGeometry);
    const scenery=new THREE.Mesh(sceneryGeometry,sceneryMaterial);scenery.name='Escena de casilla';scenery.receiveShadow=true;scenery.castShadow=true;lot.add(scenery);
    for(const spec of catalog[cell.id]||[]) {
      if(!wanted.has(spec.file))wanted.set(spec.file,[]);
      wanted.get(spec.file).push({lot,spec});
    }
  }
  function release(template) {
    const local=new Set(),bitmaps=new Set();
    template.traverse(o=>{if(o.geometry)local.add(o.geometry);for(const m of (Array.isArray(o.material)?o.material:o.material?[o.material]:[])){
      local.add(m);for(const value of Object.values(m))if(value?.isTexture){local.add(value);if(value.image?.close)bitmaps.add(value.image);}
    }});
    if(disposed){for(const r of local)r.dispose();for(const image of bitmaps)image.close();}
    else {for(const r of local)resources.add(r);for(const image of bitmaps)images.add(image);}
  }
  const queue=[...wanted.entries()];
  function status(){if(!disposed)onStatus({loaded,failed,total:wanted.size,spaces:Object.keys(catalog).length});}
  async function worker(){
    while(!disposed&&queue.length){
      const [file,uses]=queue.shift();
      try {
        const gltf=await load('/assets/modelos-3d/'+file),template=gltf.scene;
        if(!template)throw new Error('GLB sin escena');
        release(template);if(disposed)break;
        templates.set(file,template);
        for(const {lot,spec} of uses){const model=fitModel(template,spec);model.position.y+=.042;model.userData.assetFile=spec.file;lot.add(model);}
        loaded++;onChange();
      } catch(error) {if(!disposed){failed++;console.warn('No se pudo cargar el modelo '+file,error);}}
      status();
    }
  }
  status();const ready=Promise.all(Array.from({length:Math.min(4,queue.length)},worker));
  return {root,lots,ready,
    setVisible(value){root.visible=value;onChange();},
    dispose(){if(disposed)return;disposed=true;queue.length=0;scene.remove(root);for(const r of resources)r.dispose();for(const image of images)image.close();resources.clear();images.clear();templates.clear();root.clear();lots.clear();for(const r of [padGeometry,padMaterial,sceneryMaterial])r.dispose();}
  };
}
