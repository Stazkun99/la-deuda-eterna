import * as THREE from 'three';

// Camera work is driven by the same demand-render loop as the board.
export function createBoardCamera(camera,controls,{reduced=()=>false,aspect=()=>1}={}){
 let tween=null,tracking=null,last=null;
 const offset=()=>new THREE.Vector3(0,6.2,7.2).multiplyScalar(aspect()<1?1.25:1);
 function cancel(){tween=null;tracking=null;last=null;}
 function move(position,target,now=performance.now(),duration=650){
  cancel();if(reduced()||duration===0){camera.position.copy(position);controls.target.copy(target);controls.update();return;}
  tween={from:camera.position.clone(),fromTarget:controls.target.clone(),position:position.clone(),target:target.clone(),start:now,duration};
 }
 function focus(point,now=performance.now()){const target=new THREE.Vector3(point.x,.25,point.z);move(target.clone().add(offset()),target,now);}
 function follow(read,startsAt){tracking=null;last=null;if(!reduced())tracking={read,startsAt};}
 function tick(now){
  if(reduced()&&(tween||tracking)){if(tween){camera.position.copy(tween.position);controls.target.copy(tween.target);controls.update();}cancel();return false;}
  if(tween){const t=Math.min(1,Math.max(0,(now-tween.start)/tween.duration)),ease=t*t*(3-2*t);camera.position.lerpVectors(tween.from,tween.position,ease);controls.target.lerpVectors(tween.fromTarget,tween.target,ease);controls.update();if(t===1)tween=null;return !!tween||!!tracking;}
  if(!tracking)return false;
  if(now<tracking.startsAt)return true;
  const subject=tracking.read();if(!subject){cancel();return false;}
  const target=new THREE.Vector3(subject.point.x,.25,subject.point.z),position=target.clone().add(offset());
  const dt=last===null?16:Math.min(64,Math.max(0,now-last));last=now;const alpha=1-Math.exp(-dt/160);
  camera.position.lerp(position,alpha);controls.target.lerp(target,alpha);controls.update();
  if(!subject.moving&&camera.position.distanceTo(position)<.015&&controls.target.distanceTo(target)<.015){camera.position.copy(position);controls.target.copy(target);controls.update();cancel();return false;}
  return true;
 }
 return {move,focus,follow,tick,cancel};
}
