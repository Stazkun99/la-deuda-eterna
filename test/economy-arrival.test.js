const test=require('node:test');const assert=require('node:assert/strict');const {Game}=require('../lib/game');
function fixture(){const game=new Game({chooseIndex:()=>0,dice:()=>1});for(let i=0;i<2;i++)game.join('s'+i,{nombre:'Jugador '+i,userId:'usuario_'+i,sessionToken:String(i).repeat(64),sala:'ANIMA',crear:i===0});const r=game.rooms.ANIMA;game.action('s0','iniciarPartida',{monopolio:true});return {game,r,p:r.jugadores[0],other:r.jugadores[1]};}
for(const region of ['sur','norte'])for(const direction of ['cobrar','pagar'])for(const count of [1,2,3])test(`${region}: ${direction}, ${count} industrias del conjunto`,()=>{
 const {game,r,p,other}=fixture();const owner=direction==='cobrar'?p:other;
 const south=[1,2,3].map(id=>r.tablero[id]);const cells=region==='sur'?south:south.map(c=>game.north(r,c));
 for(const c of cells.slice(0,count)){c.dueño=owner.id;c[region==='sur'?'industriasNac':'industriasExp']=1;}
 game.land(r,p,cells[0].id);const effect=r.ultimaLlegadaEconomica;assert.equal(effect.direccion,direction);assert.equal(effect.cadena,count>1);assert.equal(effect.casillas.length,count);assert.equal(effect.monto,direction==='cobrar'?game.ownIncome(r,cells[0]):game.rent(r,cells[0]));assert.equal(effect.jugadorId,p.id);
 if(direction==='pagar')assert.equal(r.pendiente.monto,effect.monto);
 game.land(r,p,10);assert.equal(r.ultimaLlegadaEconomica,null);
});
test('cerrada, propia o visitante exento no muestra cobros ficticios; manufactura FMI no usa cadena',()=>{
 const {game,r,p,other}=fixture();const c=r.tablero[1];c.dueño=p.id;c.industriasNac=1;p.industriasCerradas=true;game.land(r,p,1);assert.equal(r.ultimaLlegadaEconomica,null);p.industriasCerradas=false;
 const north=game.north(r,c);north.dueño=other.id;north.industriasExp=1;game.land(r,p,north.id);assert.equal(r.ultimaLlegadaEconomica,null);
 c.industriasNac=0;r.barreraProteccionista=true;game.land(r,p,north.id);assert.equal(r.ultimaLlegadaEconomica.cadena,false);assert.equal(r.ultimaLlegadaEconomica.monto,north.precio);
});
test('efectos 3D: cuatro variantes, duración, recursos y reducción de movimiento',async()=>{
 const THREE=await import('three');const {createEconomyArrival}=await import('../public/board3d-economy.mjs');const scene=new THREE.Scene();const layer=createEconomyArrival(scene);
 for(const direccion of ['cobrar','pagar'])for(const cadena of [false,true]){
  const duration=layer.start({casilla:1,direccion,cadena,monto:300,casillas:cadena?[1,2,3]:[1]},100);assert.equal(duration,cadena?2400:1900);assert.equal(layer.tick(500),true);assert.ok(scene.children[0].children.length>10);assert.equal(layer.tick(100+duration),false);assert.equal(scene.children[0].children.length,0);
 }
 layer.start({casilla:1,direccion:'cobrar',monto:30,casillas:[1]},0);layer.tick(10,true);assert.equal(layer.active,false);layer.dispose();assert.equal(scene.children.length,0);
});
test('FMI anima solo intereses confirmados, distingue efectivo de oro y excluye préstamos',()=>{
 const {game,r,p}=fixture();p.dinero=10000;p.oro=2;
 game.payment(r,p,500,'Intereses al pasar por el FMI');assert.equal(r.interacciones.at(-1)?.pagoIntereses,undefined);
 game.pay(r,p,{decisionId:r.pendiente.id,usarOro:false});assert.equal(r.interacciones.at(-1).pagoIntereses.monto,500);assert.equal(r.interacciones.at(-1).pagoIntereses.oro,false);
 game.payment(r,p,1000,'Intereses FMI · carta');game.pay(r,p,{decisionId:r.pendiente.id,usarOro:true});assert.equal(r.interacciones.at(-1).pagoIntereses.oro,true);
 game.debit(r,p,100,null,'Amortización');assert.equal(r.interacciones.at(-1).pagoIntereses,undefined);
});
test('12 Octubre retira un lingote y anima salida; sin oro no inventa un tributo',()=>{
 const {game,r,p}=fixture();p.oro=2;game.land(r,p,32);assert.equal(p.oro,1);assert.equal(r.ultimaLlegadaEconomica.oro,true);assert.equal(r.ultimaLlegadaEconomica.tributo,true);assert.equal(r.ultimaLlegadaEconomica.direccion,'pagar');p.oro=0;game.land(r,p,32);assert.equal(r.ultimaLlegadaEconomica,null);
});
