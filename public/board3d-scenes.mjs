import * as THREE from 'three';
import {createSceneryGeometry} from './board3d-scenery.mjs';

export const FARM_SPACES=[1,2,3,5,6,7];
const WATER_SPACES=[9,32];
const FACTORY_SPACES=[17,21,22,23,24,25,26,27,29,31,33,34,35,37];

// Low scenery sits below the imported GLB footprints. A separate subject is
// kept for spaces without a downloaded model, preserving all forty themes.
export function createLotScene(id,hasDownloadedModel=false) {
  if(!Number.isInteger(id)||id<0||id>39)throw new RangeError('Casilla inválida');
  const parts=[];
  function add(source,color,x=0,y=0,z=0,sx=1,sy=1,sz=1,ry=0){
    const g=source.index?source.toNonIndexed():source;if(g!==source)source.dispose();
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,ry,0)),new THREE.Vector3(sx,sy,sz)));
    if(color){const c=new THREE.Color(color),values=new Float32Array(g.attributes.position.count*3);for(let n=0;n<values.length;n+=3)values.set([c.r,c.g,c.b],n);g.setAttribute('color',new THREE.BufferAttribute(values,3));}
    parts.push(g);
  }
  const box=(x,y,z,w,h,d,color)=>add(new THREE.BoxGeometry(w,h,d),color,x,y,z);
  const oval=(x,y,z,w,h,d,color)=>add(new THREE.SphereGeometry(1,10,7),color,x,y,z,w,h,d);
  const stem=(x,y,z,r,h,color)=>add(new THREE.CylinderGeometry(r*.8,r,h,8),color,x,y,z);
  function leaf(x,y,z,angle,length,width,color){
    const vertices=[],indices=[];
    for(let n=0;n<=8;n++)for(const side of [-1,0,1]){
      const t=n/8,w=Math.sin(t*Math.PI)*width*side;
      vertices.push(x+Math.sin(angle)*length*t+Math.cos(angle)*w,y+Math.sin(t*Math.PI)*length*.22-t*t*length*.17-Math.abs(side)*width*.15,z+Math.cos(angle)*length*t-Math.sin(angle)*w);
    }
    for(let n=0;n<8;n++)for(let c=0;c<2;c++){const a=n*3+c,b=a+3;indices.push(a,b,a+1,b,b+1,a+1);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();
    const back=g.clone(),reverse=[...indices];for(let n=0;n<reverse.length;n+=3)[reverse[n],reverse[n+2]]=[reverse[n+2],reverse[n]];back.setIndex(reverse);back.computeVertexNormals();add(g,color);add(back,color);
  }
  const farm=FARM_SPACES.includes(id),water=WATER_SPACES.includes(id),industrial=FACTORY_SPACES.includes(id);
  box(0,.022,-1.01,.93,.032,1.02,water?'#72aeb4':farm||id===11?'#91a660':industrial?'#9da398':'#d0c6a7');
  // A narrow continuous walkway, bordered by low stones.
  for(let n=0;n<6;n++)box(-.35+n*.14,.045,-.61,.128,.016,.10,n%2?'#d8c59e':'#c9b68f');
  for(const x of [-.445,.445])box(x,.047,-1.02,.022,.024,.98,'#c6ae7b');
  if(farm){
    box(0,.043,-1.45,.84,.023,.055,'#599ca7');
    for(const z of [-.79,-1.055,-1.31])box(0,.045,z,.78,.025,.17,'#866343');
    for(let n=0;n<15;n++)oval(-.37+(n%5)*.18,.058,-.72-Math.floor(n/5)*.27,.016,.007,.013,'#b5a374');
  }
  if(id===1){
    for(let row=0;row<3;row++)for(let col=0;col<5;col++){
      const x=-.29+col*.14,z=-.8-row*.25,h=.3+((row+col)%3)*.045;
      stem(x,h/2+.05,z,.012,h,'#779949');
      for(let n=1;n<5;n++)stem(x,.05+n*h/5,z,.014,.012,'#bbba6c');
      for(let n=0;n<4;n++)leaf(x,h+.05-n*.02,z,n*1.7,.105,.015,n%2?'#507b3e':'#91ab50');
    }
  }else if(id===2){
    for(const [x,z,h] of [[-.23,-.86,.36],[.21,-1.23,.43],[-.23,-1.25,.39]]){
      stem(x,h/2+.05,z,.023,h,'#8b9450');
      for(let n=0;n<6;n++)leaf(x,h+.05,z,n*Math.PI/3,.17,.043,n%2?'#588a43':'#85a855');
      for(let n=0;n<6;n++)oval(x+.028+(n%2)*.02,h-.02-Math.floor(n/2)*.022,z+.025,.014,.03,.012,'#debf57');
    }
    box(.24,.095,-.76,.22,.095,.15,'#b3955f');
    for(const x of [.15,.33])box(x,.102,-.68,.013,.10,.012,'#836a43');
  }else if(id===3){
    for(const [x,z,h] of [[-.23,-.88,.28],[.20,-1.24,.36],[-.23,-1.29,.32]]){
      stem(x,h/2+.05,z,.022,h,'#815839');
      for(let n=0;n<12;n++)leaf(x+Math.sin(n*2.4)*.055,h+.035+(n%3)*.027,z+Math.cos(n*2.4)*.055,n*2.4,.105,.032,n%2?'#50814a':'#779344');
      for(const s of [-1,1])oval(x+s*.035,h*.65,z+.018,.024,.061,.024,s<0?'#b5653b':'#ce9d48');
    }
    for(const x of [.14,.34])for(const z of [-.72,-.91])box(x,.10,z,.018,.15,.018,'#795b3e');
    for(let n=0;n<6;n++)box(.14+n*.039,.18,-.81,.032,.023,.24,'#b8935d');
    for(let n=0;n<20;n++)oval(.16+(n%5)*.04,.198,-.9+Math.floor(n/5)*.05,.014,.008,.01,'#71472f');
  }else if([5,6,7].includes(id)){
    for(let row=0;row<3;row++)for(let col=0;col<3;col++){
      const x=-.26+col*.25,z=-.82-row*.24,h=.22+(col%2)*.04;
      stem(x,h/2+.045,z,.009,h,'#817844');
      for(let n=0;n<6;n++)leaf(x,h+.02-n*.022,z,n*1.8,.11,id===6?.04:.023,n%2?'#729543':'#4e7e43');
      if(id===5)for(let n=0;n<3;n++)oval(x+(n-1)*.034,h+.035,z,.03,.026,.028,'#f4ecd8');
      if(id===7)for(let n=0;n<6;n++)oval(x+(n%2?-.018:.018),h-.018-Math.floor(n/2)*.025,z+.02,.012,.012,.012,'#b65b43');
    }
  }
  if(water){
    for(let n=0;n<9;n++)box(-.34+(n%3)*.29,.043,-.88-Math.floor(n/3)*.21,.105,.004,.008,'#b9d6c8');
    for(let n=0;n<7;n++)box(-.34,.073,-.74-n*.093,.11,.025,.08,'#af9163');
    for(const z of [-.75,-1.30])stem(-.40,.06,z,.013,.15,'#735b41');
  }
  if(id===11){
    for(let n=0;n<6;n++)box(-.38+n*.15,.12,-1.42,.022,.19,.022,'#a58a5b');
    for(const y of [.10,.17])box(0,y,-1.42,.78,.022,.025,'#cfb887');
    box(.25,.09,-.74,.22,.08,.12,'#92734c');box(.25,.135,-.74,.18,.007,.085,'#71adb5');
  }
  if(industrial){
    for(let n=0;n<4;n++)box(-.21+n*.14,.043,-.69,.065,.006,.025,'#e0c776');
    for(const x of [-.40,.40]){stem(x,.082,-1.40,.025,.075,'#788079');stem(x,.124,-1.40,.026,.008,'#cfc097');}
  }
  if([13,14,15].includes(id)){
    for(const x of [-.075,.075])box(x,.052,-.86,.012,.018,.49,'#8d9990');
    for(let n=0;n<5;n++)box(0,.041,-.7-n*.095,.20,.014,.023,'#95784c');
  }
  if(!hasDownloadedModel&&!farm){
    const g=createSceneryGeometry(id);
    add(g,null,0,.057,-1.08,.83,.83,1.4);
    if([8,19,28,22,25,26,31,33,38].includes(id))box(0,.052,-1.08,.75,.025,.54,'#c2af85');
  }
  const geometry=new THREE.BufferGeometry();
  for(const key of ['position','normal','color']){
    const data=new Float32Array(parts.reduce((n,g)=>n+g.attributes[key].array.length,0));let offset=0;
    for(const g of parts){data.set(g.attributes[key].array,offset);offset+=g.attributes[key].array.length;}
    geometry.setAttribute(key,new THREE.BufferAttribute(data,3));
  }
  parts.forEach(g=>g.dispose());geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;
}
