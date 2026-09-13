'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync(require.resolve('../public/app.js'),'utf8');
function setup(){
 const element=(tag,text='',className='')=>({tag,textContent:text,className,children:[],style:{setProperty(){}},dataset:{},classList:{add(){},remove(){}},append(...nodes){this.children.push(...nodes)},replaceChildren(){this.children=[]}});
 const nodes=Object.fromEntries(['dados-panel','dados-caras','dados-resultado'].map(id=>[id,element('div')]));
 const timers=new Map();let id=0;const context={element,$:key=>nodes[key],seenRoll:null,diceTimer:null,matchMedia:()=>({matches:false}),setTimeout:(fn,ms)=>{timers.set(++id,{fn,ms});return id},clearTimeout:id=>timers.delete(id)};
 vm.createContext(context);vm.runInContext(source.slice(source.indexOf('function diceCube('),source.indexOf('function updateClock(')),context);
 return{context,nodes,timers};
}
test('dados de mesa: seis caras con valores opuestos y resultado real para 2, 3 y 4 dados',()=>{
 const {context,nodes}=setup();
 for(let n=1;n<=6;n++){
  const cube=context.diceCube(n);assert.equal(cube.children.length,6);
  assert.equal(cube.children[0].children.length,n);
  for(let pair=0;pair<6;pair+=2)assert.equal(cube.children[pair].children.length+cube.children[pair+1].children.length,7);
 }
 for(const dados of [[1,6],[3,2,5],[1,2,4,6]]){
  const roll={id:String(dados.length),jugador:'Staz',dados,total:dados.reduce((a,b)=>a+b,0)};
  context.renderDice(roll,false);
  assert.equal(nodes['dados-caras'].children.length,dados.length);
  assert.equal(nodes['dados-resultado'].textContent,`Staz: ${dados.join(' + ')} = ${roll.total}`);
  assert.equal(nodes['dados-panel'].hidden,false);
 }
});
test('dados de mesa: esperan la caída, no repiten la misma tirada y limpian al reiniciar',()=>{
 const {context,nodes,timers}=setup();const roll={id:'roll',jugador:'Staz',dados:[2,4],total:6};
 context.renderDice(roll,true);assert.equal(nodes['dados-resultado'].textContent,'Staz está tirando…');
 const count=timers.size;context.renderDice(roll,true);assert.equal(timers.size,count);
 [...timers.values()].find(t=>t.ms===850).fn();assert.equal(nodes['dados-resultado'].textContent,'Staz: 2 + 4 = 6');
 context.renderDice(null,false);assert.equal(nodes['dados-panel'].hidden,true);
});
