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
  { id: 24, nombre: "Industrialización", tipo: "evento" },
  { id: 25, nombre: "Ropa", tipo: "propiedad", region: "norte", baseSur: "Algodón", precio: 500, renta: 100, dueño: null, industriasExp: 0 },
  { id: 26, nombre: "Cigarrillos", tipo: "propiedad", region: "norte", baseSur: "Tabaco", precio: 600, renta: 120, dueño: null, industriasExp: 0 },
  { id: 27, nombre: "Café Elaborado", tipo: "propiedad", region: "norte", baseSur: "Café", precio: 700, renta: 140, dueño: null, industriasExp: 0 },
  { id: 28, nombre: "Condiciones FMI", tipo: "evento" },
  { id: 29, nombre: "Enlatados", tipo: "propiedad", region: "norte", baseSur: "Pesca", precio: 800, renta: 160, dueño: null, industriasExp: 0 },
  { id: 30, nombre: "Ayuda BID", tipo: "evento" },
  { id: 31, nombre: "Zapatos", tipo: "propiedad", region: "norte", baseSur: "Ganado", precio: 1000, renta: 200, dueño: null, industriasExp: 0 },
  { id: 32, nombre: "12 Octubre 1492", tipo: "evento" },
  { id: 33, nombre: "Cables", tipo: "propiedad", region: "norte", baseSur: "Cobre", precio: 1200, renta: 240, dueño: null, industriasExp: 0 },
  { id: 34, nombre: "Electrónica", tipo: "propiedad", region: "norte", baseSur: "Estaño", precio: 1400, renta: 280, dueño: null, industriasExp: 0 },
  { id: 35, nombre: "Tractores", tipo: "propiedad", region: "norte", baseSur: "Hierro", precio: 1600, renta: 320, dueño: null, industriasExp: 0 },
  { id: 36, nombre: "Solidaridad", tipo: "evento" },
  { id: 37, nombre: "Gasolina", tipo: "propiedad", region: "norte", baseSur: "Petróleo", precio: 2400, renta: 480, dueño: null, industriasExp: 0 },
  { id: 38, nombre: "No Pagar", tipo: "evento" },
  { id: 39, nombre: "Sede FMI", tipo: "fmi_cobro", monto: 2000 }
];

const COLORES = ['#E74C3C', '#2ECC71', '#3498DB', '#F1C40F'];

module.exports = { TABLERO, GRUPOS_CADENAS, COLORES };
