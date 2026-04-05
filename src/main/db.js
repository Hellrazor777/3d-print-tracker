/**
 * Database abstraction layer for Electron desktop app.
 *
 * When DATABASE_URL is set as a Windows environment variable → saves to Supabase
 * (same database as the cloud/Render deployment — data stays in sync).
 * Otherwise → silently falls back to local JSON files in userData (original behaviour).
 */

// ─── PostgreSQL (Supabase) ────────────────────────────────────────────────────

let usePostgres = false;
let pgPool = null;

const dbReadyPromise = (async () => {
  if (!process.env.DATABASE_URL) return;
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });
    await pool.query('SELECT 1');
    pgPool = pool;
    usePostgres = true;
    console.log('[db] Connected to Supabase — data will sync with cloud.');
  } catch (err) {
    console.log('[db] Supabase not reachable — using local files.', err.message);
  }
})();

// ─── Public API ───────────────────────────────────────────────────────────────

async function loadData(localPath, fs) {
  await dbReadyPromise;
  if (usePostgres) {
    const res = await pgPool.query("SELECT data FROM app_data WHERE id = 'default'");
    return res.rows.length ? res.rows[0].data : null;
  }
  try {
    if (fs.existsSync(localPath)) return JSON.parse(fs.readFileSync(localPath, 'utf8'));
  } catch {}
  return null;
}

async function saveData(data, localPath, fs) {
  await dbReadyPromise;
  if (usePostgres) {
    await pgPool.query(
      "UPDATE app_data SET data = $1::jsonb, updated_at = NOW() WHERE id = 'default'",
      [JSON.stringify(data)]
    );
    return true;
  }
  try {
    const bakPath = localPath + '.bak';
    if (fs.existsSync(localPath)) fs.copyFileSync(localPath, bakPath);
    fs.writeFileSync(localPath, JSON.stringify(data), 'utf8');
    return true;
  } catch { return false; }
}

async function loadSettings(settingsPath, fs) {
  await dbReadyPromise;
  if (usePostgres) {
    const res = await pgPool.query("SELECT settings FROM app_data WHERE id = 'default'");
    return res.rows.length ? (res.rows[0].settings || {}) : {};
  }
  try {
    if (fs.existsSync(settingsPath)) return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch {}
  return {};
}

async function saveSettings(settings, settingsPath, fs) {
  await dbReadyPromise;
  if (usePostgres) {
    await pgPool.query(
      "UPDATE app_data SET settings = $1::jsonb, updated_at = NOW() WHERE id = 'default'",
      [JSON.stringify(settings)]
    );
    return true;
  }
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings), 'utf8');
    return true;
  } catch { return false; }
}

module.exports = { loadData, saveData, loadSettings, saveSettings, dbReadyPromise };
