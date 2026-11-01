const { Pool } = require('pg');
const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const neonUrl = process.env.DATABASE_URL;

async function syncServerToLocal() {
  console.log('[Sync Server -> Local] Connecting to Neon PostgreSQL...');
  if (!neonUrl) {
    console.error('DATABASE_URL is not set!');
    process.exit(1);
  }

  const pgPool = new Pool({
    connectionString: neonUrl,
    ssl: { rejectUnauthorized: false }
  });

  const sqlitePath = path.resolve('F:/antigravity/database.sqlite');
  console.log(`[Sync Server -> Local] Connecting to SQLite at ${sqlitePath}...`);
  const sqliteDb = new Database(sqlitePath);
  sqliteDb.pragma('journal_mode = WAL');

  // Ensure sqlite tables have necessary columns if added later
  const alterIfMissing = (table, col, def) => {
    try {
      const cols = sqliteDb.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
      if (!cols.includes(col)) {
        sqliteDb.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
        console.log(`[Schema] Added column ${col} to ${table}`);
      }
    } catch (e) {
      // ignore
    }
  };

  alterIfMissing('projects', 'hosting_info', 'TEXT');
  alterIfMissing('common_onboarding_tasks', 'task_type', "TEXT DEFAULT 'standard'");
  alterIfMissing('common_onboarding_tasks', 'form_schema', 'TEXT');
  alterIfMissing('onboarding_tasks', 'task_type', "TEXT DEFAULT 'standard'");
  alterIfMissing('onboarding_tasks', 'form_schema', 'TEXT');
  alterIfMissing('onboarding_tasks', 'submission_data', 'TEXT');

  const client = await pgPool.connect();

  try {
    const tables = [
      'users',
      'workspaces',
      'projects',
      'boards',
      'tasks',
      'task_comments',
      'work_logs',
      'messages',
      'system_settings',
      'attendance_logs',
      'activity_logs',
      'video_watches',
      'earnings_rewards',
      'common_onboarding_tasks',
      'instruction_videos',
      'onboarding_tasks'
    ];

    for (const table of tables) {
      try {
        console.log(`[Sync] Pulling table '${table}' from server...`);
        const { rows } = await client.query(`SELECT * FROM ${table}`);
        console.log(`[Sync] Retrieved ${rows.length} rows for '${table}'.`);

        if (rows.length === 0) continue;

        // Ensure table exists in SQLite or get its column names
        const tableCols = sqliteDb.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
        const columns = Object.keys(rows[0]).filter(c => tableCols.includes(c));
        const placeholders = columns.map(() => '?').join(', ');
        const colList = columns.join(', ');
        
        const updateClause = columns
          .filter(c => c !== 'id' && c !== 'key')
          .map(c => `${c} = excluded.${c}`)
          .join(', ');

        const conflictKey = table === 'system_settings' ? 'key' : (columns.includes('id') ? 'id' : null);

        let sql = '';
        if (conflictKey && updateClause) {
          sql = `INSERT INTO ${table} (${colList}) VALUES (${placeholders}) ON CONFLICT (${conflictKey}) DO UPDATE SET ${updateClause}`;
        } else if (conflictKey) {
          sql = `INSERT INTO ${table} (${colList}) VALUES (${placeholders}) ON CONFLICT (${conflictKey}) DO NOTHING`;
        } else {
          sql = `INSERT OR IGNORE INTO ${table} (${colList}) VALUES (${placeholders})`;
        }

        const stmt = sqliteDb.prepare(sql);

        const insertMany = sqliteDb.transaction((records) => {
          for (const record of records) {
            const vals = columns.map(c => {
              let val = record[c];
              if (val instanceof Date) {
                return val.toISOString();
              }
              if (typeof val === 'object' && val !== null) {
                return JSON.stringify(val);
              }
              return val;
            });
            stmt.run(...vals);
          }
        });

        insertMany(rows);
        console.log(`[Sync] Successfully synced ${rows.length} rows into local '${table}'.`);
      } catch (err) {
        console.warn(`[Sync] Warning on table '${table}':`, err.message);
      }
    }

    console.log('[Sync Server -> Local] All data synchronized successfully from server to local database!');
  } catch (err) {
    console.error('[Sync Server -> Local] Fatal Error:', err);
  } finally {
    client.release();
    await pgPool.end();
    sqliteDb.close();
  }
}

syncServerToLocal();
