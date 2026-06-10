/* One-time database restore on boot — used to seed a fresh Railway volume.
   Controlled by RESTORE_DB_URL. Runs ONCE (guarded by a marker file on the volume),
   so it never overwrites data the team adds later. No effect if RESTORE_DB_URL is unset. */
const fs = require('fs'), path = require('path'), os = require('os');
const DATA = process.env.XL_DATA_DIR || path.join(os.homedir(), '1xl-data');
(async () => {
  try {
    const url = process.env.RESTORE_DB_URL;
    const marker = path.join(DATA, '.restored');
    if (url && !fs.existsSync(marker)) {
      if (!fs.existsSync(DATA)) fs.mkdirSync(DATA, { recursive: true });
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(path.join(DATA, '1xl.db'), buf);
      ['1xl.db-wal', '1xl.db-shm'].forEach(f => { try { fs.unlinkSync(path.join(DATA, f)); } catch (e) {} });
      fs.writeFileSync(marker, new Date().toISOString());
      console.log('[bootstrap] restored database from RESTORE_DB_URL (' + buf.length + ' bytes)');
    }
  } catch (e) {
    console.log('[bootstrap] restore skipped/failed: ' + e.message);
  }
  require('./server'); // start the platform
})();
