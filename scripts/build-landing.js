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
  for (const name of ['index.html', 'landing.css', 'landing.js', 'robots.txt', 'sitemap.xml', 'llms.txt', 'index.md']) {
    const content = fs.readFileSync(path.join(root, 'landing', name), 'utf8').replaceAll('__SITE_URL__', site).replaceAll('__GAME_URL__', game).replace('__RULES_HTML__', rules.map(([title,text])=>`<details><summary>${escapeHtml(title)}</summary><p>${escapeHtml(text)}</p></details>`).join('')).replace('__RULES_MD__', rules.map(([title,text])=>`### ${title}\n\n${text}`).join('\n\n'));
    fs.writeFileSync(path.join(output, name), content);
  }
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
