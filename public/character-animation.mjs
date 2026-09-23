import * as THREE from 'three';

export const CHARACTER_RIGS={
 link:{arms:['LShoulderJ_37','RShoulderJ_66'],elbows:['LArmJ_35','RArmJ_64'],hips:['LLegJ_5','RLegJ_9'],knees:['LKneeJ_4','RKneeJ_8'],feet:['LFootJ_3','RFootJ_7'],head:'HeadN_77'},
 yoshi:{arms:['L_upperarm_024','R_upperarm_038'],elbows:['L_forearm_025','R_forearm_039'],hips:['L_thigh_052','R_thigh_056'],knees:['L_calf_053','R_calf_057'],feet:['L_foot_054','R_foot_058'],head:'head_05'},
 scyther:{arms:['left_shoulder_14','right_shoulder_18'],hips:['left_leg_01_23','right_leg_01_27'],knees:['left_leg_02_22','right_leg_02_26'],wings:['left_wing_a_7','left_wing_b_8','right_wing_a_9','right_wing_b_10']}
};
const smooth=value=>{const t=THREE.MathUtils.clamp(value,0,1);return t*t*(3-2*t);};

// Axes are derived from each actual bind pose, rather than guessed bone-local axes.
// Geometry, board position, player base and ring remain independent of these poses.
export function createCharacterAnimation(pivot,source,id) {
 const rest={position:pivot.position.clone(),scale:pivot.scale.clone(),quaternion:pivot.quaternion.clone()};
 const rig=CHARACTER_RIGS[id]||{},bones=new Map();
 source.updateWorldMatrix(true,true);
 for(const name of Object.values(rig).flat()){
  const bone=source.getObjectByName(name);if(!bone)continue;
  const inverse=bone.getWorldQuaternion(new THREE.Quaternion()).invert();
  bones.set(name,{bone,rest:bone.quaternion.clone(),x:new THREE.Vector3(1,0,0).applyQuaternion(inverse),y:new THREE.Vector3(0,1,0).applyQuaternion(inverse),z:new THREE.Vector3(0,0,1).applyQuaternion(inverse)});
 }
 const rotation=new THREE.Quaternion();
 function turn(name,angle,axis='x'){const item=bones.get(name);if(!item)return;rotation.setFromAxisAngle(item[axis],angle);item.bone.quaternion.copy(item.rest).multiply(rotation);}
 function reset(){pivot.position.copy(rest.position);pivot.scale.copy(rest.scale);pivot.quaternion.copy(rest.quaternion);for(const item of bones.values())item.bone.quaternion.copy(item.rest);}
 return {reset,tick(now,motion=false,reduced=false){
  reset();if(reduced)return false;
  const t=now/1000,breath=Math.sin(t*2),moving=!!motion;
  // The board supplies phase and elapsed time from the same route clock as movement.
  const travel=typeof motion==='object'?motion:{phase:(now%320)/320,step:Math.floor(now/320),elapsed:now%1920,duration:1920};
  const phase=THREE.MathUtils.clamp(travel.phase,0,1),cycle=(travel.step+phase)*Math.PI;
  const envelope=moving?smooth(travel.elapsed/160)*smooth((travel.duration-travel.elapsed)/160):0;
  if(id==='kirby'){
   if(moving){
    pivot.position.y+=Math.sin(phase*Math.PI)*.32;
    const launch=phase<.12?Math.sin(phase/.12*Math.PI):0,landing=phase>.82?Math.sin((phase-.82)/.18*Math.PI):0;
    const stretch=.14*Math.sin(phase*Math.PI)-.14*launch-.22*landing;
    pivot.scale.multiply(new THREE.Vector3(1-stretch*.5,1+stretch,1-stretch*.5));
   }else{
    const phase=(t%4)/4,hop=phase<.2?Math.sin(phase/.2*Math.PI):0;
    pivot.position.y+=hop*.045;pivot.scale.multiply(new THREE.Vector3(1-breath*.007,1+breath*.014,1-breath*.007));
   }
  }else if(id==='link'||id==='yoshi'){
   const stride=Math.sin(cycle),power=id==='yoshi'?.70:.60;
   for(let side=0;side<2;side++){
    const step=side===0?stride:-stride,hip=-step*power*envelope,knee=Math.max(0,step)*.95*envelope;
    turn(rig.hips[side],hip);turn(rig.knees[side],knee);turn(rig.feet[side],-hip*.45-knee*.5);
    turn(rig.arms[side],moving?step*.48*envelope:breath*.055*(side===0?1:-1));
    turn(rig.elbows[side],moving?(-.22-Math.max(0,-step)*.25)*envelope:-.08);
   }
   pivot.position.y+=moving?Math.abs(stride)*.035*envelope:(breath+1)*.005;
   pivot.rotation.z=moving?stride*.025*envelope:breath*.008;
   turn(rig.head,moving?Math.sin(cycle*2)*.055*envelope:Math.sin(t*1.7)*.06,moving?'x':'y');
  }else if(id==='scyther'){
   const flight=moving?smooth(travel.elapsed/250)*smooth((travel.duration-travel.elapsed)/250):0;
   pivot.position.y+=moving?flight*(.42+Math.sin(t*11)*.025):(breath+1)*.008;
   pivot.rotation.x=moving?.12*flight:0;
   const flap=Math.sin((moving?travel.elapsed/1000:t)*(moving?34:8))*(moving?.60:.13);
   rig.wings.forEach((name,i)=>turn(name,flap*(i<2?1:-1),'y'));
   for(let side=0;side<2;side++){
    turn(rig.arms[side],moving?-.28*flight:breath*.035*(side===0?1:-1));
    turn(rig.hips[side],-.25*flight);turn(rig.knees[side],.65*flight);
   }
  }
  return true;
 }};
}
