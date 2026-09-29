'use strict';
// Broad, non-tonal stereo beds; recorded details are sparse and never played late.
globalThis.GameZoneAudio={create(getContext,isEnabled){
 let volume=.3,zone=null,beds=[],ctx=null,duckUntil=0,nextDetail=0,loading=null;
 const buffers=new Map(),details=new Set();
 try{const saved=localStorage.getItem('deuda_eterna_ambient');if(saved!==null&&Number.isFinite(Number(saved)))volume=Math.max(0,Math.min(1,Number(saved)));}catch{}
 const slider=document.getElementById('ambiente-volumen');slider.value=Math.round(volume*100);
 slider.addEventListener('input',()=>{volume=Math.max(0,Math.min(1,Number(slider.value)/100));try{localStorage.setItem('deuda_eterna_ambient',String(volume));}catch{}if(volume===0)stopDetails();setZone(zone);});
 function stopDetails(){for(const d of details){try{d.source.stop();}catch{}d.source.disconnect();d.gain.disconnect();d.filter?.disconnect();}details.clear();}
 function stop(){stopDetails();for(const b of beds){try{b.source.stop();}catch{}b.source.disconnect();b.gain.disconnect();}beds=[];ctx=null;duckUntil=0;nextDetail=0;}
 function mix(){if(!ctx)return;for(const b of beds){const target=b.name===zone&&isEnabled()&&!document.hidden?volume*.23*(ctx.currentTime<duckUntil?.28:1):0;if(b.target===target)continue;b.target=target;b.gain.gain.cancelScheduledValues(ctx.currentTime);b.gain.gain.setTargetAtTime(target,ctx.currentTime,target===0||ctx.currentTime<duckUntil?.12:.8);}}
 function preload(){if(loading||typeof fetch!=='function')return;const context=ctx;
  loading=Promise.all(['footstep_wood_000','impactWood_light_000','impactMetal_light_000'].map(async name=>{try{const r=await fetch('/sonidos/seleccion/'+name+'.ogg');if(r.ok)buffers.set(name,await context.decodeAudioData(await r.arrayBuffer()));}catch{/* The bed works offline even when a detail is unavailable. */}}));
 }
 function bed(name){
  const rate=16000,length=rate*24,buffer=ctx.createBuffer(2,length,rate);
  for(let channel=0;channel<2;channel++){
   const data=buffer.getChannelData(channel);let low=0,soft=0,bass=0;
   for(let i=0;i<length;i++){
    const t=i/rate,white=Math.random()*2-1;low+=.075*(white-low);soft+=.13*(low-soft);bass+=.009*(white-bass);
    const swell=.5+.5*Math.sin(2*Math.PI*t/8+channel*.35),gust=.55+.22*Math.sin(2*Math.PI*t/12+channel*.6)+.15*Math.sin(2*Math.PI*t/3);
    data[i]=name==='costa'?soft*(.45+swell*swell*2.8)+(low-soft)*swell*.55:name==='campo'?soft*gust*1.8+(low-soft)*Math.pow(Math.max(0,Math.sin(2*Math.PI*t/6+channel)),4)*.7:bass*2.1+soft*(.28+.1*Math.sin(2*Math.PI*t/4));
   }
   let peak=0;for(const sample of data)peak=Math.max(peak,Math.abs(sample));if(peak>.8)for(let i=0;i<length;i++)data[i]*=.8/peak;
   // Fade the seam only; avoid the audible short-loop breathing of the old six-second bed.
   const seam=rate*.06;for(let i=0;i<seam;i++){const f=.5-.5*Math.cos(Math.PI*i/seam);data[i]*=f;data[length-1-i]*=f;}
  }
  const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;source.loop=true;gain.gain.value=0;source.connect(gain);gain.connect(ctx.destination);source.start();beds.push({name,source,gain,target:null});
 }
 function detail(){if(!ctx||ctx.currentTime<nextDetail||ctx.currentTime<duckUntil||!zone||!isEnabled()||document.hidden||volume===0)return;
  nextDetail=ctx.currentTime+7+Math.random()*9;
  const file=zone==='industria'?'impactMetal_light_000':zone==='costa'?'impactWood_light_000':'footstep_wood_000',buffer=buffers.get(file);if(!buffer)return;
  const source=ctx.createBufferSource(),gain=ctx.createGain(),filter=ctx.createBiquadFilter?.();source.buffer=buffer;source.playbackRate.value=.72+Math.random()*.2;
  gain.gain.value=volume*(zone==='industria'?.035:.06);
  if(filter){filter.type='lowpass';filter.frequency.value=1100;filter.Q.value=.5;source.connect(filter);filter.connect(gain);}else source.connect(gain);
  gain.connect(ctx.destination);const d={source,gain,filter};details.add(d);source.onended=()=>{details.delete(d);source.disconnect();gain.disconnect();filter?.disconnect();};source.start();
 }
 function setZone(next){const changed=zone!==next;zone=['campo','costa','industria'].includes(next)?next:null;if(changed){stopDetails();nextDetail=(ctx?.currentTime||0)+4;}
  if(!zone||!isEnabled()||document.hidden||volume===0){stopDetails();mix();return;}
  const context=getContext();if(!context||context.state!=='running')return;
  if(!beds.length){ctx=context;for(const name of ['campo','costa','industria'])bed(name);nextDetail=ctx.currentTime+4;preload();}mix();detail();
 }
 function duck(seconds=1.5){if(!ctx)return;duckUntil=Math.max(duckUntil,ctx.currentTime+seconds);stopDetails();mix();}
 return{setZone,stop,duck};
}};
