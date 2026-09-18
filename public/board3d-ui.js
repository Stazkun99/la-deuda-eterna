'use strict';
// Move live controls instead of cloning forms, handlers or pending decisions.
globalThis.Game3DUI = {
  createMount(bindings, doc = document) {
    const saved = bindings.map(([node, target]) => {
      const anchor = doc.createComment('shared game control');
      node.parentNode.insertBefore(anchor, node);
      return {node,target,anchor};
    });
    let mounted = false;
    return {
      mount() { if(mounted)return; for(const {node,target} of saved)target.append(node); mounted=true; },
      restore() { if(!mounted)return; for(const {node,anchor} of saved)anchor.parentNode.insertBefore(node,anchor.nextSibling); mounted=false; },
      get mounted() { return mounted; }
    };
  },
  hasBlockingDialog(doc = document) {
    return !!doc.querySelector('dialog[open]:not(#tablero-3d-dialog)');
  }
};
