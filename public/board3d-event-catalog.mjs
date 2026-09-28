const asset=(file,x,z,width=.65,height=.65,depth=.55,motion=null,rotation=0)=>({file,x,z,width,height,depth,y:.055,motion,rotation});
const e=(name,...args)=>asset('eventos/'+name+'.glb',...args);
const a=(name,...args)=>asset(name+'.glb',...args);
const plants=()=>[-.85,-.35,.15].flatMap(x=>[-.3,.25].map(z=>e('nature/cultivo-hojas',x,z,.35,.43,.35,'leaves')));
const farm=()=>[e('nature/surcos',-.35,0,1.6,.10,1.0),...plants(),a('maquinaria/tractor',.9,.08,.70,.60,.65,null,Math.PI/2),a('alimentos/banano',.48,-.38,.35,.22,.28)];
const harbor=()=>[e('pirate/muelle',-.5,.13,1.55,.27,.9),e('pirate/barco',.88,.05,.72,.94,.65,'boat'),e('industrial/contenedor',-.65,-.28,.84,.36,.42),e('pirate/barril',-.9,.4,.2,.28,.2)];
const market=()=>[a('naturaleza/vaca',-.72,-.05,.8,.7,.6),a('naturaleza/canoa',.62,.08,1.1,.4,.55),a('alimentos/pescado',.75,.4,.35,.22,.2),a('alimentos/bolsa-alimentos',-.05,.32,.28,.38,.3),e('pirate/barril',-.08,-.36,.22,.32,.22)];
const mining=()=>[a('naturaleza/entrada-mina',-.72,-.05,1.05,.78,.75),a('naturaleza/roca-cobre',.08,.25,.44,.35,.38),a('naturaleza/roca-hierro',.6,.32,.4,.35,.35),a('maquinaria/grua-industrial',.85,-.28,.62,.9,.52)];
const energy=()=>[a('maquinaria/bomba-petrolera',-.62,0,1.0,.90,.8,null,Math.PI/2),a('industrial/deposito-industrial',.5,-.16,.65,.74,.62),a('maquinaria/tuberia-valvula',.63,.4,.8,.3,.23)];
export const EVENT_MODELS={
 cosecha:farm(),
 sequia:[e('nature/arbol-seco',-.8,-.05,.8,.95,.68),e('nature/surcos',.25,.08,1.35,.10,.82),e('nature/arbusto',.35,.1,.47,.35,.45),e('pirate/barril',.92,.15,.28,.4,.28)],
 pedidos:harbor(),cancelaciones:harbor().map(s=>({...s,motion:null})),
 mercados:market(),sanitaria:[...market(),e('factory/cono',-.55,.45,.17,.28,.17),e('factory/cono',.08,.46,.17,.28,.17)],
 metales:mining(),desplome:[...mining(),e('industrial/contenedor',.15,-.35,.52,.25,.32)],
 energia:energy(),escasez:[...energy(),e('factory/cono',.1,.36,.18,.27,.18)],
 cooperacion:[a('maquinaria/tractor',-.8,.15,.8,.60,.68,null,Math.PI/2),a('industrial/planta-electronica',.68,-.05,.92,.74,.85),a('maquinaria/caja-suministros',0,.32,.3,.27,.3),e('nature/arbusto',-.4,-.36,.45,.35,.4)],
 logistica:[e('industrial/contenedor',-.8,-.26,.9,.4,.43),e('industrial/contenedor',-.72,.3,.9,.4,.43),a('maquinaria/grua-industrial',.63,0,.92,1.0,.9),e('factory/cono',0,.4,.2,.3,.2)]
};
