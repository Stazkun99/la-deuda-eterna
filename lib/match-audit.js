'use strict';
const {randomUUID,createHash}=require('node:crypto');
const fs=require('node:fs'),path=require('node:path');
// Fingerprint changes automatically with the economy, cards, bots or event rules.
const sources=['lib/game.js','lib/data.js','cartas.js','lib/bot-strategy.js','lib/world-events.js','public/world-events.js'];
const rulesHash=createHash('sha256').update(sources.map(p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8')).join('\n')).digest('hex');
const LIMIT=8*1024*1024;
const pick=(v,keys)=>Object.fromEntries(keys.filter(k=>v?.[k]!==undefined).map(k=>[k,structuredClone(v[k])]));
function start(r,now,complete=true){r.auditoria={schema:1,id:randomUUID(),inicio:now,completa:complete,motivoIncompleto:complete?null:'Registro iniciado con la partida ya en curso',reglas:{version:'economia-2026-09-30',huella:rulesHash,despliegue:process.env.RENDER_GIT_COMMIT||null},opciones:{eventos:r.eventosHabilitados!==false,monopolios:!!r.monopolio},catalogo:require('./data').TABLERO,costes:require('../cartas').CARTAS_PROPIEDADES,entradas:[],bytes:0};}
function append(r,type,data,now){const a=r.auditoria;if(!a||(a.fin&&type!=='accion')||a.truncada)return;const row={n:a.entradas.length+1,fecha:now,turno:r.turnoId,tipo:type,datos:structuredClone(data)};const bytes=Buffer.byteLength(JSON.stringify(row));if(a.bytes+bytes>LIMIT){a.completa=false;a.truncada=true;a.motivoIncompleto='Límite de 8 MB alcanzado';return;}a.bytes+=bytes;a.entradas.push(row);}
function snapshot(r){return {
 turno:r.turnoId,activo:r.jugadores[r.turnoActual]?.id,fase:r.fase,enJuego:r.enJuego,
 jugadores:r.jugadores.map(p=>pick(p,['id','nombre','bot','personaje','dinero','deudaPersonal','oro','posicion','vueltasCompletadas','enQuiebra','alianzaId','turnosPerdidos','industriasCerradas','interesEspecial','noPagarVuelta','sombreroSandino','resguardoFuga','resguardoGolpe'])),
 propiedades:r.tablero.filter(c=>c.tipo==='propiedad').map(c=>pick(c,['id','dueño','industriasNac','industriasExp'])),
 barrera:!!r.barreraProteccionista,descuento:!!r.descuento,pausa:!!r.pausa,
 pendiente:pick(r.pendiente,['id','tipo','jugadorId','dueñoId','monto','motivo','casillaRenta','nombrePropiedad','efecto','cartaId','oferta','puja','mejorPostor','destinatarioId','entrego','recibo','pago','cobro','base','opciones','votos']),
 tirada:r.ultimaTirada||null,carta:r.ultimaCarta||null,evento:r.eventoActual||null,cambioEvento:r.eventoCambio||null,inicio:r.inicioPartida||null,resultado:r.resultado||null
};}
function observe(r,now){if(!r.auditoria&&(r.enJuego||r.finalizada))start(r,now,false);const a=r.auditoria;if(!a||a.fin||(!r.enJuego&&!r.finalizada))return;const current=snapshot(r),patch={};for(const [key,val]of Object.entries(current))if(JSON.stringify(val)!==JSON.stringify(a.ultimo?.[key]))patch[key]=val;if(Object.keys(patch).length)append(r,a.ultimo?'cambios':'estadoInicial',patch,now);a.ultimo=structuredClone(current);if(r.finalizada)a.fin=now;}
function archive(r){if(r.auditoria)r.auditoriaAnterior=r.auditoria;r.auditoria=null;}
function report(r,now){const a=r.auditoria||r.auditoriaAnterior;if(!a)return null;return structuredClone({formato:'deuda-eterna-balance',schema:a.schema,id:a.id,inicio:a.inicio,fin:a.fin||null,exportado:now,completa:a.completa,truncada:!!a.truncada,motivoIncompleto:a.motivoIncompleto,reglas:a.reglas,opciones:a.opciones,catalogo:a.catalogo,costes:a.costes,nota:'Los registros cambios sustituyen únicamente los campos indicados del estado anterior. Incluye apodos; no incluye chat, credenciales ni el orden de cartas futuras.',estadoFinal:a.ultimo,entradas:a.entradas});}
module.exports={start,append,observe,archive,report};
