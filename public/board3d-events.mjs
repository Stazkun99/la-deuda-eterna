import * as THREE from 'three';
import {tilePosition} from './board3d-layout.mjs';
// Lightweight, reversible stage dressing: no changes to the underlying property models.
export function createWorldEventLayer(scene){
 const root=new THREE.Group();scene.add(root);let key=null,items=[],resources=[];
 function clear(){root.clear();for(const r of resources)r.dispose();resources=[];items=[];}
 const own=x=>(resources.push(x),x);
 function mesh(g,geo,mat,x,y,z){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);g.add(m);return m;}
 function sync(event){if(key===(event?.instancia||null))return;key=event?.instancia||null;clear();if(!event)return;
 const ring=own(new THREE.RingGeometry(.44,.49,32)),box=own(new THREE.BoxGeometry(.13,.13,.13)),orb=own(new THREE.SphereGeometry(.065,8,6));
 const mat=own(new THREE.MeshBasicMaterial({color:event.positivo?'#b4d666':'#e58a62',transparent:true,opacity:.8,depthWrite:false}));
 for(const [i,id]of event.casillas.entries()){
 const g=new THREE.Group(),pos=tilePosition(id);g.position.set(pos.x,.24,pos.z);root.add(g);const halo=mesh(g,ring,mat,0,.012,0);halo.rotation.x=-Math.PI/2;
 const parts=[];const kind=event.visual;
 if(['sprout','sun','energy','warning'].includes(kind)){
 for(let k=0;k<5;k++){const a=k*Math.PI*2/5;const m=mesh(g,kind==='sprout'?orb:box,mat,Math.cos(a)*.28,.22,Math.sin(a)*.28);if(kind==='sprout')m.scale.set(1,2,1);if(kind==='energy')m.rotation.z=Math.PI/4;parts.push(m);}
 }else if(['cargo','idle-cargo','market','crane'].includes(kind)){
 for(let k=0;k<3;k++){const m=mesh(g,box,mat,(k-1)*.2,.18,0);m.scale.set(kind==='market'?1.2:1,kind==='crane'?3:1,1);parts.push(m);}
 }else if(['up','down'].includes(kind)){
 for(let k=0;k<3;k++){const m=mesh(g,box,mat,(k-1)*.17,.15+k*.1,0);m.scale.set(.65,1+k*.6,.65);parts.push(m);}
 }else if(kind==='cross'){const a=mesh(g,box,mat,0,.35,0),b=mesh(g,box,mat,0,.35,0);a.scale.set(3,.7,.7);b.scale.set(.7,3,.7);parts.push(a,b);}
 else {for(let k=0;k<2;k++){const m=mesh(g,ring,mat,k? .12:-.12,.25,0);m.scale.setScalar(.4);parts.push(m);}}
 items.push({g,halo,parts,kind,phase:i*.6});
 }}
 function tick(now,reduced=false){if(!items.length)return false;const t=reduced?0:now/1000;for(const item of items){const {kind,parts,phase,halo}=item;halo.material.opacity=reduced?.65:.55+.18*Math.sin(t*1.8);parts.forEach((m,k)=>{const a=t+phase+k*.8;if(kind==='sprout')m.scale.y=1.5+Math.sin(a)*.6;else if(kind==='sun')m.rotation.y=a;else if(kind==='cargo')m.position.z=Math.sin(a)*.2;else if(kind==='idle-cargo')m.rotation.z=Math.sin(a*.6)*.035;else if(kind==='market')m.position.y=.18+Math.abs(Math.sin(a))*.12;else if(kind==='up'||kind==='down')m.position.y=.18+k*.08+(kind==='up'?1:-1)*Math.sin(a)*.08;else if(kind==='energy')m.position.y=.25+Math.sin(a*2)*.12;else if(kind==='warning'||kind==='cross')m.scale.z=.7+Math.abs(Math.sin(a));else if(kind==='crane')m.rotation.z=Math.sin(a)*.12;else m.rotation.z=Math.sin(a)*.25;});}return !reduced;}
 return {sync,tick,dispose(){clear();scene.remove(root);}};
}
