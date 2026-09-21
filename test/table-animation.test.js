const test=require('node:test'),assert=require('node:assert/strict');
test('mazos: la carta parte del mazo correcto, muestra su imagen y termina una sola vez',async()=>{
 const THREE=await import('three'),{createDeckLayer,DECK_POSITIONS}=await import('../public/board3d-decks.mjs');const scene=new THREE.Scene(),textures=[];
 const decks=createDeckLayer({scene,loadTexture:url=>{const t=new THREE.Texture();t.name=url;textures.push(t);return t;}});
 for(const tipo of ['solidaridad','condiciones']){let completed=false;const data={tipo,roboId:tipo,imagen:'/test/'+tipo+'.webp'};const done=decks.draw(data,100).then(()=>completed=true);assert.equal(decks.card.position.x,DECK_POSITIONS[tipo].x);assert.equal(decks.card.position.z,DECK_POSITIONS[tipo].z);assert.equal(decks.card.visible,true);decks.tick(700);assert.equal(completed,false);assert.equal(decks.card.material.map.name,data.imagen);assert.ok(decks.card.position.y>1);decks.tick(1300);await done;assert.equal(completed,true);assert.equal(decks.card.visible,false);await decks.draw(data,1400);assert.equal(decks.card.visible,false);}
 const pending=decks.draw({tipo:'solidaridad',roboId:'cancel'},0);decks.finish();await pending;assert.equal(decks.tick(500),false);let disposed=0;for(const t of textures)t.addEventListener('dispose',()=>disposed++);decks.dispose();decks.dispose();assert.equal(disposed,textures.length);assert.equal(scene.children.length,0);
});
test('ambientes: cuarenta casillas, pausa, movimiento reducido y limpieza sin alterar terrenos',async()=>{
 const THREE=await import('three'),{createAmbientLayer,ambientKind}=await import('../public/board3d-ambient.mjs');const lots=new Map(),originals=[];
 for(let i=0;i<40;i++){const lot=new THREE.Group(),material=new THREE.MeshStandardMaterial(),mesh=new THREE.Mesh(new THREE.BoxGeometry(),material);mesh.name='Escena de casilla';originals.push({mesh,material});lot.add(mesh);lots.set(i,lot);assert.ok(ambientKind(i));}
 const boat=new THREE.Group();boat.userData.assetFile='naturaleza/velero.glb';boat.position.y=.042;lots.get(32).add(boat);
 const ambient=createAmbientLayer(lots);assert.equal(ambient.tick(500),true);assert.notEqual(boat.position.y,.042);const farm=originals[1].mesh.material;assert.notEqual(farm,originals[1].material);const shader={uniforms:{},vertexShader:'#include <begin_vertex>'};farm.onBeforeCompile(shader);assert.match(shader.vertexShader,/sway/);assert.ok(shader.uniforms.ambientTime);
 assert.equal(ambient.tick(600,true),false);assert.equal(boat.position.y,.042);ambient.setEnabled(false);assert.equal(ambient.tick(700),false);ambient.setEnabled(true);assert.equal(ambient.tick(800),true);ambient.dispose();ambient.dispose();assert.equal(ambient.tick(900),false);
 for(const {mesh,material} of originals){assert.equal(mesh.material,material);mesh.geometry.dispose();material.dispose();}
 assert.equal(lots.get(32).children.length,2);assert.equal(lots.get(1).children.length,1);
});
