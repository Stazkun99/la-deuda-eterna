'use strict';
// Server-owned allowances: each presentation ID earns time once, never on client request.
function compensatePresentation(room,now){
 const previous=room.presentationLedger||{roll:null,card:null,event:null,payments:[]};let ms=0;
 const roll=room.ultimaTirada,card=room.ultimaCarta,event=room.eventoCambio;
 if(roll?.id&&roll.id!==previous.roll){ms+=Number.isInteger(roll.desde)?(roll.tipo==='continuacion'?0:900)+(roll.pasos??roll.total)*320+2400:1400;}
 if(card?.roboId&&card.roboId!==previous.card)ms+=4500;
 if(event?.id&&event.id!==previous.event)ms+=5900;
 const payments=(room.interacciones||[]).filter(i=>i.pagoIntereses);
 ms+=payments.filter(i=>!previous.payments.includes(i.id)).length*2300;
 room.presentationLedger={roll:roll?.id||null,card:card?.roboId||null,event:event?.id||null,payments:payments.map(i=>i.id)};
 if(!room.enJuego||room.pausa||!ms)return 0;
 // The game clock keeps its remaining decision time; auction extensions still require a new bid.
 if(room.limiteTurno)room.limiteTurno+=ms;
 if(room.pendiente?.vence)room.pendiente.vence+=ms;
 room.botNextAt=Math.max(room.botNextAt||0,now+ms);
 return ms;
}
module.exports={compensatePresentation};
