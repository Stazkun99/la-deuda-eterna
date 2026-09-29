import * as THREE from 'three';
// Supporting scenery gives the imported models a place and an activity.
export function createEventEnvironment(root,id){
 const resources=[],motions=[];const own=x=>(resources.push(x),x),group=new THREE.Group();group.name='Entorno '+id;root.add(group);
 const cube=own(new THREE.BoxGeometry(1,1,1)),sphere=own(new THREE.SphereGeometry(1,6,4));
 function material(c,opacity=1){return own(new THREE.MeshStandardMaterial({color:c,roughness:.82,transparent:opacity<1,opacity,depthWrite:opacity===1}));}
 const sand=material('#b7a179'),wood=material('#796048'),grass=material('#718c58'),road=material('#64706a'),cream=material('#eadcbb'),water=material('#378991'),foam=material('#b3e5df',.55),red=material('#b6624c'),gold=material('#d5b35f');
 function box(m,x,y,z,w,h,d){const o=new THREE.Mesh(cube,m);o.position.set(x,y,z);o.scale.set(w,h,d);o.receiveShadow=true;group.add(o);return o;}
 const port=['pedidos','cancelaciones','logistica'].includes(id),farm=['cosecha','sequia'].includes(id),market=['mercados','sanitaria'].includes(id),mine=['metales','desplome'].includes(id),energy=['energia','escasez'].includes(id);
 const outline=new THREE.Shape();outline.moveTo(-1.30,-.68);outline.lineTo(1.30,-.68);outline.quadraticCurveTo(1.425,-.68,1.425,-.55);outline.lineTo(1.425,.55);outline.quadraticCurveTo(1.425,.68,1.30,.68);outline.lineTo(-1.30,.68);outline.quadraticCurveTo(-1.425,.68,-1.425,.55);outline.lineTo(-1.425,-.55);outline.quadraticCurveTo(-1.425,-.68,-1.30,-.68);
 const baseGeometry=own(new THREE.ExtrudeGeometry(outline,{depth:.085,bevelEnabled:true,bevelSize:.012,bevelThickness:.008,bevelSegments:2,curveSegments:6}));baseGeometry.rotateX(-Math.PI/2);const base=new THREE.Mesh(baseGeometry,wood);base.position.y=-.11;base.receiveShadow=true;group.add(base);box(farm?(id==='sequia'?sand:grass):sand,0,-.008,0,2.81,.035,1.32);
 if(port){
  box(water,.68,.019,0,1.30,.02,1.30);box(road,-.68,.027,0,1.30,.035,1.27);box(cream,.01,.05,0,.09,.065,1.28);
  for(let i=0;i<6;i++){const wave=box(foam,.45+(i%2)*.54,.035,-.55+i*.21,.37,.006,.012);motions.push({o:wave,kind:'wave',base:wave.position.clone(),phase:i});}
  for(let i=0;i<5;i++)box(gold,-1.22,.055,-.50+i*.25,.12,.008,.075);
 }
 if(id==='logistica')box(road,.66,.03,0,.66,.05,.70);
 if(farm){for(let z=-.45;z<=.45;z+=.3){box(wood,-.45,.024,z,1.62,.02,.075);box(id==='sequia'?sand:water,-.45,.036,z+.10,1.60,.014,.027);}for(let i=0;i<5;i++)box(wood,-1.23+i*.50,.16,-.61,.025,.33,.025);box(cream,-.23,.25,-.61,2.1,.025,.025);}
 if(market){
  // A striped stall roof frames goods without hiding the cow or boat.
  for(const x of [-.29,.29])for(const z of [-.43,.05])box(wood,x,.30,z,.028,.60,.028);
  for(let i=0;i<6;i++)box(i%2?cream:red,-.30+i*.12,.60,-.19,.12,.035,.56);
  box(wood,0,.16,-.18,.64,.045,.43);
 }
 if(mine||energy||id==='cooperacion'){box(road,0,.025,.43,2.74,.03,.32);for(let i=0;i<8;i++)box(cream,-1.22+i*.35,.045,.43,.18,.008,.018);}
 if(['cancelaciones','sanitaria','desplome','escasez','logistica'].includes(id)){
  for(let i=0;i<2;i++){box(wood,-1.13+i*.24,.16,.48,.025,.3,.025);}box(red,-1.01,.24,.48,.37,.055,.025);
 }
 const fxColor={cosecha:'#76bce0',sequia:'#dbb96b',pedidos:'#e4dcc4',cancelaciones:'#91a4b1',mercados:'#d3b66a',sanitaria:'#b9c4bf',metales:'#ffc06b',desplome:'#bca693',energia:'#73d5cb',escasez:'#c59061',cooperacion:'#e4ca6f',logistica:'#a3b5c0'}[id];
 for(let i=0;i<10;i++){const m=material(fxColor,.4),p=new THREE.Mesh(sphere,m);p.scale.setScalar(.013);group.add(p);motions.push({o:p,kind:id==='cosecha'?'rain':id==='sequia'?'dust':mine?'spark':'drift',phase:i*.618});}
 return{tick(t,reduced=false){for(const m of motions){const o=m.o,a=t*.55+m.phase,p=a%1;if(m.kind==='wave'){o.position.x=m.base.x+Math.sin(t+m.phase)*.035;o.material.opacity=reduced?.35:.25+Math.sin(t+m.phase)*.15;continue;}
  o.visible=!reduced;if(reduced)continue;const x=Math.sin(m.phase*29)*1.25,z=Math.cos(m.phase*17)*.56;
  if(m.kind==='rain'){o.position.set(x,.7-p*.68,z);o.scale.set(.005,.04,.005);}
  else if(m.kind==='dust'){o.position.set(x+Math.sin(t+m.phase)*.08,.07+p*.15,z);o.scale.setScalar(.02);}
  else if(m.kind==='spark'){o.position.set(.4+Math.sin(m.phase*21)*p*.3,.06+Math.sin(p*Math.PI)*.3,.05+z*.3);o.scale.setScalar(.008);}
  else{o.position.set(x,.06+Math.sin(p*Math.PI)*.15,z);o.scale.setScalar(.012);}
  o.material.opacity=Math.sin(p*Math.PI)*.45;
 }return !reduced;},dispose(){group.removeFromParent();resources.forEach(r=>r.dispose());}};
}
