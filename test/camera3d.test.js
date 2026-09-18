const test=require('node:test'),assert=require('node:assert/strict');
async function setup(reduced=()=>false){const THREE=await import('three'),{createBoardCamera}=await import('../public/board3d-camera.mjs');const camera=new THREE.PerspectiveCamera(),controls={target:new THREE.Vector3(),update(){}};camera.position.set(0,12,14);return{THREE,camera,controls,rig:createBoardCamera(camera,controls,{reduced})};}
test('cámara 3D: transición suave, final exacto y cancelación manual',async()=>{
 const {THREE,camera,controls,rig}=await setup(),point=new THREE.Vector3(4,0,-5);rig.focus(point,0);assert.equal(rig.tick(325),true);assert.ok(controls.target.x>0&&controls.target.x<4);assert.equal(rig.tick(650),false);assert.equal(controls.target.x,4);
 rig.focus(new THREE.Vector3(-4,0,5),1000);rig.tick(1100);const before=camera.position.clone();rig.cancel();assert.equal(rig.tick(2000),false);assert.ok(camera.position.equals(before));
});
test('cámara 3D: sigue después de los dados y termina al asentarse en la llegada',async()=>{
 const {THREE,camera,controls,rig}=await setup();let point=new THREE.Vector3(),moving=true;
 rig.move(new THREE.Vector3(0,10,10),new THREE.Vector3(),0,650);rig.follow(()=>({point,moving}),900);
 assert.equal(rig.tick(650),true);assert.equal(camera.position.y,10);assert.equal(rig.tick(850),true);
 point=new THREE.Vector3(5,0,-5);rig.tick(1000);assert.ok(controls.target.x>0);moving=false;
 let active=true;for(let t=1016;t<8000&&active;t+=16)active=rig.tick(t);assert.equal(active,false);assert.equal(controls.target.x,5);assert.equal(controls.target.z,-5);
});
test('cámara 3D: movimiento reducido impide seguimiento y cambios tardíos',async()=>{
 let reduced=true;const {THREE,camera,rig}=await setup(()=>reduced);rig.focus(new THREE.Vector3(3,0,2),0);const before=camera.position.clone();assert.equal(rig.tick(50),false);
 rig.follow(()=>({point:new THREE.Vector3(8,0,8),moving:true}),0);assert.equal(rig.tick(100),false);assert.ok(camera.position.equals(before));
 reduced=false;rig.focus(new THREE.Vector3(0,0,0),200);reduced=true;assert.equal(rig.tick(300),false);assert.equal(rig.tick(400),false);
});
