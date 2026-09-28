const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
function jsonChunk(data){return JSON.parse(data.subarray(20,20+data.readUInt32LE(12)).toString());}
// Load actual model geometry in Node; browser QA exercises the real textures.
function withoutTextures(data){
  const json=jsonChunk(data),tail=data.subarray(20+data.readUInt32LE(12));
  delete json.images;delete json.textures;
  function strip(value){if(!value||typeof value!=='object')return;for(const key of Object.keys(value)){if(key.endsWith('Texture'))delete value[key];else strip(value[key]);}}
  strip(json.materials);
  const raw=Buffer.from(JSON.stringify(json)),body=Buffer.alloc(Math.ceil(raw.length/4)*4,32);raw.copy(body);
  const header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(20+body.length+tail.length,8);header.writeUInt32LE(body.length,12);header.writeUInt32LE(0x4e4f534a,16);
  const result=Buffer.concat([header,body,tail]);return result.buffer.slice(result.byteOffset,result.byteOffset+result.length);
}


async function setup(file,spec){const THREE=await import('three'),{GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js'),{fitModel}=await import('../public/board3d-models.mjs');const source=(await new GLTFLoader().parseAsync(withoutTextures(fs.readFileSync(require('node:path').join(__dirname,'../public/assets/modelos-3d/maquinaria/'+file+'.glb'))),'')).scene;return{THREE,model:fitModel(source,spec)};}
test('bomba real: balancín articulado, base inmóvil y varilla finita',async()=>{const {model}=await setup('bomba-petrolera',{x:0,z:0,width:.76,height:.62,depth:.74,rotation:Math.PI/2}),{rigPump}=await import('../public/board3d-machines.mjs');const rig=rigPump(model);assert.ok(rig);model.updateMatrixWorld(true);const base=model.getObjectByName('Box001'),beam=model.getObjectByName('Box010'),initial=base.matrixWorld.clone(),before=beam.matrixWorld.clone();rig.tick(1.6);model.updateMatrixWorld(true);assert.ok(base.matrixWorld.equals(initial));assert.ok(!beam.matrixWorld.equals(before));assert.ok(model.getObjectByName('Cylinder004').matrixWorld.elements.every(Number.isFinite));rig.reset();model.updateMatrixWorld(true);assert.ok(beam.matrixWorld.elements.every((v,i)=>Math.abs(v-before.elements[i])<.00001));});
test('tanque real: retroceso al disparar y vuelta exacta al reposo',async()=>{const {THREE,model}=await setup('tanque',{x:0,z:-1,width:.76,height:.44,depth:.70,rotation:Math.PI/2}),{createMachineAnimations}=await import('../public/board3d-machines.mjs');model.userData.assetFile='maquinaria/tanque.glb';const lot=new THREE.Group();lot.add(model);const layer=createMachineAnimations(new Map([[18,lot]])),gun=model.getObjectByName('Tank_Gun_Cube001'),original=gun.position.clone();layer.fire(0);layer.tick(90,false,false);assert.ok(!gun.position.equals(original));assert.equal(layer.firing,true);layer.tick(1000,false,false);assert.ok(gun.position.equals(original));assert.equal(layer.firing,false);layer.fire(1200);layer.tick(1250,true);assert.equal(layer.firing,false);layer.dispose();assert.equal(lot.children.length,1);});
test('fachadas principales de fábricas y oficinas miran al interior',async()=>{const {BOARD_MODELS}=await import('../public/board3d-model-catalog.mjs');for(const id of [21,23,27,29,30,34,39])assert.equal(BOARD_MODELS[id][0].rotation,Math.PI);});
