'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {Game,GameError}=require('../lib/game');
const characters=require('../public/characters');
function lobby(){const game=new Game({dice:()=>1,chooseIndex:()=>0});const join=(i,s='s'+i)=>game.join(s,{nombre:'Player '+i,userId:'usuario_'+i,sessionToken:String(i).repeat(64),sala:'CHARS',crear:i===0&&!game.rooms.CHARS});for(let i=0;i<4;i++)join(i);return {game,join,r:game.rooms.CHARS};}
test('personajes: selección exclusiva, autoridad del servidor y bloqueo tras empezar',()=>{
 const {game,r}=lobby();game.action('s2','seleccionarPersonaje',{personaje:'kirby'});
 assert.equal(r.jugadores[2].personaje,'kirby');assert.throws(()=>game.action('s1','seleccionarPersonaje',{personaje:'kirby'}),GameError);
 for(const personaje of [null,{},'../foo','mario'])assert.throws(()=>game.action('s1','seleccionarPersonaje',{personaje}),GameError);
 game.action('s2','seleccionarPersonaje',{personaje:'scyther'});game.action('s1','seleccionarPersonaje',{personaje:'kirby'});
 game.action('s0','iniciarPartida',{monopolio:false});assert.equal(new Set(r.jugadores.map(p=>p.personaje)).size,4);assert.equal(r.jugadores[2].personaje,'scyther');
 assert.throws(()=>game.action('s2','seleccionarPersonaje',{personaje:'link'}),GameError);
});
test('personajes: recuperación persistida, abandono libera y partidas antiguas funcionan',()=>{
 const {game,r,join}=lobby();game.action('s1','seleccionarPersonaje',{personaje:'yoshi'});game.disconnect('s1');join(1,'back');assert.equal(r.jugadores[1].personaje,'yoshi');
 const saved=new Game({rooms:structuredClone(game.rooms)});saved.join('again',{nombre:'Player 1',userId:'usuario_1',sessionToken:'1'.repeat(64),sala:'CHARS'});assert.equal(saved.state(saved.rooms.CHARS).jugadores[1].personaje,'yoshi');
 game.leave('back');game.action('s2','seleccionarPersonaje',{personaje:'yoshi'});
 for(const p of r.jugadores)delete p.personaje;game.action('s0','iniciarPartida',{monopolio:false});assert.ok(r.jugadores.every(p=>characters.some(c=>c.id===p.personaje)));
});
test('personajes 3D: tamaño acotado, carga tardía cancelada y fallo recuperable',async()=>{
 const THREE=await import('three');const {createCharacterPiece,fitCharacter,disposeCharacter}=await import('../public/character-piece.mjs');
 const mesh=()=>new THREE.Mesh(new THREE.BoxGeometry(10,25,8),new THREE.MeshStandardMaterial());
 const fitted=fitCharacter(mesh());const bounds=new THREE.Box3().setFromObject(fitted),size=bounds.getSize(new THREE.Vector3());assert.ok(size.x<=.641&&size.y<=.861&&size.z<=.581);assert.ok(Math.abs(bounds.min.y-.115)<.001);disposeCharacter(fitted);
 let resolve,disposed=0,changed=0;const source=mesh();source.geometry.addEventListener('dispose',()=>disposed++);
 const piece=createCharacterPiece('link','#fff',()=>new Promise(r=>resolve=r),()=>changed++);await Promise.resolve();piece.dispose();resolve({scene:source});assert.equal(await piece.ready,false);assert.equal(disposed,1);assert.equal(changed,0);
 const failed=createCharacterPiece('link','#fff',()=>Promise.reject(new Error('offline')));assert.equal(await failed.ready,false);assert.equal(failed.root.userData.loadFailed,true);failed.dispose();
});
test('personajes: GLB locales con texturas, créditos y materiales compatibles',()=>{
 const fs=require('node:fs'),path=require('node:path');const dir=path.join(__dirname,'../public/assets/modelos-3d/personajes');
 const origins=JSON.parse(fs.readFileSync(path.join(dir,'origenes.json')));assert.equal(origins.length,4);
 for(const c of characters){const b=fs.readFileSync(path.join(dir,c.id+'.glb'));assert.equal(b.readUInt32LE(8),b.length);const j=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));assert.ok(!j.extensionsRequired?.includes('KHR_materials_pbrSpecularGlossiness'));for(const img of j.images){assert.ok(img.uri&&!img.uri.includes('..'));assert.ok(fs.existsSync(path.join(dir,img.uri)));}assert.ok(j.asset.extras.license.includes('CC-BY'));}
});
