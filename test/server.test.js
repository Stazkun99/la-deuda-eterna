'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {once}=require('node:events');
const {createServer}=require('../server');
const {Store}=require('../lib/store');
const {io}=require('../node_modules/socket.io/client-dist/socket.io.js');
function memory(){let snapshot={};return{load:()=>structuredClone(snapshot),save:r=>snapshot=structuredClone(r)};}
async function setup(t,store=memory()){
 const instance=createServer({store,gameOptions:{dice:()=>1}});instance.server.listen(0,'127.0.0.1');await once(instance.server,'listening');
 t.after(()=>instance.close());return{...instance,url:'http://127.0.0.1:'+instance.server.address().port};
}
async function client(t,url){const s=io(url,{transports:['websocket'],forceNew:true,reconnection:false});t.after(()=>s.disconnect());await once(s,'connect');return s;}
const emit=(s,e,d)=>new Promise((resolve,reject)=>s.timeout(3000).emit(e,d,(error,response)=>error?reject(error):resolve(response)));
const join=(s,i,crear=false)=>emit(s,'unirseSala',{nombre:'Jugador '+i,userId:'usuario_'+i,sessionToken:String(i).repeat(64),sala:'PRUEBA',crear});
let action=0;const act=(s,e,r,d={})=>emit(s,e,{turnoId:r.turnoId,actionId:'test-'+(++action),...d});
test('HTTP sirve tablero HTML, catálogo y cabeceras; no expone datos privados',{timeout:15000},async t=>{
 const {url}=await setup(t);const res=await fetch(url);assert.equal(res.status,200);assert.match(res.headers.get('content-security-policy'),/script-src 'self'/);assert.equal(res.headers.get('x-powered-by'),null);assert.ok((await res.text()).includes('board-center'));
 assert.equal((await(await fetch(url+'/api/catalogo')).json()).length,12);assert.equal((await fetch(url+'/data/partidas.json')).status,404);assert.deepEqual(await(await fetch(url+'/health')).json(),{ok:true});
});
test('dos sockets reales juegan, reciben estado sin secretos y rechazan chat inválido',{timeout:15000},async t=>{
 const {url,game}=await setup(t);const a=await client(t,url),b=await client(t,url);assert.equal((await join(a,0,true)).ok,true);assert.equal((await join(b,1)).ok,true);
 let state;b.on('actualizarEstado',s=>state=s);const r=game.rooms.PRUEBA;
 assert.equal((await act(a,'iniciarPartida',r,{monopolio:false})).ok,true);
 assert.equal((await act(a,'tirarDado',r)).ok,true);assert.equal(r.fase,'compra');
 assert.equal((await act(b,'tirarDado',r)).ok,false);
 const fresh=game.rooms.PRUEBA;assert.equal((await act(a,'decidirCompraPropiedad',fresh,{decisionId:fresh.pendiente.id,comprar:true})).ok,true);
 assert.equal((await act(a,'terminarTurno',game.rooms.PRUEBA)).ok,true);
 assert.equal((await emit(a,'enviarMensajeChat',{texto:'malformado'})).ok,false);
 const chat=once(b,'nuevoMensajeChat');assert.equal((await emit(a,'enviarMensajeChat','<img src=x onerror=alert(1)>')).ok,true);assert.equal((await chat)[0].texto,'<img src=x onerror=alert(1)>');
 assert.ok(state);assert.ok(!JSON.stringify(state).includes('tokenHash'));assert.equal((await fetch(url+'/health')).status,200);
});
test('acciones con el mismo identificador no se cobran dos veces',{timeout:15000},async t=>{
 const {url,game}=await setup(t);const a=await client(t,url),b=await client(t,url);await join(a,0,true);await join(b,1);await act(a,'iniciarPartida',game.rooms.PRUEBA,{monopolio:false});
 const d={turnoId:game.rooms.PRUEBA.turnoId,actionId:'unico'};await emit(a,'pedirPrestamo',d);const second=await emit(a,'pedirPrestamo',d);assert.equal(second.duplicate,true);assert.equal(game.rooms.PRUEBA.jugadores[0].deudaPersonal,5000);
});
test('sesión ajena rechazada y sesión válida recupera plaza por socket real',{timeout:15000},async t=>{
 const {url,game}=await setup(t);const a=await client(t,url);await join(a,0,true);const b=await client(t,url);
 assert.equal((await emit(b,'unirseSala',{nombre:'Intruso',userId:'usuario_0',sessionToken:'9'.repeat(64),sala:'PRUEBA'})).ok,false);
 assert.equal((await join(b,0)).ok,true);assert.equal(game.rooms.PRUEBA.jugadores.length,1);assert.equal(game.rooms.PRUEBA.jugadores[0].socketId,b.id);
});
test('guardado atómico carga partidas y rechaza un archivo corrupto sin borrarlo',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'deuda-store-'));
 try{const store=new Store(directory);assert.deepEqual(store.load(),{});store.save({});assert.deepEqual(store.load(),{});assert.equal(fs.existsSync(store.file+'.tmp'),false);fs.writeFileSync(store.file,'{rotura');assert.throws(()=>store.load());assert.equal(fs.readFileSync(store.file,'utf8'),'{rotura');}finally{fs.rmSync(directory,{recursive:true,force:true});}
});
test('fallo al guardar revierte la acción y no confirma éxito',{timeout:15000},async t=>{
 const store=memory(),normal=store.save;const {url,game}=await setup(t,store);const a=await client(t,url),b=await client(t,url);await join(a,0,true);await join(b,1);await act(a,'iniciarPartida',game.rooms.PRUEBA,{monopolio:false});
 store.save=()=>{throw new Error('Simulación: disco lleno');};assert.equal((await act(a,'pedirPrestamo',game.rooms.PRUEBA)).ok,false);assert.equal(game.rooms.PRUEBA.jugadores[0].deudaPersonal,0);assert.equal((await fetch(url+'/health')).status,503);store.save=normal;
});
test('estado persistido permite reconectar después de recrear el servidor',{timeout:15000},async t=>{
 const store=memory();const first=await setup(t,store);const a=await client(t,first.url),b=await client(t,first.url);await join(a,0,true);await join(b,1);await act(a,'iniciarPartida',first.game.rooms.PRUEBA,{monopolio:false});await act(a,'tirarDado',first.game.rooms.PRUEBA);const id=first.game.rooms.PRUEBA.pendiente.id;await first.close();
 const second=await setup(t,store),c=await client(t,second.url);assert.equal((await join(c,0)).ok,true);assert.equal(second.game.rooms.PRUEBA.pendiente.id,id);assert.equal((await act(c,'decidirCompraPropiedad',second.game.rooms.PRUEBA,{decisionId:id,comprar:false})).ok,true);
});
