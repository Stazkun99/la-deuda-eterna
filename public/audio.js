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
  window.GameAudio = { play, interaction, stop };
  update();
})();
