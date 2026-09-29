import * as THREE from 'three';
// Indexed by board space, so repeated card squares still have their own timing/palette.
export const TILE_ACTIONS=['start','sugar','banana','cacao','aid','cotton','tobacco','coffee','fmi','fish','build','cattle','escape','copper','tin','iron','aid','oil','tank','fmi','gate','candy','jam','chocolate','build','cloth','paper','brew','fmi','cans','aid','shoes','ship','spark','screen','tractor','aid','fuel','protest','fmi'];
export function createTileChoreography(lots){
 const resources=new Set(),groups=new Map(),actors=new Map(),shots=new Map();let disposed=false;
 const own=x=>(resources.add(x),x),dot=own(new THREE.SphereGeometry(1,6,4)),square=own(new THREE.PlaneGeometry(1,1));
 const palettes={spark:'#9deaff',screen:'#7cffe3',copper:'#df9464',tin:'#d9e9ed',iron:'#f1ba72',fish:'#8ed7e5',fuel:'#ffc975',fmi:'#809ce6',aid:'#ed947e'};
 for(const [id,lot]of lots){const root=new THREE.Group();root.name='Reacción '+id;lot.add(root);groups.set(id,root);const kind=TILE_ACTIONS[id];
  // Small contextual accents, hidden until arrival; never a second copy of a building.
  for(let i=0;i<12;i++){const mat=own(new THREE.MeshBasicMaterial({color:palettes[kind]||(['cotton','paper'].includes(kind)?'#fff0db':'#e8c96d'),transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));const p=new THREE.Mesh(['paper','cloth','fmi','aid','escape','start'].includes(kind)?square:dot,mat);p.visible=false;root.add(p);}
  if(kind==='spark'){const points=[new THREE.Vector3(-.2,.19,-.8),new THREE.Vector3(-.09,.27,-.8),new THREE.Vector3(-.02,.19,-.8),new THREE.Vector3(.08,.3,-.8),new THREE.Vector3(.22,.22,-.8)];const bolt=new THREE.Line(own(new THREE.BufferGeometry().setFromPoints(points)),own(new THREE.LineBasicMaterial({color:'#c3f3ff',transparent:true,opacity:0,depthWrite:false})));bolt.name='Arco eléctrico';root.add(bolt);}
 }
 function remember(o){if(!actors.has(o))actors.set(o,{p:o.position.clone(),r:o.rotation.clone(),s:o.scale.clone()});return actors.get(o);}
 function discover(id,lot){const out=[];for(const o of lot.children){const f=o.userData.assetFile;if(f&&!f.startsWith('industrial/')&&!f.startsWith('comercial/')&&!f.includes('bomba-petrolera')&&!f.includes('tanque')&&!f.includes('palmera')&&!f.includes('obelisco'))out.push(o);if(o.name==='Identidad de '+id)for(const child of o.children)if(child.name.startsWith('Producto provisional')||child.name.startsWith('Zapato '))out.push(child);}return out;}
 function restore(){for(const[o,b]of actors){o.position.copy(b.p);o.rotation.copy(b.r);o.scale.copy(b.s);}}
 function finish(){shots.clear();restore();for(const g of groups.values())for(const o of g.children){o.visible=false;o.material.opacity=0;}}
 function tick(now,reduced=false,idle=true){if(disposed)return false;if(reduced){finish();return false;}restore();const t=now/1000;
  for(const[id,lot]of lots){const kind=TILE_ACTIONS[id],shot=shots.get(id),u=shot===undefined?null:Math.max(0,(now-shot)/1500),hit=u!==null&&u<1,envelope=hit?Math.sin(Math.PI*u):0,a=t*1.5+id*.7;
   if(u!==null&&!hit)shots.delete(id);
   const props=discover(id,lot);
   props.forEach((o,n)=>{const b=remember(o),f=o.userData.assetFile||'',pace=hit?10:1.6,amp=hit?1:idle?.16:0;if(!amp)return;
    if(kind==='shoes'&&o.name.startsWith('Zapato ')){const step=t*pace+n*Math.PI;o.position.y=b.p.y+Math.max(0,Math.sin(step))*.09*amp;o.position.x=b.p.x+Math.cos(step)*.09*amp;o.rotation.z=b.r.z+Math.sin(step)*.22*amp;}
    else if(kind==='cans'||kind==='candy'||kind==='chocolate'||kind==='brew'){if(!f.includes('caja')){o.position.y=b.p.y+Math.abs(Math.sin(a*pace+n))*.045*amp;o.rotation.z=b.r.z+Math.sin(a*pace+n)*.16*amp;}}
    else if(kind==='cloth'||kind==='paper'){o.rotation.z=b.r.z+Math.sin(a*pace)*.08*amp;o.rotation.y=b.r.y+Math.sin(a*pace*.7)*.10*amp;}
    else if(kind==='jam'){o.rotation.y=b.r.y+Math.sin(a*pace)*.12*amp;}
    else if(kind==='tractor'&&f.includes('tractor')){o.position.z=b.p.z+Math.sin(t*(hit?5:1))*.04*amp;o.rotation.z=b.r.z+Math.sin(t*17)*.012*amp;}
    else if(hit&&['copper','tin','iron'].includes(kind)&&f.includes('roca')){o.position.y=b.p.y+Math.abs(Math.sin(a*(hit?7:1)))*.035*amp;}
    else if(kind==='build'&&f.includes('robotico'))o.rotation.y=b.r.y+Math.sin(a*(hit?4:1))*.24*amp;
    else if(kind==='gate'&&f.includes('porton'))o.position.y=b.p.y+envelope*.18;
    else if(kind==='fish'&&f.includes('pescado')){o.position.y=b.p.y+envelope*.19;o.rotation.z=b.r.z+Math.sin((u||0)*Math.PI*2)*.5*envelope;}
    else if(kind==='aid'&&f.includes('alimentos'))o.position.y=b.p.y+envelope*.08;
   });
   const group=groups.get(id);group.children.forEach((p,i)=>{if(p.name==='Arco eléctrico'){p.visible=hit;p.material.opacity=hit?(.5+.5*Math.sin(u*48))*envelope:0;return;}
    const continuous=idle&&['screen','oil','fuel'].includes(kind),v=hit?((u*2+i/12)%1):((t*.22+i/12)%1);
    p.visible=hit||(continuous&&i<3);if(!p.visible)return;const strength=hit?envelope:.14;
    const radius=kind==='spark'?.25:.22,theta=i*2.4+id;
    p.position.set(Math.cos(theta)*radius*(.3+v),.1+v*(hit?.36:.15),-1.02+Math.sin(theta)*.22*(.3+v));
    if(['escape','start'].includes(kind))p.position.x+=v*.10;
    p.rotation.set(v*3,theta,v*4);p.scale.setScalar((kind==='spark'?.012:.023)*(1-v*.5));if(p.geometry===square)p.scale.multiplyScalar(1.6);
    p.material.opacity=strength*(1-v)*.85;
   });
  }
  return idle||shots.size>0;
 }
 return{tick,land(id,now=performance.now()){if(!disposed&&TILE_ACTIONS[id])shots.set(id,now);},get active(){return shots.size>0;},finish,dispose(){if(disposed)return;finish();disposed=true;for(const g of groups.values())g.removeFromParent();resources.forEach(r=>r.dispose());actors.clear();}};
}
