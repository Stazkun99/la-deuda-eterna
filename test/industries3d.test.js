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

test('construcción: anima solo niveles nuevos y termina al pausar o recuperar estado',async()=>{const THREE=await import('three'),{createIndustryLayer}=await import('../public/board3d-industries.mjs');const state={tablero:structuredClone(TABLERO),jugadores:[],barreraProteccionista:false},layer=createIndustryLayer(new THREE.Scene(),state.tablero);layer.sync(state,true,0);state.tablero[1].industriasNac=1;layer.sync(state,true,100);const e=layer.entries.get(1);assert.equal(e.levels[0].scale.y,.02);assert.equal(layer.tick(450),true);assert.ok(e.levels[0].scale.y>.02&&e.levels[0].scale.y<1);const motion=e.buildMotion;layer.sync(state,true,460);assert.equal(e.buildMotion,motion);layer.tick(800);assert.equal(e.levels[0].scale.y,1);state.tablero[1].industriasNac=3;layer.sync(state,true,900);assert.equal(e.levels[0].scale.y,1);assert.equal(e.levels[1].scale.y,.02);layer.finish();assert.equal(e.levels[2].scale.y,1);assert.equal(layer.tick(950),false);state.tablero[1].industriasNac=2;layer.sync(state,false,1000);assert.equal(e.levels[2].visible,false);assert.equal(e.buildMotion,null);layer.dispose();});
test('construcciones: las siluetas caben en su parcela y mantienen libre la zona de fichas',async()=>{const THREE=await import('three'),{createIndustryLayer}=await import('../public/board3d-industries.mjs');const state={tablero:structuredClone(TABLERO),jugadores:[],barreraProteccionista:false};for(const c of state.tablero){c.industriasNac=3;c.industriasExp=3;}const layer=createIndustryLayer(new THREE.Scene(),state.tablero);layer.sync(state);for(const id of [1,21]){const e=layer.entries.get(id),copy=e.building.clone(true);copy.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(copy);assert.ok(bounds.min.x>=.06&&bounds.max.x<=.47);assert.ok(bounds.min.z>=-.67&&bounds.max.z<=-.30);assert.ok(bounds.max.y<.60);assert.ok(e.levels.every(g=>g.children.length>5));}layer.dispose();});
