'use strict';
// Decisions use only the same public room snapshot a human receives. No dice/deck access.
function reserve(game, r, p) {
  const exposure = Math.max(0, ...r.tablero.filter(c => c.tipo === 'propiedad' && c.dueño && !game.owns(r, p, c)).map(c => game.rent(r, c)));
  return Math.ceil(Math.min(5000, 900 + p.deudaPersonal * (p.interesEspecial || .1) * 1.3 + exposure * .3));
}
function value(game, r, p, c) {
  const group = r.tablero.filter(s => s.region === 'sur' && s.grupo === c.grupo && s.id !== c.id);
  const owned = group.filter(s => game.owns(r, p, s)).length;
  const synergy = group.length && owned === group.length ? 1000 + c.precio * 2 : owned * c.precio * .7;
  return game.investment(r, c) + c.precio * .6 + synergy + game.north(r, c).industriasExp * 300;
}
function plan(game, r, p) {
  const d = r.pendiente, safety = reserve(game, r, p), assets = game.assets(r, p);
  const action = (event, data = {}) => ({ event, data: { turnoId: r.turnoId, ...(d ? { decisionId: d.id } : {}), ...data } });
  if (d?.tipo === 'votacion') {
    // Remain independent: no alliances that can trap a practice match without an opponent.
    return d.elegibles.includes(p.id) && !Object.hasOwn(d.votos, p.id) ? action('responderVotoAlianza', { voto: false }) : null;
  }
  if (d?.tipo === 'comercio') {
    if (d.destinatarioId !== p.id) return null;
    const after = structuredClone(r);
    for (const name of d.entrego) game.transfer(after, game.sur(after, name), p.id);
    for (const name of d.recibo) game.transfer(after, game.sur(after, name), d.jugadorId);
    const worth = room => game.assets(room, p).reduce((sum, c) => sum + value(game, room, p, c), 0);
    const gain = worth(after) - worth(r) + d.pago - d.cobro;
    return action('responderComercio', { aceptar: gain >= 100 && p.dinero + d.pago - d.cobro >= safety });
  }
  if (d?.tipo === 'subasta') {
    if (game.sameTeam(p, game.player(r, d.jugadorId)) || d.oferta?.jugadorId === p.id) return null;
    const c = game.sur(r, d.nombrePropiedad), bid = d.oferta ? d.oferta.monto + 100 : d.base;
    return bid <= Math.min(p.dinero - safety, value(game, r, p, c)) ? action('pujarSubasta', { monto: bid }) : null;
  }
  if (r.jugadores[r.turnoActual]?.id !== p.id) return null;
  if (d && d.jugadorId !== p.id) return null;
  if (d?.tipo === 'pago') return action('responderDecisionPago', { usarOro: !!d.oroPermitido && p.oro > 0 && (d.monto >= 1800 || p.dinero - d.monto < safety / 2) });
  if (d?.tipo === 'fuga') return action('tirarDadoFuga');
  if (d?.tipo === 'eleccion') {
    let option;
    if(d.efecto === 'sandino') {
      const id=d.cartaId;
      const harmful = [1,7,11,15].includes(id) || [2,4].includes(id)&&p.deudaPersonal*.15>=1500 || id===3&&p.oro>0 || id===5&&p.dinero>=2500 || id===10&&p.deudaPersonal>=15000 || id===13&&assets.reduce((sum,c)=>sum+c.industriasNac*200+game.north(r,c).industriasExp*400,0)>=1500 || id===14 || id===16&&assets.some(c=>c.industriasNac>0);
      option=harmful?'usar':'guardar';
    }
    else if (d.efecto === 'pactoFmi') option = 'aceptar';
    else {
      const score = id => {
        const [name, type] = id.split(':'), c = game.sur(r, name);
        if (d.efecto === 'dumping') return -value(game, r, p, c);
        if (!type) return value(game, r, p, c) + game.info(c).nac[0];
        return type === 'exportacion' ? game.info(c).exp[game.north(r, c).industriasExp] + game.north(r, c).precio : game.info(c).nac[c.industriasNac] + c.precio;
      };
      option = [...d.opciones].sort((a, b) => score(b.id) - score(a.id))[0].id;
    }
    return action('resolverEleccion', { opcion: option });
  }
  if (d?.tipo === 'compra') {
    const c = game.sur(r, d.nombrePropiedad), strategic = value(game, r, p, c) > c.precio * 2;
    const buffer = strategic ? safety * .45 : safety * .7;
    const short = Math.ceil(c.precio + buffer - p.dinero);
    if (short > 0 && strategic && p.deudaPersonal + short < 10000 && short <= 2000) return action('pedirPrestamo', { monto: short });
    return action('decidirCompraPropiedad', { comprar: p.dinero >= c.precio + buffer });
  }
  if (!['tirada', 'gestion'].includes(r.fase)) return null;
  if (p.dinero < 0) {
    const borrower = game.team(r, p).find(q => q.deudaPersonal < 30000);
    if (borrower) return action('pedirPrestamo', { monto: Math.min(30000 - borrower.deudaPersonal, Math.ceil(-p.dinero + 500)) });
    if (assets.length) return action('subastarPropiedad', { nombrePropiedad: [...assets].sort((a,b) => value(game,r,p,a)-value(game,r,p,b))[0].nombre });
    return action(r.fase === 'tirada' ? 'tirarDado' : 'terminarTurno');
  }
  // Lower the number of dice when affordable, while preserving a cash buffer.
  const spare = Math.floor(p.dinero - safety);
  const thresholdPayment = p.deudaPersonal >= 20000 ? p.deudaPersonal - 19999 : p.deudaPersonal >= 10000 ? p.deudaPersonal - 9999 : 0;
  if (thresholdPayment && spare >= thresholdPayment) return action('pagarDeuda', { monto: Math.min(p.deudaPersonal, spare) });
  if (r.barreraProteccionista && !p.industriasCerradas && p.dinero >= safety + 2000) {
    const own = assets.reduce((sum,c) => sum + game.rent(r,game.north(r,c)),0);
    const rivals = r.jugadores.filter(q=>!game.sameTeam(p,q)&&!q.enQuiebra).map(q=>game.assets(r,q).reduce((sum,c)=>sum+game.rent(r,game.north(r,c)),0));
    if (own >= 3000 && own > Math.max(0,...rivals)) return action('levantarBarrera');
  }
  if (r.fase === 'tirada' || r.descuento) {
    const choices = [];
    for (const c of assets) for (const tipo of ['nacional', 'exportacion']) {
      const n = game.north(r,c), national = tipo === 'nacional', level = national ? c.industriasNac : n.industriasExp;
      if (level >= 3 || !national && level >= c.industriasNac) continue;
      const cost = Math.floor(game.info(c)[national?'nac':'exp'][level] * (r.descuento ? .5 : 1));
      const revenue = (national ? c.precio * 1.5 : n.precio * (r.barreraProteccionista ? .35 : 1.5));
      const score = revenue / cost + (national && level === 0 ? .35 : 0) + (value(game,r,p,c) > game.investment(r,c)+1000 ? .15 : 0);
      if (cost <= spare && (p.deudaPersonal < 10000 || score > .8)) choices.push({c,tipo,score});
    }
    choices.sort((a,b)=>b.score-a.score);
    if (choices.length) return action('construirIndustria', { nombrePropiedad:choices[0].c.nombre, tipo:choices[0].tipo });
  }
  if (p.deudaPersonal > 0 && spare >= 500) return action('pagarDeuda', { monto:Math.min(spare,p.deudaPersonal) });
  return action(r.fase === 'tirada' ? 'tirarDado' : 'terminarTurno');
}
module.exports = { plan, reserve, value };
