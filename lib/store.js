'use strict';
const fs = require('node:fs');
const path = require('node:path');
class Store {
  constructor(directory) { this.file = path.join(directory, 'partidas.json'); fs.mkdirSync(directory, { recursive: true }); }
  load() {
    if (!fs.existsSync(this.file)) return {};
    const data = JSON.parse(fs.readFileSync(this.file, 'utf8'));
    if (data.version !== 1 || !data.rooms || typeof data.rooms !== 'object' || Array.isArray(data.rooms)) throw new Error('Guardado incompatible: conserva partidas.json y revisa su contenido.');
    for (const [code, r] of Object.entries(data.rooms)) {
      if (!/^[A-Z0-9_-]{3,12}$/.test(code) || r.codigo !== code || !Array.isArray(r.jugadores) || !Array.isArray(r.tablero) || r.tablero.length !== 40 || r.jugadores.some(p => !/^[a-f0-9]{64}$/.test(p.tokenHash))) throw new Error('Guardado inválido: conserva partidas.json para recuperarlo.');
    }
    return data.rooms;
  }
  save(rooms) {
    const temp = this.file + '.tmp', fd = fs.openSync(temp, 'w', 0o600);
    try { fs.writeFileSync(fd, JSON.stringify({ version: 1, rooms })); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    fs.renameSync(temp, this.file);
  }
}
module.exports = { Store };
