import * as THREE from 'three';
import {createSceneryGeometry} from './board3d-scenery.mjs';
// Small identity details complement the downloaded buildings, keeping the token lane clear.
export function createPlaceDetails(lots){
 const resources=[],groups=[];const own=r=>(resources.push(r),r);const cube=own(new THREE.BoxGeometry(1,1,1));
 const mat=c=>own(new THREE.MeshStandardMaterial({color:c,roughness:.75}));const paper=mat('#fff3d2'),green=mat('#23694e'),blue=mat('#244477'),red=mat('#bc5146'),gold=mat('#caa459'),leather=mat('#78432b'),sole=mat('#302b27');
 function box(g,m,x,y,z,w,h,d){const o=new THREE.Mesh(cube,m);o.position.set(x,y,z);o.scale.set(w,h,d);g.add(o);return o;}
 function sign(g,text,color,x,y,z,w=.65,h=.17){if(typeof document==='undefined')return;const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const c=canvas.getContext('2d');c.fillStyle=color;c.fillRect(0,0,512,128);c.strokeStyle='#dfcf99';c.lineWidth=6;c.strokeRect(4,4,504,120);c.fillStyle='#fff7df';c.font='bold 44px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(text,256,65,480);const texture=own(new THREE.CanvasTexture(canvas));texture.colorSpace=THREE.SRGBColorSpace;const m=own(new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide})),mesh=new THREE.Mesh(own(new THREE.PlaneGeometry(w,h)),m);mesh.position.set(x,y,z);g.add(mesh);}
 for(const id of [0,4,16,36,10,30,8,19,28,31,22,25,26,33]){const lot=lots.get(id);if(!lot)continue;const g=new THREE.Group();g.name='Identidad de '+id;lot.add(g);groups.push(g);
 if(id===0){
  // A race start gate: no extra nameplate and no invented official regional flag.
  const ink=mat('#263740'),yellow=mat('#e4b94f');
  box(g,red,0,.048,-.99,.79,.045,.73);
  for(const x of [-.36,.36]){
   box(g,sole,x,.085,-1.02,.14,.075,.19);
   box(g,x<0?blue:red,x,.30,-1.02,.085,.46,.095);
   box(g,gold,x,.535,-1.02,.11,.04,.12);
  }
  box(g,paper,0,.535,-1.02,.80,.10,.105);
  for(let col=0;col<12;col++)for(let row=0;row<2;row++){
   box(g,(col+row)%2?ink:paper,-.3575+col*.065,.077,-.78+row*.065,.065,.013,.065);
   box(g,(col+row)%2?ink:paper,-.3575+col*.065,.514+row*.042,-.961,.065,.042,.008);
  }
  const colors=[blue,paper,red,yellow,green,blue,red];
  box(g,gold,0,.448,-1.00,.64,.008,.009);
  for(let i=0;i<colors.length;i++){
   const geo=own(new THREE.BufferGeometry());geo.setAttribute('position',new THREE.Float32BufferAttribute([-.035,0,0,.035,0,0,0,-.075,0, .035,0,0,-.035,0,0,0,-.075,0],3));geo.computeVertexNormals();
   const flag=new THREE.Mesh(geo,colors[i]);flag.position.set(-.27+i*.09,.446,-.98);g.add(flag);
  }
 }
 if([4,16,36].includes(id)){sign(g,'SOLIDARIDAD','#b52e35',0,.39,-.98);box(g,green,0,.085,-.76,.65,.06,.28);}
 if([22,25,26,33].includes(id)){
  // Keep recognizable products until licensed downloaded replacements arrive.
  const product=new THREE.Mesh(own(createSceneryGeometry(id)),own(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.78})));
  product.name='Producto provisional '+id;product.scale.set(.55,.55,.70);product.position.set(0,.07,-.76);product.castShadow=true;product.receiveShadow=true;g.add(product);
  box(g,gold,0,.043,-.76,.61,.04,.30);
 }
 if(id===30){box(g,gold,.32,.30,-1.20,.018,.50,.018);for(let i=0;i<7;i++)box(g,i%2?paper:red,.23,.46-i*.019,-1.2,.19,.019,.009);box(g,blue,.18,.44,-1.19,.085,.075,.012);}
 if([8,19,28].includes(id)){sign(g,'FMI · CONDICIONES','#244477',-.13,.43,-1.02,.61,.13);const folder=new THREE.Group();folder.position.set(.18,.09,-.80);folder.rotation.x=-.32;folder.rotation.y=-.20;g.add(folder);box(folder,blue,0,.018,0,.32,.036,.36);box(folder,paper,0,.041,0,.28,.018,.31);for(let i=0;i<4;i++)box(folder,blue,-.016,.053,-.09+i*.038,.19,.003,.008);box(folder,red,.066,.057,.075,.055,.008,.035);box(g,gold,-.21,.09,-.78,.1,.09,.1);box(g,blue,-.21,.155,-.78,.055,.06,.055);}
 if(id===31){for(const z of [-.89,-.69]){const shoe=new THREE.Group();shoe.name="Zapato "+z;shoe.position.set(0,.075,z);g.add(shoe);const shape=new THREE.Shape();shape.moveTo(-.19,-.073);shape.quadraticCurveTo(.17,-.10,.21,-.035);shape.quadraticCurveTo(.24,.08,.10,.087);shape.lineTo(-.19,.073);shape.closePath();const base=new THREE.Mesh(own(new THREE.ExtrudeGeometry(shape,{depth:.023,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.009,bevelThickness:.005,curveSegments:10})),sole);base.rotation.x=-Math.PI/2;shoe.add(base);
 const positions=[],indices=[],stations=[[-.18,.071,.13],[-.12,.078,.15],[-.05,.079,.135],[.04,.083,.10],[.13,.077,.075],[.20,.025,.035]];for(const [x,w,h]of stations)for(let j=0;j<=12;j++){const t=j*Math.PI/12;positions.push(x,.025+Math.sin(t)*h,Math.cos(t)*w);}for(let i=0;i<stations.length-1;i++)for(let j=0;j<12;j++){const a=i*13+j;indices.push(a,a+13,a+1,a+1,a+13,a+14);}const geo=own(new THREE.BufferGeometry());geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();shoe.add(new THREE.Mesh(geo,leather));box(shoe,sole,-.14,.15,0,.075,.012,.082);for(let n=0;n<4;n++)box(shoe,paper,-.07+n*.032,.156-n*.012,0,.013,.008,.095);}}
 }
 return{dispose(){for(const g of groups)g.removeFromParent();for(const r of resources)r.dispose();}};
}
