const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const assetRoot=path.join(__dirname,'../public/assets/modelos-3d');

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

test('GLB: catalogue covers forty spaces, real assets fit lots and every texture exists',async()=>{
  const THREE=await import('three'),{GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');
  const {BOARD_MODELS,MISSING_MODELS}=await import('../public/board3d-model-catalog.mjs');
  const {fitModel}=await import('../public/board3d-models.mjs');
  assert.equal(Object.keys(BOARD_MODELS).length,25);
  for(let id=0;id<40;id++)assert.notEqual(!!BOARD_MODELS[id],!!MISSING_MODELS[id],'one state per space '+id);
  const files=new Set(Object.values(BOARD_MODELS).flat().map(s=>s.file));
  const manifest=JSON.parse(fs.readFileSync(path.join(assetRoot,'origenes.json'),'utf8'));
  assert.deepEqual([...files].sort(),manifest.map(m=>m.archivo).sort(),'no unused models ship');
  const templates=new Map(),loader=new GLTFLoader();
  for(const entry of manifest){
    const filename=path.join(assetRoot,entry.archivo),data=fs.readFileSync(filename),json=jsonChunk(data);
    assert.equal(crypto.createHash('sha256').update(data).digest('hex'),entry.sha256);
    assert.equal(data.readUInt32LE(8),data.length);
    for(const image of json.images||[]){
      if(image.bufferView!==undefined){assert.equal(image.mimeType,'image/png');assert.ok(json.bufferViews[image.bufferView]);continue;}
      const texture=path.resolve(path.dirname(filename),image.uri);
      assert.ok(texture.startsWith(assetRoot+path.sep));assert.ok(fs.existsSync(texture));
      assert.equal(fs.readFileSync(texture).subarray(1,4).toString(),'PNG');
    }
    assert.ok(['CC0','CC-BY-3.0'].includes(entry.licencia));
    if(entry.licencia==='CC-BY-3.0')assert.ok(entry.fuente.startsWith('https://poly.pizza/m/'));
    templates.set(entry.archivo,(await loader.parseAsync(withoutTextures(data),'' )).scene);
  }
  for(const [id,specs] of Object.entries(BOARD_MODELS))for(const spec of specs){
    const model=fitModel(templates.get(spec.file),spec),bounds=new THREE.Box3().setFromObject(model);
    assert.ok(bounds.min.x>=-.46&&bounds.max.x<=.46,'width '+id+' '+spec.file);
    assert.ok(bounds.min.z>=-1.49&&bounds.max.z<=-.56,'keep models outside printed space '+id);
    assert.ok(bounds.min.y>=-.00001&&bounds.max.y<=.65,'height '+id);
  }
  for(const scene of templates.values())scene.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();});
});

test('GLB: downloads cached, bounded concurrency, hidden models and shared resources released once',async()=>{
  const THREE=await import('three'),{createModelLayer}=await import('../public/board3d-models.mjs');
  const scene=new THREE.Scene(),geometry=new THREE.BoxGeometry(),material=new THREE.MeshStandardMaterial();
  let disposedGeometry=0,disposedMaterial=0;geometry.addEventListener('dispose',()=>disposedGeometry++);material.addEventListener('dispose',()=>disposedMaterial++);
  let active=0,peak=0;const calls=[],statuses=[];
  const spec=file=>({file,x:0,z:-1,width:.8,height:.6,depth:.8});
  const layer=createModelLayer({scene,board:Array.from({length:40},(_,id)=>({id})),catalog:{0:[spec('a'),spec('a')],1:['b','c','d','e'].map(spec)},
    async load(url){calls.push(url);active++;peak=Math.max(peak,active);await new Promise(r=>setImmediate(r));active--;const root=new THREE.Group();root.add(new THREE.Mesh(geometry,material));return{scene:root};},onStatus:s=>statuses.push(s)});
  layer.setVisible(false);await layer.ready;
  assert.equal(layer.root.visible,false);assert.equal(calls.length,5);assert.ok(peak<=4);
  assert.equal(layer.lots.get(2).children.length,2,'missing model has only its empty platform');
  assert.equal(statuses.at(-1).loaded,5);
  layer.dispose();layer.dispose();assert.equal(scene.children.length,0);assert.equal(disposedGeometry,1);assert.equal(disposedMaterial,1);
});

test('GLB: closing during download releases late resources without repopulating scene',async()=>{
  const THREE=await import('three'),{createModelLayer}=await import('../public/board3d-models.mjs');
  let resolve,changes=0,releases=0;const scene=new THREE.Scene(),g=new THREE.BoxGeometry(),m=new THREE.MeshStandardMaterial();g.addEventListener('dispose',()=>releases++);
  const layer=createModelLayer({scene,board:[{id:0}],catalog:{0:[{file:'pending',x:0,z:-1,width:.8,height:.6,depth:.8}]},load:()=>new Promise(r=>resolve=r),onChange:()=>changes++});
  layer.dispose();const root=new THREE.Group();root.add(new THREE.Mesh(g,m));resolve({scene:root});await layer.ready;
  assert.equal(changes,0);assert.equal(scene.children.length,0);assert.equal(releases,1);
});

test('GLB: a failed download reports the missing model without blocking other spaces',async t=>{
  const THREE=await import('three'),{createModelLayer}=await import('../public/board3d-models.mjs');
  t.mock.method(console,'warn',()=>{});
  let status;const scene=new THREE.Scene(),spec=file=>({file,x:0,z:-1,width:.8,height:.6,depth:.8});
  const layer=createModelLayer({scene,board:[{id:0},{id:1}],catalog:{0:[spec('bad')],1:[spec('good')]},onStatus:s=>status=s,
    async load(url){if(url.endsWith('/bad'))throw new Error('Download failed');const root=new THREE.Group();root.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial()));return{scene:root};}});
  await layer.ready;assert.equal(status.loaded,1);assert.equal(status.failed,1);assert.equal(layer.lots.get(0).children.length,2);assert.equal(layer.lots.get(1).children.length,3);layer.dispose();
});

test('hybrid scenes: all forty lots stay outside the playing lane and have finite colored geometry',async()=>{const {createLotScene}=await import('../public/board3d-scenes.mjs');const {BOARD_MODELS}=await import('../public/board3d-model-catalog.mjs');for(let id=0;id<40;id++){const geo=createLotScene(id,!!BOARD_MODELS[id]?.length);geo.computeBoundingBox();const b=geo.boundingBox;assert.ok(b.min.x>=-.49&&b.max.x<=.49,'width '+id);assert.ok(b.min.z>=-1.55&&b.max.z<=-.48,'lane '+id);assert.ok(b.max.y<.8,'height '+id);assert.equal(geo.attributes.position.count,geo.attributes.color.count);assert.ok(Array.from(geo.attributes.position.array).every(Number.isFinite));geo.dispose();}});

test('credits: both CC-BY models have public attribution, source and license links',()=>{const html=fs.readFileSync(path.join(__dirname,'../public/creditos-modelos.html'),'utf8');const index=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');assert.match(index,/href="\/creditos-modelos.html"/);for(const id of ['fZykGFywa5D','eiXGnD1wN5q'])assert.ok(html.includes('https://poly.pizza/m/'+id));assert.ok(html.includes('https://creativecommons.org/licenses/by/3.0/'));assert.ok(html.includes('https://poly.pizza/u/Poly%20by%20Google'));assert.ok(html.includes('via Poly Pizza'));assert.equal(fs.existsSync(path.join(assetRoot,'Nueva carpeta')),false);});
