const test=require('node:test'),assert=require('node:assert/strict');
test('fichas: bases separadas de 1 a 4 jugadores y dentro de su franja',async()=>{
 const {sceneryPlayerSlot}=await import('../public/board3d-layout.mjs');
 for(let n=1;n<=4;n++){
  const players=Array.from({length:n},(_,i)=>({id:String(i),posicion:12})),slots=players.map(p=>sceneryPlayerSlot(players,p));
  for(const p of slots){assert.ok(Math.abs(p.x)+p.scale*.36<.5);assert.ok(p.z-p.scale*.36>-.1);assert.ok(p.z+p.scale*.36<.52);}
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){const a=slots[i],b=slots[j];assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>(a.scale+b.scale)*.36);}
  assert.deepEqual(sceneryPlayerSlot([...players].reverse(),players[0]),slots[0]);
 }
});
test('cámara: encuadre interior, retrato y seguimiento anticipado sin giro en esquinas',async()=>{
 const THREE=await import('three'),{createBoardCamera}=await import('../public/board3d-camera.mjs');
 for(const aspect of [1.8,.5]){
  const camera=new THREE.PerspectiveCamera(42,aspect,.1,100),controls={target:new THREE.Vector3(),update(){camera.lookAt(this.target);camera.updateMatrixWorld();}};
  const rig=createBoardCamera(camera,controls,{aspect:()=>aspect});
  for(const [x,z] of [[5,5],[-5,5],[-5,-5],[5,-5]]){
   const point=new THREE.Vector3(x,.225,z);rig.focus(point,0);rig.tick(650);assert.ok((camera.position.x-x)*x<0);assert.ok((camera.position.z-z)*z<0);
   for(const h of [0,1]){const projected=point.clone().add(new THREE.Vector3(0,h,0)).project(camera);assert.ok(Math.abs(projected.x)<.85&&Math.abs(projected.y)<.85);}
  }
  let point=new THREE.Vector3(5,.225,5),ahead={x:3,z:5},moving=true;rig.follow(()=>({point,ahead,moving}),0);
  for(let t=0;t<2000;t+=16)rig.tick(t);
  assert.ok(controls.target.x<point.x&&controls.target.x>point.x-1);
  const direction=camera.position.clone().sub(controls.target).normalize();
  point.set(-5,.225,5);ahead={x:-5,z:3};for(let t=2000;t<6000;t+=16)rig.tick(t);
  assert.ok(camera.position.clone().sub(controls.target).normalize().distanceTo(direction)<.001);
  moving=false;for(let t=6000;t<10000;t+=16)rig.tick(t);assert.equal(controls.target.x,-5);assert.equal(controls.target.z,5);
 }
});
test('personajes: iluminación conserva color y textura y tamaño acotado por personaje',async()=>{
 const THREE=await import('three'),{tuneCharacterMaterials,fitCharacter,disposeCharacter}=await import('../public/character-piece.mjs');
 for(const id of ['kirby','link','yoshi','scyther']){
  const map=new THREE.Texture(),material=new THREE.MeshStandardMaterial({color:'#65ab62',map,metalness:.8,roughness:.2}),source=new THREE.Mesh(new THREE.BoxGeometry(1,2,1),material),color=material.color.clone();
  tuneCharacterMaterials(source,id);assert.ok(material.color.equals(color));assert.equal(material.map,map);assert.equal(material.emissiveMap,map);assert.ok(material.emissiveIntensity>0&&material.emissiveIntensity<=.25);
  const fitted=fitCharacter(source,id),size=new THREE.Box3().setFromObject(fitted).getSize(new THREE.Vector3());assert.ok(size.x<=.661&&size.z<=.601&&size.y<=1.001);disposeCharacter(fitted);
 }
});
