'use strict';
const form = document.getElementById('entry-form'), nombre = document.getElementById('nombre'), codigo = document.getElementById('codigo');
const status = document.getElementById('entry-status'), cancel = document.getElementById('cancelar');
const gameUrl = document.body.dataset.gameUrl;
let sending = false, run = 0, lastWarm = 0;
try { nombre.value = localStorage.getItem('deuda_portada_nombre') || ''; } catch {}
async function ping() {
  const response = await fetch(new URL('health', gameUrl), { mode: 'cors', credentials: 'omit', cache: 'no-store', signal: AbortSignal.timeout(7000) });
  return response.ok && (await response.json()).ok === true;
}
function warm() {
  if (Date.now() - lastWarm < 30000) return;
  lastWarm = Date.now(); ping().catch(() => {});
}
form.addEventListener('focusin', warm);
codigo.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); form.requestSubmit(document.getElementById('unirse')); } });
function unlock() { sending = false; form.removeAttribute('aria-busy'); nombre.disabled = codigo.disabled = false; document.getElementById('crear').disabled = document.getElementById('unirse').disabled = false; cancel.hidden = true; }
cancel.onclick = () => { run++; unlock(); status.textContent = 'Conexión cancelada. Puedes volver a intentarlo.'; };
window.addEventListener('pageshow', () => { run++; unlock(); });
form.addEventListener('submit', async event => {
  event.preventDefault(); if (sending) return;
  const crear = event.submitter?.value !== 'unirse';
  const data = { nombre: nombre.value.trim(), crear, sala: crear ? Array.from(crypto.getRandomValues(new Uint8Array(4)), n => n.toString(16).padStart(2, '0')).join('').toUpperCase() : codigo.value.trim().toUpperCase() };
  if (!data.nombre) { nombre.focus(); status.textContent = 'Escribe tu nombre para entrar.'; return; }
  let destination;
  try { destination = GameEntry.build(gameUrl, data); }
  catch { status.textContent = 'Usa un nombre de hasta 40 caracteres y un código de 3 a 12 letras, números, guiones o guiones bajos.'; codigo.focus(); return; }
  try { localStorage.setItem('deuda_portada_nombre', data.nombre); } catch {}
  sending = true; const current = ++run, started = Date.now(); form.setAttribute('aria-busy', 'true');
  nombre.disabled = codigo.disabled = true;
  document.getElementById('crear').disabled = document.getElementById('unirse').disabled = true; cancel.hidden = false;
  status.textContent = 'Preparando la mesa… Estamos conectando con el servidor.';
  while (current === run && Date.now() - started < 100000) {
    let ready = false; try { ready = await ping(); } catch {}
    if (current !== run) return;
    if (ready) { status.textContent = 'Servidor listo. Entrando en la sala…'; window.location.assign(destination); return; }
    status.textContent = 'El servidor está despertando. Puedes esperar aquí; tardará alrededor de un minuto.';
    await new Promise(resolve => setTimeout(resolve, 3500));
  }
  if (current === run) { unlock(); status.textContent = 'El servidor sigue sin responder. Inténtalo de nuevo o usa «Volver a mi partida» para abrir el juego directamente.'; }
});
