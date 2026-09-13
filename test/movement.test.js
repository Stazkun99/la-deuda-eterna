'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require.resolve('../public/app.js'), 'utf8');
function fixture() {
  const steps = [], animations = [], nodes = [];
  const player = { id: 'p1', posicion: 32, color: '#123456' };
  const run = { playerId: 'p1', position: 38, total: 4 };
  const context = { state: { jugadores: [player] }, movement: run, flushed: 0,
    setTimeout: fn => { fn(); },
    $: () => ({ append() {}, getBoundingClientRect: () => ({ left: 0, top: 0 }) }),
    cells: new Map(Array.from({ length: 40 }, (_, id) => [id, { getBoundingClientRect: () => ({ left: id * 10, top: 0, width: 10, height: 10 }) }])),
    element: () => { const node = { style: { setProperty() {} }, setAttribute() {}, offsetWidth: 10, offsetHeight: 10,
      remove() { this.removed = true; },
      animate(frames) { let resolve, reject; const finished = new Promise((a,b) => { resolve=a; reject=b; });
        const animation = { finished, resolve, cancel: () => reject(new Error('cancelled')), frames }; animations.push(animation); return animation; }
    }; nodes.push(node); return node; },
    renderBoard: () => steps.push(context.movement?.position), updateControls() {},
    flushLanding: () => context.flushed++
  };
  vm.createContext(context);
  vm.runInContext(source.slice(source.indexOf('function cancelMovement()'), source.indexOf("document.addEventListener('visibilitychange'")), context);
  return { context, run, player, steps, animations, nodes };
}
test('animación cruza 39 → 0 y espera cada paso antes de mostrar decisiones sin alterar estado real', async () => {
  const { context, run, player, steps, animations, nodes } = fixture();
  const done = context.movePiece(run); await new Promise(resolve => setImmediate(resolve));
  assert.equal(context.flushed, 0);
  for (let i=0;i<4;i++) { assert.equal(animations.length,i+1); animations[i].resolve(); await new Promise(resolve => setImmediate(resolve)); }
  await done;
  assert.deepEqual(steps.slice(0,5), [38,39,0,1,2]);
  assert.equal(player.posicion,32); // A card may have already changed the authoritative destination.
  assert.equal(context.flushed,1); assert.equal(context.movement,null); assert.ok(nodes[0].removed);
});
test('cancelar movimiento elimina ficha flotante y no continúa un recorrido antiguo', async () => {
  const { context, run, animations, nodes } = fixture();
  const done = context.movePiece(run); await new Promise(resolve => setImmediate(resolve));
  context.cancelMovement(); await done;
  assert.equal(animations.length,1); assert.equal(context.movement,null);
  assert.ok(nodes[0].removed); assert.equal(context.flushed,0);
});

