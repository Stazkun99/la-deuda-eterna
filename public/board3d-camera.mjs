import * as THREE from 'three';

// Camera work is driven by the same demand-render loop as the board.
export function createBoardCamera(camera,controls,{reduced=()=>false,aspect=()=>1}={}){
 let tween=null,tracking=null,last=null;
 // View from the clear center of the table, above the miniature scenery.
 const offset=point=>{
   const horizontal=new THREE.Vector3(-point.x,0,-point.z);
   if(horizontal.lengthSq()<1)horizontal.set(0,0,1);
   horizontal.normalize().multiplyScalar(4.8);horizontal.y=5.1;
   return horizontal.multiplyScalar(Math.min(1.65,Math.max(1,1/Math.max(.4,aspect()))));
 };
 function cancel(){tween=null;tracking=null;last=null;}
 function move(position,target,now=performance.now(),duration=650){
  cancel();if(reduced()||duration===0){camera.position.copy(position);controls.target.copy(target);controls.update();return;}
  tween={from:camera.position.clone(),fromTarget:controls.target.clone(),position:position.clone(),target:target.clone(),start:now,duration};
 }
 function focus(point,now=performance.now()){const target=new THREE.Vector3(point.x,.45,point.z);move(target.clone().add(offset(point)),target,now);}
 function follow(read,startsAt){tracking=null;last=null;if(!reduced())tracking={read,startsAt,offset:null};}
 function tick(now){
  if(reduced()&&(tween||tracking)){if(tween){camera.position.copy(tween.position);controls.target.copy(tween.target);controls.update();}cancel();return false;}
  if(tween){const t=Math.min(1,Math.max(0,(now-tween.start)/tween.duration)),ease=t*t*(3-2*t);camera.position.lerpVectors(tween.from,tween.position,ease);controls.target.lerpVectors(tween.fromTarget,tween.target,ease);controls.update();if(t===1)tween=null;return !!tween||!!tracking;}
  if(!tracking)return false;
  if(now<tracking.startsAt)return true;
  const subject=tracking.read();if(!subject){cancel();return false;}
  // Keep the viewing direction throughout a roll, including corners.
  tracking.offset ||= offset(subject.point);
  const target=new THREE.Vector3(subject.point.x,.45,subject.point.z);
  if(subject.moving&&subject.ahead){const ahead=new THREE.Vector3(subject.ahead.x,.45,subject.ahead.z);const delta=ahead.sub(target);if(delta.length()>1.5)delta.setLength(1.5);target.addScaledVector(delta,.38);}
  const position=target.clone().add(tracking.offset);
  const dt=last===null?16:Math.min(64,Math.max(0,now-last));last=now;const alpha=1-Math.exp(-dt/160);
  camera.position.lerp(position,alpha);controls.target.lerp(target,alpha);controls.update();
  if(!subject.moving&&camera.position.distanceTo(position)<.015&&controls.target.distanceTo(target)<.015){camera.position.copy(position);controls.target.copy(target);controls.update();cancel();return false;}
  return true;
 }
 return {move,focus,follow,tick,cancel};
}

// Fit every corner of the board/scenery envelope, allowing for the viewport aspect.
export function overviewPose(aspect){
 const direction=new THREE.Vector3(0,.86,.51).normalize(),up=new THREE.Vector3(0,direction.z,-direction.y),target=new THREE.Vector3(0,.25,0),tan=Math.tan(Math.PI*21/180);
 let distance=0;
 for(const x of [-6.4,6.4])for(const y of [-.7,1.8])for(const z of [-6.4,6.4]){
  const p=new THREE.Vector3(x,y,z).sub(target);
  distance=Math.max(distance,p.dot(direction)+Math.max(Math.abs(x)/(tan*Math.max(.15,aspect)*.88),Math.abs(p.dot(up))/(tan*.88)));
 }
 return {position:target.clone().addScaledVector(direction,distance),target};
}
