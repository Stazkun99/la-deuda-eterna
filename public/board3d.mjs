import {createBanker} from './board3d-banker.mjs';
import {createBoardMessages} from './board3d-messages.mjs';
import {createTableFinish} from './board3d-finish.mjs';
import {createEconomyArrival} from './board3d-economy.mjs';
import {createTileChoreography} from './board3d-tile-choreography.mjs';
import * as THREE from 'three';
import {createPlaceDetails} from './board3d-place-details.mjs';
import {createMachineAnimations} from './board3d-machines.mjs';
import {createSetCelebration} from './board3d-celebration.mjs';
import {createWorldEventLayer} from './board3d-events.mjs';
import {createSeats} from './board3d-seats.mjs';
import {createDeckLayer} from './board3d-decks.mjs';
import {createAmbientLayer} from './board3d-ambient.mjs';
import {createBoardCamera,overviewPose} from './board3d-camera.mjs';
import {createIndustryLayer} from './board3d-industries.mjs';
import {createDiceTray} from './board3d-dice.mjs';
import { OrbitControls } from '/vendor/three/OrbitControls.js';
import { createCharacterPiece } from './character-piece.mjs';
import { createPlayerPiece } from './board3d-pieces.mjs';
import { GLTFLoader } from '/vendor/three/loaders/GLTFLoader.js';
import { createModelLayer } from './board3d-models.mjs';
import { tilePosition, tileAnchor, pieceKind, sceneryPlayerSlot, rollPath } from './board3d-layout.mjs';

export function createBoard3D({host, getState, getArt, onSelect, getViewerId=()=>null, onInspect=()=>{}, onPlayer=()=>{}, onError, legend, onDiceLabel, onCinematic=()=>{}}) {
  const renderer = new THREE.WebGLRenderer({antialias:true, alpha:false});
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.setClearColor('#18151a');
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.06;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
  host.replaceChildren(renderer.domElement);
  renderer.domElement.setAttribute('aria-label','Tablero tridimensional. Usa los controles y el selector de casillas.');
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(42,1,.1,200);
  const setCelebration=createSetCelebration(scene);
  const controls = new OrbitControls(camera,renderer.domElement);
  controls.enablePan=false; controls.enableDamping=false;
  controls.minDistance=4; controls.maxDistance=100;
  controls.minPolarAngle=.01; controls.maxPolarAngle=1.15;
  scene.add(new THREE.HemisphereLight(0xfff4df,0x443a39,1.8));
  const light=new THREE.DirectionalLight(0xffe4bc,2.65);light.position.set(-5,13,6);light.castShadow=true;
  light.shadow.mapSize.set(1024,1024);Object.assign(light.shadow.camera,{left:-10,right:10,top:10,bottom:-10,near:1,far:35});light.shadow.camera.updateProjectionMatrix();light.shadow.normalBias=.025;light.shadow.bias=-.00015;light.shadow.radius=2;scene.add(light);
  const fill=new THREE.DirectionalLight(0xc0e2ed,1.05);fill.position.set(8,7,-5);scene.add(fill);
  const cameraRig=createBoardCamera(camera,controls,{reduced:()=>matchMedia('(prefers-reduced-motion: reduce)').matches,aspect:()=>camera.aspect,onOverview:()=>{overview=true;}});
  let followEnabled=true,overview=true;
  controls.addEventListener('start',()=>{overview=false;cameraRig.cancel();});
  function shadowObjects(group){group.traverse(object=>{if(object.isMesh){object.castShadow=!object.isInstancedMesh;object.receiveShadow=true;}});renderer.shadowMap.needsUpdate=true;}
  const resources=[], tiles=[], images=new Map();
  const pieces=new Map();
  const industries=createIndustryLayer(scene,getState().tablero);
  const diceTray=createDiceTray(scene,onDiceLabel);
  const eventLayer=createWorldEventLayer(scene,{load:url=>new GLTFLoader().loadAsync(url),onChange:()=>{renderer.shadowMap.needsUpdate=true;schedule();}}),seats=createSeats(scene);let eventPending=false;
  let previousPlayers=[], lastRoll=null, barrierValue=!!getState().barreraProteccionista, barrierPending=null;
  let active=false, disposed=false, frame=0, selection=null, down=null, lastTap=null;
  const own=r=>(resources.push(r),r);
  function box(w,h,d,color,x=0,y=0,z=0){
    const m=new THREE.Mesh(own(new THREE.BoxGeometry(w,h,d)),own(new THREE.MeshStandardMaterial({color,roughness:.72})));
    m.position.set(x,y,z);scene.add(m);return m;
  }
  const table=box(160,.18,160,'#30211d',0,-.64);table.receiveShadow=true;
  function roundedBase(size,radius,depth,y,color){
    const s=new THREE.Shape(),a=size/2,k=a-radius;
    s.moveTo(-k,-a);s.lineTo(k,-a);s.quadraticCurveTo(a,-a,a,-k);s.lineTo(a,k);s.quadraticCurveTo(a,a,k,a);s.lineTo(-k,a);s.quadraticCurveTo(-a,a,-a,k);s.lineTo(-a,-k);s.quadraticCurveTo(-a,-a,-k,-a);
    const geo=own(new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:16}));geo.rotateX(-Math.PI/2);
    const mesh=new THREE.Mesh(geo,own(new THREE.MeshStandardMaterial({color,roughness:.7})));mesh.position.y=y;mesh.receiveShadow=true;scene.add(mesh);
  }
  roundedBase(13.18,1.7,.36,-.55,'#533b2c');
  roundedBase(13.10,1.66,.08,-.19,'#c5a362');
  roundedBase(13.02,1.62,.17,-.11,'#b5a17a');
  const center=document.createElement('canvas');
  const felt=own(new THREE.CanvasTexture(center));felt.colorSpace=THREE.SRGBColorSpace;felt.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  const stopCenter=globalThis.GameCenter.paint(center,()=>{felt.needsUpdate=true;schedule();});felt.needsUpdate=true;
  const mat=own(new THREE.MeshBasicMaterial({map:felt,toneMapped:false}));
  const surface=new THREE.Mesh(own(new THREE.PlaneGeometry(8.92,8.92)),mat);surface.rotation.x=-Math.PI/2;surface.position.y=.07;scene.add(surface);
  const textureLoader=new THREE.TextureLoader();
  const decks=createDeckLayer({scene,loadTexture:(url,done)=>textureLoader.load(url,done),onChange:schedule});
  const banker=createBanker(scene),economy=createEconomyArrival(scene),messages=createBoardMessages(scene);
  let choreography,machines,ambientEnabled=true;
  let ambient,lastPaint=0,lastAmbientShadow=0,celebration=null;
  const sides=own(new THREE.MeshStandardMaterial({color:'#b5a17a',roughness:.7}));
  function schedule(){if(active&&!disposed&&!document.hidden&&!frame)frame=requestAnimationFrame(now=>{
    frame=0;const moving=animatePieces(now),rolling=diceTray.tick(now),industryMoving=industries.tick(now,ambientEnabled&&!getState().pausa&&!matchMedia('(prefers-reduced-motion: reduce)').matches),barrierMoving=industries.active,cameraMoving=cameraRig.tick(now),drawing=decks.tick(now);
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    let charactersMoving=false;for(const piece of pieces.values()){if(piece.tick&&!piece.travel)piece.model.rotation.y=Math.atan2(camera.position.x-piece.root.position.x,camera.position.z-piece.root.position.z);if(piece.tick?.(now,piece.travel||false,reduced))charactersMoving=true;}
    const machineMoving=machines?.tick(now,reduced,ambientEnabled&&models.root.visible)||false;
    const eventMoving=eventLayer.tick(now,reduced);
    const bankerMoving=banker.tick(now,reduced,!!getState().pausa,ambientEnabled);
    if(bankerMoving&&now-lastAmbientShadow>250){renderer.shadowMap.needsUpdate=true;lastAmbientShadow=now;}
    const economyMoving=economy.tick(now,reduced),messageMoving=messages.tick(now);
    const tileMoving=choreography?.tick(now,reduced||!models.root.visible,ambientEnabled)||false;
    const ambientMoving=ambient?.tick(now,matchMedia('(prefers-reduced-motion: reduce)').matches||!models.root.visible)||false;
    if(moving||rolling||barrierMoving||drawing||((industryMoving||machineMoving||tileMoving||ambientMoving||charactersMoving)&&now-lastAmbientShadow>250)){renderer.shadowMap.needsUpdate=true;lastAmbientShadow=now;}
    setCelebration.tick(now);
    if(celebration){const t=(now-celebration.start)/2400;for(const tile of tiles)if(celebration.ids.includes(tile.cell.id)){tile.top.emissive.set(t>=1?'#000000':'#eaba42');tile.top.emissiveIntensity=t>=1?0:.25+.5*Math.abs(Math.sin(t*Math.PI*4));}if(t>=1)celebration=null;}
    if(!moving&&!rolling&&(barrierPending!==null||eventPending)){if(barrierPending!==null)barrierValue=barrierPending;barrierPending=null;eventPending=false;update({animate:true});}
    const soundState=getState();
    let zone=null;if(soundState.enJuego&&!soundState.pausa&&active){let nearest=null,distance=Infinity;for(const c of soundState.tablero){if(!c.region)continue;const p=tilePosition(c.id),d=Math.hypot(p.x-controls.target.x,p.z-controls.target.z);if(d<distance){distance=d;nearest=c;}}zone=distance>3?'campo':nearest?.region==='norte'||[13,14,15,17].includes(nearest?.id)?'industria':nearest?.id===9?'costa':'campo';}
    globalThis.GameAudio?.setZone(zone);
    onCinematic(moving||rolling||drawing);
    const fast=(bankerMoving&&banker.active)||messageMoving||economyMoving||choreography?.active||machines?.firing||moving||rolling||barrierMoving||cameraMoving||drawing;
    if(fast||(!ambientMoving&&!charactersMoving)||now-lastPaint>=33){renderer.render(scene,camera);lastPaint=now;}
    if(fast||bankerMoving||industryMoving||tileMoving||machineMoving||ambientMoving||charactersMoving||celebration||eventMoving)schedule();
  });}
  function settle(piece){piece.finish?.();piece.motion=null;piece.teleport=null;piece.travel=null;piece.lookAhead=null;piece.root.position.copy(piece.target);piece.root.scale.setScalar(piece.scale);piece.model.rotation.z=0;}
  function animatePieces(now){let moving=false;for(const piece of pieces.values()){
    if(piece.teleport){const jump=piece.teleport,t=Math.min(1,Math.max(0,(now-jump.start)/850)),ease=t*t*(3-2*t);piece.root.position.lerpVectors(jump.origin,piece.target,ease);piece.root.position.y+=Math.sin(t*Math.PI)*1.1;if(t===1)settle(piece);else moving=true;continue;}
    const motion=piece.motion;if(!motion)continue;
    const elapsed=Math.max(0,now-motion.start),step=elapsed/(globalThis.GameMovement?.stepMs||320),index=Math.floor(step);
    if(index>=motion.path.length-1){settle(piece);continue;}
    moving=true;const t=step-index,ease=piece.tick?t:t*t*(3-2*t),a=index===0?motion.origin:tileAnchor(motion.path[index]),b=tileAnchor(motion.path[index+1]);
    const end=index===motion.path.length-2;if(end){b.x=piece.target.x;b.z=piece.target.z;}
    piece.root.position.set(THREE.MathUtils.lerp(a.x,b.x,ease),.225+(piece.tick?0:Math.sin(t*Math.PI)*.15),THREE.MathUtils.lerp(a.z,b.z,ease));
    piece.model.rotation.z=piece.tick?0:Math.sin(t*Math.PI)*.07;
    if(piece.tick&&now>=motion.start){
      piece.travel={phase:t,step:index,elapsed,duration:(motion.path.length-1)*(globalThis.GameMovement?.stepMs||320)};
      piece.model.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);
    }
    piece.lookAhead=tileAnchor(motion.path[Math.min(index+2,motion.path.length-1)]);
  }return moving;}
  function syncPieces(state,animate){
    const visible=state.jugadores.filter(p=>!p.enQuiebra&&Number.isInteger(p.posicion));
    for(const [id,piece] of pieces)if(!visible.some(p=>p.id===id)){scene.remove(piece.root);piece.dispose();pieces.delete(id);}
    for(const player of visible){
      let piece=pieces.get(player.id);
      const character=globalThis.GameCharacters.find(c=>c.id===player.personaje);
      const kind=character?.id||pieceKind(player.color);
      if(piece&&piece.kind!==kind){scene.remove(piece.root);piece.dispose();pieces.delete(player.id);piece=null;}
      if(!piece){piece=character?createCharacterPiece(kind,player.color,url=>new GLTFLoader().loadAsync(url),()=>{renderer.shadowMap.needsUpdate=true;schedule();}):createPlayerPiece(kind,player.color);piece.kind=kind;pieces.set(player.id,piece);scene.add(piece.root);shadowObjects(piece.root);piece.target=new THREE.Vector3();}
      const slot=sceneryPlayerSlot(visible,player),position=tileAnchor(player.posicion,slot.x,slot.z);
      piece.offset=slot;piece.scale=slot.scale;piece.target.set(position.x,.225,position.z);
      piece.root.userData.playerId=player.id;piece.root.userData.id=player.posicion;piece.ring.visible=state.enJuego&&state.jugadores[state.turnoActual]?.id===player.id;
      const previous=previousPlayers.find(p=>p.id===player.id),path=rollPath(previous,player,state.ultimaTirada,lastRoll);
      if(animate&&path.length&&active&&!document.hidden&&!matchMedia('(prefers-reduced-motion: reduce)').matches){piece.motion={path,origin:piece.root.position.clone(),start:performance.now()+(state.ultimaTirada?.tipo==='continuacion'?0:(globalThis.GameMovement?.startDelayMs||900))};piece.root.scale.setScalar(slot.scale);if(followEnabled){overview=false;cameraRig.follow(()=>pieces.has(player.id)?{point:piece.root.position,moving:!!piece.motion,ahead:piece.lookAhead}:null,piece.motion.start);}}
      else if(animate&&previous&&previous.posicion!==player.posicion&&active&&!document.hidden&&!matchMedia('(prefers-reduced-motion: reduce)').matches){piece.motion=null;piece.teleport={origin:piece.root.position.clone(),start:performance.now()};piece.travel=null;}
      else if(!piece.motion&&!piece.teleport||previous?.posicion!==player.posicion||!active||document.hidden||!state.enJuego||!animate)settle(piece);
    }
    previousPlayers=state.jugadores.map(p=>({...p}));lastRoll=state.ultimaTirada?.id;
    if(legend){legend.replaceChildren();for(const player of visible){
      const b=document.createElement('button');b.type='button';b.className='secondary';
      const current=state.enJuego&&state.jugadores[state.turnoActual]?.id===player.id;
      b.textContent=player.nombre+' · '+(globalThis.GameCharacters.find(c=>c.id===player.personaje)?.name||pieceKind(player.color))+(current?' · En turno':'');b.style.borderLeft='5px solid '+player.color;
      b.ondblclick=()=>{const piece=pieces.get(player.id);if(!piece)return;overview=false;cameraRig.focus(piece.root.position);select(player.posicion);onPlayer(player.id);schedule();};b.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();onPlayer(player.id);}};b.title='Doble clic para ver propiedades';legend.append(b);
    }}
  }
  function visibility(){renderer.shadowMap.needsUpdate=true;if(document.hidden){messages.finish();banker.finish();economy.finish();choreography?.finish();machines?.finish();cameraRig.cancel();decks.finish();industries.finish();diceTray.finish();for(const p of pieces.values())settle(p);cancelAnimationFrame(frame);frame=0;}else schedule();}
  function wrap(ctx,text,y){const words=text.split(' ');let line='';for(const word of words){const next=line?line+' '+word:word;if(ctx.measureText(next).width>222&&line){ctx.fillText(line,128,y);y+=23;line=word;}else line=next;}ctx.fillText(line,128,y);}
  function paint(tile){
    if(disposed)return;
    const c=tile.cell, ctx=tile.ctx, url=tile.url, img=images.get(url);
    ctx.fillStyle=c.region==='norte'?'#e0e9e2':'#fff4d9';ctx.fillRect(0,0,256,256);
    ctx.fillStyle=tile.owner || (c.region==='norte'?'#345b55':'#b69a5c');ctx.fillRect(0,0,256,15);
    ctx.fillStyle='#29443c';ctx.textAlign='left';ctx.font='bold 16px sans-serif';ctx.fillText(String(c.id),12,37);
    if(img?.complete&&img.naturalWidth){const scale=Math.min(190/img.naturalWidth,118/img.naturalHeight);const w=img.naturalWidth*scale,h=img.naturalHeight*scale;ctx.drawImage(img,(256-w)/2,44+(118-h)/2,w,h);}
    ctx.textAlign='center';ctx.font='bold 20px sans-serif';wrap(ctx,c.nombre,189);
    ctx.font='18px sans-serif';if(c.precio)ctx.fillText('$'+c.precio,128,245);
    if(tile.barrier){ctx.fillStyle='#78382d';ctx.fillRect(0,145,256,24);ctx.fillStyle='#fff3d6';ctx.font='bold 15px sans-serif';ctx.fillText('BARRERA ACTIVA',128,162);}
    tile.texture.needsUpdate=true;schedule();
  }
  for(const c of getState().tablero){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
    const texture=own(new THREE.CanvasTexture(canvas));texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
    const top=own(new THREE.MeshStandardMaterial({map:texture,roughness:.88}));
    const mesh=new THREE.Mesh(own(new THREE.BoxGeometry(.96,.16,.96)),[sides,sides,top,sides,sides,sides]);
    const {x,z}=tilePosition(c.id);mesh.position.set(x,.13,z);mesh.userData.id=c.id;scene.add(mesh);
    tiles.push({cell:c,mesh,top,texture,ctx:canvas.getContext('2d'),key:null});
  }
  const modelStatus=document.createElement('p');modelStatus.className='muted';modelStatus.setAttribute('role','status');modelStatus.id='estado-modelos-3d';legend?.before(modelStatus);
  const loader=new GLTFLoader();
  const models=createModelLayer({scene,board:getState().tablero,load:url=>loader.loadAsync(url),
    onChange(){renderer.shadowMap.needsUpdate=true;schedule();},
    onStatus({loaded,failed,total}){modelStatus.hidden=loaded+failed===total&&!failed;modelStatus.textContent=loaded+failed<total?'Preparando los decorados…':failed?'Algunos decorados no se pudieron cargar. Puedes seguir jugando o recargar la página para reintentar.':'';}
  });
  const finish=createTableFinish(table,models.lots);
  const placeDetails=createPlaceDetails(models.lots);
  choreography=createTileChoreography(models.lots);ambient=createAmbientLayer(models.lots);machines=createMachineAnimations(models.lots);
  function update({animate=true}={}){
    const actual=getState();if(!actual||disposed)return;
    const deferred=animate&&active&&!document.hidden&&!matchMedia('(prefers-reduced-motion: reduce)').matches && (Array.from(pieces.values()).some(p=>p.motion)||actual.ultimaTirada?.id!==lastRoll&&Number.isInteger(actual.ultimaTirada?.desde));
    if(deferred && !!actual.barreraProteccionista!==barrierValue)barrierPending=!!actual.barreraProteccionista;
    else if(!deferred){barrierValue=!!actual.barreraProteccionista;barrierPending=null;}
    const state={...actual,barreraProteccionista:barrierValue};
    if(deferred)eventPending=true;else {eventPending=false;eventLayer.sync(state.enJuego?state.eventoActual:null);}
    seats.sync(state,getViewerId());
    const {catalog,specialCatalog}=getArt();
    for(const tile of tiles){const c=state.tablero.find(c=>c.id===tile.cell.id);if(!c)continue;
      const art=catalog.find(a=>a.nombre===(c.baseSur||c.nombre));
      const special=specialCatalog[c.id];
      const url=special?.icono||special?.imagen||([4,16,36].includes(c.id)?'/assets/cartas/reversos/solidaridad.webp':[8,19,28].includes(c.id)?'/assets/cartas/reversos/condiciones.webp':art?.icono);
      const owner=state.jugadores.find(p=>p.id===c.dueño)?.color;
      const barrier=c.region==='norte'&&state.barreraProteccionista;
      const key=JSON.stringify([c.nombre,c.precio,url,owner,barrier]);if(key===tile.key)continue;
      Object.assign(tile,{cell:c,url,owner,barrier,key});
      if(url&&!images.has(url)){const img=new Image();images.set(url,img);img.onload=()=>{for(const t of tiles)if(t.url===url)paint(t);};img.src=url;}
      paint(tile);
    }const rollAnimation=animate&&active&&!document.hidden&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
    industries.sync(state,rollAnimation);
    if(diceTray.sync(state.ultimaTirada,rollAnimation)&&followEnabled)reset();
    syncPieces(state,animate);renderer.shadowMap.needsUpdate=true;if(selection!==null)onSelect(selection);schedule();
  }
  function reset(immediate=false){overview=true;const {position,target}=overviewPose(host.clientWidth/Math.max(1,host.clientHeight));cameraRig.move(position,target,performance.now(),immediate?0:650);schedule();}
  function resize(){if(disposed||!host.clientWidth||!host.clientHeight)return;renderer.setSize(host.clientWidth,host.clientHeight,false);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();if(overview)reset(true);schedule();}
  function select(id){const tile=tiles.find(t=>t.cell.id===id);if(!tile)return;selection=id;for(const t of tiles){t.top.emissive.set(t.cell.id===selection?'#9d762b':'#000000');t.top.emissiveIntensity=.35;}onSelect(id);schedule();}
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
  function pointerDown(e){down={x:e.clientX,y:e.clientY};}
  function pointerUp(e){if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>6){down=null;return;}down=null;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects([...tiles.map(t=>t.mesh),models.root,...industries.root.children,...Array.from(pieces.values(),p=>p.root)],true).find(hit=>{let node=hit.object;while(node){if(!node.visible)return false;node=node.parent;}return true;});if(hit){let object=hit.object;while(object&&object.userData.id===undefined)object=object.parent;if(object){const target=object.userData.playerId||object.userData.id,now=performance.now(),double=lastTap?.target===target&&now-lastTap.time<450;lastTap={target,time:now};if(!object.userData.playerId)select(object.userData.id);if(double){lastTap=null;if(object.userData.playerId)onPlayer(object.userData.playerId);else onInspect(object.userData.id);}}}}
  function lost(e){e.preventDefault();active=false;onError();}
  renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointerup',pointerUp);renderer.domElement.addEventListener('webglcontextlost',lost);
  controls.addEventListener('change',schedule);document.addEventListener('visibilitychange',visibility);
  const observer=new ResizeObserver(resize);observer.observe(host);shadowObjects(scene);table.castShadow=false;surface.castShadow=false;resize();reset(true);update();
  return {
    update,select,reset,
    get canPresent(){return active&&!disposed&&!document.hidden&&!matchMedia('(prefers-reduced-motion: reduce)').matches;},
    message(item){if(!active||disposed||document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches)return 0;const duration=messages.start(item,{x:0,z:.3});schedule();return duration;},
    focusEvent(){if(!active||disposed||document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches)return 0;cameraRig.follow(()=>({point:{x:0,z:-3.15},moving:false}),performance.now());cameraRig.holdArrival(5000);schedule();return 5000;},
    interestPayment(data){if(!active||document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches)return 0;const duration=economy.start(data);banker.start(data,duration);const point=tileAnchor(39);cameraRig.follow(()=>({point,moving:false}),performance.now());cameraRig.holdArrival(duration);schedule();return duration;},
    landing(id,data){if(active&&!document.hidden&&!matchMedia('(prefers-reduced-motion: reduce)').matches){const duration=Math.max(1500,economy.start(data?.casilla===id?data:null));if(data?.casilla===id)banker.start(data,duration);cameraRig.holdArrival(duration);choreography.land(id);ambient.land(id);if(id===18)machines.fire();schedule();return duration;}return 0;},
    celebrate(ids,color){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;setCelebration.start(ids,color);celebration={ids,start:performance.now()};schedule();},
    drawCard(data){if(!active||document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches)return Promise.resolve();reset();const result=decks.draw(data);schedule();return result;},
    setAmbient(value){ambientEnabled=!!value;ambient.setEnabled(value);schedule();},
    setFollow(value){followEnabled=value;if(!value)cameraRig.cancel();},
    setShadows(value){renderer.shadowMap.enabled=value;renderer.shadowMap.needsUpdate=true;schedule();},
    focus(){overview=false;if(selection===null)return;const p=tilePosition(selection);cameraRig.focus(p);schedule();},
    showScenery(value){models.setVisible(value);},
    rotate(){overview=false;cameraRig.cancel();controls.rotateLeft(Math.PI/4);controls.update();schedule();},
    zoom(factor){overview=false;cameraRig.cancel();camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target);controls.update();schedule();},
    overhead(){overview=false;const target=controls.target.clone(),distance=camera.position.distanceTo(target);cameraRig.move(target.clone().add(new THREE.Vector3(0,distance,.01)),target);schedule();},
    setActive(value){if(!value)globalThis.GameAudio?.setZone(null);renderer.shadowMap.needsUpdate=true;active=value;if(value){resize();schedule();}else{messages.finish();banker.finish();economy.finish();choreography?.finish();machines?.finish();cameraRig.cancel();decks.finish();industries.finish();diceTray.finish();for(const p of pieces.values())settle(p);cancelAnimationFrame(frame);frame=0;}},
    dispose(){banker.dispose();messages.dispose();finish.dispose();economy.dispose();choreography?.dispose();placeDetails.dispose();machines?.dispose();setCelebration.dispose();globalThis.GameAudio?.setZone(null);eventLayer.dispose();seats.dispose();cameraRig.cancel();stopCenter();decks.dispose();ambient.dispose();models.dispose();modelStatus.remove();light.shadow.map?.dispose();light.shadow.mapPass?.dispose();industries.dispose();diceTray.dispose();disposed=true;active=false;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();document.removeEventListener('visibilitychange',visibility);renderer.domElement.removeEventListener('webglcontextlost',lost);renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointerup',pointerUp);for(const img of images.values())img.onload=null;for(const p of pieces.values())p.dispose();pieces.clear();legend?.replaceChildren();for(const r of resources)r.dispose();renderer.dispose();host.replaceChildren();}
  };
}
