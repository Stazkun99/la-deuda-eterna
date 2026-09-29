import * as THREE from 'three';
import {tileAnchor,tileAngle} from './board3d-layout.mjs';

export function industryView(cell,state){
 const owner=state.jugadores.find(p=>p.id===cell.dueño);
 return {level:Math.max(0,Math.min(3,Number(cell.region==='sur'?cell.industriasNac:cell.industriasExp)||0)),color:owner?.color||'#879796',closed:!!(owner?.industriasCerradas||owner?.turnosPerdidos),blocked:cell.region==='norte'&&!!state.barreraProteccionista};
}
export function createIndustryLayer(scene,board){
 const resources=[],entries=new Map(),root=new THREE.Group();scene.add(root);
 const own=v=>(resources.push(v),v),cube=own(new THREE.BoxGeometry(1,1,1));
 const mat=(color,metalness=0)=>own(new THREE.MeshStandardMaterial({color,roughness:.6,metalness}));
 const brick=mat('#9e593d'),glass=mat('#85cfd4',.35),concrete=mat('#d4d2ba'),door=mat('#596968'),tileRoof=mat('#a74935');
 const cylinder=own(new THREE.CylinderGeometry(1,1,1,10));
 function tank(parent,x,y,z,r,h,material){const m=new THREE.Mesh(cylinder,material);m.position.set(x,y,z);m.scale.set(r,h,r);parent.add(m);return m;}
 const roof=mat('#344f58',.35),light=mat('#ffdfa0'),steel=mat('#b7c7cb',.5),warning=mat('#f4c650'),dark=mat('#344044');
 function box(parent,x,y,z,w,h,d,material){const m=new THREE.Mesh(cube,material);m.position.set(x,y,z);m.scale.set(w,h,d);parent.add(m);return m;}
 for(const cell of board.filter(c=>c.region==='sur'||c.region==='norte')){
  const group=new THREE.Group(),anchor=tileAnchor(cell.id);group.position.set(anchor.x,.215,anchor.z);group.rotation.y=tileAngle(cell.id);group.userData.id=cell.id;root.add(group);
  // All geometry is in local tile coordinates, relative to the player lane anchor.
  const building=new THREE.Group();building.position.set(.265,0,-.5);group.add(building);
  const ownerMat=mat('#879796'),shell=mat(cell.region==='sur'?'#d48a57':'#4e9fba',.2),levels=[],machines=[];
  const operatingLight=mat('#ffdfa0');
  const ownership=new THREE.Group();group.add(ownership);
  box(ownership,0,.018,.30,.88,.035,.08,ownerMat);
  const rank=[];for(let n=0;n<3;n++)rank.push(box(ownership,(n-1)*.15,.055,.30,.10,.04,.065,light));
  box(building,0,.025,0,.38,.05,.30,concrete);
  function window(parent,x,y,z,w=.035,h=.046){box(parent,x,y,z,w,h,.009,light);}
  function gable(parent,x,y,z,w,d){
   for(const side of [-1,1]){const slope=box(parent,x+side*w*.25,y,z,w*.59,.018,d,tileRoof);slope.rotation.z=side*-.38;}
  }
  for(let n=0;n<3;n++){
   const floor=new THREE.Group();floor.name=(cell.region==='sur'?'Ampliación nacional ':'Ampliación multinacional ')+(n+1);building.add(floor);levels.push(floor);
   if(cell.region==='sur'){
    if(n===0){
     box(floor,-.065,.145,0,.20,.19,.22,shell);gable(floor,-.065,.26,0,.23,.25);
     box(floor,-.075,.114,.116,.065,.12,.013,door);window(floor,-.13,.19,.118);window(floor,.002,.19,.118);
     box(floor,-.12,.295,-.07,.035,.18,.036,brick);box(floor,-.12,.39,-.07,.045,.015,.046,roof);
    }else if(n===1){
     box(floor,.112,.127,.012,.135,.15,.22,shell);gable(floor,.112,.225,.012,.15,.25);
     box(floor,.114,.11,.126,.09,.11,.012,door);
     for(let i=0;i<4;i++)box(floor,.114,.077+i*.025,.136,.088,.004,.004,steel);
     box(floor,.072,.065,.14,.035,.04,.028,brick);
    }else{
     tank(floor,.11,.32,-.07,.048,.21,steel);tank(floor,.11,.435,-.07,.055,.02,roof);
     for(const y of [.245,.31,.375])tank(floor,.11,y,-.07,.050,.009,roof);
     for(const x of [.083,.137])box(floor,x,.33,-.019,.007,.23,.008,warning);
     for(let i=0;i<6;i++)box(floor,.11,.235+i*.033,-.013,.06,.007,.007,warning);
     box(floor,-.045,.28,.04,.06,.02,.08,steel);
    }
   }else{
    if(n===0){
     box(floor,0,.14,0,.31,.18,.24,shell);box(floor,0,.24,0,.34,.027,.27,roof);
     for(const x of [-.085,.04]){box(floor,x,.125,.126,.075,.12,.012,door);box(floor,x,.20,.137,.08,.012,.008,warning);}
     for(const x of [-.13,.13])box(floor,x,.13,-.13,.014,.19,.018,steel);
    }else if(n===1){
     box(floor,-.025,.335,-.005,.24,.17,.20,shell);
     box(floor,-.025,.342,.101,.218,.11,.012,glass);box(floor,-.15,.342,-.006,.01,.11,.17,glass);
     for(const x of [-.10,-.025,.05])box(floor,x,.342,.11,.01,.12,.012,steel);
     box(floor,-.025,.43,-.005,.27,.025,.23,steel);
    }else{
     for(const x of [-.086,.022]){tank(floor,x,.495,-.024,.043,.105,steel);tank(floor,x,.551,-.024,.047,.013,roof);}
     box(floor,.134,.34,-.065,.038,.21,.06,concrete);box(floor,.134,.455,-.065,.055,.025,.074,roof);
     for(let i=0;i<5;i++)box(floor,.145,.27+i*.035,-.025,.03,.008,.016,warning);
     box(floor,-.03,.458,.11,.23,.035,.012,ownerMat);
    }
   }
  }
  // Each extension adds a functional detail; all remain inside the existing footprint.
  const rotor=new THREE.Group();rotor.name=cell.region==='sur'?'Volante del taller':'Ventilador de nave';rotor.position.set(cell.region==='sur'?-.063:0,cell.region==='sur'?.20:.25,cell.region==='sur'?.132:0);levels[0].add(rotor);
  const hub=tank(rotor,0,0,0,.019,.015,steel);hub.rotation.x=Math.PI/2;
  for(let i=0;i<4;i++){const blade=box(rotor,0,0,0,.012,.085,.01,cell.region==='sur'?steel:dark);blade.rotation.z=i*Math.PI/4;}
  if(cell.region==='norte')rotor.rotation.x=-Math.PI/2;
  machines.push({object:rotor,axis:'z',base:rotor.rotation.z,level:1,speed:cell.region==='sur'?1.1:1.8});
  const conveyor=new THREE.Group();conveyor.name=cell.region==='sur'?'Línea de empaquetado':'Muelle de expedición';conveyor.position.set(0,.086,.137);levels[1].add(conveyor);
  box(conveyor,0,0,0,.29,.022,.026,dark);
  for(let i=0;i<7;i++)box(conveyor,-.12+i*.04,.014,0,.007,.012,.023,steel);
  const parcel=box(conveyor,-.105,.04,0,.039,.039,.026,cell.region==='sur'?brick:warning);parcel.name='Carga en cinta';machines.push({object:parcel,axis:'x',base:-.105,level:2,travel:true});
  const upper=new THREE.Group();upper.name=cell.region==='sur'?'Válvula de silo':'Extractor del complejo';upper.position.set(cell.region==='sur'?.11:-.086,cell.region==='sur'?.442:.56,cell.region==='sur'?-.07:-.024);levels[2].add(upper);
  for(let i=0;i<3;i++){const blade=box(upper,0,0,0,.074,.009,.009,roof);blade.rotation.y=i*Math.PI/3;}
  machines.push({object:upper,axis:'y',base:0,level:3,speed:.8});
  box(building,.155,.18,.139,.016,.025,.015,operatingLight);
  box(building,0,.055,.153,.31,.07,.018,ownerMat);
  // Three illuminated indicators remain readable with either building silhouette.
  const indicators=[];for(let n=0;n<3;n++)indicators.push(box(building,(n-1)*.085,.056,.168,.055,.028,.015,light));
  let gate=null,shutter=null,lamp=null;
  if(cell.region==='norte'){
   gate=new THREE.Group();gate.position.z=-.32;group.add(gate);
   for(const x of [-.435,.435])box(gate,x,.37,0,.045,.74,.05,steel);
   box(gate,0,.74,0,.92,.075,.09,roof);
   shutter=new THREE.Group();gate.add(shutter);
   for(let n=0;n<7;n++)box(shutter,0,.07+n*.09,0,.84,.055,.035,steel);
   box(shutter,0,.15,.023,.84,.11,.022,warning);
   for(let n=0;n<6;n++){const stripe=box(shutter,-.34+n*.135,.15,.04,.052,.11,.016,dark);stripe.rotation.z=-.35;}
   lamp=box(gate,.38,.8,0,.07,.045,.055,warning);
  }
  entries.set(cell.id,{group,ownership,rank,building,levels,indicators,ownerMat,shell,gate,shutter,lamp,machines,operatingLight,operating:false,north:cell.region==='norte',progress:0,target:0,motion:null,initialized:false,level:0,buildMotion:null});
 }
 function pose(e){if(!e.gate)return;e.gate.visible=e.progress>0||e.target===1;e.shutter.scale.y=Math.max(.015,e.progress);e.shutter.position.y=.67*(1-e.progress);}
 function sync(state,animate=false,now=performance.now()){
  for(const cell of state.tablero){const e=entries.get(cell.id);if(!e)continue;const view=industryView(cell,state);
   if(!e.initialized||!animate||view.level!==e.level){
    const previous=e.level;
    for(const g of e.levels){g.scale.setScalar(1);g.position.y=0;}
    e.buildMotion=animate&&e.initialized&&view.level>previous?{from:previous,start:now}:null;
    if(e.buildMotion)for(let i=previous;i<view.level;i++){e.levels[i].scale.y=.02;e.levels[i].position.y=.12;}
    e.ownerMat.emissiveIntensity=0;e.level=view.level;
   }
   e.ownership.visible=!!cell.dueño;e.rank.forEach((m,i)=>m.visible=i<view.level);
   e.building.visible=view.level>0;e.levels.forEach((g,i)=>g.visible=i<view.level);e.indicators.forEach((m,i)=>m.visible=i<view.level);
   e.ownerMat.color.set(view.color);e.shell.color.set(view.closed||view.blocked?'#87918e':e.north?'#4e9fba':'#d48a57');
   e.operating=view.level>0&&!view.closed&&!view.blocked;
   e.operatingLight.color.set(e.operating?'#ffdfa0':'#65716b');e.operatingLight.emissive.set(e.operating?'#9a641c':'#000000');e.operatingLight.emissiveIntensity=.3;
   const target=view.blocked?1:0;
   if(!e.initialized||!animate){e.target=target;e.progress=target;e.motion=null;}
   else if(target!==e.target){e.target=target;e.motion={from:e.progress,start:now};}
   e.initialized=true;pose(e);
  }
 }
 function constructionPose(e,now){
  if(!e.buildMotion)return false;
  const t=Math.min(1,Math.max(0,(now-e.buildMotion.start)/700)),ease=1-(1-t)**3;
  for(let i=e.buildMotion.from;i<e.level;i++){e.levels[i].scale.y=.02+.98*ease;e.levels[i].position.y=.12*(1-ease);}
  e.ownerMat.emissive.copy(e.ownerMat.color);e.ownerMat.emissiveIntensity=Math.sin(t*Math.PI)*.45;
  if(t===1){e.buildMotion=null;e.ownerMat.emissiveIntensity=0;}
  return t<1;
 }
 function tick(now,ambient=false){let moving=false;for(const e of entries.values()){
  for(const m of e.machines){const running=ambient&&e.operating&&m.level<=e.level&&!e.buildMotion;const t=now/1000;
   if(m.travel)m.object.position.x=running?-.105+((t*.045+e.group.userData.id*.017)% .21):m.base;
   else m.object.rotation[m.axis]=running?m.base+t*m.speed:m.base;
   if(running)moving=true;
  }
  moving=constructionPose(e,now)||moving;
  if(!e.motion)continue;
  const t=Math.min(1,Math.max(0,(now-e.motion.start)/750)),smooth=t*t*(3-2*t);e.progress=e.motion.from+(e.target-e.motion.from)*smooth;if(t===1)e.motion=null;else moving=true;pose(e);
 }return moving;}
 function finish(){for(const e of entries.values()){for(const m of e.machines){if(m.travel)m.object.position.x=m.base;else m.object.rotation[m.axis]=m.base;}e.motion=null;e.progress=e.target;e.buildMotion=null;e.ownerMat.emissiveIntensity=0;for(const g of e.levels){g.scale.setScalar(1);g.position.y=0;}pose(e);}}
 return {root,entries,sync,tick,finish,get active(){return [...entries.values()].some(e=>e.motion||e.buildMotion);},dispose(){scene.remove(root);for(const r of resources)r.dispose();entries.clear();}};
}
