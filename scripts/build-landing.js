'use strict';
const fs = require('node:fs'), path = require('node:path');
const rules = require('../public/rules');
const escapeHtml = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const root = path.join(__dirname, '..');
function origin(value) {
  const url = new URL(value);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('Usa una URL de origen completa, sin rutas ni credenciales.');
  return url.origin;
}
function build({ siteUrl, gameUrl = 'https://la-deuda-eterna.onrender.com', output = path.join(root, 'dist-landing') }) {
  const site = origin(siteUrl), game = origin(gameUrl);
  if (site === game) throw new Error('La portada y el servidor deben tener direcciones distintas.');
  fs.mkdirSync(output, { recursive: true });
  for (const name of ['index.html', 'landing.css', 'landing.js', 'hero3d.mjs', 'robots.txt', 'sitemap.xml', 'llms.txt', 'index.md']) {
    const content = fs.readFileSync(path.join(root, 'landing', name), 'utf8').replaceAll('__SITE_URL__', site).replaceAll('__GAME_URL__', game).replace('__RULES_HTML__', rules.map(([title,text])=>`<details><summary>${escapeHtml(title)}</summary><p>${escapeHtml(text)}</p></details>`).join('')).replace('__RULES_MD__', rules.map(([title,text])=>`### ${title}\n\n${text}`).join('\n\n'));
    fs.writeFileSync(path.join(output, name), content);
  }
  fs.cpSync(path.join(root, 'landing/media'), path.join(output, 'media'), { recursive: true });
  const copy=(from,to)=>{fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to);};
  for(const file of ['build/three.module.js','build/three.core.js','examples/jsm/loaders/GLTFLoader.js','examples/jsm/utils/BufferGeometryUtils.js','examples/jsm/utils/SkeletonUtils.js','LICENSE'])copy(path.join(root,'node_modules/three',file),path.join(output,'vendor/three',file.replace('build/','').replace('examples/jsm/','addons/')));
  for(const file of ['naturaleza/palmera','maquinaria/tractor','naturaleza/vaca','maquinaria/bomba-petrolera','industrial/fabrica-chocolate','industrial/planta-conservas','comercial/oficinas-fmi','maquinaria/caja-suministros']){
    const rel='assets/modelos-3d/'+file+'.glb',source=path.join(root,'public',rel),data=fs.readFileSync(source),json=JSON.parse(data.subarray(20,20+data.readUInt32LE(12)).toString());copy(source,path.join(output,rel));
    for(const image of json.images||[])if(image.uri&&!image.uri.startsWith('data:'))copy(path.resolve(path.dirname(source),image.uri),path.resolve(path.dirname(path.join(output,rel)),image.uri));
  }
  for (const name of ['favicon.svg','favicon.ico','favicon-96.png','apple-touch-icon.png']) copy(path.join(root,'public',name),path.join(output,name));
  copy(path.join(root,'public/creditos-modelos.html'),path.join(output,'creditos-modelos.html'));
  fs.cpSync(path.join(root,'public/assets/modelos-3d/licencias'),path.join(output,'assets/modelos-3d/licencias'),{recursive:true});
  fs.copyFileSync(path.join(root, 'public/entry-link.js'), path.join(output, 'entry-link.js'));
  fs.copyFileSync(path.join(root, 'public/preview.png'), path.join(output, 'preview.png'));
  for (const name of fs.readdirSync(path.join(root, 'public')).filter(n => /^google[a-f0-9]+\.html$/.test(n))) fs.copyFileSync(path.join(root, 'public', name), path.join(output, name));
  return { site, game, output };
}
if (require.main === module) {
  const siteUrl = process.env.SITE_URL || process.env.RENDER_EXTERNAL_URL;
  if (!siteUrl) throw new Error('Falta SITE_URL para una compilación local. Render proporciona RENDER_EXTERNAL_URL automáticamente.');
  console.log(build({ siteUrl, gameUrl: process.env.GAME_URL || undefined }));
}
module.exports = { build };
