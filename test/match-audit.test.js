const test=require('node:test'),assert=require('node:assert/strict');
const {Game}=require('../lib/game'),Audit=require('../lib/match-audit');
function setup(){const g=new Game({dice:()=>1,chooseIndex:()=>0});for(let i=0;i<2;i++)g.join('s'+i,{nombre:'J'+i,userId:'usuario_'+i,sessionToken:String(i).repeat(64),sala:'AUDIT',crear:i===0});g.action('s0','iniciarPartida',{monopolio:false,eventos:false});return {g,r:g.rooms.AUDIT};}
test('informe conserva más de 100 acciones, economía, reglas y no expone secretos ni mazos',()=>{
 const {g,r}=setup(),p=r.jugadores[0];for(let i=0;i<110;i++){g.money(r,p,10,{accion:'Prueba'});g.publish(r);}
 const report=Audit.report(r,Date.now());assert.equal(report.completa,true);assert.ok(report.entradas.filter(e=>e.tipo==='interaccion').length>=110);assert.equal(report.estadoFinal.jugadores[0].dinero,6300);
 assert.equal(report.reglas.huella.length,64);assert.equal(report.opciones.eventos,false);assert.ok(!JSON.stringify(report).includes('tokenHash'));assert.ok(!JSON.stringify(report).includes('sessionToken'));assert.ok(!JSON.stringify(report).includes('mazos'));assert.ok(!JSON.stringify(report).includes('usuario_'));
 const state=g.state(r);assert.equal(state.informeDisponible,true);assert.equal(state.auditoria,undefined);assert.equal(state.auditoriaAnterior,undefined);
 const count=r.auditoria.entradas.length;g.publish(r);assert.equal(r.auditoria.entradas.length,count);report.entradas.length=0;assert.ok(r.auditoria.entradas.length>0);
});
test('resultado se conserva en revancha y la siguiente partida obtiene otro ID; guardado se recupera',()=>{
 const {g,r}=setup();g.finish(r,'J0','Prueba');g.publish(r);const id=Audit.report(r,0).id;assert.equal(Audit.report(r,0).estadoFinal.resultado.ganador,'J0');
 g.action('s0','prepararRevancha',{resultadoId:r.resultado.id});assert.equal(Audit.report(r,0).id,id);g.action('s0','iniciarPartida',{monopolio:false});assert.notEqual(Audit.report(r,0).id,id);
 const restored=new Game({rooms:JSON.parse(JSON.stringify(g.rooms))});assert.equal(Audit.report(restored.rooms.AUDIT,0).id,r.auditoria.id);
});
test('partidas antiguas y límite de tamaño se marcan parciales sin perder el último estado',()=>{
 const {g,r}=setup();delete r.auditoria;g.publish(r);assert.equal(Audit.report(r,0).completa,false);r.auditoria.bytes=8*1024*1024;r.jugadores[0].dinero=123;g.publish(r);const report=Audit.report(r,0);assert.equal(report.truncada,true);assert.equal(report.estadoFinal.jugadores[0].dinero,123);
});
test('descarga exige pertenecer a la sala y solo devuelve el informe de esa sala',async t=>{
 const {createServer}=require('../server'),{io}=require('../node_modules/socket.io/client-dist/socket.io.js'),{once}=require('node:events');const server=createServer({store:{load:()=>({}),save:()=>{}}});server.server.listen(0,'127.0.0.1');await once(server.server,'listening');t.after(()=>server.close());const socket=io('http://127.0.0.1:'+server.server.address().port,{transports:['websocket'],reconnection:false});t.after(()=>socket.disconnect());await once(socket,'connect');const emit=(event,data)=>new Promise(resolve=>socket.emit(event,data,resolve));assert.equal((await emit('descargarInforme',{})).ok,false);await emit('unirseSala',{nombre:'Staz',userId:'usuario_staz',sessionToken:'a'.repeat(64),sala:'SOCKET',crear:true});const r=server.game.rooms.SOCKET;Audit.start(r,Date.now());Audit.observe(r,Date.now());const reply=await emit('descargarInforme',{sala:'OTRA'});assert.equal(reply.ok,true);assert.equal(reply.informe.id,r.auditoria.id);
});
