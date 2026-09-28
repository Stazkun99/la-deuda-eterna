'use strict';
// Quiet synthesized landscapes, mixed independently from game effects.
globalThis.GameZoneAudio={create(getContext,isEnabled){
 let volume=.3,zone=null,beds=[],ctx=null;
 try{const saved=localStorage.getItem('deuda_eterna_ambient');if(saved!==null&&Number.isFinite(Number(saved)))volume=Math.max(0,Math.min(1,Number(saved)));}catch{}
 const slider=document.getElementById('ambiente-volumen');slider.value=Math.round(volume*100);
 slider.addEventListener('input',()=>{volume=Number(slider.value)/100;try{localStorage.setItem('deuda_eterna_ambient',String(volume));}catch{}mix();});
 function stop(){for(const b of beds){try{b.source.stop();}catch{}b.source.disconnect();b.gain.disconnect();}beds=[];ctx=null;}
 function mix(){if(!ctx)return;for(const b of beds){b.gain.gain.cancelScheduledValues(ctx.currentTime);b.gain.gain.setTargetAtTime(b.name===zone&&isEnabled()&&!document.hidden?volume*.075:0,ctx.currentTime,.7);}}
 function setZone(next){zone=next;if(!next||!isEnabled()||document.hidden||volume===0){if(beds.length)mix();return;}const context=getContext();if(!context||context.state!=='running')return;
 if(!beds.length){ctx=context;for(const name of ['campo','costa','industria']){
 const length=ctx.sampleRate*6,buffer=ctx.createBuffer(1,length,ctx.sampleRate),data=buffer.getChannelData(0);let wind=0;
 for(let i=0;i<length;i++){const t=i/ctx.sampleRate;wind=.985*wind+.015*(Math.random()*2-1);const fade=Math.min(1,t*5,(6-t)*5);
 if(name==='campo'){const phase=t%2,chirp=phase<.22?Math.sin(2*Math.PI*(1600*phase+1400*phase*phase))*Math.sin(Math.PI*phase/.22)*.11:0;data[i]=fade*(wind*1.8+chirp);}
 else if(name==='costa')data[i]=fade*wind*(3+2*Math.sin(Math.PI*t/3));
 else data[i]=fade*(Math.sin(2*Math.PI*72*t)*.13+Math.sin(2*Math.PI*108*t)*.05+wind*.6);}
 const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;source.loop=true;gain.gain.value=0;source.connect(gain);gain.connect(ctx.destination);source.start();beds.push({name,source,gain});}
 }mix();}
 return{setZone,stop};
}};
