'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
test('dados 3D: las seis caras conservan opuestos y el resultado queda arriba',async()=>{
 const THREE=await import('three'),{DICE_FACES,diceOrientation}=await import('../public/board3d-dice.mjs');
 for(const face of DICE_FACES){const n=new THREE.Vector3(...face.normal);const opposite=DICE_FACES.find(f=>new THREE.Vector3(...f.normal).dot(n)===-1);assert.equal(face.value+opposite.value,7);
 for(let i=0;i<4;i++)assert.ok(n.clone().applyQuaternion(diceOrientation(face.value,i)).distanceTo(new THREE.Vector3(0,1,0))<1e-6);}
});
test('dados 3D: 2, 3 y 4 dados, caída, repetición, reconexión y limpieza',async()=>{
 const THREE=await import('three'),{createDiceTray,validRoll}=await import('../public/board3d-dice.mjs');
 const scene=new THREE.Scene();let label='';const tray=createDiceTray(scene,text=>label=text);
 for(const count of [2,3,4]){const dados=Array.from({length:count},(_,i)=>i+2),roll={id:'roll'+count,jugador:'Staz',dados,total:dados.reduce((a,b)=>a+b)};
 assert.equal(tray.sync(roll,true,1000),true);assert.equal(tray.root.children.filter(g=>g.visible).length,count);assert.match(label,/tirando/);
 assert.equal(tray.tick(1400),true);assert.equal(tray.tick(1850),false);assert.match(label,new RegExp('= '+roll.total+'$'));
 for(const group of tray.root.children.filter(g=>g.visible))assert.equal(group.position.y,.435);
 assert.equal(tray.sync(roll,true,2000),false);assert.equal(tray.tick(2000),false);
 tray.sync({...roll,id:'reconnect'+count},false);assert.equal(tray.tick(3000),false);
 }
 tray.sync({id:'cancel',dados:[1,6],total:7},true,0);tray.finish();assert.equal(tray.tick(400),false);
 assert.equal(validRoll({id:'bad',dados:[7,2],total:9}),false);assert.equal(validRoll({id:'bad',dados:[1,2],total:4}),false);
 tray.sync(null,false);assert.equal(tray.root.visible,false);assert.equal(label,'');tray.dispose();assert.equal(scene.children.length,0);
});
