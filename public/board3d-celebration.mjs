import * as THREE from 'three';
import {tileAnchor} from './board3d-layout.mjs';
export function createSetCelebration(scene){
 const root=new THREE.Group();scene.add(root);let started=null;
 function clear(){for(const item of [...root.children]){item.geometry.dispose();item.material.dispose();root.remove(item);}started=null;}
 function start(ids,color='#ffe49b',now=performance.now()){
 clear();const valid=[...new Set(ids)].filter(id=>Number.isInteger(id)&&id>=0&&id<40);if(valid.length<2)return;started=now;
 for(let i=1;i<valid.length;i++){const a=tileAnchor(valid[i-1]),b=tileAnchor(valid[i]),from=new THREE.Vector3(a.x,.36,a.z),to=new THREE.Vector3(b.x,.36,b.z),mid=from.clone().add(to).multiplyScalar(.5);mid.y=.9;
 const curve=new THREE.QuadraticBezierCurve3(from,mid,to),geometry=new THREE.TubeGeometry(curve,24,.025,6,false),material=new THREE.MeshBasicMaterial({color,transparent:true,opacity:0,depthWrite:false});root.add(new THREE.Mesh(geometry,material));}
 }
 function tick(now){if(started===null)return false;const t=(now-started)/2400;if(t>=1){clear();return false;}for(const mesh of root.children)mesh.material.opacity=Math.sin(Math.PI*Math.max(0,t))*(.65+.35*Math.sin(t*Math.PI*6)**2);return true;}
 return{start,tick,clear,dispose(){clear();scene.remove(root);}};
}
