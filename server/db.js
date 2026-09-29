const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const Database = require('better-sqlite3');
require('dotenv').config();

let dbType = 'sqlite'; // 'postgres' or 'sqlite'
let pgPool = null;
let sqliteDb = null;

// Initialize Database
function initDB() {
  const pgConnectionString = process.env.DATABASE_URL;

  if (pgConnectionString && !process.env.USE_SQLITE) {
    try {
      const isCloudPg = pgConnectionString.includes('sslmode=require') || 
                        pgConnectionString.includes('supabase.co') || 
                        pgConnectionString.includes('neon.tech') || 
                        process.env.NODE_ENV === 'production';
      pgPool = new Pool({
        connectionString: pgConnectionString,
        ssl: isCloudPg ? { rejectUnauthorized: false } : false
      });
      // Test connection
      pgPool.query('SELECT NOW()', (err) => {
        if (err) {
          console.warn('[DB] PostgreSQL connection failed, falling back to SQLite:', err.message);
          setupSQLite();
        } else {
          console.log('[DB] Connected successfully to PostgreSQL.');
          dbType = 'postgres';
          setupPostgresSchema();
        }
      });
    } catch (e) {
      console.warn('[DB] Could not initialize Postgres, fallback to SQLite:', e.message);
      setupSQLite();
    }
  } else {
    setupSQLite();
  }
}

function setupSQLite() {
  dbType = 'sqlite';
  const dbPath = path.resolve(__dirname, '../../database.sqlite');
  sqliteDb = new Database(dbPath);
  sqliteDb.pragma('journal_mode = WAL');
  console.log(`[DB] Connected to SQLite database at ${dbPath}`);
  setupSQLiteSchema();
}

function setupSQLiteSchema() {
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      full_name TEXT NOT NULL,
      avatar_url TEXT,
      role TEXT DEFAULT 'member', -- admin, manager, member, guest
      department TEXT,
      designation TEXT,
      phone TEXT,
      location TEXT,
      skills TEXT, -- JSON array of strings
      auth_provider TEXT DEFAULT 'local', -- local, google, facebook, twitter, github, linkedin
      auth_provider_id TEXT,
      join_date TEXT,
      status TEXT DEFAULT 'active', -- active, onboarding, suspended
      onboarding_progress INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS onboarding_tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT DEFAULT 'General', -- HR, IT, Training, Security
      is_completed INTEGER DEFAULT 0,
      completed_at TEXT,
      due_date TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      slug TEXT UNIQUE,
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      workspace_id TEXT,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT DEFAULT '#10b981', -- default elegant green
      status TEXT DEFAULT 'active', -- active, completed, on_hold
      priority TEXT DEFAULT 'Medium',
      start_date TEXT,
      due_date TEXT,
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS boards (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL,
      parent_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'To Do', -- Backlog, To Do, In Progress, In Review, Done, Blocked
      priority TEXT DEFAULT 'Medium', -- Low, Medium, High, Urgent
      estimated_hours REAL DEFAULT 0,
      actual_hours REAL DEFAULT 0,
      start_date TEXT,
      due_date TEXT,
      order_index INTEGER DEFAULT 0,
      assignee_ids TEXT, -- JSON array of user IDs
      tags TEXT, -- JSON array of tag names
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS task_comments (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      user_id TEXT,
      action TEXT NOT NULL,
      details TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Indexes for high-volume performance
    CREATE INDEX IF NOT EXISTS idx_tasks_board ON tasks(board_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
    CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date);
    CREATE INDEX IF NOT EXISTS idx_onboarding_user ON onboarding_tasks(user_id);
    CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_logs(created_at);
  `);

  // Run dynamic column additions safely in JS
  try { sqliteDb.exec("ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'local'"); } catch(e) {}
  try { sqliteDb.exec("ALTER TABLE users ADD COLUMN auth_provider_id TEXT"); } catch(e) {}
  try { sqliteDb.exec("ALTER TABLE activity_logs ADD COLUMN user_name TEXT"); } catch(e) {}
  try { sqliteDb.exec("ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0"); } catch(e) {}
  try { sqliteDb.exec("ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1"); } catch(e) {}
  try { sqliteDb.exec("ALTER TABLE tasks ADD COLUMN xp_reward INTEGER DEFAULT 50"); } catch(e) {}
  try { sqliteDb.exec("ALTER TABLE tasks ADD COLUMN completed_at TEXT"); } catch(e) {}
  try { sqliteDb.exec("ALTER TABLE tasks ADD COLUMN qc_issues TEXT"); } catch(e) {}
  try { sqliteDb.exec("ALTER TABLE projects ADD COLUMN doc_markdown TEXT"); } catch(e) {}
  try { sqliteDb.exec("ALTER TABLE projects ADD COLUMN doc_pdf_path TEXT"); } catch(e) {}
  try { sqliteDb.exec("ALTER TABLE projects ADD COLUMN project_folder TEXT"); } catch(e) {}
  try { sqliteDb.exec("ALTER TABLE projects ADD COLUMN progress_percent INTEGER DEFAULT 0"); } catch(e) {}
  try { sqliteDb.exec("ALTER TABLE projects ADD COLUMN lifecycle_stage TEXT DEFAULT 'Development'"); } catch(e) {}
  try { sqliteDb.exec("ALTER TABLE projects ADD COLUMN location_path TEXT"); } catch(e) {}
  try { sqliteDb.exec("ALTER TABLE projects ADD COLUMN github_repo TEXT"); } catch(e) {}
  try { sqliteDb.exec("ALTER TABLE projects ADD COLUMN server_name TEXT"); } catch(e) {}
  try { sqliteDb.exec("ALTER TABLE projects ADD COLUMN is_restricted INTEGER DEFAULT 0"); } catch(e) {}
  try { sqliteDb.exec("ALTER TABLE projects ADD COLUMN tech_stack TEXT"); } catch(e) {}
  try { sqliteDb.exec("ALTER TABLE projects ADD COLUMN frontend_tech TEXT"); } catch(e) {}
  try { sqliteDb.exec("ALTER TABLE projects ADD COLUMN backend_tech TEXT"); } catch(e) {}
  try { sqliteDb.exec("ALTER TABLE projects ADD COLUMN database_tech TEXT"); } catch(e) {}
  try { sqliteDb.exec("ALTER TABLE onboarding_tasks ADD COLUMN xp_reward INTEGER DEFAULT 35"); } catch(e) {}
  try { sqliteDb.exec("ALTER TABLE users ADD COLUMN rfid_card TEXT"); } catch(e) {}

  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS work_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      task_id TEXT,
      project_id TEXT,
      hours REAL NOT NULL,
      description TEXT,
      work_date TEXT DEFAULT (date('now')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_work_logs_user ON work_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_work_logs_date ON work_logs(work_date);

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL,
      recipient_type TEXT NOT NULL DEFAULT 'broadcast', -- 'broadcast' or 'direct'
      recipient_id TEXT, -- NULL for broadcast, user_id for direct
      title TEXT,
      content TEXT NOT NULL,
      priority TEXT DEFAULT 'Normal', -- 'Normal', 'Important', 'Urgent'
      category TEXT DEFAULT 'Announcement', -- 'Announcement', 'Direct Notice', 'Task Directive', 'Policy Update'
      is_pinned INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
    CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
    CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(recipient_type);
    CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);

    CREATE TABLE IF NOT EXISTS instruction_videos (
      id TEXT PRIMARY KEY,
      uploader_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      video_url TEXT NOT NULL, -- local uploaded file path or direct URL
      video_type TEXT DEFAULT 'upload', -- 'upload' or 'url' (mp4, webm, embed)
      thumbnail_url TEXT,
      duration_seconds REAL DEFAULT 0,
      file_size_bytes INTEGER DEFAULT 0,
      audience_type TEXT NOT NULL DEFAULT 'all', -- 'all' (open for all) or 'selected' (particular people)
      allowed_user_ids TEXT, -- JSON array of user IDs
      category TEXT DEFAULT 'Training & SOP',
      tags TEXT, -- JSON array
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_instruction_videos_uploader ON instruction_videos(uploader_id);
    CREATE INDEX IF NOT EXISTS idx_instruction_videos_audience ON instruction_videos(audience_type);
    CREATE INDEX IF NOT EXISTS idx_instruction_videos_created ON instruction_videos(created_at);

    CREATE TABLE IF NOT EXISTS attendance_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      rfid_card TEXT NOT NULL,
      employee_name TEXT,
      attendance_date TEXT NOT NULL, -- YYYY-MM-DD
      check_in_time TEXT, -- HH:MM:SS or full timestamp
      check_out_time TEXT, -- HH:MM:SS or full timestamp
      total_hours REAL DEFAULT 0,
      status TEXT DEFAULT 'Present', -- 'Present', 'Late', 'Half Day', 'Overtime', 'Absent'
      terminal_id TEXT, -- Reader ID/Door ID e.g., 'RFID-MAIN-GATE'
      raw_source TEXT, -- 'csv_import', 'excel_import', 'manual_scan'
      import_batch_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_rfid ON attendance_logs(rfid_card);
    CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_logs(attendance_date);
    CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance_logs(status);
  `);
}

async function setupPostgresSchema() {
  if (!pgPool) return;
  const client = await pgPool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT,
        full_name VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        role VARCHAR(32) DEFAULT 'member',
        department VARCHAR(128),
        designation VARCHAR(128),
        phone VARCHAR(64),
        location VARCHAR(128),
        skills TEXT,
        join_date VARCHAR(64),
        status VARCHAR(32) DEFAULT 'active',
        onboarding_progress INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS onboarding_tasks (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        category VARCHAR(64) DEFAULT 'General',
        is_completed INTEGER DEFAULT 0,
        completed_at TIMESTAMP,
        due_date VARCHAR(64)
      );

      CREATE TABLE IF NOT EXISTS workspaces (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        slug VARCHAR(255) UNIQUE,
        created_by VARCHAR(64),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(64) PRIMARY KEY,
        workspace_id VARCHAR(64) REFERENCES workspaces(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        color VARCHAR(32) DEFAULT '#10b981',
        status VARCHAR(32) DEFAULT 'active',
        priority VARCHAR(32) DEFAULT 'Medium',
        start_date VARCHAR(64),
        due_date VARCHAR(64),
        created_by VARCHAR(64),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS boards (
        id VARCHAR(64) PRIMARY KEY,
        project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(64) PRIMARY KEY,
        board_id VARCHAR(64) NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
        parent_id VARCHAR(64),
        title TEXT NOT NULL,
        description TEXT,
        status VARCHAR(64) DEFAULT 'To Do',
        priority VARCHAR(32) DEFAULT 'Medium',
        estimated_hours NUMERIC DEFAULT 0,
        actual_hours NUMERIC DEFAULT 0,
        start_date VARCHAR(64),
        due_date VARCHAR(64),
        order_index INTEGER DEFAULT 0,
        assignee_ids TEXT,
        tags TEXT,
        created_by VARCHAR(64),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS task_comments (
        id VARCHAR(64) PRIMARY KEY,
        task_id VARCHAR(64) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS activity_logs (
        id VARCHAR(64) PRIMARY KEY,
        entity_type VARCHAR(64) NOT NULL,
        entity_id VARCHAR(64) NOT NULL,
        user_id VARCHAR(64),
        action VARCHAR(128) NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS work_logs (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        task_id VARCHAR(64) REFERENCES tasks(id) ON DELETE SET NULL,
        project_id VARCHAR(64) REFERENCES projects(id) ON DELETE SET NULL,
        hours NUMERIC NOT NULL,
        description TEXT,
        work_date VARCHAR(64) DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(64) PRIMARY KEY,
        sender_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        recipient_type VARCHAR(32) NOT NULL DEFAULT 'broadcast',
        recipient_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        title TEXT,
        content TEXT NOT NULL,
        priority VARCHAR(32) DEFAULT 'Normal',
        category VARCHAR(64) DEFAULT 'Announcement',
        is_pinned INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS instruction_videos (
        id VARCHAR(64) PRIMARY KEY,
        uploader_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        video_url TEXT NOT NULL,
        video_type VARCHAR(32) DEFAULT 'upload',
        thumbnail_url TEXT,
        duration_seconds NUMERIC DEFAULT 0,
        file_size_bytes BIGINT DEFAULT 0,
        audience_type VARCHAR(32) NOT NULL DEFAULT 'all',
        allowed_user_ids TEXT,
        category VARCHAR(64) DEFAULT 'Training & SOP',
        tags TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS attendance_logs (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
        rfid_card VARCHAR(128) NOT NULL,
        employee_name VARCHAR(255),
        attendance_date VARCHAR(64) NOT NULL,
        check_in_time VARCHAR(64),
        check_out_time VARCHAR(64),
        total_hours NUMERIC DEFAULT 0,
        status VARCHAR(64) DEFAULT 'Present',
        terminal_id VARCHAR(128),
        raw_source VARCHAR(64),
        import_batch_id VARCHAR(64),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_tasks_board ON tasks(board_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
      CREATE INDEX IF NOT EXISTS idx_work_logs_user ON work_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
      CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
      CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(recipient_type);
      CREATE INDEX IF NOT EXISTS idx_instruction_videos_uploader ON instruction_videos(uploader_id);
      CREATE INDEX IF NOT EXISTS idx_instruction_videos_audience ON instruction_videos(audience_type);
      CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_attendance_rfid ON attendance_logs(rfid_card);
      CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_logs(attendance_date);
    `);

    // Safe dynamic column additions for PostgreSQL
    const alterColumns = [
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(32) DEFAULT 'local'",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider_id VARCHAR(128)",
      "ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS user_name VARCHAR(128)",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS rfid_card VARCHAR(128)",
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS xp_reward INTEGER DEFAULT 50",
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at VARCHAR(64)",
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS qc_issues TEXT",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS doc_markdown TEXT",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS doc_pdf_path TEXT",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_folder TEXT",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS progress_percent INTEGER DEFAULT 0",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS lifecycle_stage VARCHAR(64) DEFAULT 'Development'",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS location_path TEXT",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_repo TEXT",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS server_name TEXT",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_restricted INTEGER DEFAULT 0",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS tech_stack TEXT",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS frontend_tech TEXT",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS backend_tech TEXT",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS database_tech TEXT",
      "ALTER TABLE onboarding_tasks ADD COLUMN IF NOT EXISTS xp_reward INTEGER DEFAULT 35"
    ];

    for (const sql of alterColumns) {
      try { await client.query(sql); } catch(e) {}
    }

    console.log('[DB] PostgreSQL tables verified/created successfully.');
  } catch (err) {
    console.error('[DB] Postgres setup schema error:', err.message);
  } finally {
    client.release();
  }
}

// Unified query wrapper supporting both SQLite and PostgreSQL syntax
async function query(sql, params = []) {
  if (dbType === 'postgres' && pgPool) {
    // Convert ? to $1, $2, etc for postgres if needed
    let pSql = sql;
    let pIdx = 1;
    while (pSql.includes('?')) {
      pSql = pSql.replace('?', `$${pIdx++}`);
    }
    const res = await pgPool.query(pSql, params);
    return res.rows;
  } else {
    // SQLite execution
    const trimmed = sql.trim().toUpperCase();
    if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA')) {
      const stmt = sqliteDb.prepare(sql);
      return stmt.all(...params);
    } else {
      const stmt = sqliteDb.prepare(sql);
      const info = stmt.run(...params);
      return { affectedRows: info.changes, lastInsertRowid: info.lastInsertRowid };
    }
  }
}

// Quick helper to get single row
async function getOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows && rows.length > 0 ? rows[0] : null;
}

module.exports = {
  initDB,
  query,
  getOne,
  getDbType: () => dbType,
  getPool: () => pgPool,
  getSqlite: () => sqliteDb
};
