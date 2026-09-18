const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function api(){const context=vm.createContext({});vm.runInContext(fs.readFileSync(require.resolve('../public/board3d-ui.js'),'utf8'),context);return context.Game3DUI;}
class Node {
 constructor(name){this.name=name;this.children=[];this.parentNode=null;}
 get nextSibling(){return this.parentNode?.children[this.parentNode.children.indexOf(this)+1]||null;}
 append(node){this.insertBefore(node,null);}
 insertBefore(node,next){if(node.parentNode){const old=node.parentNode;old.children.splice(old.children.indexOf(node),1);}const index=next?this.children.indexOf(next):this.children.length;this.children.splice(index,0,node);node.parentNode=this;}
}
test('vista 3D: mueve controles originales, conserva formularios y restaura orden sin duplicar',()=>{
 const ui=api(),origin=new Node('2d'),target=new Node('3d'),a=new Node('acciones'),b=new Node('chat'),c=new Node('otros');origin.append(a);origin.append(b);origin.append(c);b.value='mensaje sin enviar';a.handler=()=>42;
 const mount=ui.createMount([[a,target],[b,target]],{createComment:()=>new Node('anchor')});
 for(let i=0;i<3;i++){mount.mount();mount.mount();assert.deepEqual(target.children,[a,b]);assert.equal(b.value,'mensaje sin enviar');assert.equal(a.handler(),42);mount.restore();mount.restore();assert.deepEqual(origin.children.filter(n=>n.name!=='anchor'),[a,b,c]);assert.equal(target.children.length,0);}
});
test('vista 3D: los avisos avanzan sobre la mesa y se pausan ante decisiones modales',()=>{
 const ui=api();let seen;
 assert.equal(ui.hasBlockingDialog({querySelector:q=>{seen=q;return null;}}),false);assert.equal(seen,'dialog[open]:not(#tablero-3d-dialog)');
 assert.equal(ui.hasBlockingDialog({querySelector:()=>({id:'carta-dialog'})}),true);
});
