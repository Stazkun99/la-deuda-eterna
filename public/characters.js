'use strict';
// Shared allow-list used by the server and both board views.
(function () {
  const characters = Object.freeze([
    {id:'kirby',name:'Kirby',color:'#f5a4c4'},
    {id:'link',name:'Link',color:'#74b65b'},
    {id:'yoshi',name:'Yoshi',color:'#9acd49'},
    {id:'scyther',name:'Scyther',color:'#6bbda0'}
  ].map(Object.freeze));
  if (typeof module !== 'undefined' && module.exports) module.exports = characters;
  else globalThis.GameCharacters = characters;
})();
