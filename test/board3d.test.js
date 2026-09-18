'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
test('3D: cuarenta casillas únicas, adyacentes y con las esquinas del tablero original',async()=>{
 const {tilePosition}=await import('../public/board3d-layout.mjs');
 const positions=Array.from({length:40},(_,i)=>tilePosition(i));
 assert.equal(new Set(positions.map(p=>JSON.stringify(p))).size,40);
 assert.deepEqual([0,10,20,30].map(tilePosition),[{x:5,z:5},{x:-5,z:5},{x:-5,z:-5},{x:5,z:-5}]);
 for(let i=0;i<40;i++){const a=positions[i],b=positions[(i+1)%40];assert.equal(Math.abs(a.x-b.x)+Math.abs(a.z-b.z),1);assert.equal(Math.max(Math.abs(a.x),Math.abs(a.z)),5);}
 for(const id of [-1,40,1.5,NaN])assert.throws(()=>tilePosition(id),RangeError);
});

test('3D: identidad estable, ocupación compartida y recorrido real al cruzar salida',async()=>{
 const {pieceKind,playerSlot,rollPath}=await import('../public/board3d-layout.mjs');
 assert.equal(pieceKind('#3498DB'),'bota');assert.equal(pieceKind('#F1C40F'),'balsa');
 const players=Array.from({length:4},(_,id)=>({id:String(id),posicion:0}));
 const slots=players.map(p=>playerSlot(players,p));assert.equal(new Set(slots.map(p=>JSON.stringify(p))).size,4);
 assert.deepEqual(playerSlot([players[2]],players[2]),{x:0,z:0,scale:1});
 const before={id:'a',posicion:38},after={id:'a',posicion:2},roll={id:'r',jugadorId:'a',desde:38,hasta:2,total:4};
 assert.deepEqual(rollPath(before,after,roll,null),[38,39,0,1,2]);
 assert.deepEqual(rollPath(before,after,roll,'r'),[]);assert.deepEqual(rollPath(null,after,roll,null),[]);
 assert.deepEqual(rollPath(before,{...after,posicion:20},roll,null),[]);
});

test('3D: cuatro modelos con volumen, aro de turno y recursos liberables',async()=>{
 const {createPlayerPiece}=await import('../public/board3d-pieces.mjs');
 for(const kind of ['carrito','sombrero','bota','balsa']){
   const p=createPlayerPiece(kind,'#e74c3c');assert.ok(p.model.children.length>=7);assert.ok(p.ring.isMesh);
   let disposed=0;for(const m of p.model.children)m.geometry.addEventListener('dispose',()=>disposed++);
   p.dispose();assert.equal(disposed,p.model.children.length);
 }
});

test('3D: las 40 casillas tienen miniatura acotada y una única malla de color',async()=>{
 const {SCENERY,createSceneryGeometry}=await import('../public/board3d-scenery.mjs');
 assert.equal(SCENERY.length,40);let triangles=0;
 for(let id=0;id<40;id++){
  const g=createSceneryGeometry(id),b=g.boundingBox;
  assert.ok(g.attributes.position.count>30,SCENERY[id]);assert.equal(g.attributes.color.count,g.attributes.position.count);
  assert.ok(b.max.x<=.401&&b.min.x>=-.401,SCENERY[id]);assert.ok(b.max.z<=.161&&b.min.z>=-.161,SCENERY[id]);assert.ok(b.max.y<=.681&&b.min.y>=-.001,SCENERY[id]);
  for(const key of ['position','normal','color'])assert.ok(g.attributes[key].array.every(Number.isFinite));
  triangles+=g.attributes.position.count/3;g.dispose();
 }
 assert.ok(triangles<100000,'Presupuesto de geometría del tablero');
 assert.throws(()=>createSceneryGeometry(40),RangeError);
});

test('3D: decorados y fichas usan franjas separadas en las cuatro caras',async()=>{
 const {tileAnchor,sceneryPlayerSlot}=await import('../public/board3d-layout.mjs');
 for(const id of [5,15,25,35]){
  const decor=tileAnchor(id,0,-.28),lane=tileAnchor(id);
  assert.ok(Math.hypot(decor.x-lane.x,decor.z-lane.z)>.49);
 }
 const players=Array.from({length:4},(_,id)=>({id:String(id),posicion:1}));
 for(const p of players){const slot=sceneryPlayerSlot(players,p);assert.ok(slot.z-slot.scale*.42>-.1);assert.ok(slot.z+slot.scale*.42<.52);}
});
