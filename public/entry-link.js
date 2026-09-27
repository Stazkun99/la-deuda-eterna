(function (root) {
  'use strict';
  function parse(hash) {
    if (typeof hash !== 'string' || hash.length > 1500) return null;
    const p = new URLSearchParams(hash.replace(/^#/, ''));
    const mode = p.get('entrada'), nombre = (p.get('nombre') || '').trim(), sala = (p.get('sala') || '').trim().toUpperCase();
    if (!['crear', 'unirse'].includes(mode) || !nombre || nombre.length > 40 || !/^[A-Z0-9_-]{3,12}$/.test(sala)) return null;
    return { nombre, sala, crear: mode === 'crear' };
  }
  function build(base, data) {
    const url = new URL(base);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Dirección del juego inválida');
    const p = new URLSearchParams({ entrada: data.crear ? 'crear' : 'unirse', nombre: data.nombre, sala: data.sala });
    if (!parse(p.toString())) throw new Error('Nombre o código de sala inválido');
    url.hash = p.toString();
    return url.href;
  }
  function invitation(search) {
    const room = (new URLSearchParams(search).get('sala') || '').trim().toUpperCase();
    return /^[A-Z0-9_-]{3,12}$/.test(room) ? room : null;
  }
  function invite(base, room) {
    const url = new URL(base);
    if (!['http:', 'https:'].includes(url.protocol) || !invitation('?sala='+encodeURIComponent(room))) throw new Error('Invitación inválida');
    url.search = new URLSearchParams({sala:room.toUpperCase()}).toString(); url.hash='';
    return url.href;
  }
  const api = { parse, build, invitation, invite };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.GameEntry = api;
})(globalThis);
