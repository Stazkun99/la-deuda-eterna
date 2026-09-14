'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup(saved){
 const handlers={},nodes=[],storage={},button={setAttribute(){},addEventListener:(type,fn)=>handlers['button:'+type]=fn};
 const param=()=>({value:0,setValueAtTime(value){this.value=value},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
 const node=()=>({gain:param(),frequency:param(),connect(){},disconnect(){},start(){this.started=true},stop(){this.stopped=true;this.onended?.()}});
 let audio;
 class Audio{constructor(){audio=this;this.state='running';this.currentTime=0;this.sampleRate=48000;}createGain(){return node()}createBuffer(){return{getChannelData:()=>new Float32Array(4800)}}createOscillator(){const n=node();nodes.push(n);return n}createBufferSource(){const n=node();nodes.push(n);return n}createBiquadFilter(){return node()}resume(){this.state='running';return Promise.resolve()}suspend(){this.state='suspended';return Promise.resolve()}}
 const document={hidden:false,getElementById:()=>button,addEventListener:(type,fn)=>handlers[type]=fn};
 const window={AudioContext:Audio,addEventListener:(type,fn)=>handlers[type]=fn};
 vm.runInNewContext(fs.readFileSync(require.resolve('../public/audio.js'),'utf8'),{window,document,localStorage:{getItem:()=>saved,setItem:(k,v)=>storage[k]=v},Math,Set,Map});
 return{window,document,handlers,nodes,storage,audio:()=>audio};
}
test('sonidos: no reproducen antes de un gesto y respetan silencio guardado',()=>{
 const f=setup('off');f.handlers.pointerdown();assert.equal(f.audio(),undefined);
 f.window.GameAudio.play('dice',4);assert.equal(f.nodes.length,0);
 f.handlers['button:click']();f.window.GameAudio.play('dice',4);assert.equal(f.nodes.length,24);
 f.handlers['button:click']();assert.ok(f.nodes.every(n=>n.stopped));assert.equal(f.storage.deuda_eterna_sound,'off');
});
test('sonidos: cada mecánica produce un efecto y rentas distinguen cobro de pago',()=>{
 const f=setup();f.handlers.pointerdown();
 for(const kind of ['step','dice','solidarity','fmi','loan','trade','build','aid','military','income','payment']){
  const before=f.nodes.length;f.window.GameAudio.play(kind,3);assert.ok(f.nodes.length>before,kind);f.audio().currentTime+=2;
 }
 f.window.GameAudio.interaction({accion:'Pago de renta',origen:'Ana',destino:'Staz'},'Staz');
 assert.equal(f.nodes.at(-1).frequency.value,1760);f.audio().currentTime+=2;
 f.window.GameAudio.interaction({accion:'Pago de renta',origen:'Staz',destino:'Ana'},'Staz');assert.equal(f.nodes.at(-1).frequency.value,440);
});
test('sonidos: pestaña oculta para audio y no acumula eventos para reproducir después',()=>{
 const f=setup();f.handlers.pointerdown();f.window.GameAudio.play('solidarity');
 f.document.hidden=true;f.handlers.visibilitychange();assert.ok(f.nodes.every(n=>n.stopped));
 const count=f.nodes.length;f.window.GameAudio.play('fmi');assert.equal(f.nodes.length,count);
 f.document.hidden=false;f.handlers.visibilitychange();assert.equal(f.nodes.length,count);
});
