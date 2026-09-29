const test=require('node:test'),assert=require('node:assert/strict');
test('40 casillas reaccionan, finalizan y respetan movimiento reducido',async()=>{
 const THREE=await import('three'),{createTileChoreography,TILE_ACTIONS}=await import('../public/board3d-tile-choreography.mjs');assert.equal(TILE_ACTIONS.length,40);
 const lots=new Map(Array.from({length:40},(_,id)=>[id,new THREE.Group()])),layer=createTileChoreography(lots);
 for(let id=0;id<40;id++){layer.land(id,0);layer.tick(500,false,false);assert.ok(lots.get(id).getObjectByName('Reacción '+id).children.some(o=>o.visible),'reaction '+id);layer.tick(1600,false,false);assert.equal(layer.active,false);}
 layer.land(33,2000);layer.tick(2200,true);assert.equal(layer.active,false);assert.ok([...lots.values()].every(l=>l.children.every(g=>g.children.every(o=>!o.visible))));layer.dispose();assert.ok([...lots.values()].every(l=>l.children.length===0));
});
test('zapatos alternan pasos sin desplazar el edificio y vuelven a su pose',async()=>{
 const THREE=await import('three'),{createTileChoreography}=await import('../public/board3d-tile-choreography.mjs');const lot=new THREE.Group(),details=new THREE.Group();details.name='Identidad de 31';lot.add(details);for(let i=0;i<2;i++){const shoe=new THREE.Group();shoe.name='Zapato '+i;shoe.position.set(0,.075,i*.2);details.add(shoe);}const layer=createTileChoreography(new Map([[31,lot]]));layer.land(31,0);layer.tick(300,false,false);assert.notEqual(details.children[0].position.y,details.children[1].position.y);layer.tick(1600,false,false);for(const s of details.children)assert.equal(s.position.y,.075);layer.dispose();assert.equal(lot.children.length,1);
});
