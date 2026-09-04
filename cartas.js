const CARTAS_CONDICIONES = [
  { id: 1, titulo: "SUBEN LAS MANUFACTURAS", desc: "Avance hasta la manufactura del NORTE más cercana. Si no tiene dueño, páguela al FMI al DOBLE." },
  { id: 2, titulo: "SUBEN LOS INTERESES", desc: "Avance hasta el FMI y pague sus intereses al 15%." },
  { id: 3, titulo: "500 AÑOS DE CIVILIZACIÓN", desc: "Avance hasta 12 de Octubre. Le cambiarán sus reservas de oro por un lindo espejito." },
  { id: 4, titulo: "SUBEN LOS INTERESES", desc: "Avance hasta el FMI y pague sus intereses al 15%." },
  { id: 5, titulo: "BAJA DE SALARIOS", desc: "Todos los jugadores con deudas al FMI devolverán la mitad de su dinero en efectivo." },
  { id: 6, titulo: "DESPIDO SINDICAL", desc: "El compañero de su izquierda debe presentarse ante el FMI." },
  { id: 7, titulo: "DESEMPLEO", desc: "Para reactivar su economía espere dos turnos sin jugar (y sin cobrar)." },
  { id: 8, titulo: "COLECTA", desc: "Una estatua a la libertad de empresa. Contribuya con $100." },
  { id: 9, titulo: "GUERRA EN LA FRONTERA", desc: "Usted y el jugador de su derecha le comprarán cada uno al FMI $1,000 en armas." },
  { id: 10, titulo: "REUNIÓN CON EL CLUB DE PARÍS", desc: "Todos los jugadores avanzarán hasta el FMI para recibir consejos (pagando intereses)." },
  { id: 11, titulo: "CIERRE DE INDUSTRIAS", desc: "Todas sus industrias quedarán cerradas hasta que usted llegue al FMI." },
  { id: 12, titulo: "NEGOCIE DIRECTAMENTE CON EL FMI", desc: "Si promete no hacer pactos, el FMI le regala $10,000." },
  { id: 13, titulo: "PATENTES", desc: "Debe pagar al FMI $200 por cada industria nacional y $400 por cada exportación." },
  { id: 14, titulo: "IMPUESTO", desc: "Por importación de autos de lujo y whisky pague $1,500." },
  { id: 15, titulo: "SOBREVALORACIÓN DEL DÓLAR", desc: "Cuando llegue al FMI pagará sus intereses al 20% en esta vuelta." },
  { id: 16, titulo: "DUMPING", desc: "Quiebra una industria suya (la que usted prefiera). Devuelva al FMI hasta el terreno." },
  { id: 17, titulo: "INFLACIÓN", desc: "Cada jugador pagará al FMI $750 por el alto costo de la vida." }
];

const CARTAS_SOLIDARIDAD = [
  { id: 1, pais: "PUERTO RICO", desc: "Te invita a la NACIONALIZACIÓN (Casilla 24)." },
  { id: 2, pais: "GUATEMALA", desc: "Te regala una finca de algodón $2,600." },
  { id: 3, pais: "GUYANA Y SURINAM", desc: "Te envían a la casilla No. 10 para brindarte ayuda solidaria." },
  { id: 4, pais: "NICARAGUA", desc: "Les regala a todos el SOMBRERO." },
  { id: 5, pais: "ARGENTINA Y URUGUAY", desc: "Te regalan una cría de ganado $3,400." },
  { id: 6, pais: "HAITÍ Y DOMINICANA", desc: "Te regalan una vega de tabaco $2,800." },
  { id: 7, pais: "COLOMBIA", desc: "Te regala un saco de café $3,000." },
  { id: 8, pais: "BRASIL", desc: "Te regala una mina de hierro $4,000." },
  { id: 9, pais: "PARAGUAY", desc: "Resguardo: No pagarás nada en una caída en GOLPE MILITAR." },
  { id: 10, pais: "ECUADOR", desc: "Te regala una cosecha de cacao $2,400." },
  { id: 11, pais: "EL SALVADOR", desc: "Le regala a cada jugador $2,000 para su lucha de liberación." },
  { id: 12, pais: "HONDURAS Y COSTA RICA", desc: "Te regalan una carga de bananos $2,200." },
  { id: 13, pais: "CHILE", desc: "Te regala un vagón de cobre $3,600." },
  { id: 14, pais: "PERÚ", desc: "Te regala un barco de pescado $3,200." },
  { id: 15, pais: "JAMAICA Y CARIBE", desc: "Te regalan una tonelada de azúcar $2,000." },
  { id: 16, pais: "MÉXICO", desc: "Te devuelve las reservas de oro que hayas perdido." },
  { id: 17, pais: "BOLIVIA", desc: "Te regala una beta de estaño $3,800." },
  { id: 18, pais: "CUBA", desc: "Los invita a todos a la casilla AMÉRICA LATINA. ¡UNANSE!" },
  { id: 19, pais: "VENEZUELA", desc: "Regala al que tenga el terreno de petróleo una industria." },
  { id: 20, pais: "PANAMÁ", desc: "Resguardo para librarte de FUGA DE CAPITALES." }
];

const CARTAS_PROPIEDADES = [
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

module.exports = { CARTAS_CONDICIONES, CARTAS_SOLIDARIDAD, CARTAS_PROPIEDADES };