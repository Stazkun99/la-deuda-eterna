import * as THREE from 'three';

export function disposeCharacter(object) {
  const resources=new Set(), images=new Set();
  object.traverse(o=>{
    if(o.geometry)resources.add(o.geometry);
    if(o.skeleton)resources.add(o.skeleton);
    for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){
      resources.add(m);
      for(const value of Object.values(m))if(value?.isTexture){resources.add(value);if(value.image?.close)images.add(value.image);}
    }
  });
  for(const resource of resources)resource.dispose();
  for(const image of images)image.close();
}

export function poseCharacter(source,id) {
  if(id==='kirby') {
    // The download includes a display plinth and a floating decoration.
    for(const name of ['Object_6','Object_8']) {const prop=source.getObjectByName(name);if(prop){prop.removeFromParent();disposeCharacter(prop);}}
  }
  source.updateMatrixWorld(true);
  const names=id==='link'?['LShoulderJ_37','RShoulderJ_66']:id==='scyther'?['left_shoulder_14','right_shoulder_18']:[];
  for(const name of names){
    const bone=source.getObjectByName(name),child=bone?.children.find(c=>c.isBone);if(!child)continue;
    const origin=bone.getWorldPosition(new THREE.Vector3()),direction=child.getWorldPosition(new THREE.Vector3()).sub(origin).normalize();
    const target=new THREE.Vector3(Math.sign(direction.x)*.36,-.86,.2).normalize();
    const turn=new THREE.Quaternion().setFromUnitVectors(direction,target);
    const world=bone.getWorldQuaternion(new THREE.Quaternion()).premultiply(turn);
    bone.quaternion.copy(bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(world));
    source.updateMatrixWorld(true);
  }
  source.traverse(o=>{if(o.isSkinnedMesh){o.skeleton.update();o.computeBoundingBox();}});
}

export function tuneCharacterMaterials(source,id) {
  const materials=new Set();
  source.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});
  for(const m of materials){
    if(!m.isMeshStandardMaterial)continue;
    // A subtle texture-colored fill keeps dark faces readable without lighting the board.
    m.emissive.copy(m.color);m.emissiveMap=m.map;
    m.emissiveIntensity=id==='scyther'?.24:.12;
    m.metalness=Math.min(m.metalness,.12);m.roughness=Math.max(m.roughness,.55);m.needsUpdate=true;
  }
}

export function fitCharacter(source,id) {
  source.updateMatrixWorld(true);
  // Invisible alternate expressions must not distort the size of the playing piece.
  source.traverse(o=>{if(o.isMesh){const mats=Array.isArray(o.material)?o.material:[o.material];if(mats.every(m=>m.transparent&&m.opacity===0))o.visible=false;}});
  const bounds=new THREE.Box3();
  source.traverse(o=>{if(o.isMesh&&o.visible){o.computeBoundingBox?.();const b=(o.boundingBox||o.geometry.boundingBox);if(!b)o.geometry.computeBoundingBox();bounds.union((o.boundingBox||o.geometry.boundingBox).clone().applyMatrix4(o.matrixWorld));}});
  const size=bounds.getSize(new THREE.Vector3());
  if(bounds.isEmpty()||![size.x,size.y,size.z].every(Number.isFinite))throw new Error('Personaje sin geometrÃ­a vÃ¡lida');
  const heights={kirby:.72,link:1,yoshi:.94,scyther:1};
  const height=heights[id]||.86,width=id ? .66 : .64,depth=id ? .60 : .58;
  const scale=Math.min(width/Math.max(size.x,.001),height/Math.max(size.y,.001),depth/Math.max(size.z,.001));
  const wrapper=new THREE.Group(),offset=new THREE.Group();wrapper.add(offset);offset.add(source);
  offset.position.set(-(bounds.min.x+bounds.max.x)/2,-bounds.min.y,-(bounds.min.z+bounds.max.z)/2);
  wrapper.scale.setScalar(scale);wrapper.position.y=.115;
  wrapper.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  return wrapper;
}


// Local poses only: never move the board anchor, base or turn indicator.
export function createCharacterAnimation(pivot,source,id) {
  const rest={position:pivot.position.clone(),scale:pivot.scale.clone(),quaternion:pivot.quaternion.clone()};
  const names={
    link:['LShoulderJ_37','RShoulderJ_66','LLegJ_5','RLegJ_9'],
    yoshi:['head_05','L_thigh_052','R_thigh_056'],
    scyther:['left_wing_a_7','left_wing_b_8','right_wing_a_9','right_wing_b_10','left_shoulder_14','right_shoulder_18']
  };
  const bones=new Map();
  for(const name of names[id]||[]){const bone=source.getObjectByName(name);if(bone)bones.set(name,{bone,rest:bone.quaternion.clone()});}
  const rotation=new THREE.Quaternion(),axis=new THREE.Vector3();
  function turn(name,x,y,z){const item=bones.get(name);if(!item)return;axis.set(x,y,z);const angle=axis.length();if(!angle)return;rotation.setFromAxisAngle(axis.normalize(),angle);item.bone.quaternion.copy(item.rest).multiply(rotation);}
  function reset(){pivot.position.copy(rest.position);pivot.scale.copy(rest.scale);pivot.quaternion.copy(rest.quaternion);for(const item of bones.values())item.bone.quaternion.copy(item.rest);}
  return {
    reset,
    tick(now,moving=false,reduced=false){
      reset();if(reduced)return false;
      const t=now/1000,breath=Math.sin(t*2),stride=Math.sin(t*Math.PI*2/.34);
      if(id==='kirby'){
        // A small occasional idle hop; walking uses the existing tile-by-tile hop.
        const phase=(t%4)/4,hop=phase<.2?Math.sin(phase/.2*Math.PI):0;
        pivot.position.y+=moving?Math.abs(stride)*.022:hop*.045;
        const squash=moving?stride*.035:breath*.014;
        pivot.scale.multiply(new THREE.Vector3(1-squash*.5,1+squash,1-squash*.5));
      }else if(id==='link'){
        pivot.rotation.z=(moving?stride:breath)*(moving?.035:.012);
        pivot.scale.y*=1+breath*.009;
        const arms=moving?stride*.14:breath*.025;
        turn('LShoulderJ_37',0,0,arms);turn('RShoulderJ_66',0,0,-arms);
        if(moving){turn('LLegJ_5',0,0,stride*.09);turn('RLegJ_9',0,0,-stride*.09);}
      }else if(id==='yoshi'){
        pivot.position.y+=moving?Math.abs(stride)*.035:(breath+1)*.007;
        pivot.rotation.z=(moving?stride:breath)*(moving?.03:.012);
        turn('head_05',Math.sin(t*2.3)*.035,0,0);
        if(moving){turn('L_thigh_052',stride*.12,0,0);turn('R_thigh_056',-stride*.12,0,0);}
      }else if(id==='scyther'){
        const flutter=Math.sin(t*(moving?20:9))*(moving?.15:.08);
        for(const name of ['left_wing_a_7','left_wing_b_8'])turn(name,0,0,flutter);
        for(const name of ['right_wing_a_9','right_wing_b_10'])turn(name,0,0,-flutter);
        turn('left_shoulder_14',breath*.025,0,0);turn('right_shoulder_18',-breath*.025,0,0);
        pivot.position.y+=(breath+1)*.008;
      }
      return true;
    }
  };
}

// Each piece owns its loaded scene, including bones, so replacement/disposal is safe.
export function createCharacterPiece(id,color,load,onChange=()=>{}) {
  const root=new THREE.Group(),model=new THREE.Group();root.add(model);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(.32,.36,.09,32),new THREE.MeshStandardMaterial({color,metalness:.35,roughness:.36}));
  base.position.y=.05;model.add(base);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.39,.027,8,48),new THREE.MeshBasicMaterial({color:'#fff3ae'}));ring.rotation.x=-Math.PI/2;ring.position.y=.045;root.add(ring);
  const fallback=new THREE.Mesh(new THREE.SphereGeometry(.17,16,12),new THREE.MeshStandardMaterial({color}));fallback.position.y=.28;model.add(fallback);
  let disposed=false,animation=null;
  const ready=Promise.resolve().then(()=>load('/assets/modelos-3d/personajes/'+id+'.glb')).then(gltf=>{
    if(disposed){disposeCharacter(gltf.scene);return false;}
    try {poseCharacter(gltf.scene,id);tuneCharacterMaterials(gltf.scene,id);const character=fitCharacter(gltf.scene,id),pivot=new THREE.Group();pivot.position.y=character.position.y;character.position.y=0;pivot.add(character);model.add(pivot);animation=createCharacterAnimation(pivot,gltf.scene,id);fallback.visible=false;onChange();return true;}
    catch(error){disposeCharacter(gltf.scene);throw error;}
  }).catch(()=>{if(!disposed){root.userData.loadFailed=true;onChange();}return false;});
  return {root,model,ring,ready,tick(now,moving,reduced){return !disposed&&!!animation?.tick(now,moving,reduced);},finish(){animation?.reset();},dispose(){if(disposed)return;disposed=true;disposeCharacter(root);root.clear();}};
}
