'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
test('barrera: solo Norte, anima cambios una vez y respeta movimiento reducido',()=>{
 const animations=[];
 const element=()=>({dataset:{},setAttribute(){},append(){},getAnimations:()=>[],animate(frames){animations.push(frames);return {finished:new Promise(()=>{}),cancel(){}}}});
 const ctx={element,state:{barreraProteccionista:false},document:{hidden:false},matchMedia:()=>({matches:false})};vm.createContext(ctx);
 const source=fs.readFileSync(require.resolve('../public/app.js'),'utf8');vm.runInContext(source.slice(source.indexOf('function renderBarrier('),source.indexOf('function renderBoard(')),ctx);
 const tile={node:null,querySelector(){return this.node},append(node){this.node=node},classList:{toggle(){}}};
 ctx.renderBarrier(tile,{region:'sur'});assert.equal(tile.node,null);
 ctx.renderBarrier(tile,{region:'norte'});assert.equal(tile.node.hidden,true);assert.equal(animations.length,0);
 ctx.state.barreraProteccionista=true;ctx.renderBarrier(tile,{region:'norte'});assert.equal(tile.node.hidden,false);assert.equal(animations.length,1);
 ctx.renderBarrier(tile,{region:'norte'});assert.equal(animations.length,1);
 ctx.state.barreraProteccionista=false;ctx.matchMedia=()=>({matches:true});ctx.renderBarrier(tile,{region:'norte'});assert.equal(tile.node.hidden,true);assert.equal(animations.length,1);
});
