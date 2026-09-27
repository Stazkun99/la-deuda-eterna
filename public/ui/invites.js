'use strict';
globalThis.GameInvites={create({$,getRoom,notice}) {
  let base='https://la-deuda-eterna-1.onrender.com/';
  const config=fetch('/api/public-config').then(r=>r.ok?r.json():null).then(data=>{if(data?.landingUrl)base=data.landingUrl;}).catch(()=>{});
  $('invitar').onclick=async()=>{
    const room=getRoom(); if(!room)return;
    await config; if(getRoom()!==room)return;
    $('enlace-invitacion').value=GameEntry.invite(base,room);
    $('compartir-invitacion').hidden=!navigator.share;
    $('invitacion-dialog').showModal();
  };
  $('cerrar-invitacion').onclick=()=>$('invitacion-dialog').close();
  $('copiar-invitacion').onclick=async()=>{
    try {await navigator.clipboard.writeText($('enlace-invitacion').value);$('estado-invitacion').textContent='Enlace copiado. Envíalo a tus amigos.';}
    catch {$('enlace-invitacion').focus();$('enlace-invitacion').select();$('estado-invitacion').textContent='Selecciona y copia este enlace.';}
  };
  $('compartir-invitacion').onclick=async()=>{try{await navigator.share({title:'La Deuda Eterna',text:'Únete a mi sala',url:$('enlace-invitacion').value});}catch(e){if(e.name!=='AbortError')notice('Puedes copiar el enlace y enviarlo manualmente.');}};
}};
