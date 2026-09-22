import * as THREE from 'three';
import {GLTFLoader} from '/vendor/three/loaders/GLTFLoader.js';
import {createCharacterPiece} from './character-piece.mjs';

// One short-lived renderer generates actual-model portraits for the lobby and 2D view.
export async function renderPortraits() {
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setSize(240,200);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(32,1.2,.01,20);
  camera.position.set(.8,.85,2.1);camera.lookAt(0,.44,0);
  scene.add(new THREE.HemisphereLight(0xffffff,0x657779,2.5));
  const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(-2,4,5);scene.add(light);
  const loader=new GLTFLoader();
  try {
    for(const c of globalThis.GameCharacters){
      const piece=createCharacterPiece(c.id,c.color,url=>loader.loadAsync(url));piece.ring.visible=false;
      try {
        if(!await piece.ready)continue;
        scene.add(piece.root);renderer.render(scene,camera);
        const url=renderer.domElement.toDataURL('image/png');globalThis.CharacterPortraits[c.id]=url;
        document.querySelectorAll('img[data-character="'+c.id+'"]').forEach(img=>{img.src=url;});
      } finally {scene.remove(piece.root);piece.dispose();}
    }
  } finally {renderer.dispose();renderer.forceContextLoss();}
}
