const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const { CARTAS_CONDICIONES, CARTAS_SOLIDARIDAD, CARTAS_PROPIEDADES } = require('./cartas');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

const GRUPOS_CADENAS = {
  cafe_agricola: [1, 2, 3],
  textil_agricola: [5, 6, 7],
  ganaderia_pesca: [9, 11],
  mineria: [13, 14, 15],
  energia: [17]
};

const TABLERO = [
  { id: 0, nombre: "América Latina (SALIDA)", tipo: "inicio" },
  { id: 1, nombre: "Azúcar", tipo: "propiedad", region: "sur", grupo: "cafe_agricola", precio: 100, renta: 20, dueño: null, industriasNac: 0, industriasExp: 0 },
  { id: 2, nombre: "Banano", tipo: "propiedad", region: "sur", grupo: "cafe_agricola", precio: 150, renta: 30, dueño: null, industriasNac: 0, industriasExp: 0 },
  { id: 3, nombre: "Cacao", tipo: "propiedad", region: "sur", grupo: "cafe_agricola", precio: 200, renta: 40, dueño: null, industriasNac: 0, industriasExp: 0 },
  { id: 4, nombre: "Solidaridad", tipo: "evento" },
  { id: 5, nombre: "Algodón", tipo: "propiedad", region: "sur", grupo: "textil_agricola", precio: 250, renta: 50, dueño: null, industriasNac: 0, industriasExp: 0 },
  { id: 6, nombre: "Tabaco", tipo: "propiedad", region: "sur", grupo: "textil_agricola", precio: 300, renta: 60, dueño: null, industriasNac: 0, industriasExp: 0 },
  { id: 7, nombre: "Café", tipo: "propiedad", region: "sur", grupo: "textil_agricola", precio: 350, renta: 70, dueño: null, industriasNac: 0, industriasExp: 0 },
  { id: 8, nombre: "Condiciones FMI", tipo: "evento" },
  { id: 9, nombre: "Pesca", tipo: "propiedad", region: "sur", grupo: "ganaderia_pesca", precio: 400, renta: 80, dueño: null, industriasNac: 0, industriasExp: 0 },
  { id: 10, nombre: "Ayuda Solidaria", tipo: "evento" },
  { id: 11, nombre: "Ganado", tipo: "propiedad", region: "sur", grupo: "ganaderia_pesca", precio: 500, renta: 100, dueño: null, industriasNac: 0, industriasExp: 0 },
  { id: 12, nombre: "Fuga de Capitales", tipo: "fmi_cobro", monto: 1000 },
  { id: 13, nombre: "Cobre", tipo: "propiedad", region: "sur", grupo: "mineria", precio: 600, renta: 120, dueño: null, industriasNac: 0, industriasExp: 0 },
  { id: 14, nombre: "Estaño", tipo: "propiedad", region: "sur", grupo: "mineria", precio: 700, renta: 140, dueño: null, industriasNac: 0, industriasExp: 0 },
  { id: 15, nombre: "Hierro", tipo: "propiedad", region: "sur", grupo: "mineria", precio: 800, renta: 160, dueño: null, industriasNac: 0, industriasExp: 0 },
  { id: 16, nombre: "Solidaridad", tipo: "evento" },
  { id: 17, nombre: "Petróleo", tipo: "propiedad", region: "sur", grupo: "energia", precio: 1200, renta: 240, dueño: null, industriasNac: 0, industriasExp: 0 },
  { id: 18, nombre: "Golpe Militar", tipo: "castigo" },
  { id: 19, nombre: "Condiciones FMI", tipo: "evento" },
  { id: 20, nombre: "Barrera Proteccionista", tipo: "fmi_cobro", monto: 1500 },
  { id: 21, nombre: "Caramelos", tipo: "propiedad", region: "norte", baseSur: "Azúcar", precio: 200, renta: 40, dueño: null, industriasExp: 0 },
  { id: 22, nombre: "Mermelada", tipo: "propiedad", region: "norte", baseSur: "Banano", precio: 300, renta: 60, dueño: null, industriasExp: 0 },
  { id: 23, nombre: "Chocolate", tipo: "propiedad", region: "norte", baseSur: "Cacao", precio: 400, renta: 80, dueño: null, industriasExp: 0 },
  { id: 24, nombre: "Nacionalización", tipo: "evento" },
  { id: 25, nombre: "Ropa", tipo: "propiedad", region: "norte", baseSur: "Algodón", precio: 500, renta: 100, dueño: null, industriasExp: 0 },
  { id: 26, nombre: "Cigarrillos", tipo: "propiedad", region: "norte", baseSur: "Tabaco", precio: 600, renta: 120, dueño: null, industriasExp: 0 },
  { id: 27, nombre: "Café Elaborado", tipo: "propiedad", region: "norte", baseSur: "Café", precio: 700, renta: 140, dueño: null, industriasExp: 0 },
  { id: 28, nombre: "Condiciones FMI", tipo: "evento" },
  { id: 29, nombre: "Enlatados", tipo: "propiedad", region: "norte", baseSur: "Pesca", precio: 800, renta: 160, dueño: null, industriasExp: 0 },
  { id: 30, nombre: "Ayuda USA", tipo: "evento" },
  { id: 31, nombre: "Zapatos", tipo: "propiedad", region: "norte", baseSur: "Ganado", precio: 1000, renta: 200, dueño: null, industriasExp: 0 },
  { id: 32, nombre: "12 Octubre 1492", tipo: "evento" },
  { id: 33, nombre: "Cables", tipo: "propiedad", region: "norte", baseSur: "Estaño", precio: 1200, renta: 240, dueño: null, industriasExp: 0 },
  { id: 34, nombre: "Electrónica", tipo: "propiedad", region: "norte", baseSur: "Estaño", precio: 1400, renta: 280, dueño: null, industriasExp: 0 },
  { id: 35, nombre: "Tractores", tipo: "propiedad", region: "norte", baseSur: "Hierro", precio: 1600, renta: 320, dueño: null, industriasExp: 0 },
  { id: 36, nombre: "Solidaridad", tipo: "evento" },
  { id: 37, nombre: "Gasolina", tipo: "propiedad", region: "norte", baseSur: "Petróleo", precio: 2400, renta: 480, dueño: null, industriasExp: 0 },
  { id: 38, nombre: "No Pagar", tipo: "evento" },
  { id: 39, nombre: "Sede FMI", tipo: "fmi_cobro", monto: 2000 }
];

const COLORES = ['#E74C3C', '#2ECC71', '#3498DB', '#F1C40F'];
let salas = {};

function crearNuevaSala(codigoSala) {
  salas[codigoSala] = {
    codigo: codigoSala,
    enJuego: false,
    deudaFMIGlobal: 500000,
    turnoActual: 0,
    votosPendientes: 0,
    jugadores: [],
    tablero: JSON.parse(JSON.stringify(TABLERO))
  };
}

function pasarSiguienteTurno(room) {
  const gameState = salas[room];
  if (gameState && gameState.jugadores.length > 0) {
    let intentos = 0;
    do {
      gameState.turnoActual = (gameState.turnoActual + 1) % gameState.jugadores.length;
      intentos++;
    } while (gameState.jugadores[gameState.turnoActual]?.enQuiebra && intentos < gameState.jugadores.length);
  }
}

function calcularRentaCasilla(gameState, casilla) {
  let rentaTotal = casilla.renta;
  const infoCarta = CARTAS_PROPIEDADES.find(p => p.nombre.toLowerCase() === casilla.nombre.toLowerCase() || (casilla.baseSur && p.nombre.toLowerCase() === casilla.baseSur.toLowerCase()));

  if (!infoCarta) return rentaTotal;

  if (casilla.region === 'sur') {
    const idsGrupo = GRUPOS_CADENAS[casilla.grupo] || [];
    const tieneCadenaCompleta = idsGrupo.every(id => {
      const c = gameState.tablero[id];
      return c && c.dueño === casilla.dueño && c.industriasNac > 0;
    });

    if (tieneCadenaCompleta) {
      rentaTotal = 0;
      idsGrupo.forEach(id => {
        const c = gameState.tablero[id];
        const infoC = CARTAS_PROPIEDADES.find(p => p.nombre.toLowerCase() === c.nombre.toLowerCase());
        rentaTotal += c.renta + (infoC ? infoC.nac[c.industriasNac - 1] : 0);
      });
    } else if (casilla.industriasNac > 0) {
      rentaTotal += infoCarta.nac[casilla.industriasNac - 1];
    }
  } else if (casilla.region === 'norte' && casilla.industriasExp > 0) {
    rentaTotal += infoCarta.exp[casilla.industriasExp - 1];
  }

  return rentaTotal;
}

function finalizarJuego(room, ganadorNombre, motivo) {
  const gameState = salas[room];
  if (!gameState) return;

  gameState.enJuego = false;
  io.to(room).emit('mensajeLog', `🏆 ¡FIN DEL JUEGO! ${ganadorNombre} ha ganado. Motivo: ${motivo}`);
  io.to(room).emit('finDeJuegoModal', { ganador: ganadorNombre, motivo: motivo });
  io.to(room).emit('actualizarEstado', gameState);
}

function verificarCondicionVictoria(room) {
  const gameState = salas[room];
  if (!gameState) return;

  const activos = gameState.jugadores.filter(j => !j.enQuiebra);

  if (activos.length === 1 && gameState.jugadores.length > 1) {
    finalizarJuego(room, activos[0].nombre, "Único sobreviviente financiero ante la quiebra de los rivales.");
    return;
  }

  gameState.jugadores.forEach(j => {
    const propsSur = gameState.tablero.filter(c => c.region === 'sur' && c.dueño === j.id && c.industriasNac >= 3);
    const propsNorte = gameState.tablero.filter(c => c.region === 'norte' && c.dueño === j.id && c.industriasExp >= 3);

    if (propsSur.length === 12 && propsNorte.length === 12) {
      finalizarJuego(room, j.nombre, "Control absoluto del mercado (12 industrias en el Sur y 12 en el Norte).");
    }
  });
}

function iniciarVotacionAlianza(room, mensaje) {
  const gameState = salas[room];
  if (!gameState) return;

  gameState.votosPendientes = gameState.jugadores.filter(j => !j.enQuiebra).length;
  gameState.jugadores.forEach(j => j.votoAlianza = null);
  io.to(room).emit('solicitarVotacionAlianza', { mensaje });
}

function procesarFusionAlianza(room) {
  const gameState = salas[room];
  if (!gameState) return;

  const miembros = gameState.jugadores.filter(j => j.votoAlianza === true && !j.enQuiebra);

  if (miembros.length >= 2) {
    const totalEfectivo = miembros.reduce((acc, j) => acc + (j.dinero || 0), 0);
    const totalDeuda = miembros.reduce((acc, j) => acc + (j.deudaPersonal || 0), 0);

    let todasPropiedades = [];
    miembros.forEach(j => {
      if (j.propiedades) todasPropiedades = todasPropiedades.concat(j.propiedades);
    });
    todasPropiedades = [...new Set(todasPropiedades)];

    miembros.forEach(j => {
      j.dinero = totalEfectivo;
      j.deudaPersonal = totalDeuda;
      j.propiedades = [...todasPropiedades];
      j.enAlianza = true;
    });

    const idLiderAlianza = miembros[0].id;
    gameState.tablero.forEach(casilla => {
      if (casilla.dueño !== null && miembros.some(m => m.id === casilla.dueño)) {
        casilla.dueño = idLiderAlianza;
      }
    });

    io.to(room).emit('mensajeLog', `¡ALIANZA CONSTITUIDA! Efectivo ($${totalEfectivo.toLocaleString()}), deudas y propiedades unificados.`);
  } else {
    io.to(room).emit('mensajeLog', `La propuesta de Alianza no prosperó.`);
  }
}

function aplicarEfectoSolidaridad(room, jugador, carta) {
  const gameState = salas[room];
  if (!carta || !gameState) return;

  switch (carta.id) {
    case 1: jugador.posicion = 24; break;
    case 2: jugador.dinero += 2600; break;
    case 3: jugador.posicion = 10; break;
    case 4:
      gameState.jugadores.forEach(j => j.sombreroSandino = true);
      break;
    case 5: jugador.dinero += 3400; break;
    case 6: jugador.dinero += 2800; break;
    case 7: jugador.dinero += 3000; break;
    case 8: jugador.dinero += 4000; break;
    case 9: jugador.resguardoGolpe = true; break;
    case 10: jugador.posicion = 10; break;
    case 11: gameState.jugadores.forEach(j => j.dinero += 2000); break;
    case 12: jugador.dinero += 2200; break;
    case 13: jugador.dinero += 3600; break;
    case 14: jugador.dinero += 3200; break;
    case 15: jugador.dinero += 2000; break;
    case 16: jugador.oro = 3; break;
    case 17: jugador.dinero += 3800; break;
    case 18:
      gameState.jugadores.forEach(j => j.posicion = 0);
      iniciarVotacionAlianza(room, `${jugador.nombre} sacó la tarjeta de Cuba. ¡Invita a consolidar la Alianza!`);
      break;
    case 19:
      const casillaPetroleo = gameState.tablero.find(c => c.nombre.toLowerCase() === 'petróleo');
      if (casillaPetroleo && casillaPetroleo.dueño !== null) {
        const dueñoPetroleo = gameState.jugadores.find(j => j.id === casillaPetroleo.dueño);
        if (dueñoPetroleo && casillaPetroleo.industriasNac < 3) {
          casillaPetroleo.industriasNac++;
          io.to(room).emit('mensajeLog', `🇻🇪 Venezuela regala 1 Industria Nacional al dueño del Petróleo (${dueñoPetroleo.nombre}).`);
        }
      }
      break;
    case 20: jugador.resguardoFuga = true; break;
  }
}

function aplicarEfectoCondiciones(room, jugador, carta) {
  const gameState = salas[room];
  if (!carta || !gameState) return;

  if (jugador.sombreroSandino) {
    io.to(room).emit('mensajeLog', `${jugador.nombre} utilizó la protección del Sombrero de Sandino 🤠 y neutralizó la sanción del FMI.`);
    return;
  }

  switch (carta.id) {
    case 1:
      let posAux = (jugador.posicion + 1) % 40;
      while (gameState.tablero[posAux].region !== 'norte') {
        posAux = (posAux + 1) % 40;
      }
      jugador.posicion = posAux;
      break;
    case 2:
    case 4:
      jugador.posicion = 39;
      jugador.dinero -= 1500;
      gameState.deudaFMIGlobal += 1500;
      break;
    case 3:
      jugador.posicion = 32;
      jugador.oro = 0;
      break;
    case 5: jugador.dinero = Math.floor(jugador.dinero / 2); break;
    case 7: jugador.turnosPerdidos = 2; break;
    case 8: jugador.dinero -= 100; gameState.deudaFMIGlobal += 100; break;
    case 9: jugador.dinero -= 1000; gameState.deudaFMIGlobal += 1000; break;
    case 10: jugador.posicion = 39; break;
    case 13:
      let cobroPatentes = 0;
      gameState.tablero.forEach(c => {
        if (c.dueño === jugador.id) {
          if (c.region === 'sur') cobroPatentes += (c.industriasNac * 200);
          if (c.region === 'norte') cobroPatentes += (c.industriasExp * 400);
        }
      });
      jugador.dinero -= cobroPatentes;
      gameState.deudaFMIGlobal += cobroPatentes;
      io.to(room).emit('mensajeLog', `${jugador.nombre} pagó $${cobroPatentes} al FMI por concepto de Patentes.`);
      break;
    case 14: jugador.dinero -= 1500; gameState.deudaFMIGlobal += 1500; break;
    case 17:
      gameState.jugadores.forEach(j => {
        j.dinero -= 750;
        gameState.deudaFMIGlobal += 750;
      });
      break;
  }
}

function sincronizarRecursosAlianza(gameState, jugador) {
  if (jugador && jugador.enAlianza) {
    const aliados = gameState.jugadores.filter(j => j.enAlianza);
    aliados.forEach(a => {
      a.dinero = jugador.dinero;
      a.deudaPersonal = jugador.deudaPersonal;
      a.propiedades = [...jugador.propiedades];
    });
  }
}

io.on('connection', (socket) => {
  let miRoom = null;

  socket.on('unirseSala', ({ nombre, userId, sala }) => {
    const codigo = (sala || 'GLOBAL').toUpperCase().trim();
    if (!salas[codigo]) crearNuevaSala(codigo);

    const gameState = salas[codigo];

    if (gameState.enJuego) {
      const jExistente = gameState.jugadores.find(j => j.userId === userId);
      if (!jExistente) {
        socket.emit('errorAcceso', 'La partida ya comenzó. No puedes unirte como nuevo jugador.');
        return;
      }
    }

    if (!gameState.enJuego && gameState.jugadores.length >= 4) {
      const jExistente = gameState.jugadores.find(j => j.userId === userId);
      if (!jExistente) {
        socket.emit('errorAcceso', 'La sala está llena (máximo 4 jugadores).');
        return;
      }
    }

    miRoom = codigo;
    socket.join(codigo);

    let jugador = gameState.jugadores.find(j => j.userId === userId);

    if (jugador) {
      jugador.socketId = socket.id;
      if (nombre) jugador.nombre = nombre;
      io.to(codigo).emit('mensajeLog', `🔄 ${jugador.nombre} se reconectó a la sala [${codigo}].`);
    } else {
      jugador = {
        id: gameState.jugadores.length,
        userId: userId,
        socketId: socket.id,
        nombre: nombre || `Jugador ${gameState.jugadores.length + 1}`,
        posicion: 0,
        dinero: 0,
        deudaPersonal: 0,
        oro: 3,
        color: COLORES[gameState.jugadores.length],
        propiedades: [],
        resguardoGolpe: false,
        resguardoFuga: false,
        sombreroSandino: false,
        enAlianza: false,
        votoAlianza: null,
        noPagarVuelta: false,
        barreraProteccionista: false,
        turnosPerdidos: 0,
        enQuiebra: false,
        esLider: gameState.jugadores.length === 0
      };
      gameState.jugadores.push(jugador);
      io.to(codigo).emit('mensajeLog', `👋 ${jugador.nombre} se unió a la sala [${codigo}].`);
    }

    io.to(codigo).emit('actualizarEstado', gameState);
  });

  socket.on('enviarMensajeChat', (mensaje) => {
    if (miRoom && salas[miRoom] && mensaje.trim()) {
      const gameState = salas[miRoom];
      const jugador = gameState.jugadores.find(j => j.socketId === socket.id);
      if (jugador) {
        io.to(miRoom).emit('nuevoMensajeChat', {
          nombre: jugador.nombre,
          color: jugador.color,
          texto: mensaje.trim()
        });
      }
    }
  });

  socket.on('iniciarPartida', () => {
    const gameState = salas[miRoom];
    if (!gameState) return;

    const jugador = gameState.jugadores.find(j => j.socketId === socket.id);
    if (jugador && jugador.esLider && !gameState.enJuego) {
      gameState.enJuego = true;
      gameState.deudaFMIGlobal = 500000;

      gameState.jugadores.forEach(j => {
        const tiradaInicial = Math.floor(Math.random() * 6) + 1;
        j.dinero = 5000 + (tiradaInicial * 1000);
        j.deudaPersonal = 0;
        j.enQuiebra = false;
      });

      io.to(miRoom).emit('mensajeLog', `🚀 ¡EL ANFITRIÓN HA INICIADO LA PARTIDA EN LA SALA [${miRoom}]!`);
      io.to(miRoom).emit('actualizarEstado', gameState);
    }
  });

  socket.on('pedirPrestamo', () => {
    const gameState = salas[miRoom];
    if (!gameState || !gameState.enJuego) return;

    const jugador = gameState.jugadores.find(j => j.socketId === socket.id);
    if (jugador && jugador.deudaPersonal < 30000) {
      jugador.dinero += 5000;
      jugador.deudaPersonal += 5000;
      gameState.deudaFMIGlobal += 5000; // FIX: Al pedir préstamo, la deuda FMI global TAMBIÉN AUMENTA.
      
      sincronizarRecursosAlianza(gameState, jugador);
      io.to(miRoom).emit('mensajeLog', `${jugador.nombre} solicitó un préstamo de $5,000 al FMI (Deuda acumulada: $${jugador.deudaPersonal}).`);

      if (jugador.deudaPersonal >= 30000) {
        io.to(miRoom).emit('mensajeLog', `⚠️ ATENCIÓN: ${jugador.nombre} ha alcanzado el límite de $30,000 y ha entrado en EMBARGO FMI.`);
      }

      io.to(miRoom).emit('actualizarEstado', gameState);
    }
  });

  socket.on('pagarDeuda', () => {
    const gameState = salas[miRoom];
    if (!gameState || !gameState.enJuego) return;

    const jugador = gameState.jugadores.find(j => j.socketId === socket.id);
    const montoCuota = 5000;
    const interesFijo = 500; // 10% de interés administrativo
    const costoTotal = montoCuota + interesFijo;

    if (jugador && jugador.deudaPersonal > 0) {
      if (jugador.dinero >= costoTotal) {
        jugador.dinero -= costoTotal;
        jugador.deudaPersonal -= montoCuota;
        gameState.deudaFMIGlobal -= montoCuota; // Se reduce el capital neto amortizado

        sincronizarRecursosAlianza(gameState, jugador);
        
        io.to(miRoom).emit('mensajeLog', `💳 ${jugador.nombre} amortizó $${montoCuota.toLocaleString()} de su deuda al FMI (Pagó $${costoTotal.toLocaleString()} incluyendo $${interesFijo} de interés).`);

        if (gameState.deudaFMIGlobal <= 0) {
          gameState.deudaFMIGlobal = 0;
          finalizarJuego(miRoom, jugador.nombre, "Ha cancelado completamente la Deuda Eterna del FMI.");
          return;
        }

        io.to(miRoom).emit('actualizarEstado', gameState);
      } else {
        io.to(miRoom).emit('mensajeLog', `⚠️ ${jugador.nombre} necesita $${costoTotal.toLocaleString()} ($5,000 cuota + $500 interés) para abonar a la deuda.`);
      }
    }
  });

  socket.on('tirarDado', () => {
    const gameState = salas[miRoom];
    if (!gameState || !gameState.enJuego) return;

    const jugadorIndex = gameState.jugadores.findIndex(j => j.socketId === socket.id);

    if (jugadorIndex !== -1 && jugadorIndex === gameState.turnoActual) {
      const jugador = gameState.jugadores[jugadorIndex];

      if (jugador.enQuiebra) {
        pasarSiguienteTurno(miRoom);
        io.to(miRoom).emit('actualizarEstado', gameState);
        return;
      }

      if (jugador.turnosPerdidos > 0) {
        jugador.turnosPerdidos--;
        io.to(miRoom).emit('mensajeLog', `${jugador.nombre} está desempleado y pierde este turno.`);
        pasarSiguienteTurno(miRoom);
        io.to(miRoom).emit('actualizarEstado', gameState);
        return;
      }

      let numDados = 1;
      if (jugador.deudaPersonal >= 20000) numDados = 4;
      else if (jugador.deudaPersonal >= 10000) numDados = 3;

      let sumaDado = 0;
      for (let i = 0; i < numDados; i++) {
        sumaDado += Math.floor(Math.random() * 6) + 1;
      }

      const prevPos = jugador.posicion || 0;
      const nuevaPos = (prevPos + sumaDado) % 40;
      jugador.posicion = nuevaPos;

      let logMsg = `${jugador.nombre} tiró ${numDados} dado(s), sacó ${sumaDado} y cayó en ${gameState.tablero[nuevaPos].nombre}.`;

      if (nuevaPos < prevPos) {
        if (!jugador.noPagarVuelta) {
          const intereses = Math.floor(jugador.deudaPersonal * 0.10);
          if (intereses >= 50) {
            if (jugador.dinero >= intereses) {
              jugador.dinero -= intereses;
              gameState.deudaFMIGlobal += intereses;
              logMsg += ` Pagó $${intereses} de intereses (10%) al pasar por la Salida.`;
            } else {
              logMsg += ` ¡No pudo cubrir los $${intereses} de intereses al pasar por la Salida!`;
            }
          }
        } else {
          jugador.noPagarVuelta = false;
          logMsg += ` ¡Eximido de pagar intereses en esta vuelta!`;
        }
      }

      const casilla = gameState.tablero[nuevaPos];
      let requiereDecision = false;

      if (nuevaPos === 0) {
        iniciarVotacionAlianza(miRoom, `${jugador.nombre} cayó en América Latina. Se propone la Alianza Latinoamericana.`);
      }

      if (casilla.nombre === 'Golpe Militar') {
        if (jugador.resguardoGolpe) {
          jugador.resguardoGolpe = false;
          logMsg += ` Usó su Resguardo de Paraguay 🛡️ y no perdió dinero.`;
        } else {
          gameState.deudaFMIGlobal += jugador.dinero;
          jugador.dinero = 0;
          logMsg += ` ¡Golpe Militar! Entregó todo su dinero al FMI.`;
        }
      } else if (casilla.nombre === '12 Octubre 1492') {
        if (jugador.oro > 0) {
          jugador.oro--;
          logMsg += ` ⛵ 12 de Octubre 1492: El FMI/Saqueo colonial te despojó de 1 Lingote de Oro 🪙.`;
        } else {
          logMsg += ` ⛵ 12 de Octubre 1492: No posees lingotes de oro para despojar.`;
        }
      } else if (casilla.nombre === 'Ayuda USA') {
        const subsidioUSA = 3000;
        jugador.dinero += subsidioUSA;
        logMsg += ` 💵 Ayuda USA para el Desarrollo: Recibes un subsidio internacional de $${subsidioUSA}.`;
      } else if (casilla.nombre === 'Nacionalización') {
        const subsidioNac = 2000;
        jugador.dinero += subsidioNac;
        logMsg += ` 🏛️ Nacionalización: Subsidio estatal para el desarrollo industrial de $${subsidioNac}.`;
      } else if (casilla.nombre === 'Ayuda Solidaria') {
        logMsg += ` 🤝 Ayuda Solidaria: ¡50% de descuento en construcciones durante este turno!`;
      } else if (casilla.nombre === 'Fuga de Capitales') {
        if (jugador.resguardoFuga) {
          jugador.resguardoFuga = false;
          logMsg += ` Usó su Resguardo de Panamá 🇵🇦 y no pagó nada.`;
        } else {
          const multa = sumaDado * 1000;
          jugador.dinero -= multa;
          gameState.deudaFMIGlobal += multa;
          logMsg += ` Fuga de Capitales: Paga $${multa} al FMI.`;
        }
      } else if (casilla.nombre === 'Barrera Proteccionista') {
        jugador.barreraProteccionista = true;
        logMsg += ` Barrera Proteccionista activada.`;
      } else if (casilla.nombre === 'No Pagar') {
        jugador.noPagarVuelta = true;
        logMsg += ` ¡Inmunidad de intereses FMI obtenida!`;
      } else if (casilla.tipo === 'fmi_cobro') {
        if (jugador.oro > 0) {
          requiereDecision = true;
          io.to(jugador.socketId).emit('solicitarDecisionPago', {
            tipo: 'fmi',
            monto: casilla.monto,
            motivo: `Cobro de ${casilla.nombre}`
          });
        } else {
          jugador.dinero -= casilla.monto;
          gameState.deudaFMIGlobal += casilla.monto;
          logMsg += ` ¡El FMI le cobró $${casilla.monto}!`;
        }
      } else if (casilla.tipo === 'propiedad') {
        if (casilla.region === 'sur' && casilla.dueño === null) {
          requiereDecision = true;
          io.to(jugador.socketId).emit('mostrarOfertaPropiedad', casilla.nombre);
        } else if (casilla.region === 'sur' && (casilla.dueño === jugador.id || (jugador.enAlianza && gameState.jugadores[casilla.dueño]?.enAlianza))) {
          if (casilla.industriasNac === 0) {
            jugador.dinero += casilla.precio;
            logMsg += ` ¡Cobró del FMI $${casilla.precio} por su materia prima (${casilla.nombre})!`;
          }
        } else if (casilla.dueño !== null) {
          const dueño = gameState.jugadores[casilla.dueño];
          const rentaCalculada = calcularRentaCasilla(gameState, casilla);

          const esMiembroAlianza = jugador.enAlianza && dueño && dueño.enAlianza;
          const poseeBaseEnSur = gameState.tablero.some(c => c.region === 'sur' && c.nombre.toLowerCase() === (casilla.baseSur || '').toLowerCase() && (c.dueño === jugador.id || (jugador.enAlianza && gameState.jugadores[c.dueño]?.enAlianza)));

          if (casilla.dueño === jugador.id || esMiembroAlianza || poseeBaseEnSur) {
            if (poseeBaseEnSur && casilla.dueño !== jugador.id && !esMiembroAlianza) {
              logMsg += ` Posee la materia prima (${casilla.baseSur}) en el Sur: Eximido de pagar en ${casilla.nombre}.`;
            } else if (esMiembroAlianza && casilla.dueño !== jugador.id) {
              logMsg += ` En Alianza con ${dueño ? dueño.nombre : 'aliado'}: Uso compartido sin costo de renta.`;
            } else if (casilla.region === 'norte' && casilla.industriasExp > 0) {
              if (jugador.barreraProteccionista) {
                logMsg += ` Multinacional bloqueada por Barrera Proteccionista.`;
              } else {
                jugador.dinero += rentaCalculada;
                logMsg += ` ¡El FMI le pagó $${rentaCalculada} por su exportación!`;
              }
            }
          } else {
            if (casilla.region === 'norte' && jugador.oro > 0) {
              requiereDecision = true;
              io.to(jugador.socketId).emit('solicitarDecisionPago', {
                tipo: 'renta_norte',
                monto: rentaCalculada,
                dueñoId: dueño ? dueño.id : undefined,
                motivo: `Renta de ${casilla.nombre} a ${dueño ? dueño.nombre : 'dueño'}`
              });
            } else {
              jugador.dinero -= rentaCalculada;
              if (dueño) dueño.dinero += rentaCalculada;
              logMsg += ` Le pagó $${rentaCalculada} de renta a ${dueño ? dueño.nombre : 'dueño'}.`;
            }
          }
        }
      } else if (casilla.tipo === 'evento') {
        if (casilla.nombre === 'Solidaridad' && CARTAS_SOLIDARIDAD.length > 0) {
          const carta = CARTAS_SOLIDARIDAD[Math.floor(Math.random() * CARTAS_SOLIDARIDAD.length)];
          logMsg += ` Robó tarjeta de Solidaridad: [${carta.pais}] ${carta.desc}`;
          aplicarEfectoSolidaridad(miRoom, jugador, carta);
          io.to(miRoom).emit('mostrarCartaModal', { tipo: 'solidaridad', titulo: carta.pais, texto: carta.desc });
        } else if (casilla.nombre === 'Condiciones FMI' && CARTAS_CONDICIONES.length > 0) {
          if (jugador.deudaPersonal > 0) {
            const carta = CARTAS_CONDICIONES[Math.floor(Math.random() * CARTAS_CONDICIONES.length)];
            logMsg += ` Robó tarjeta Condiciones FMI: [${carta.titulo}] ${carta.desc}`;
            aplicarEfectoCondiciones(miRoom, jugador, carta);
            io.to(miRoom).emit('mostrarCartaModal', { tipo: 'condiciones', titulo: carta.titulo, texto: carta.desc });
          } else {
            logMsg += ` No debe dinero al FMI. Eximido de robar tarjeta de Condiciones FMI.`;
          }
        }
      }

      if (jugador.dinero < 0 && jugador.propiedades.length === 0) {
        jugador.enQuiebra = true;
        logMsg += ` 🚨 ¡${jugador.nombre} SE DECLARÓ EN QUIEBRA ANTE EL FMI! Queda eliminado.`;
      }

      sincronizarRecursosAlianza(gameState, jugador);
      verificarCondicionVictoria(miRoom);
      io.to(miRoom).emit('mensajeLog', logMsg);

      if (!requiereDecision && gameState.enJuego) {
        pasarSiguienteTurno(miRoom);
      }

      io.to(miRoom).emit('actualizarEstado', gameState);
    }
  });

  socket.on('decidirCompraPropiedad', (comprar) => {
    const gameState = salas[miRoom];
    if (!gameState || !gameState.enJuego) return;

    const jugadorIndex = gameState.jugadores.findIndex(j => j.socketId === socket.id);
    if (jugadorIndex === -1 || jugadorIndex !== gameState.turnoActual) return;

    const jugador = gameState.jugadores[jugadorIndex];
    const casilla = gameState.tablero[jugador.posicion];

    if (casilla && casilla.tipo === 'propiedad' && casilla.region === 'sur' && casilla.dueño === null) {
      if (comprar && jugador.dinero >= casilla.precio) {
        jugador.dinero -= casilla.precio;
        casilla.dueño = jugador.id;

        if (jugador.enAlianza) {
          const aliados = gameState.jugadores.filter(j => j.enAlianza);
          aliados.forEach(a => {
            if (!a.propiedades.includes(casilla.nombre)) a.propiedades.push(casilla.nombre);
          });
        } else {
          jugador.propiedades.push(casilla.nombre);
        }

        sincronizarRecursosAlianza(gameState, jugador);
        io.to(miRoom).emit('mensajeLog', `${jugador.nombre} compró ${casilla.nombre} por $${casilla.precio}.`);
      } else if (!comprar) {
        io.to(miRoom).emit('mensajeLog', `${jugador.nombre} decidió no comprar ${casilla.nombre}.`);
      }
    }

    pasarSiguienteTurno(miRoom);
    io.to(miRoom).emit('actualizarEstado', gameState);
  });

  socket.on('construirIndustria', ({ nombrePropiedad, tipo }) => {
    const gameState = salas[miRoom];
    if (!gameState || !gameState.enJuego) return;

    const jugadorIndex = gameState.jugadores.findIndex(j => j.socketId === socket.id);
    if (jugadorIndex === -1) return;

    const jugador = gameState.jugadores[jugadorIndex];
    const casilla = gameState.tablero.find(c => c.nombre.toLowerCase() === nombrePropiedad.toLowerCase());
    const infoCarta = CARTAS_PROPIEDADES.find(p => p.nombre.toLowerCase() === nombrePropiedad.toLowerCase());

    if (!casilla || !infoCarta) return;

    const esPropietarioOAliado = casilla.dueño === jugador.id || (jugador.enAlianza && gameState.jugadores[casilla.dueño]?.enAlianza);
    const descuentoAyudaSolidaria = (jugador.posicion === 10) ? 0.50 : 1.0;

    if (tipo === 'nacional' && casilla.region === 'sur' && esPropietarioOAliado) {
      if (casilla.industriasNac < 3) {
        const costo = Math.floor(infoCarta.nac[casilla.industriasNac] * descuentoAyudaSolidaria);
        if (jugador.dinero >= costo) {
          jugador.dinero -= costo;
          casilla.industriasNac++;
          sincronizarRecursosAlianza(gameState, jugador);
          io.to(miRoom).emit('mensajeLog', `${jugador.nombre} construyó la Industria Nacional #${casilla.industriasNac} en ${casilla.nombre} por $${costo}${descuentoAyudaSolidaria < 1 ? ' (50% desc. Ayuda Solidaria)' : ''}.`);
          io.to(miRoom).emit('actualizarEstado', gameState);
        }
      }
    } else if (tipo === 'exportacion' && casilla.region === 'sur' && esPropietarioOAliado) {
      if (casilla.industriasNac >= 1) {
        const casillaNorte = gameState.tablero.find(c => c.baseSur && c.baseSur.toLowerCase() === infoCarta.nombre.toLowerCase());
        if (casillaNorte) {
          if (casillaNorte.industriasExp < 3) {
            const costo = Math.floor(infoCarta.exp[casillaNorte.industriasExp] * descuentoAyudaSolidaria);
            if (jugador.dinero >= costo) {
              jugador.dinero -= costo;
              casillaNorte.industriasExp++;
              casillaNorte.dueño = jugador.id;

              if (jugador.enAlianza) {
                const aliados = gameState.jugadores.filter(j => j.enAlianza);
                aliados.forEach(a => {
                  if (!a.propiedades.includes(casillaNorte.nombre)) a.propiedades.push(casillaNorte.nombre);
                });
              } else {
                if (!jugador.propiedades.includes(casillaNorte.nombre)) jugador.propiedades.push(casillaNorte.nombre);
              }

              sincronizarRecursosAlianza(gameState, jugador);
              io.to(miRoom).emit('mensajeLog', `${jugador.nombre} expandió la Multinacional #${casillaNorte.industriasExp} (${casillaNorte.nombre}) por $${costo}${descuentoAyudaSolidaria < 1 ? ' (50% desc. Ayuda Solidaria)' : ''}.`);
              io.to(miRoom).emit('actualizarEstado', gameState);
            }
          }
        }
      }
    }
  });

  socket.on('expropiarPropiedad', ({ nombrePropiedad }) => {
    const gameState = salas[miRoom];
    if (!gameState || !gameState.enJuego) return;

    const jugador = gameState.jugadores.find(j => j.socketId === socket.id);
    const casilla = gameState.tablero.find(c => c.nombre.toLowerCase() === nombrePropiedad.toLowerCase());
    const infoCarta = CARTAS_PROPIEDADES.find(p => p.nombre.toLowerCase() === nombrePropiedad.toLowerCase());

    if (jugador && casilla && casilla.region === 'sur' && casilla.dueño !== null && casilla.dueño !== jugador.id) {
      const dueñoAnterior = gameState.jugadores[casilla.dueño];
      let costoInversion = infoCarta.terreno;
      for (let i = 0; i < casilla.industriasNac; i++) costoInversion += infoCarta.nac[i];

      const impuestoFMI = 2000;
      const costoTotal = costoInversion + impuestoFMI;

      if (jugador.dinero >= costoTotal) {
        jugador.dinero -= costoTotal;
        if (dueñoAnterior) dueñoAnterior.dinero += costoInversion;
        gameState.deudaFMIGlobal += impuestoFMI;

        casilla.dueño = jugador.id;
        if (dueñoAnterior) dueñoAnterior.propiedades = dueñoAnterior.propiedades.filter(p => p !== casilla.nombre);

        if (jugador.enAlianza) {
          const aliados = gameState.jugadores.filter(j => j.enAlianza);
          aliados.forEach(a => {
            if (!a.propiedades.includes(casilla.nombre)) a.propiedades.push(casilla.nombre);
          });
        } else {
          jugador.propiedades.push(casilla.nombre);
        }

        sincronizarRecursosAlianza(gameState, jugador);
        if (dueñoAnterior) sincronizarRecursosAlianza(gameState, dueñoAnterior);

        io.to(miRoom).emit('mensajeLog', `${jugador.nombre} expropió ${casilla.nombre} a ${dueñoAnterior ? dueñoAnterior.nombre : 'dueño'}.`);
        io.to(miRoom).emit('actualizarEstado', gameState);
      }
    }
  });

  socket.on('responderDecisionPago', (data) => {
    const gameState = salas[miRoom];
    if (!gameState || !gameState.enJuego) return;

    const jugadorIndex = gameState.jugadores.findIndex(j => j.socketId === socket.id);
    if (jugadorIndex === -1 || jugadorIndex !== gameState.turnoActual) return;

    const jugador = gameState.jugadores[jugadorIndex];

    if (data.usarOro && jugador.oro > 0) {
      jugador.oro--;
      io.to(miRoom).emit('mensajeLog', `${jugador.nombre} utilizó 1 Lingote de Oro 🪙 para cubrir el pago.`);
    } else {
      jugador.dinero -= data.monto;
      if (data.tipo === 'fmi') {
        gameState.deudaFMIGlobal += data.monto;
      } else if (data.tipo === 'renta_norte' && data.dueñoId !== undefined) {
        const dueño = gameState.jugadores.find(j => j.id === data.dueñoId);
        if (dueño) {
          dueño.dinero += data.monto;
          sincronizarRecursosAlianza(gameState, dueño);
        }
      }
      io.to(miRoom).emit('mensajeLog', `${jugador.nombre} pagó $${data.monto} en efectivo.`);
    }

    sincronizarRecursosAlianza(gameState, jugador);
    pasarSiguienteTurno(miRoom);
    io.to(miRoom).emit('actualizarEstado', gameState);
  });

  socket.on('abandonarSala', () => {
    if (miRoom && salas[miRoom]) {
      const gameState = salas[miRoom];
      const index = gameState.jugadores.findIndex(j => j.socketId === socket.id);

      if (index !== -1) {
        const jugadorSalió = gameState.jugadores[index];

        gameState.tablero.forEach(casilla => {
          if (casilla.dueño === jugadorSalió.id) {
            casilla.dueño = null;
            casilla.industriasNac = 0;
            casilla.industriasExp = 0;
          }
        });

        gameState.jugadores.splice(index, 1);

        if (jugadorSalió.esLider && gameState.jugadores.length > 0) {
          gameState.jugadores[0].esLider = true;
        }

        if (gameState.turnoActual >= gameState.jugadores.length) {
          gameState.turnoActual = 0;
        }

        socket.leave(miRoom);
        io.to(miRoom).emit('mensajeLog', `🚪 ${jugadorSalió.nombre} abandonó la sala. Sus propiedades han sido devueltas al mercado.`);
        io.to(miRoom).emit('actualizarEstado', gameState);
      }
      miRoom = null;
    }
  });

  socket.on('disconnect', () => {
    if (miRoom && salas[miRoom]) {
      const gameState = salas[miRoom];
      const index = gameState.jugadores.findIndex(j => j.socketId === socket.id);
      
      if (index !== -1 && index === gameState.turnoActual && gameState.enJuego) {
        pasarSiguienteTurno(miRoom);
      }
      
      io.to(miRoom).emit('actualizarEstado', gameState);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor de La Deuda Eterna activo en el puerto ${PORT}`);
});