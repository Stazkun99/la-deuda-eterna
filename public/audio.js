/* Original synthesized sound effects: no external files or services. */
'use strict';
(() => {
  let context, master, noise, enabled = true;
  const active = new Set(), last = new Map();
  try { enabled = localStorage.getItem('deuda_eterna_sound') !== 'off'; } catch {}
  const button = document.getElementById('sonido');
  function update() {
    button.textContent = enabled ? '♪ Sonido' : '♪ Silenciado';
    button.setAttribute('aria-pressed', String(enabled));
    button.setAttribute('aria-label', enabled ? 'Silenciar sonidos del juego' : 'Activar sonidos del juego');
  }
  function stop() { for (const node of active) { try { node.stop(); } catch {} } active.clear(); }
  function unlock() {
    if (!enabled || document.hidden) return;
    try {
      if (!context) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return;
        context = new Audio(); master = context.createGain(); master.gain.value = .22; master.connect(context.destination);
        noise = context.createBuffer(1, Math.floor(context.sampleRate * .1), context.sampleRate);
        const data = noise.getChannelData(0); for (let i=0;i<data.length;i++) data[i]=Math.random()*2-1;
      }
      if (context.state === 'suspended') context.resume().catch(() => {});
    } catch { /* Unsupported or blocked audio must never interrupt the game. */ }
  }
  function note(frequency, delay, duration, type='sine', volume=.3, end=frequency) {
    const at=context.currentTime+delay, gain=context.createGain();
    gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(volume,at+.005);gain.gain.exponentialRampToValueAtTime(.001,at+duration);
    gain.connect(master);
    let node, filter;
    if(type==='noise') { node=context.createBufferSource();node.buffer=noise;filter=context.createBiquadFilter();filter.type='bandpass';filter.frequency.value=frequency;node.connect(filter);filter.connect(gain); }
    else { node=context.createOscillator();node.type=type;node.frequency.setValueAtTime(frequency,at);node.frequency.exponentialRampToValueAtTime(end,at+duration);node.connect(gain); }
    active.add(node);node.onended=()=>{active.delete(node);node.disconnect();filter?.disconnect();gain.disconnect();};
    node.start(at);node.stop(at+duration+.01);
  }
  const tunes = {
    rentIn:[880,1320,1760], rentOut:[880,660,440], income:[660,880,1320], payment:[660,440,330], solidarity:[523,659,784,1047],
    fmi:[220,207,165], loan:[196,247,330], trade:[440,659,494,740],
    build:[262,392,523], aid:[587,740,880], military:[110,98,82]
  };
  function play(kind, count=2) {
    if (!enabled || document.hidden || !context || context.state !== 'running') return;
    const now=context.currentTime;
    if(now-(last.get(kind) ?? -Infinity)<(kind==='step'?.08:.55))return;
    last.set(kind,now);
    try {
      if(kind==='dice') {
        for(let i=0;i<Math.min(4,Math.max(2,count));i++)for(const [j,t] of [0,.32,.48].entries()) {
          note(1300+i*180,t+i*.045,.055,'noise',.4/(j+1));note(280+i*45,t+i*.045,.07,'triangle',.18/(j+1),100);
        }
      } else if(kind==='step') { note(330,0,.045,'triangle',.16,170); }
      else if(tunes[kind]) tunes[kind].forEach((f,i)=>note(f,i*.10,.18,kind==='fmi'||kind==='military'?'triangle':'sine',.24));
    } catch { /* A device change or suspended context is harmless. */ }
  }
  // Short, original sound scenes for the board: frequency, start, length, timbre, level, end pitch.
  const scenes = {
    0: [[392,0,.25],[523,.15,.3],[784,.3,.4]],
    1: [[3600,0,.06,'noise'],[3000,.12,.06,'noise'],[2400,.25,.06,'noise'],[1300,.4,.12]], // pouring sugar
    2: [[900,0,.16,'sine',.12,1900],[1200,.22,.15,'sine',.1,2400]], // tropical birds
    3: [[230,0,.07,'triangle'],[180,.18,.07,'triangle'],[110,.36,.12,'triangle']], // cacao pods
    5: [[1800,0,.09,'noise',.14],[2400,.1,.09,'noise',.12],[1600,.2,.09,'noise',.1]], // cotton rustle
    6: [[900,0,.08,'noise',.13],[700,.14,.08,'noise',.12],[550,.28,.08,'noise',.1]], // drying leaves
    7: [[560,0,.05,'triangle'],[680,.1,.04,'triangle'],[480,.18,.04,'triangle'],[720,.26,.05,'triangle'],[1500,.42,.18]], // beans and cup
    9: [[450,0,.12,'sine',.18,1700],[2400,.1,.09,'noise',.18],[850,.25,.08,'sine',.12,300],[550,.42,.15,'sine',.18,2200],[3200,.54,.09,'noise',.18],[700,.7,.1,'sine',.1,200]], // fish jumping, splashes, bubbles
    12: [[440,0,.5,'triangle',.14,90],[2300,.18,.09,'noise',.1]], // money rushing away
    13: [[740,0,.35,'sine',.2],[1150,0,.25,'sine',.08],[740,.4,.3,'sine',.16]], // copper strikes
    14: [[1800,0,.16],[2700,.02,.1,'sine',.1],[2100,.24,.18]], // light tin
    15: [[160,0,.1,'triangle'],[690,0,.3,'sine',.13],[160,.35,.1,'triangle'],[690,.35,.3,'sine',.13]], // anvil
    17: [[70,0,.22,'triangle',.17],[90,.25,.2,'triangle',.17],[70,.5,.22,'triangle',.17],[350,.65,.12,'sine',.1,100]], // oil pump
    20: [[130,0,.16,'triangle'],[110,.18,.16,'triangle'],[80,.36,.22,'triangle']], // closing gate
    21: [[2000,0,.05,'noise',.1],[1047,.12,.12],[1319,.26,.12],[1568,.4,.18]], // candy wrapper
    22: [[850,0,.07,'sine',.2,180],[2500,.08,.07,'noise',.1],[1150,.3,.15]], // jar pop and spoon
    23: [[3200,0,.04,'noise'],[2100,.13,.04,'noise'],[400,.15,.08,'triangle']], // chocolate snapping
    24: [[130,0,.1,'triangle'],[260,.15,.1,'triangle'],[390,.3,.1,'triangle'],[780,.45,.25]],
    25: [[900,0,.06,'triangle'],[1100,.1,.06,'triangle'],[900,.2,.06,'triangle'],[1100,.3,.06,'triangle'],[2400,.4,.08,'noise',.12]], // sewing machine
    26: [[3500,0,.04,'noise',.12],[1100,.09,.08,'noise',.1],[1500,.25,.09,'noise',.1]], // paper and match
    27: [[420,.0,.08,'sine',.1,800],[1400,.08,.09,'noise',.15],[1300,.18,.09,'noise',.12],[1200,.28,.09,'noise',.1],[1800,.45,.25]], // coffee pouring into cup
    29: [[1250,0,.2,'sine',.22],[1870,0,.1,'sine',.08],[1600,.19,.22,'sine',.2],[2390,.19,.1,'sine',.08],[1050,.42,.28,'sine',.2]], // cans clattering
    31: [[130,0,.08,'triangle'],[1800,0,.05,'noise',.1],[170,.24,.08,'triangle'],[2100,.24,.05,'noise',.1],[130,.48,.08,'triangle'],[170,.72,.08,'triangle']], // walking shoes
    32: [[880,0,.3],[1320,.12,.3],[1760,.24,.4]], // glass mirror
    33: [[110,0,.35,'sawtooth',.025],[880,.12,.05,'noise',.14],[1300,.35,.09,'sine',.1,600]], // cable buzz and spark
    34: [[880,0,.07,'square',.06],[1320,.12,.07,'square',.06],[1760,.24,.12,'square',.06]], // electronic beeps
    35: [[65,0,.22,'sawtooth',.06,90],[80,.16,.22,'sawtooth',.06,110],[95,.32,.3,'sawtooth',.06,135],[1600,.1,.07,'noise',.1]], // tractor engine
    37: [[350,.0,.2,'triangle',.12,90],[2200,.12,.08,'noise',.1],[2000,.22,.08,'noise',.1],[1800,.32,.08,'noise',.1],[1000,.48,.12]], // filling fuel, click
    38: [[740,0,.16],[988,.18,.3]]
  };
  function land(id) {
    if (!Number.isInteger(id) || id<0 || id>39 || !enabled || document.hidden || !context || context.state!=='running') return;
    if ([4,16,36].includes(id)) return play('solidarity');
    if ([8,19,28,39].includes(id)) return play('fmi');
    if (id===10) return play('build');
    if (id===18) return play('military');
    if (id===30) return play('aid');
    const key='tile:'+id, now=context.currentTime;
    if (now-(last.get(key)??-Infinity)<.6) return;
    last.set(key,now);
    try {
      if(id===11) {
        // Voiced, rounded "muuu": harmonics share a rising then falling pitch and slow envelope.
        for(let h=1;h<=6;h++) {
          const at=context.currentTime, osc=context.createOscillator(), gain=context.createGain();
          osc.type='sine';osc.frequency.setValueAtTime(95*h,at);osc.frequency.linearRampToValueAtTime(125*h,at+.25);osc.frequency.exponentialRampToValueAtTime(83*h,at+1.15);
          const level=[.3,.16,.09,.045,.025,.012][h-1];
          gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(level,at+.16);gain.gain.setValueAtTime(level*.8,at+.6);gain.gain.exponentialRampToValueAtTime(.001,at+1.2);
          osc.connect(gain);gain.connect(master);active.add(osc);osc.onended=()=>{active.delete(osc);osc.disconnect();gain.disconnect();};osc.start(at);osc.stop(at+1.25);
        }
      } else for(const [frequency,delay,duration,type='sine',volume=.17,end=frequency] of scenes[id]||[]) note(frequency,delay,duration,type,volume,end);
    } catch { /* Sound scenes cannot block a turn. */ }
  }
  function interaction(item, name) {
    const action=item.accion||'';
    if(action==='Solidaridad')return; // The card reveal already has its own cue.
    if(action.includes('Golpe'))return play('military');
    if(/renta/i.test(action))return play(item.destino===name?'rentIn':'rentOut');
    if(action.includes('Préstamo'))return play('loan');
    if(action.includes('Ayuda'))return play('aid');
    if(/comercio|intercambio/i.test(action))return play('trade');
    if(action==='Construcción')return play('build');
    if(item.destino==='FMI'||item.origen==='FMI')return play('fmi');
    play(item.destino===name?'income':item.origen===name||/Compra|Pago/.test(action)?'payment':'income');
  }
  button.addEventListener('click',()=>{enabled=!enabled;try{localStorage.setItem('deuda_eterna_sound',enabled?'on':'off');}catch{}update();if(enabled)unlock();else stop();});
  document.addEventListener('pointerdown',unlock,{passive:true});document.addEventListener('keydown',unlock);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();if(context?.state==='running')context.suspend().catch(()=>{});}else unlock();});
  window.addEventListener('pagehide',stop);
  window.GameAudio = { play, land, interaction, stop };
  update();
})();
