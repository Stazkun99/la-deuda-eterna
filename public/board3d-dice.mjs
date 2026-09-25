import * as THREE from 'three';
export const DICE_FACES=[{value:1,normal:[0,1,0]},{value:6,normal:[0,-1,0]},{value:3,normal:[1,0,0]},{value:4,normal:[-1,0,0]},{value:2,normal:[0,0,1]},{value:5,normal:[0,0,-1]}];
const patterns={1:[[0,0]],2:[[-1,-1],[1,1]],3:[[-1,-1],[0,0],[1,1]],4:[[-1,-1],[-1,1],[1,-1],[1,1]],5:[[-1,-1],[-1,1],[0,0],[1,-1],[1,1]],6:[[-1,-1],[-1,0],[-1,1],[1,-1],[1,0],[1,1]]};
export function diceOrientation(value,index=0){
 const face=DICE_FACES.find(f=>f.value===value);if(!face)throw new RangeError('Dado inválido');
 return new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),index*.38-.25).multiply(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(...face.normal),new THREE.Vector3(0,1,0)));
}
export function validRoll(roll){return !!roll&&typeof roll.id==='string'&&Array.isArray(roll.dados)&&(['fuga','inicial'].includes(roll.tipo)?roll.dados.length===1:[2,3,4].includes(roll.dados.length))&&roll.dados.every(v=>Number.isInteger(v)&&v>=1&&v<=6)&&roll.total===roll.dados.reduce((a,b)=>a+b,0);}
export function createDiceTray(scene,onLabel=()=>{}){
 const resources=[],dice=[],root=new THREE.Group();scene.add(root);root.visible=false;
 const own=r=>(resources.push(r),r);
 const shape=new THREE.Shape();shape.moveTo(-.31,-.31);shape.lineTo(.31,-.31);shape.lineTo(.31,.31);shape.lineTo(-.31,.31);shape.closePath();
 const bodyGeo=own(new THREE.ExtrudeGeometry(shape,{depth:.62,bevelEnabled:true,bevelThickness:.04,bevelSize:.04,bevelSegments:2,steps:1}));bodyGeo.translate(0,0,-.31);
 const bodyMat=own(new THREE.MeshStandardMaterial({color:'#fff2d2',roughness:.32,metalness:.08}));
 const pipGeo=own(new THREE.SphereGeometry(.051,8,6)),pipMat=own(new THREE.MeshStandardMaterial({color:'#233c38',roughness:.8}));
 for(let i=0;i<4;i++){
  const group=new THREE.Group();group.add(new THREE.Mesh(bodyGeo,bodyMat));
  const pips=new THREE.InstancedMesh(pipGeo,pipMat,21);let index=0;
  for(const face of DICE_FACES){const normal=new THREE.Vector3(...face.normal),rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),normal);
   for(const [x,y] of patterns[face.value]){const position=new THREE.Vector3(x*.16,y*.16,.352).applyQuaternion(rotation);const matrix=new THREE.Matrix4().compose(position,rotation,new THREE.Vector3(1,1,.19));pips.setMatrixAt(index++,matrix);}
  }group.add(pips);root.add(group);dice.push({group,end:new THREE.Quaternion()});
 }
 let seen=null,current=null,start=null;
 function label(){if(current)onLabel((current.jugador||'Jugador')+(current.tipo==='inicial'?' · Dado inicial: '+current.total+' → $'+(5000+current.total*200):current.tipo==='fuga'?' · Fuga de Capitales: '+current.total+' → $'+(current.total*1000):': '+current.dados.join(' + ')+' = '+current.total));else onLabel('');}
 function finish(){start=null;if(!current){label();return;}for(let i=0;i<dice.length;i++){const die=dice[i];if(!die.group.visible)continue;die.group.position.set(die.x,.435,die.z);die.group.quaternion.copy(die.end);}label();}
 function sync(roll,animate,now=performance.now()){
  if(!validRoll(roll)){seen=null;current=null;start=null;root.visible=false;onLabel('');return false;}
  if(seen===roll.id){if(!animate)finish();return false;}
  seen=roll.id;current=roll;root.visible=true;
  dice.forEach((die,i)=>{die.group.visible=i<roll.dados.length;if(!die.group.visible)return;die.x=(i-(roll.dados.length-1)/2)*1.12;die.z=(i%2?.28:-.28);die.end.copy(diceOrientation(roll.dados[i],i));});
  if(animate){start=now;onLabel((roll.jugador||'Jugador')+' está tirando…');tick(now);}else finish();return animate;
 }
 function tick(now){if(start===null)return false;const t=Math.min(1,Math.max(0,(now-start)/850));if(t>=1){finish();return false;}
  dice.forEach((die,i)=>{if(!die.group.visible)return;const drop=t<.58?3.5*(1-(t/.58)**2):.52*Math.abs(Math.sin((t-.58)/.42*Math.PI*2))*(1-t)/.42;
   die.group.position.set(die.x-(1-t)*(1-t)*(1+i*.1),.435+drop,die.z-(1-t)*.7);
   const spin=new THREE.Quaternion().setFromEuler(new THREE.Euler((1-t)*Math.PI*4,(1-t)*Math.PI*2,(1-t)*Math.PI*(i%2?2:-2)));
   die.group.quaternion.copy(die.end).multiply(spin);
  });return true;
 }
 return {root,sync,tick,finish,dispose(){scene.remove(root);for(const die of dice){for(const child of die.group.children)if(child.isInstancedMesh)child.dispose();}for(const r of resources)r.dispose();}};
}
