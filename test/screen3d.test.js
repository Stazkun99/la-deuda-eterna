const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('pantalla principal: apertura, controles compactos, pausa cinematográfica y regreso a 2D',()=>{
 class Node extends EventTarget{constructor(){super();this.hidden=true;this.inert=false;const set=new Set();this.classList={add:v=>set.add(v),remove:v=>set.delete(v),contains:v=>set.has(v),toggle:(v,on)=>on?set.add(v):set.delete(v)};}setAttribute(k,v){this[k]=v;}querySelectorAll(){return [];}focus(){this.focused=true;}}
 const root=new Node(),main=new Node(),body=new Node(),nodes={};for(const id of ['panel-3d','ir-turno-3d','pantalla-completa-3d','estado-3d','abrir-3d'])nodes[id]=new Node();
 const doc={body,documentElement:new Node(),getElementById:id=>nodes[id],querySelector:()=>main,addEventListener(){}};
 const context={document:doc,Event};vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('../public/ui/screen.js'),'utf8'),context);
 const screen=context.GameScreen.create(root);let closes=0;screen.addEventListener('close',()=>closes++);
 screen.showModal();assert.equal(screen.open,true);assert.equal(main.inert,true);assert.ok(body.classList.contains('playing-3d'));
 nodes['ir-turno-3d'].dispatchEvent(new Event('click'));assert.equal(nodes['panel-3d'].inert,true);screen.setCinematic(true);screen.setCinematic(false);assert.equal(nodes['panel-3d'].inert,true,'el fin de animación conserva la ocultación manual');
 nodes['ir-turno-3d'].dispatchEvent(new Event('click'));assert.equal(nodes['panel-3d'].inert,false);screen.setCinematic(true);assert.equal(nodes['panel-3d'].inert,true);screen.setCinematic(false);assert.equal(nodes['panel-3d'].inert,false);
 screen.close();screen.close();assert.equal(closes,1);assert.equal(main.inert,false);assert.equal(screen.open,false);assert.equal(nodes['abrir-3d'].focused,true);
 screen.showModal();assert.equal(nodes['panel-3d'].inert,false);
});
test('vista general: los extremos del tablero caben en móvil, portátil y pantalla completa',async()=>{
 const THREE=await import('three'),{overviewPose}=await import('../public/board3d-camera.mjs');
 for(const aspect of [.4,.75,1,1.77,2.5]){
  const camera=new THREE.PerspectiveCamera(42,aspect,.1,200),{position,target}=overviewPose(aspect);camera.position.copy(position);camera.lookAt(target);camera.updateMatrixWorld();
  for(const x of [-6.4,6.4])for(const y of [-.7,1.8])for(const z of [-6.4,6.4]){const p=new THREE.Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<=.881&&Math.abs(p.y)<=.881);assert.ok(p.z>-1&&p.z<1);}
 }
});
test('arranque modular: dependencias UI anteriores al cliente y tablero no modal',()=>{
 const html=fs.readFileSync(require.resolve('../public/index.html'),'utf8');assert.match(html,/<section id="tablero-3d-dialog"/);assert.doesNotMatch(html,/<dialog id="tablero-3d-dialog"/);
 for(const file of ['screen','board-view','trade','property'])assert.ok(html.indexOf('ui/'+file+'.js')<html.indexOf('src="app.js"'));
});
