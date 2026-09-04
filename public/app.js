const socket = io();

// Generar o recuperar identificador único persistente para reconexión
let userId = localStorage.getItem('deuda_eterna_userid');
if (!userId) {
  userId = 'usr_' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('deuda_eterna_userid', userId);
}

const DATOS_PROPIEDADES = [
  { nombre: "Azúcar", terreno: 100, nac: [150, 200, 300], exp: [300, 400, 600], total: 2050 },
  { nombre: "Banano", terreno: 150, nac: [250, 300, 450], exp: [500, 600, 900], total: 3150 },
  { nombre: "Cacao", terreno: 200, nac: [300, 400, 600], exp: [600, 800, 1200], total: 4100 },
  { nombre: "Algodón", terreno: 250, nac: [350, 500, 750], exp: [750, 1000, 1500], total: 5100 },
  { nombre: "Tabaco", terreno: 300, nac: [450, 600, 900], exp: [900, 1200, 1800], total: 6150 },
  { nombre: "Café", terreno: 350, nac: [500, 700, 1050], exp: [1000, 1400, 2100], total: 7050 },
  { nombre: "Pesca", terreno: 400, nac: [600, 800, 1200], exp: [1200, 1600, 2400], total: 8200 },
  { nombre: "Ganado", terreno: 500, nac: [750, 1000, 1500], exp: [1500, 2000, 3000], total: 10250 },
  { nombre: "Cobre", terreno: 600, nac: [900, 1200, 1800], exp: [1800, 2400, 3600], total: 12300 },
  { nombre: "Estaño", terreno: 700, nac: [1050, 1400, 2100], exp: [2100, 2800, 4200], total: 14350 },
  { nombre: "Hierro", terreno: 800, nac: [1200, 1600, 2400], exp: [2400, 3200, 4800], total: 16400 },
  { nombre: "Petróleo", terreno: 1200, nac: [1800, 2400, 3600], exp: [3600, 4800, 7200], total: 24600 }
];

const pantallaLogin = document.getElementById('pantalla-login');
const pantallaJuego = document.getElementById('pantalla-juego');
const nombreInput = document.getElementById('nombre-input');
const btnUnirse = document.getElementById('btn-unirse');
const btnDado = document.getElementById('btn-dado');
const btnPedirPrestamo = document.getElementById('btn-pedir-prestamo');
const btnPagarDeuda = document.getElementById('btn-pagar-deuda');
const btnLevantarBarrera = document.getElementById('btn-levantar-barrera');

const infoTurno = document.getElementById('info-turno');
const listaJugadores = document.getElementById('lista-jugadores');
const logJuego = document.getElementById('log-juego');
const fichasContainer = document.getElementById('fichas-container');
const tableroContainer = document.getElementById('tablero');

const btnReglamento = document.getElementById('btn-reglamento');
const modalReglamento = document.getElementById('modal-reglamento');
const cerrarReglamento = document.getElementById('cerrar-reglamento');

const btnPropiedades = document.getElementById('btn-propiedades');
const modalCarta = document.getElementById('modal-carta');
const cerrarCarta = document.getElementById('cerrar-carta');
const modalMisPropiedades = document.getElementById('modal-mis-propiedades');
const cerrarMisPropiedades = document.getElementById('cerrar-mis-propiedades');
const listaMisPropiedades = document.getElementById('lista-mis-propiedades-container');

const modalAlianza = document.getElementById('modal-alianza');
const textoAlianza = document.getElementById('texto-alianza');
const btnUnirseAlianza = document.getElementById('btn-unirse-alianza');
const btnRechazarAlianza = document.getElementById('btn-rechazar-alianza');

const contenedorBotonesOferta = document.getElementById('contenedor-botones-oferta');
const btnOfertaComprar = document.getElementById('btn-oferta-comprar');
const btnOfertaPasar = document.getElementById('btn-oferta-pasar');

const contenedorBotonesConstruir = document.getElementById('contenedor-botones-construir');
const btnConstruirNac = document.getElementById('btn-construir-nac');
const btnConstruirExp = document.getElementById('btn-construir-exp');
const btnExpropiar = document.getElementById('btn-expropiar');
const btnSubastar = document.getElementById('btn-subastar');

const modalPagoOro = document.getElementById('modal-pago-oro');
const textoPagoOro = document.getElementById('texto-pago-oro');
const btnPagarEfectivo = document.getElementById('btn-pagar-efectivo');
const btnPagarOro = document.getElementById('btn-pagar-oro');

let miSocketId = null;
let stateGlobal = null;
let datosPagoPendiente = null;
let propiedadSeleccionadaActual = null;

socket.on('connect', () => {
  miSocketId = socket.id;
  const nombreGuardado = localStorage.getItem('deuda_eterna_nombre') || nombreInput.value.trim();
  if (nombreGuardado) {
    socket.emit('unirse', { nombre: nombreGuardado, userId: userId });
  }
});

btnUnirse.onclick = () => {
  const nombre = nombreInput.value.trim();
  if (nombre) {
    localStorage.setItem('deuda_eterna_nombre', nombre);
    socket.emit('unirse', { nombre: nombre, userId: userId });
    pantallaLogin.classList.add('oculto');
    pantallaJuego.classList.remove('oculto');
  }
};

btnDado.onclick = () => socket.emit('tirarDado');
btnPedirPrestamo.onclick = () => socket.emit('pedirPrestamo');
btnPagarDeuda.onclick = () => socket.emit('pagarDeuda');
if (btnLevantarBarrera) btnLevantarBarrera.onclick = () => socket.emit('levantarBarrera');

btnReglamento.onclick = () => modalReglamento.classList.remove('oculto');
cerrarReglamento.onclick = () => modalReglamento.classList.add('oculto');

if (btnPropiedades) {
  btnPropiedades.onclick = () => {
    listaMisPropiedades.innerHTML = '';
    const miJugador = stateGlobal?.jugadores.find(j => j.userId === userId || j.socketId === miSocketId);

    if (!miJugador || miJugador.propiedades.length === 0) {
      listaMisPropiedades.innerHTML = '<p style="color: #bbb;">No posees propiedades actualmente.</p>';
    } else {
      miJugador.propiedades.forEach(propName => {
        const btnProp = document.createElement('button');
        btnProp.innerText = propName;
        btnProp.style.margin = '5px 0';
        btnProp.style.backgroundColor = '#2c3e50';
        btnProp.onclick = () => verCartaPropiedad(propName, false, true);
        listaMisPropiedades.appendChild(btnProp);
      });
    }
    modalMisPropiedades.classList.remove('oculto');
  };
}

if (cerrarMisPropiedades) cerrarMisPropiedades.onclick = () => modalMisPropiedades.classList.add('oculto');
if (cerrarCarta) {
  cerrarCarta.onclick = () => {
    modalCarta.classList.add('oculto');
    contenedorBotonesOferta.classList.add('oculto');
    contenedorBotonesConstruir.classList.add('oculto');
  };
}

window.addEventListener('click', (e) => {
  if (e.target === modalReglamento) modalReglamento.classList.add('oculto');
  if (e.target === modalCarta) {
    modalCarta.classList.add('oculto');
    contenedorBotonesOferta.classList.add('oculto');
    contenedorBotonesConstruir.classList.add('oculto');
  }
  if (e.target === modalMisPropiedades) modalMisPropiedades.classList.add('oculto');
});

function verCartaPropiedad(nombre, esOferta = false, esMiPropiedad = false) {
  const info = DATOS_PROPIEDADES.find(p => p.nombre.toLowerCase() === nombre.toLowerCase());
  propiedadSeleccionadaActual = nombre;

  document.getElementById('modal-carta-titulo').innerText = `Propiedad: ${nombre}`;
  
  if (info) {
    const casillaSur = stateGlobal?.tablero.find(c => c.nombre.toLowerCase() === nombre.toLowerCase());
    const nacActuales = casillaSur ? (casillaSur.industriasNac || 0) : 0;
    const casillaNorte = stateGlobal?.tablero.find(c => c.baseSur && c.baseSur.toLowerCase() === nombre.toLowerCase());
    const expActuales = casillaNorte ? (casillaNorte.industriasExp || 0) : 0;

    document.getElementById('modal-carta-cuerpo').innerHTML = `
      <div style="text-align: left; font-size: 14px; line-height: 1.6;">
        <p><strong>Precio del Terreno:</strong> $${info.terreno}</p>
        <hr style="border: 1px solid #444;">
        <p><strong>Industrias Nacionales (Sur) - [Construidas: ${nacActuales}/3]:</strong></p>
        <ul>
          <li>1ª Industria: $${info.nac[0]}</li>
          <li>2ª Industria: $${info.nac[1]}</li>
          <li>3ª Industria: $${info.nac[2]}</li>
        </ul>
        <hr style="border: 1px solid #444;">
        <p><strong>Industrias de Exportación (Norte) - [Construidas: ${expActuales}/3]:</strong></p>
        <ul>
          <li>1ª Exportación: $${info.exp[0]}</li>
          <li>2ª Exportación: $${info.exp[1]}</li>
          <li>3ª Exportación: $${info.exp[2]}</li>
        </ul>
        <hr style="border: 1px solid #444;">
        <p style="color: #f1c40f;"><strong>Total Invertido Máximo:</strong> $${info.total.toLocaleString()}</p>
      </div>
    `;
  } else {
    document.getElementById('modal-carta-cuerpo').innerHTML = `<p>Detalles no disponibles para ${nombre}.</p>`;
  }

  if (esOferta) {
    contenedorBotonesOferta.classList.remove('oculto');
    contenedorBotonesConstruir.classList.add('oculto');
  } else if (esMiPropiedad && info) {
    contenedorBotonesOferta.classList.add('oculto');
    contenedorBotonesConstruir.classList.remove('oculto');
  } else {
    contenedorBotonesOferta.classList.add('oculto');
    contenedorBotonesConstruir.classList.add('oculto');
  }

  modalMisPropiedades.classList.add('oculto');
  modalCarta.classList.remove('oculto');
}

btnOfertaComprar.onclick = () => {
  socket.emit('decidirCompraPropiedad', true);
  modalCarta.classList.add('oculto');
  contenedorBotonesOferta.classList.add('oculto');
};

btnOfertaPasar.onclick = () => {
  socket.emit('decidirCompraPropiedad', false);
  modalCarta.classList.add('oculto');
  contenedorBotonesOferta.classList.add('oculto');
};

btnConstruirNac.onclick = () => {
  if (propiedadSeleccionadaActual) {
    socket.emit('construirIndustria', { nombrePropiedad: propiedadSeleccionadaActual, tipo: 'nacional' });
    modalCarta.classList.add('oculto');
    contenedorBotonesConstruir.classList.add('oculto');
  }
};

btnConstruirExp.onclick = () => {
  if (propiedadSeleccionadaActual) {
    socket.emit('construirIndustria', { nombrePropiedad: propiedadSeleccionadaActual, tipo: 'exportacion' });
    modalCarta.classList.add('oculto');
    contenedorBotonesConstruir.classList.add('oculto');
  }
};

btnExpropiar.onclick = () => {
  if (propiedadSeleccionadaActual) {
    socket.emit('expropiarPropiedad', { nombrePropiedad: propiedadSeleccionadaActual });
    modalCarta.classList.add('oculto');
    contenedorBotonesConstruir.classList.add('oculto');
  }
};

if (btnSubastar) {
  btnSubastar.onclick = () => {
    if (propiedadSeleccionadaActual) {
      socket.emit('subastarPropiedad', { nombrePropiedad: propiedadSeleccionadaActual });
      modalCarta.classList.add('oculto');
      contenedorBotonesConstruir.classList.add('oculto');
    }
  };
}

socket.on('solicitarVotacionAlianza', (data) => {
  textoAlianza.innerText = data.mensaje;
  modalAlianza.classList.remove('oculto');
});

btnUnirseAlianza.onclick = () => {
  socket.emit('responderVotoAlianza', true);
  modalAlianza.classList.add('oculto');
};

btnRechazarAlianza.onclick = () => {
  socket.emit('responderVotoAlianza', false);
  modalAlianza.classList.add('oculto');
};

socket.on('mostrarOfertaPropiedad', (nombrePropiedad) => verCartaPropiedad(nombrePropiedad, true, false));

socket.on('mostrarCartaModal', (data) => {
  contenedorBotonesOferta.classList.add('oculto');
  contenedorBotonesConstruir.classList.add('oculto');
  document.getElementById('modal-carta-titulo').innerText = data.titulo;
  document.getElementById('modal-carta-cuerpo').innerHTML = `
    <p style="font-size: 16px; line-height: 1.5; padding: 10px; background: #333; border-radius: 6px; border-left: 4px solid #f39c12;">
      ${data.texto}
    </p>
  `;
  modalCarta.classList.remove('oculto');
});

socket.on('solicitarDecisionPago', (data) => {
  datosPagoPendiente = data;
  textoPagoOro.innerText = `${data.motivo} - Monto: $${data.monto.toLocaleString()}`;
  
  const miJugador = stateGlobal?.jugadores.find(j => j.userId === userId || j.socketId === miSocketId);
  btnPagarOro.disabled = !miJugador || miJugador.oro <= 0;

  modalPagoOro.classList.remove('oculto');
});

btnPagarEfectivo.onclick = () => {
  if (datosPagoPendiente) {
    socket.emit('responderDecisionPago', { usarOro: false, ...datosPagoPendiente });
    modalPagoOro.classList.add('oculto');
  }
};

btnPagarOro.onclick = () => {
  if (datosPagoPendiente) {
    socket.emit('responderDecisionPago', { usarOro: true, ...datosPagoPendiente });
    modalPagoOro.classList.add('oculto');
  }
};

socket.on('actualizarEstado', (state) => {
  stateGlobal = state;

  const miJugadorActivo = state.jugadores ? state.jugadores.find(j => j.userId === userId || j.socketId === miSocketId) : null;
  if (miJugadorActivo) {
    pantallaLogin.classList.add('oculto');
    pantallaJuego.classList.remove('oculto');

    if (btnLevantarBarrera) {
      if (miJugadorActivo.barreraProteccionista) btnLevantarBarrera.classList.remove('oculto');
      else btnLevantarBarrera.classList.add('oculto');
    }
  }

  document.getElementById('deuda-fmi').innerText = `Deuda FMI: $${(state.deudaFMIGlobal || 500000).toLocaleString()}`;

  listaJugadores.innerHTML = '';
  if (state.jugadores) {
    state.jugadores.forEach(j => {
      let statusText = '';
      if (j.enQuiebra) statusText += ' 🚨[QUIEBRA]';
      if (j.resguardoGolpe) statusText += ' 🛡️Paraguay';
      if (j.resguardoFuga) statusText += ' 🇵🇦Panamá';
      if (j.sombreroSandino) statusText += ' 🤠Sandino';
      if (j.enAlianza) statusText += ' 🤝Alianza';
      if (j.deudaPersonal >= 30000) statusText += ' 🔨EMBARGO';

      const li = document.createElement('li');
      li.innerText = `${j.nombre} - Pos: ${j.posicion || 0} - $: $${(j.dinero || 0).toLocaleString()} - Deuda: $${(j.deudaPersonal || 0).toLocaleString()} - Oro: ${'🪙'.repeat(j.oro || 0)}${statusText}`;
      li.style.color = j.enQuiebra ? '#7f8c8d' : j.color;
      li.style.fontWeight = 'bold';
      if (j.enQuiebra) li.style.textDecoration = 'line-through';
      listaJugadores.appendChild(li);
    });
  }

  if (state.jugadores && state.jugadores.length > 0) {
    const jugadorActual = state.jugadores[state.turnoActual || 0];
    if (jugadorActual) {
      const esMiTurno = (jugadorActual.userId === userId || jugadorActual.socketId === miSocketId) && !jugadorActual.enQuiebra;
      infoTurno.innerText = `Turno de: ${jugadorActual.nombre}`;
      btnDado.disabled = !esMiTurno;
    }
  }

  fichasContainer.innerHTML = '';
  if (state.jugadores) {
    state.jugadores.forEach(j => {
      if (!j.enQuiebra) {
        const ficha = document.createElement('div');
        ficha.className = 'ficha';
        ficha.style.backgroundColor = j.color;
        
        const pos = calcularPosicionEnTablero(j.posicion || 0);
        ficha.style.left = `${pos.x}px`;
        ficha.style.top = `${pos.y}px`;

        fichasContainer.appendChild(ficha);
      }
    });
  }

  document.querySelectorAll('.indicador-construccion').forEach(el => el.remove());
  
  if (state.tablero) {
    state.tablero.forEach(casilla => {
      if (casilla.tipo === 'propiedad') {
        const pos = calcularPosicionEnTablero(casilla.id);

        if (casilla.region === 'sur' && casilla.industriasNac > 0) {
          const ind = document.createElement('div');
          ind.className = 'indicador-construccion indicador-nac';
          ind.innerText = `N:${casilla.industriasNac}`;
          ind.style.left = `${pos.x - 12}px`;
          ind.style.top = `${pos.y - 18}px`;
          tableroContainer.appendChild(ind);
        }

        if (casilla.region === 'norte' && casilla.industriasExp > 0) {
          const ind = document.createElement('div');
          ind.className = 'indicador-construccion indicador-exp';
          ind.innerText = `E:${casilla.industriasExp}`;
          ind.style.left = `${pos.x - 12}px`;
          ind.style.top = `${pos.y - 18}px`;
          tableroContainer.appendChild(ind);
        }
      }
    });
  }
});

socket.on('mensajeLog', (msg) => {
  const p = document.createElement('p');
  p.innerText = msg;
  p.style.margin = "3px 0";
  logJuego.appendChild(p);
  logJuego.scrollTop = logJuego.scrollHeight;
});

function calcularPosicionEnTablero(casilla) {
  const COORDENADAS = [
    { x: 725, y: 240 }, { x: 725, y: 270 }, { x: 700, y: 300 }, { x: 725, y: 330 }, { x: 700, y: 360 },
    { x: 725, y: 395 }, { x: 660, y: 445 }, { x: 595, y: 450 }, { x: 530, y: 450 }, { x: 465, y: 450 },
    { x: 400, y: 450 }, { x: 335, y: 450 }, { x: 270, y: 450 }, { x: 205, y: 450 }, { x: 120, y: 440 },
    { x: 75,  y: 395 }, { x: 100, y: 365 }, { x: 75,  y: 330 }, { x: 75,  y: 300 }, { x: 75,  y: 270 },
    { x: 75,  y: 240 }, { x: 75,  y: 205 }, { x: 75,  y: 175 }, { x: 75,  y: 140 }, { x: 75,  y: 110 },
    { x: 90,  y: 80 },  { x: 110, y: 45 },  { x: 210, y: 45 },  { x: 270, y: 45 },  { x: 330, y: 45 },
    { x: 390, y: 45 },  { x: 450, y: 45 },  { x: 510, y: 45 },  { x: 570, y: 45 },  { x: 660, y: 40 },
    { x: 725, y: 70 },  { x: 725, y: 110 }, { x: 725, y: 140 }, { x: 725, y: 175 }, { x: 725, y: 205 }
  ];

  const pos = parseInt(casilla, 10);
  return COORDENADAS[isNaN(pos) ? 0 : pos] || { x: 725, y: 240 };
}

document.querySelectorAll('.modal-contenido').forEach(modalContenido => {
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  modalContenido.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('cerrar') || e.target.tagName === 'BUTTON') return;

    isDragging = true;
    offsetX = e.clientX - modalContenido.offsetLeft;
    offsetY = e.clientY - modalContoffsetTop;
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;

    modalContenido.style.left = `${x}px`;
    modalContenido.style.top = `${y}px`;
    modalContenido.style.margin = '0';
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
});