'use strict';
const express=require('express'),path=require('node:path');
const {readFileSync}=require('node:fs'),{createHash}=require('node:crypto');
const root=path.join(__dirname,'..');
function installHttp(app,isHealthy){
  const structuredDataHashes = [...readFileSync(path.join(root, 'public/index.html'), 'utf8').matchAll(/<script type="(?:application\/ld\+json|importmap)">([\s\S]*?)<\/script>/g)]
    .map(match => "'sha256-" + createHash('sha256').update(match[1]).digest('base64') + "'").join(' ');
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', `default-src 'self'; script-src 'self' ${structuredDataHashes}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'`);
    if (req.path === '/' || /\.(html|js)$/.test(req.path)) res.setHeader('Cache-Control', 'no-cache');
    next();
  });
  app.get('/index.html', (_req, res) => res.redirect(301, '/'));
  app.use(['/health', '/api'], (_req, res, next) => { res.setHeader('X-Robots-Tag', 'noindex'); next(); });
  app.get('/health', (_req, res) => res.status(isHealthy() ? 200 : 503).json({ ok: isHealthy() }));
  app.get('/api/catalogo', (_req, res) => {
    const art = require('../public/assets/cartas/manifest.json');
    res.json(require('../cartas').CARTAS_PROPIEDADES.map(p => ({ ...p, ...art.propiedades[p.nombre] })));
  });
  // Only the browser modules needed by the 3D view are public, not all node_modules.
  for (const file of ['three.module.js', 'three.core.js']) app.get('/vendor/three/' + file, (_req, res) => res.sendFile(path.join(root, 'node_modules/three/build', file)));
  app.get('/vendor/three/OrbitControls.js', (_req, res) => res.sendFile(path.join(root, 'node_modules/three/examples/jsm/controls/OrbitControls.js')));
  for (const file of ['loaders/GLTFLoader.js','utils/BufferGeometryUtils.js','utils/SkeletonUtils.js']) {
    app.get('/vendor/three/' + file, (_req, res) => res.sendFile(path.join(root, 'node_modules/three/examples/jsm', file)));
  }
  app.use(express.static(path.join(root, 'public')));
}
module.exports={installHttp};
