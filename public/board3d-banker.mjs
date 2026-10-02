import * as THREE from 'three';
import {tilePosition} from './board3d-layout.mjs';

// A presentation-only cashier. All amounts and transfers remain server-authoritative.
export function createBanker(scene){
 const owned=new Set(),own=r=>(owned.add(r),r),root=new THREE.Group();root.name='Banquero del FMI';scene.add(root);
 const mat=(color,extra={})=>own(new THREE.MeshStandardMaterial({color,roughness:.65,...extra}));
 const suit=mat('#243449'),skin=mat('#dca579'),shirt=mat('#f9efdc'),hair=mat('#3c2b25'),dark=mat('#171e27'),gold=mat('#cfa75b',{metalness:.55,roughness:.35}),paper=mat('#97b78d');
 function mesh(geometry,material,parent,x,y,z){const o=new THREE.Mesh(own(geometry),material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 const box=(w,h,d,m,p,x,y,z)=>mesh(new THREE.BoxGeometry(w,h,d),m,p,x,y,z);
 const ball=(r,m,p,x,y,z,s=[1,1,1])=>{const o=mesh(new THREE.SphereGeometry(r,16,12),m,p,x,y,z);o.scale.set(...s);return o;};
 const body=new THREE.Group();root.add(body);
 box(.30,.32,.19,suit,body,0,.47,0);box(.12,.23,.012,shirt,body,0,.51,.103);
 const tie=box(.038,.18,.02,gold,body,0,.49,.119);tie.rotation.z=.08;
 for(const x of [-.078,.078])box(.085,.20,.014,suit,body,x,.53,.12).rotation.z=x<0?-.24:.24;
 ball(.145,skin,body,0,.79,0,[.88,1.08,.91]);ball(.145,hair,body,0,.867,-.026,[.87,.49,.9]);
 ball(.024,skin,body,0,.77,.145,[.65,.8,1.25]);
 for(const x of [-.071,.071]){const glasses=mesh(new THREE.TorusGeometry(.047,.009,5,16),dark,body,x,.805,.132);ball(.009,dark,body,x,.806,.137);}
 box(.05,.012,.018,dark,body,0,.805,.143);box(.05,.009,.012,hair,body,0,.725,.126);
 box(.055,.07,.014,gold,body,-.105,.47,.113);
 const legs=[],arms=[];
 for(const side of [-1,1]){
  const leg=new THREE.Group();leg.position.set(side*.085,.32,0);body.add(leg);box(.105,.23,.115,suit,leg,0,-.115,0);box(.12,.055,.19,dark,leg,0,-.245,.035);legs.push(leg);
  const arm=new THREE.Group();arm.position.set(side*.185,.59,0);body.add(arm);box(.085,.21,.10,suit,arm,0,-.105,0);box(.08,.035,.092,shirt,arm,0,-.218,0);ball(.049,skin,arm,0,-.263,0);arms.push(arm);
 }
 const briefcase=new THREE.Group();arms[0].add(briefcase);briefcase.position.set(0,-.37,0);box(.23,.17,.10,hair,briefcase,0,0,0);box(.08,.05,.025,gold,briefcase,0,.105,0);box(.035,.026,.015,gold,briefcase,0,.02,.055);
 const notes=new THREE.Group();arms[1].add(notes);notes.position.set(0,-.265,.06);box(.13,.022,.075,paper,notes,0,0,0);box(.025,.024,.077,shirt,notes,0,0,0);notes.visible=false;
 const shadow=mesh(new THREE.CircleGeometry(.22,24),own(new THREE.MeshBasicMaterial({color:'#16120e',transparent:true,opacity:.22,depthWrite:false})),root,0,.003,0);shadow.rotation.x=-Math.PI/2;shadow.castShadow=false;
 // Interior perimeter stays clear of both decks and the event stage in the middle.
 const radius=3.9,side=radius*2,perimeter=side*4,home=side+side*.93;
 const point=s=>{s=((s%perimeter)+perimeter)%perimeter;const q=Math.floor(s/side),t=s%side;return [new THREE.Vector3(-radius+t,.105,-radius),new THREE.Vector3(radius,.105,-radius+t),new THREE.Vector3(radius-t,.105,radius),new THREE.Vector3(-radius,.105,radius-t)][q];};
 let motion=null,current=home,last=0,clock=0;root.position.copy(point(home));root.rotation.y=Math.PI;
 function pose(){body.position.y=0;body.rotation.z=0;legs.forEach(l=>l.rotation.x=0);arms.forEach(a=>a.rotation.x=0);notes.visible=false;}
 function finish(){motion=null;pose();}
 function start(data,duration,now=performance.now()){
  if(!data||!(data.monto>0)||!Number.isInteger(data.casilla)||data.casilla<0||data.casilla>39)return;
  const target=tilePosition(data.casilla),origin=point(current);
  const forward=point(current+.1).sub(origin),toward=new THREE.Vector3(target.x,0,target.z).sub(origin),direction=forward.dot(toward)>=0?1:-1;
  // Short walk towards the operation, then hand over / request the funds. No teleporting.
  motion={start:clock,from:current,to:current+direction*1.35,duration,collect:data.direccion==='cobrar',confirmed:!!data.fmi||!!data.tributo,target,returning:false};last=now;
 }
 function tick(now,reduced=false,paused=false,ambient=true){
  const delta=last?Math.max(0,Math.min(100,now-last)):0;last=now;if(paused)return false;clock+=delta;
  if(reduced){finish();return false;}if(!motion){pose();if(!ambient)return false;current+=delta*.00024;root.position.copy(point(current));const next=point(current+.05);root.rotation.y=Math.atan2(next.x-root.position.x,next.z-root.position.z);const stride=Math.sin(clock*.006);legs[0].rotation.x=stride*.25;legs[1].rotation.x=-stride*.25;arms[1].rotation.x=-stride*.18;body.position.y=Math.abs(stride)*.009;return true;}
  const m=motion,t=THREE.MathUtils.clamp((clock-m.start)/m.duration,0,1),walk=t<.38,back=t>.78;
  let u=walk?t/.38:back?1-(t-.78)/.22:1;u=u*u*(3-2*u);current=THREE.MathUtils.lerp(m.from,m.to,u);root.position.copy(point(current));
  const goal=walk?point(current+(m.to-m.from)*.02):back?point(current-(m.to-m.from)*.02):new THREE.Vector3(m.target.x,.105,m.target.z);
  root.rotation.y=Math.atan2(goal.x-root.position.x,goal.z-root.position.z);
  pose();if(walk||back){const stride=Math.sin(clock*.016);legs[0].rotation.x=stride*.48;legs[1].rotation.x=-stride*.48;arms[1].rotation.x=-stride*.30;arms[0].rotation.x=stride*.14;body.position.y=Math.abs(stride)*.018;}
  else{const gesture=Math.sin((t-.38)/.40*Math.PI);arms[1].rotation.x=-1.1*gesture;body.rotation.z=-.04*gesture;notes.visible=m.collect||(m.confirmed&&t>.57);}
  if(t>=1){current=m.from;root.position.copy(point(current));finish();return false;}return true;
 }
 return {start,tick,finish,root,get active(){return !!motion;},dispose(){finish();root.removeFromParent();for(const r of owned)r.dispose();}};
}
