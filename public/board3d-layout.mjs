export function tilePosition(id) {
  if (!Number.isInteger(id) || id < 0 || id > 39) throw new RangeError('Casilla inválida');
  if(id<=10)return {x:5-id,z:5};
  if(id<=20)return {x:-5,z:15-id};
  if(id<=30)return {x:id-25,z:-5};
  return {x:5,z:id-35};
}

export function pieceKind(color) {
  return ({'#e74c3c':'carrito','#2ecc71':'sombrero','#3498db':'bota','#f1c40f':'balsa'})[color?.toLowerCase()] || 'carrito';
}
export function playerSlot(players, player) {
  const occupants=players.filter(p=>!p.enQuiebra&&p.posicion===player.posicion).sort((a,b)=>String(a.id).localeCompare(String(b.id)));
  const index=occupants.findIndex(p=>p.id===player.id);
  if(occupants.length<=1)return {x:0,z:0,scale:1};
  return {x:(index%2 ? 1:-1)*.235,z:(index<2 ? -1:1)*.235,scale:.56};
}
export function rollPath(previous, next, roll, seenRoll) {
  if(!previous||!roll||roll.id===seenRoll||roll.jugadorId!==next.id||roll.desde!==previous.posicion||roll.hasta!==next.posicion||!Number.isInteger(roll.total)||roll.total<1||roll.total>24)return [];
  if((roll.desde+roll.total)%40!==roll.hasta)return [];
  return Array.from({length:roll.total+1},(_,i)=>(roll.desde+i)%40);
}

// Local negative Z is the outer strip; positive Z is the player lane.
export function tileAngle(id){return id<=10?Math.PI:id<=20?Math.PI/2:id<=30?0:-Math.PI/2;}
export function tileAnchor(id,x=0,z=.22){const p=tilePosition(id),a=tileAngle(id);return {x:p.x+x*Math.cos(a)+z*Math.sin(a),z:p.z-x*Math.sin(a)+z*Math.cos(a)};}
export function sceneryPlayerSlot(players,player){const slot=playerSlot(players,player);return {x:slot.x,z:.22+slot.z*.47,scale:slot.scale===1?.7:.43};}
