const test=require('node:test'),assert=require('node:assert/strict');
test('animaciones: cuatro reposos distintos, sin deriva y movimiento reducido restaura la pose',async()=>{
 const THREE=await import('three'),{createCharacterAnimation}=await import('../public/character-piece.mjs');
 const signatures=[];
 for(const id of ['kirby','link','yoshi','scyther']){
  const pivot=new THREE.Group(),source=new THREE.Group();pivot.position.y=.115;pivot.add(source);
  for(const name of ['LShoulderJ_37','head_05','left_wing_a_7']){const bone=new THREE.Bone();bone.name=name;bone.rotation.y=.3;source.add(bone);}
  const original=source.children.map(b=>b.quaternion.toArray());
  const animation=createCharacterAnimation(pivot,source,id);
  assert.equal(animation.tick(570,false),true);
  const snapshot=()=>JSON.stringify([pivot.position.toArray(),pivot.scale.toArray(),pivot.quaternion.toArray(),source.children.map(b=>b.quaternion.toArray())]);
  const first=snapshot();signatures.push(first);
  for(let i=0;i<100;i++)animation.tick(570,false);
  assert.equal(snapshot(),first,'misma hora no acumula transformaciones');
  animation.tick(570,true);assert.notEqual(snapshot(),first,'desplazamiento diferente del reposo');
  assert.equal(animation.tick(570,true,true),false);assert.deepEqual(pivot.position.toArray(),[0,.115,0]);assert.deepEqual(pivot.scale.toArray(),[1,1,1]);assert.deepEqual(source.children.map(b=>b.quaternion.toArray()),original);
  animation.tick(900,true);animation.reset();assert.deepEqual(pivot.position.toArray(),[0,.115,0]);
 }
 assert.equal(new Set(signatures).size,4);
});
test('animaciones: no alteran base, aro ni ancla del tablero y terminan al desechar',async()=>{
 const THREE=await import('three'),{createCharacterPiece}=await import('../public/character-piece.mjs');
 const scene=new THREE.Group();scene.add(new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial()));
 const p=createCharacterPiece('kirby','#ff9999',async()=>({scene}));await p.ready;p.root.position.set(2,.225,-4);
 const before=[p.root.position.toArray(),p.model.children[0].position.toArray(),p.ring.position.toArray()];
 for(let t=0;t<6000;t+=33)assert.equal(p.tick(t,t>3000,false),true);
 assert.deepEqual([p.root.position.toArray(),p.model.children[0].position.toArray(),p.ring.position.toArray()],before);
 p.finish();p.dispose();assert.equal(p.tick(7000,false,false),false);
});
