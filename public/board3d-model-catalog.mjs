// x/z and limits are local to each outer lot; no game coordinates are changed.
const item=(file,x=0,z=-1.02,width=.80,height=.62,depth=.83,y=0,rotation=0)=>({file,x,z,width,height,depth,y,rotation});
const food=name=>'alimentos/'+name+'.glb';
const machine=name=>'maquinaria/'+name+'.glb';
const nature=name=>'naturaleza/'+name+'.glb';
const mine=rock=>[item(nature('entrada-mina'),0,-1.23,.74,.49,.39),item(nature(rock),-.18,-.77,.33,.21,.28),item(machine('caja-suministros'),.27,-.78,.17,.12,.19)];
const factory=(building,product)=>[
  item('industrial/'+building+'.glb',0,-1.23,.81,.48,.43),
  item(food(product),-.19,-.78,.34,.28,.28),
  item(machine('caja-suministros'),.26,-.76,.19,.16,.22)
];
const supplies=()=>[
  item(machine('caja-suministros'),-.20,-1.15,.38,.30,.43),
  item(food('bolsa-alimentos'),.20,-1.13,.29,.39,.34),
  item(food('pan'),0,-.78,.40,.18,.25)
];
export const BOARD_MODELS = {
  0:[item(nature('obelisco'),0,-1.04,.33,.62,.37),item(nature('palmera'),-.30,-1.24,.25,.43,.28),item(nature('palmera'),.30,-1.24,.25,.43,.28)],
  2:[item(food('banano'),.24,-.76,.18,.12,.13,.10)],
  4:supplies(),
  9:[item(nature('canoa'),0,-1.23,.78,.30,.42),item(food('pescado'),0,-.80,.51,.27,.27)],
  10:supplies(),
  11:[item(nature('vaca'),0,-1.09,.70,.47,.57,0,Math.PI/2)],
  17:[item(machine('bomba-petrolera'),0,-1.06,.76,.62,.74,0,Math.PI/2)],
  18:[item(machine('tanque'),0,-1.08,.76,.44,.70,0,Math.PI/2)],
  32:[item(nature('velero'),.06,-1.10,.69,.62,.72,0,Math.PI/2)],
  35:[item(machine('tractor'),0,-1.08,.74,.52,.70,0,Math.PI/2)],
  13:mine('roca-cobre'),
  14:mine('roca-estano'),
  15:mine('roca-hierro'),
  16:supplies(),
  20:[item(nature('porton'),0,-1.08,.79,.46,.56)],
  21:factory('fabrica-caramelos','caramelo'),
  23:factory('fabrica-chocolate','chocolate'),
  24:[item(machine('grua-industrial'),-.18,-1.17,.47,.64,.52),item(machine('brazo-robotico'),.26,-1.12,.24,.42,.29),item(machine('caja-suministros'),0,-.77,.31,.20,.23)],
  27:factory('tostadero-cafe','cafe-elaborado'),
  29:factory('planta-conservas','lata-conserva'),
  30:[item('comercial/oficinas-bid.glb',0,-1.04,.80,.60,.78)],
  34:[item('industrial/planta-electronica.glb',0,-1.23,.80,.46,.43),item(machine('pantalla-electronica'),-.16,-.77,.36,.27,.25),item(machine('brazo-robotico'),.26,-.79,.18,.30,.21)],
  36:supplies(),
  37:[item('industrial/refineria.glb',-.13,-1.20,.54,.57,.50),item('industrial/deposito-industrial.glb',.29,-1.23,.24,.42,.30),item(machine('tuberia-valvula'),0,-.77,.46,.22,.26)],
  39:[item('comercial/oficinas-fmi.glb',0,-1.04,.81,.64,.78)]
};

// Downloaded upgrades still wanted. These spaces already have local scenery.
export const MISSING_MODELS = {
  1:'Azúcar: cañaveral o manojo de cañas',
  3:'Cacao: cacaotero o mazorcas',
  5:'Algodón: planta o fardo',
  6:'Tabaco: planta u hojas secas',
  7:'Café: cafeto o saco de granos sin elaborar',
  8:'Condiciones FMI: contrato, documento o carpeta',
  12:'Fuga de capitales: maleta con dinero o avión',
  19:'Condiciones FMI: contrato, documento o carpeta',
  22:'Mermelada: tarro de mermelada',
  25:'Ropa: prendas, máquina de coser o taller textil',
  26:'Cigarrillos: cajetilla o fábrica de tabaco',
  28:'Condiciones FMI: contrato, documento o carpeta',
  31:'Zapatos: zapatos, botas o taller de calzado',
  33:'Cables: bobina de cable',
  38:'No Pagar: pancarta o símbolo de protesta'
};
