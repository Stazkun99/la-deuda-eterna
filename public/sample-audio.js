/* Selected Kenney CC0 recordings. Missing/late files fall back to the synth immediately. */
'use strict';
(()=>{
 const cue=(file,at=0,rate=1,gain=.55,duration=.6)=>({file,at,rate,gain,duration});
 const metal='impactMetal_light_000',wood='impactWood_light_000',tin='impactTin_medium_000',glass='impactGlass_light_000',engine='engineCircular_000';
 const tiles={
  3:[cue(wood),cue(wood,.24,.85)],4:[cue('impactSoft_medium_000',0),cue(wood,.2)],
  8:[cue(wood,0,.8),cue('impactMetal_heavy_000',.28,1,.25)],10:[cue(metal),cue(wood,.25)],
  13:[cue(metal,0,.82),cue(metal,.38,1.1)],14:[cue(tin),cue(tin,.3,1.2)],15:[cue('impactMining_000'),cue('impactMining_000',.4,.85)],
  16:[cue('impactSoft_medium_000',0,1.2),cue(wood,.3,1.1)],17:[cue(engine,0,.65,.4,1.15)],
  18:[cue('explosionCrunch_000',0,.8,.45,1.25)],19:[cue(wood,0,.72),cue('impactMetal_heavy_000',.3,.8,.22)],
  20:[cue('doorClose_000',0,.85,.45,.9)],22:[cue(glass,0,.85),cue(glass,.32,1.2,.3)],23:[cue(wood,0,1.6),cue(wood,.16,1.4)],
  24:[cue(metal,0,.75),cue('impactMetal_heavy_000',.35,1,.3)],25:[0,.15,.3,.45,.6].map(t=>cue(metal,t,1.7,.18,.13)),
  27:[cue(glass,0,1.3),cue(glass,.45,.9,.3)],28:[cue(wood,0,.9),cue('impactMetal_heavy_000',.33,1.2,.2)],
  29:[cue(tin),cue('impactTin_medium_001',.2),cue(tin,.43,.8)],30:[cue(wood,0,1.1),cue('impactSoft_medium_000',.25,.9)],
  31:[cue('footstep_concrete_000'),cue('footstep_concrete_001',.3),cue('footstep_concrete_000',.6,.95),cue('footstep_concrete_001',.9,1.05)],
  32:[cue('footstep_wood_000',0,.85),cue(wood,.35,.7,.3)],34:[cue('computerNoise_000',0,1,.35,1.2)],
  35:[cue(engine,0,.9,.4,1.2)],36:[cue('impactSoft_medium_000',0,.8),cue(wood,.22,1.3)],37:[cue(engine,0,1.2,.28,.85),cue(metal,.85,.8,.3)],39:[cue('impactMetal_heavy_000',0,.7,.25),cue(wood,.45,.6)]
 };
 const effects={cannon:tiles[18],step:[cue('footstep_wood_000',0,1,.18,.12)]};
 function create(getContext,getMaster){const buffers=new Map(),nodes=new Set();let pending=null;
  function preload(){if(pending)return pending;const ctx=getContext();if(!ctx||typeof fetch!=='function')return Promise.resolve();const files=[...new Set([...Object.values(tiles),...Object.values(effects)].flat().map(c=>c.file))];let index=0;
   pending=Promise.all(Array.from({length:3},async()=>{while(index<files.length){const file=files[index++];try{const r=await fetch('/sonidos/seleccion/'+file+'.ogg');if(!r.ok)continue;const buffer=await ctx.decodeAudioData(await r.arrayBuffer());buffers.set(file,buffer);}catch{/* Synth remains available. */}}}));return pending;
  }
  function play(list){const ctx=getContext();if(!list||!ctx||ctx.state!=='running'||!list.every(c=>buffers.has(c.file)))return false;
   for(const c of list){const source=ctx.createBufferSource(),gain=ctx.createGain(),at=ctx.currentTime+c.at,duration=Math.min(c.duration,buffers.get(c.file).duration/c.rate);source.buffer=buffers.get(c.file);source.playbackRate.value=c.rate;gain.gain.setValueAtTime(c.gain,at);gain.gain.setValueAtTime(c.gain,at+Math.max(0,duration-.035));gain.gain.linearRampToValueAtTime(0,at+duration);source.connect(gain);gain.connect(getMaster());nodes.add(source);source.onended=()=>{nodes.delete(source);source.disconnect();gain.disconnect();};source.start(at);source.stop(at+duration);}
   return true;
  }
  return{preload,land:id=>play(tiles[id]),play:kind=>play(effects[kind]),stop(){for(const n of nodes){try{n.stop();}catch{}}nodes.clear();},get loaded(){return buffers.size;}};
 }
 globalThis.GameSampleAudio={create,tiles,effects};
})();
