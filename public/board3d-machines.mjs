import * as THREE from 'three';
// Animate named parts of the downloaded machines; their shared geometry stays intact.
export function rigPump(model){
 const source=model.children[0],beam=source?.getObjectByName('Box010'),head=source?.getObjectByName('Box011'),bearing=source?.getObjectByName('Cylinder001'),rod=source?.getObjectByName('Cylinder004');
 if(!beam||!head||!bearing)return null;model.updateMatrixWorld(true);
 const center=o=>source.worldToLocal(new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()));
 const point=center(bearing),direction=center(head).sub(point);direction.y=0;direction.normalize();const axis=new THREE.Vector3(-direction.z,0,direction.x),pivot=new THREE.Group();pivot.position.copy(point);source.add(pivot);source.updateMatrixWorld(true);pivot.attach(beam);pivot.attach(head);
 let shaft=null,anchor=null,height=1;
 if(rod){const bounds=new THREE.Box3().setFromObject(rod),bottom=bounds.getCenter(new THREE.Vector3());bottom.y=bounds.min.y;source.worldToLocal(bottom);const top=bounds.getCenter(new THREE.Vector3());top.y=bounds.max.y;source.worldToLocal(top);height=top.y-bottom.y;shaft=new THREE.Group();shaft.position.copy(bottom);source.add(shaft);source.updateMatrixWorld(true);shaft.attach(rod);anchor=pivot.worldToLocal(source.localToWorld(top.clone()));}
 return{tick(t){pivot.quaternion.setFromAxisAngle(axis,Math.sin(t*.85)*.075);if(shaft){source.updateMatrixWorld(true);const top=source.worldToLocal(pivot.localToWorld(anchor.clone()));shaft.scale.y=Math.max(.2,(top.y-shaft.position.y)/height);}},reset(){pivot.quaternion.identity();if(shaft)shaft.scale.y=1;}};
}
export function createMachineAnimations(lots){
 let pump=null,pumpModel=null,tank=null,gun=null,gunBase=null,tankBase=null,flash=null,smoke=null,shot=null;const resources=[];
 function discover(){const oil=lots.get(17)?.children.find(o=>o.userData.assetFile==='maquinaria/bomba-petrolera.glb');if(oil&&oil!==pumpModel){pumpModel=oil;pump=rigPump(oil);}
 if(!tank){tank=lots.get(18)?.children.find(o=>o.userData.assetFile==='maquinaria/tanque.glb');if(tank){gun=tank.getObjectByName('Tank_Gun_Cube001');tankBase=tank.position.clone();if(gun){gunBase=gun.position.clone();tank.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(gun),tip=bounds.getCenter(new THREE.Vector3());const source=tank.children[0];const box=gun.geometry.boundingBox||((gun.geometry.computeBoundingBox()),gun.geometry.boundingBox);tip.set(box.min.x,(box.min.y+box.max.y)/2,(box.min.z+box.max.z)/2);gun.localToWorld(tip);lots.get(18).worldToLocal(tip);
 const geometry=new THREE.SphereGeometry(1,10,6),fire=new THREE.MeshBasicMaterial({color:'#ffcf6d',transparent:true,opacity:0,depthWrite:false}),fog=new THREE.MeshBasicMaterial({color:'#adaba3',transparent:true,opacity:0,depthWrite:false});resources.push(geometry,fire,fog);flash=new THREE.Mesh(geometry,fire);flash.position.copy(tip);flash.scale.set(.07,.07,.12);smoke=new THREE.Mesh(geometry,fog);smoke.position.copy(tip);smoke.userData.base=tip.clone();lots.get(18).add(flash,smoke);}}}
 }
 function finish(){shot=null;if(gun&&gunBase)gun.position.copy(gunBase);if(tank&&tankBase)tank.position.copy(tankBase);if(flash)flash.material.opacity=0;if(smoke)smoke.material.opacity=0;}
 function tick(now,reduced=false,ambient=true){discover();if(pump){if(ambient&&!reduced)pump.tick(now/1000);else pump.reset();}if(reduced){finish();return false;}if(shot!==null){const t=(now-shot)/900;if(t>=1)finish();else{const kick=Math.sin(Math.min(1,t*5)*Math.PI);if(gun)gun.position.x=gunBase.x+kick*.8;if(tank)tank.position.z=tankBase.z-kick*.028;if(flash){flash.material.opacity=Math.max(0,1-t*7);smoke.material.opacity=Math.sin(t*Math.PI)*.25;smoke.position.copy(smoke.userData.base);smoke.position.y+=t*.3;smoke.scale.setScalar(.04+t*.13);}}}return !!pump&&ambient||shot!==null;
 }
 return{tick,get firing(){return shot!==null;},fire(now=performance.now()){discover();if(tank)shot=now;},finish,dispose(){finish();pump?.reset();flash?.removeFromParent();smoke?.removeFromParent();resources.forEach(r=>r.dispose());}};
}
