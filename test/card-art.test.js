'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {Game}=require('../lib/game');
const {CARTAS_SOLIDARIDAD,CARTAS_CONDICIONES,CARTAS_PROPIEDADES}=require('../cartas');
const art=require('../public/assets/cartas/manifest.json');
const publicRoot=path.resolve(__dirname,'../public');
test('todas las cartas y propiedades tienen arte local WebP válido',()=>{
 for(const p of CARTAS_PROPIEDADES){assert.ok(art.propiedades[p.nombre]);for(const url of Object.values(art.propiedades[p.nombre]))check(url);}
 for(const [type,deck]of [['solidaridad',CARTAS_SOLIDARIDAD],['condiciones',CARTAS_CONDICIONES]]){
  assert.equal(Object.keys(art[type]).length,deck.length);
  for(const card of deck)check(art[type][card.id]);check(art.reversos[type]);
 }
 function check(url){assert.match(url,/^\/assets\/cartas\/[a-z/0-9-]+\.webp$/);const p=path.resolve(publicRoot,'.'+url);assert.ok(p.startsWith(publicRoot+path.sep));const bytes=fs.readFileSync(p);assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');}
});
test('el servidor anuncia la imagen exacta de cada robo y conserva su identidad al reconectar',()=>{
 const events=[],game=new Game({dice:()=>1,emit:(room,event,data)=>events.push({event,data})});
 for(let i=0;i<2;i++)game.join('s'+i,{nombre:'Jugador '+i,userId:'usuario_'+i,sessionToken:String(i).repeat(64),sala:'ARTE',crear:i===0});
 game.action('s0','iniciarPartida',{monopolio:false});const r=game.rooms.ARTE,p=r.jugadores[0];
 for(const [type,deck]of [['solidaridad',CARTAS_SOLIDARIDAD],['condiciones',CARTAS_CONDICIONES]])for(const c of deck){
  p.sombreroSandino=false;p.deudaPersonal=10000;r.mazos[type]=[c.id];game.card(r,p,type);
  const event=events.filter(e=>e.event==='mostrarCartaModal').at(-1).data;
  assert.equal(event.id,c.id);assert.equal(event.imagen,art[type][c.id]);assert.equal(event.titulo,c.pais||c.titulo);assert.ok(event.roboId);assert.equal(game.state(r).ultimaCarta.roboId,event.roboId);
 }
 const before=r.ultimaCarta.roboId;r.mazos.condiciones=[17];game.card(r,p,'condiciones');assert.notEqual(r.ultimaCarta.roboId,before);
 const restored=new Game({rooms:structuredClone(game.rooms)});assert.equal(restored.rooms.ARTE.ultimaCarta.imagen,r.ultimaCarta.imagen);
});

test('las casillas especiales y las doce industrias del Norte tienen ilustración original local',()=>{
 const special=require('../public/assets/tablero/manifest.json');
 assert.deepEqual(Object.keys(special).map(Number),[0,10,12,18,20,21,22,23,24,25,26,27,29,30,31,32,33,34,35,37,38,39]);
 for(const art of Object.values(special)){
  assert.match(art.imagen,/^\/assets\/tablero\/[a-z0-9-]+\.webp$/);
  const bytes=fs.readFileSync(path.join(publicRoot,art.imagen));
  assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');
  assert.ok(art.fuente.endsWith('.jpg'));assert.equal(art.recorteReferencia.length,4);
 }
});
