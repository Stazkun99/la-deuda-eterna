'use strict';
(function(){
 const timing=Object.freeze({stepMs:320,startDelayMs:900});
 if(typeof module!=='undefined'&&module.exports)module.exports=timing;
 else globalThis.GameMovement=timing;
})();
