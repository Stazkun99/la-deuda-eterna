import * as THREE from 'three';

// Each miniature is baked into one mesh: no extra draw call per stalk, wheel or leaf.
export const SCENERY = ['Plaza latinoamericana','Cañaveral','Bananera','Cacaotero','Solidaridad','Algodonal','Tabacal','Cafetal','Condiciones FMI','Pesca','Ayuda solidaria','Ganado','Fuga de capitales','Mina de cobre','Mina de estaño','Mina de hierro','Solidaridad','Bomba petrolera','Golpe militar','Condiciones FMI','Barrera proteccionista','Caramelos','Mermelada','Chocolate','Industrialización','Ropa','Cigarrillos','Café elaborado','Condiciones FMI','Enlatados','Ayuda BID','Zapatos','Carabela','Cables','Electrónica','Tractor','Solidaridad','Gasolinera','No pagar','Sede FMI'];
export function createSceneryGeometry(id) {
  if(!Number.isInteger(id)||!SCENERY[id])throw new RangeError('Casilla inválida');
  const parts=[];
  const green='#4f9d54',leaf='#8cc958',brown='#885335',gold='#efc45a',red='#df6754',blue='#479eae',white='#f4e9ce',dark='#334d56';
  function add(g,color,x=0,y=0,z=0,sx=1,sy=1,sz=1,rz=0,rx=0){
    let geo=g.index?g.toNonIndexed():g;if(geo!==g)g.dispose();
    const matrix=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,0,rz)),new THREE.Vector3(sx,sy,sz));geo.applyMatrix4(matrix);
    const c=new THREE.Color(color),count=geo.attributes.position.count,colors=new Float32Array(count*3);for(let i=0;i<count;i++)colors.set([c.r,c.g,c.b],i*3);geo.setAttribute('color',new THREE.BufferAttribute(colors,3));parts.push(geo);
  }
  const box=(x,y,z,w,h,d,c,rz=0)=>add(new THREE.BoxGeometry(w,h,d),c,x,y,z,1,1,1,rz);
  const ball=(x,y,z,w,h,d,c)=>add(new THREE.IcosahedronGeometry(1,1),c,x,y,z,w,h,d);
  const cyl=(x,y,z,r,h,c,rz=0,rx=0)=>add(new THREE.CylinderGeometry(r,r,h,10),c,x,y,z,1,1,1,rz,rx);
  const cone=(x,y,z,r,h,c,rz=0)=>add(new THREE.ConeGeometry(r,h,8),c,x,y,z,1,1,1,rz);
  const ring=(x,y,z,r,c,rx=0)=>add(new THREE.TorusGeometry(r,.035,6,12),c,x,y,z,1,1,1,0,rx);
  function plant(x,type){cyl(x,.3,0,.025,.6,brown);for(let n=0;n<3;n++){const y=.22+n*.16;ball(x-.12,y,0,.17,.045,.07,green);ball(x+.12,y+.07,0,.17,.045,.07,leaf);}if(type==='cotton')for(let n=0;n<3;n++)ball(x+(n-1)*.1,.5+n%2*.13,.035,.1,.085,.08,white);if(type==='coffee')for(let n=0;n<4;n++)ball(x+(n%2?-.075:.075),.25+n*.08,.08,.04,.04,.04,red);if(type==='cacao')for(const side of [-1,1])ball(x+side*.06,.3,.08,.055,.13,.06,side===1?gold:red);}
  function gift(x=0){box(x,.16,0,.38,.3,.3,red);box(x,.32,0,.43,.05,.34,gold);box(x,.18,.16,.055,.29,.014,gold);ring(x-.07,.4,0,.07,gold);ring(x+.07,.4,0,.07,gold);}
  function bank(){box(0,.06,0,.8,.1,.4,white);for(const x of [-.28,-.09,.09,.28])cyl(x,.29,.06,.045,.4,white);box(0,.51,0,.8,.08,.38,blue);cone(0,.64,0,.38,.22,blue);box(0,.25,-.13,.7,.32,.06,dark);}
  function coin(x,y){cyl(x,y,0,.14,.045,gold);}
  if(id===0){box(0,.07,0,.75,.14,.4,white);cyl(0,.36,0,.04,.55,brown);box(.15,.53,0,.3,.17,.03,green);for(const x of [-.29,.29]){cyl(x,.23,0,.025,.3,brown);ball(x,.4,0,.16,.17,.12,green);}}
  else if(id===1){for(let n=0;n<5;n++){const x=(n-2)*.14,h=.42+(n%3)*.1;cyl(x,h/2,0,.033,h,green);for(let k=1;k<4;k++)cyl(x,k*h/4,0,.038,.018,gold);ball(x-.06,h,0,.12,.035,.06,leaf);ball(x+.06,h+.04,0,.12,.035,.06,green);}}
  else if(id===2){cyl(0,.32,0,.04,.62,brown);for(const s of [-1,1]){ball(s*.18,.6,0,.25,.065,.12,green);for(let n=0;n<3;n++)ball(s*(.08+n*.06),.35-n*.045,.06,.045,.13,.05,gold);}}
  else if([3,5,6,7].includes(id)){plant(-.19,({3:'cacao',5:'cotton',7:'coffee'})[id]);plant(.19,({3:'cacao',5:'cotton',7:'coffee'})[id]);}
  else if([4,16,36,10].includes(id)){gift();if(id===10){coin(-.3,.05);coin(.3,.05);}else{ball(-.3,.15,0,.12,.07,.1,white);ball(.3,.15,0,.12,.07,.1,white);}}
  else if([8,19,28].includes(id)){for(let n=0;n<3;n++){box((n-1)*.15,.26+n*.035,0,.32,.46,.04,white,-.15+n*.15);box((n-1)*.15,.29+n*.035,.028,.2,.025,.01,blue);}ball(.22,.08,.02,.13,.08,.1,red);}
  else if(id===9){box(0,.03,0,.8,.06,.4,blue);for(const x of [-.2,.18]){ball(x,.17,0,.15,.065,.07,white);cone(x-.17,.17,0,.07,.13,gold,-Math.PI/2);ball(x+.08,.2,.05,.015,.015,.015,dark);}}
  else if(id===11){ball(0,.29,0,.27,.16,.13,white);ball(.25,.36,0,.13,.12,.1,white);ball(.33,.3,.04,.07,.05,.09,red);for(const x of [-.16,.13])for(const z of [-.07,.07])cyl(x,.12,z,.035,.22,dark);ball(-.08,.39,.07,.09,.06,.08,dark);for(const z of [-.08,.08])cone(.25,.5,z,.025,.1,gold);}
  else if(id===12){box(-.1,.2,0,.4,.3,.23,brown);ring(-.1,.4,0,.08,gold);for(let n=0;n<3;n++)box(.2+n*.09,.36+n*.1,0,.18,.04,.12,green,-.3);}
  else if([13,14,15].includes(id)){const ore={13:'#db8655',14:'#b1d5d8',15:'#788f9f'}[id];for(let n=0;n<4;n++){const x=(n-1.5)*.18;ball(x,.12+n%2*.08,0,.16,.15,.15,dark);ball(x,.24+n%2*.08,.04,.08,.08,.07,ore);}box(0,.46,0,.45,.055,.06,brown,-.25);box(.1,.42,0,.06,.34,.06,white,-.25);}
  else if(id===17){box(0,.04,0,.7,.08,.34,dark);box(-.05,.27,0,.08,.48,.08,gold,.3);box(.08,.27,0,.08,.48,.08,gold,-.3);box(0,.52,0,.65,.08,.09,red,.15);box(.28,.42,0,.06,.3,.05,dark);cyl(-.28,.14,0,.1,.2,dark);}
  else if(id===18){box(0,.12,0,.66,.18,.33,dark);for(const x of [-.22,0,.22])for(const z of [-.18,.18])cyl(x,.11,z,.08,.04,brown,0,Math.PI/2);box(0,.27,0,.33,.17,.28,green);cyl(.23,.3,0,.035,.35,green,Math.PI/2);}
  else if(id===20){for(const x of [-.3,.3])box(x,.22,0,.07,.44,.09,dark);box(0,.4,0,.78,.13,.08,white);for(const x of [-.28,-.1,.08,.26])box(x,.4,.047,.07,.13,.014,red,-.35);}
  else if(id===21){for(let n=0;n<3;n++){const x=(n-1)*.26,y=.14+(n%2)*.14,c=[red,gold,blue][n];ball(x,y,0,.105,.095,.085,c);cone(x-.13,y,0,.085,.12,c,-Math.PI/2);cone(x+.13,y,0,.085,.12,c,Math.PI/2);}}
  else if(id===22){for(const x of [-.2,.2]){cyl(x,.21,0,.15,.37,red);cyl(x,.41,0,.16,.065,gold);box(x,.22,.15,.19,.16,.025,white);ball(x,.22,.17,.04,.055,.018,red);}}
  else if(id===23){box(0,.08,0,.72,.12,.34,white);for(let x=0;x<4;x++)for(let z=0;z<2;z++)box((x-1.5)*.16,.18,(z-.5)*.15,.145,.13,.13,brown);}
  else if(id===24){box(0,.21,0,.62,.4,.33,red);for(const x of [-.23,0,.23]){cone(x,.48,0,.16,.18,gold);box(x,.22,.18,.09,.12,.025,blue);}cyl(.25,.54,-.05,.055,.42,dark);}
  else if(id===25){box(0,.32,0,.3,.43,.1,blue);box(-.24,.45,0,.24,.15,.1,blue,-.4);box(.24,.45,0,.24,.15,.1,blue,.4);box(0,.53,.06,.12,.07,.02,white);}
  else if(id===26){box(-.1,.23,0,.36,.45,.2,white);box(-.1,.11,.11,.36,.18,.025,red);for(let n=0;n<3;n++){const x=.17+n*.085;cyl(x,.28,0,.032,.48,white);cyl(x,.49,0,.033,.12,brown);}}
  else if(id===27){cyl(-.12,.2,0,.2,.3,white);cyl(-.12,.355,0,.17,.015,brown);ring(.13,.23,0,.12,white);cyl(-.12,.035,0,.3,.04,blue);}
  else if(id===29){for(let n=0;n<3;n++){const x=(n-1)*.24,y=.17+(n%2)*.15;cyl(x,y,0,.12,.28,blue);cyl(x,y+.15,0,.122,.025,white);ring(x,y+.17,0,.04,dark,Math.PI/2);box(x,y,.12,.12,.07,.015,gold);}}
  else if(id===30){bank();for(let n=0;n<3;n++)coin(.3,.12+n*.06);}
  else if(id===31){for(const z of [-.1,.1]){box(0,.07,z,.58,.08,.16,dark);ball(.07,.17,z,.28,.13,.1,brown);box(-.17,.2,z,.17,.2,.17,brown);for(let n=0;n<3;n++)box(-.04+n*.07,.27,z,.025,.02,.14,white);}}
  else if(id===32){ball(0,.1,0,.4,.11,.17,brown);cyl(0,.41,0,.025,.62,brown);box(.13,.46,0,.25,.28,.025,white);box(.13,.46,.02,.035,.18,.01,red);box(.13,.46,.02,.14,.035,.01,red);}
  else if(id===33){cyl(0,.18,0,.19,.44,brown,Math.PI/2);for(const x of [-.24,.24])cyl(x,.18,0,.25,.045,gold,Math.PI/2);for(let n=0;n<6;n++)ring(-.17+n*.07,.18,0,.18,red,0);}
  else if(id===34){box(0,.08,0,.7,.1,.35,green);box(0,.2,0,.3,.13,.2,dark);for(let n=0;n<5;n++)for(const z of [-.13,.13])box((n-2)*.055,.17,z,.023,.03,.09,gold);cyl(-.25,.22,0,.045,.22,blue);cyl(.25,.17,0,.05,.13,red);}
  else if(id===35){box(0,.22,0,.58,.15,.25,green);box(-.15,.4,0,.21,.24,.23,blue);box(-.15,.55,0,.29,.05,.3,green);for(const x of [-.22,.23])for(const z of [-.17,.17]){const r=x<0?.17:.11;cyl(x,r,z,r,.07,dark,0,Math.PI/2);cyl(x,r,z,.065,.08,gold,0,Math.PI/2);}cyl(.18,.4,0,.025,.26,dark);}
  else if(id===37){box(-.08,.28,0,.3,.52,.22,red);box(-.08,.42,.12,.23,.14,.02,white);box(-.08,.43,.14,.14,.04,.01,dark);ring(.2,.28,0,.18,dark);box(.32,.37,0,.06,.15,.06,gold);}
  else if(id===38){cyl(0,.08,0,.24,.1,gold);ring(0,.37,0,.24,red);box(0,.37,0,.055,.49,.055,red,-.7);}
  else if(id===39)bank();
  // Normalize to a reserved strip at the outer edge, keeping the player lane free.
  const arrays={position:[],normal:[],color:[]};for(const g of parts){for(const key of Object.keys(arrays))arrays[key].push(...g.attributes[key].array);g.dispose();}
  const geometry=new THREE.BufferGeometry();for(const [key,data] of Object.entries(arrays))geometry.setAttribute(key,new THREE.Float32BufferAttribute(data,3));
  geometry.computeBoundingBox();const bounds=geometry.boundingBox,size=new THREE.Vector3();bounds.getSize(size);
  geometry.translate(-(bounds.min.x+bounds.max.x)/2,-bounds.min.y,-(bounds.min.z+bounds.max.z)/2);
  geometry.scale(.8/Math.max(size.x,.8),Math.min(1,.68/size.y),.32/Math.max(size.z,.32));geometry.computeBoundingSphere();geometry.computeBoundingBox();return geometry;
}
