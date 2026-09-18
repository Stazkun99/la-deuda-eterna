const test=require('node:test'),assert=require('node:assert/strict');
const {TABLERO}=require('../lib/data');
test('industrias 3D: niveles nacionales/exportación, dueño, cierre y eliminación',async()=>{
 const THREE=await import('three'),{createIndustryLayer}=await import('../public/board3d-industries.mjs');
 const scene=new THREE.Scene(),board=structuredClone(TABLERO),layer=createIndustryLayer(scene,board),state={tablero:board,jugadores:[{id:'a',color:'#e74c3c'}],barreraProteccionista:false};
 assert.equal(layer.entries.size,24);layer.sync(state);assert.ok([...layer.entries.values()].every(e=>!e.building.visible));
 for(const level of [1,2,3]){Object.assign(board[1],{dueño:'a',industriasNac:level});Object.assign(board[21],{dueño:'a',industriasExp:level});layer.sync(state);
 for(const id of [1,21]){const e=layer.entries.get(id);assert.equal(e.levels.filter(g=>g.visible).length,level);assert.equal(e.indicators.filter(g=>g.visible).length,level);assert.equal(e.ownerMat.color.getHexString(),'e74c3c');}}
 state.jugadores[0].industriasCerradas=true;layer.sync(state);assert.equal(layer.entries.get(1).shell.color.getHexString(),'87918e');
 state.jugadores[0].color='#3498db';layer.sync(state);assert.equal(layer.entries.get(1).ownerMat.color.getHexString(),'3498db');
 board[1].industriasNac=0;layer.sync(state);assert.equal(layer.entries.get(1).building.visible,false);layer.dispose();assert.equal(scene.children.length,0);
});
test('barrera 3D: doce persianas, inversión suave, sin repetición ni animación al recuperar',async()=>{
 const THREE=await import('three'),{createIndustryLayer}=await import('../public/board3d-industries.mjs');
 const scene=new THREE.Scene(),state={tablero:structuredClone(TABLERO),jugadores:[],barreraProteccionista:false},layer=createIndustryLayer(scene,state.tablero);
 layer.sync(state,true,0);assert.equal([...layer.entries.values()].filter(e=>e.gate).length,12);
 state.barreraProteccionista=true;layer.sync(state,true,100);assert.equal(layer.tick(475),true);
 const e=layer.entries.get(21);assert.ok(e.progress>.4&&e.progress<.6);const motion=e.motion;layer.sync(state,true,480);assert.equal(e.motion,motion);
 state.barreraProteccionista=false;layer.sync(state,true,500);assert.equal(e.motion.from,e.progress);layer.tick(1250);assert.equal(e.gate.visible,false);
 state.barreraProteccionista=true;layer.sync(state,false,1300);assert.equal(e.progress,1);assert.equal(layer.tick(1400),false);
 for(const v of layer.entries.values())if(!v.north)assert.equal(v.gate,null);
 state.barreraProteccionista=false;layer.sync(state,true,1500);layer.finish();assert.equal(e.gate.visible,false);assert.equal(layer.tick(1600),false);layer.dispose();
});
