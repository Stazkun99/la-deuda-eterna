'use strict';
(function(){
const catalog=[
 ['cosecha','La gran cosecha','Las lluvias llegaron a tiempo. Las cooperativas llenan sus almacenes de azúcar, banano y cacao.','Doble cobro propio en Azúcar, Banano y Cacao.',true,[1,2,3],'sprout'],
 ['sequia','Sequía prolongada','El calor agrieta la tierra. Los productores reservan agua mientras esperan el regreso de las lluvias.','Cobro propio a la mitad en Azúcar, Banano y Cacao. Las rentas no cambian.',false,[1,2,3],'sun'],
 ['pedidos','Pedidos de ultramar','Los puertos reciben contratos de tejidos, tabaco y café. Los almacenes preparan los envíos.','Cobro propio +50% en Algodón, Tabaco, Café y sus manufacturas.',true,[5,6,7,25,26,27],'cargo'],
 ['cancelaciones','Contratos cancelados','Los compradores suspenden sus pedidos. Los contenedores esperan y los almacenes se llenan.','Cobro propio −50% en Algodón, Tabaco, Café y sus manufacturas.',false,[5,6,7,25,26,27],'idle-cargo'],
 ['mercados','Mercados populares','Pescadores y ganaderos organizan mercados comunitarios, sin intermediarios.','En Pesca y Ganado, el banco paga media renta al dueño cuando cae cualquiera. El visitante no paga.',true,[9,11],'market'],
 ['sanitaria','Crisis sanitaria','Las inspecciones limitan la circulación de productos animales. Las plantas reducen su actividad.','Rentas y cobros propios −50% en Pesca, Ganado, Enlatados y Zapatos.',false,[9,11,29,31],'cross'],
 ['metales','El mundo necesita metales','Grandes obras y nuevos tendidos eléctricos disparan los pedidos a minas y fundiciones.','El banco añade un 50% a las rentas en efectivo cobradas a rivales en minería y sus manufacturas.',true,[13,14,15,33,34,35],'up'],
 ['desplome','Desplome de los metales','Las obras se paralizan. Se acumulan existencias y las fundiciones reducen sus precios.','Rentas y cobros propios −50% en minería y sus manufacturas.',false,[13,14,15,33,34,35],'down'],
 ['energia','Acuerdo energético','Los productores acuerdan un suministro estable. El combustible llega a fábricas y obras de toda la región.','Doble cobro propio en Petróleo y Gasolina. Construcción −15% para todos.',true,[17,37],'energy'],
 ['escasez','Crisis de abastecimiento','Faltan cargamentos de combustible. Las entregas se retrasan y levantar industrias resulta más caro.','Cobro propio −50% en Petróleo y Gasolina. Construcción +15% para todos.',false,[17,37],'warning'],
 ['cooperacion','Cooperación regional','Los países comparten maquinaria y conocimientos para impulsar la industria nacional.','La primera construcción nacional de cada jugador tiene un 30% de descuento.',true,[1,2,3,5,6,7,9,11,13,14,15,17],'link'],
 ['logistica','Atasco logístico','Buques y mercancías esperan en los puertos. Instalar nuevas fábricas de exportación requiere más recursos.','Construir multinacionales cuesta un 25% más. Las existentes siguen funcionando.',false,[21,22,23,25,26,27,29,31,33,34,35,37],'crane']
].map(([id,titulo,historia,efecto,positivo,casillas,visual])=>({id,titulo,historia,efecto,positivo,casillas,visual}));
const definition=r=>r.eventosHabilitados===false?undefined:catalog.find(e=>e.id===r.eventoActual?.id);
const affected=(r,c)=>!!definition(r)?.casillas.includes(c.id);
function rentFactor(r,c){return affected(r,c)&&['sanitaria','desplome'].includes(r.eventoActual.id)?.5:1;}
function selfFactor(r,c){if(!affected(r,c))return 1;return ({cosecha:2,sequia:.5,pedidos:1.5,cancelaciones:.5,energia:2,escasez:.5})[r.eventoActual.id]||1;}
function buildFactor(r,p,national){const id=definition(r)?.id;let discount=r.descuento?.5:1;if(id==='energia')discount=Math.min(discount,.85);if(id==='cooperacion'&&national&&!r.eventoActual.usados.includes(p.id))discount=Math.min(discount,.7);return discount*(id==='escasez'?1.15:id==='logistica'&&!national?1.25:1);}
const api={catalog,definition,affected,rentFactor,selfFactor,buildFactor};if(typeof module!=='undefined')module.exports=api;else globalThis.WorldEvents=api;
})();
