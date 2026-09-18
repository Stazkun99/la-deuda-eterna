import * as THREE from 'three';

export function createPlayerPiece(kind, color) {
  const root=new THREE.Group(), model=new THREE.Group(), resources=[];
  root.add(model);
  const own=v=>(resources.push(v),v);
  const material=(color,metalness=.15)=>own(new THREE.MeshStandardMaterial({color,metalness,roughness:.36}));
  const body=material(color,.45), dark=material('#26343b'), cream=material('#fff1c4'), metal=material('#d8e1e5',.7), wood=material('#b67b42');
  function mesh(geometry,mat,x,y,z,rx=0,rz=0){const m=new THREE.Mesh(own(geometry),mat);m.position.set(x,y,z);m.rotation.set(rx,0,rz);model.add(m);return m;}
  const box=(w,h,d,mat,x,y,z)=>mesh(new THREE.BoxGeometry(w,h,d),mat,x,y,z);
  const cyl=(a,b,h,mat,x,y,z,rx=0,rz=0)=>mesh(new THREE.CylinderGeometry(a,b,h,24),mat,x,y,z,rx,rz);
  cyl(.33,.36,.07,dark,0,.035,0);
  cyl(.32,.32,.035,body,0,.086,0);
  if(kind==='carrito'){
    box(.52,.15,.29,body,0,.24,0);box(.26,.17,.27,body,-.02,.37,0);
    box(.19,.10,.282,cream,-.02,.39,0);box(.02,.12,.29,body,-.02,.39,0);
    box(.54,.04,.31,metal,0,.17,0);
    for(const x of [-.17,.17])for(const z of [-.17,.17]){cyl(.095,.095,.065,dark,x,.18,z,Math.PI/2);cyl(.047,.047,.069,metal,x,.18,z,Math.PI/2);}
    for(const z of [-.095,.095])box(.025,.055,.065,cream,.269,.26,z);
  }else if(kind==='sombrero'){
    cyl(.29,.3,.055,body,0,.15,0);cyl(.17,.21,.35,body,0,.345,0);cyl(.205,.21,.075,dark,0,.225,0);cyl(.18,.17,.035,body,0,.53,0);
    box(.065,.05,.024,metal,0,.235,.212);
  }else if(kind==='bota'){
    box(.46,.075,.26,dark,.025,.15,0);box(.43,.13,.24,body,.025,.23,0);
    box(.23,.29,.24,body,-.09,.39,0);box(.25,.06,.26,cream,-.09,.54,0);
    for(let i=0;i<3;i++)box(.026,.018,.19,cream,.035,.32+i*.065,0);
    box(.13,.055,.23,dark,-.12,.105,0);
  }else{
    for(let i=0;i<4;i++)cyl(.06,.06,.57,wood,0,.16,(i-1.5)*.13,0,Math.PI/2);
    for(const x of [-.17,.17])box(.027,.025,.53,dark,x,.219,0);
    cyl(.018,.018,.6,wood,-.05,.49,0);
    const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(.3,0);shape.lineTo(0,.43);shape.closePath();
    const sail=mesh(new THREE.ExtrudeGeometry(shape,{depth:.016,bevelEnabled:false}),body,-.035,.32,0);
    sail.material.side=THREE.DoubleSide;
    cyl(.029,.029,.52,cream,.13,.20,.05,0,-.6);
  }
  const ringMaterial=own(new THREE.MeshBasicMaterial({color:'#fff3ae',transparent:true,opacity:.95}));
  const ring=new THREE.Mesh(own(new THREE.TorusGeometry(.39,.027,8,48)),ringMaterial);ring.rotation.x=-Math.PI/2;ring.position.y=.045;root.add(ring);
  return {root,model,ring,dispose(){for(const r of resources)r.dispose();}};
}
