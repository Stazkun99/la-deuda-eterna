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
 const roof=mat('#344f58',.35),light=mat('#ffdfa0'),steel=mat('#b7c7cb',.5),warning=mat('#f4c650'),dark=mat('#344044');
 function box(parent,x,y,z,w,h,d,material){const m=new THREE.Mesh(cube,material);m.position.set(x,y,z);m.scale.set(w,h,d);parent.add(m);return m;}
 for(const cell of board.filter(c=>c.region==='sur'||c.region==='norte')){
  const group=new THREE.Group(),anchor=tileAnchor(cell.id);group.position.set(anchor.x,.215,anchor.z);group.rotation.y=tileAngle(cell.id);group.userData.id=cell.id;root.add(group);
  // All geometry is in local tile coordinates, relative to the player lane anchor.
  const building=new THREE.Group();building.position.set(.265,0,-.5);group.add(building);
  const ownerMat=mat('#879796'),shell=mat(cell.region==='sur'?'#d48a57':'#4e9fba',.2),levels=[];
  box(building,0,.025,0,.32,.05,.29,roof);
  for(let n=0;n<3;n++){
   const floor=new THREE.Group();building.add(floor);levels.push(floor);
   if(cell.region==='sur'){
    const x=(n-1)*.09;box(floor,x,.16,0,.085,.24,.24,shell);box(floor,x,.29,0,.092,.045,.26,roof);
    box(floor,x,.37,-.065,.035,.16,.04,steel);box(floor,x,.15,.126,.045,.07,.012,light);
   }else{
    const y=.09+n*.17;box(floor,0,y+.06,0,.245,.16,.23,shell);
    box(floor,0,y+.15,0,.28,.025,.25,steel);
    for(const x of [-.065,.065])box(floor,x,y+.07,.12,.045,.085,.01,light);
   }
  }
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
  entries.set(cell.id,{group,building,levels,indicators,ownerMat,shell,gate,shutter,lamp,north:cell.region==='norte',progress:0,target:0,motion:null,initialized:false});
 }
 function pose(e){if(!e.gate)return;e.gate.visible=e.progress>0||e.target===1;e.shutter.scale.y=Math.max(.015,e.progress);e.shutter.position.y=.67*(1-e.progress);}
 function sync(state,animate=false,now=performance.now()){
  for(const cell of state.tablero){const e=entries.get(cell.id);if(!e)continue;const view=industryView(cell,state);
   e.building.visible=view.level>0;e.levels.forEach((g,i)=>g.visible=i<view.level);e.indicators.forEach((m,i)=>m.visible=i<view.level);
   e.ownerMat.color.set(view.color);e.shell.color.set(view.closed||view.blocked?'#87918e':e.north?'#4e9fba':'#d48a57');
   const target=view.blocked?1:0;
   if(!e.initialized||!animate){e.target=target;e.progress=target;e.motion=null;}
   else if(target!==e.target){e.target=target;e.motion={from:e.progress,start:now};}
   e.initialized=true;pose(e);
  }
 }
 function tick(now){let moving=false;for(const e of entries.values()){if(!e.motion)continue;const t=Math.min(1,Math.max(0,(now-e.motion.start)/750)),smooth=t*t*(3-2*t);e.progress=e.motion.from+(e.target-e.motion.from)*smooth;if(t===1)e.motion=null;else moving=true;pose(e);}return moving;}
 function finish(){for(const e of entries.values()){e.motion=null;e.progress=e.target;pose(e);}}
 return {root,entries,sync,tick,finish,dispose(){scene.remove(root);for(const r of resources)r.dispose();entries.clear();}};
}
