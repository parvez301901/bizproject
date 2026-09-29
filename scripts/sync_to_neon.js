const Database = require('better-sqlite3');
const { Pool } = require('pg');
require('dotenv').config();

const neonUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_sALSrY4bq8Fl@ep-tiny-base-b43gm6rl-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function syncAll() {
  console.log('[Sync] Reading local SQLite database...');
  const sqliteDb = new Database('F:/antigravity/database.sqlite');
  const pgPool = new Pool({
    connectionString: neonUrl,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pgPool.connect();
  try {
    // 1. Check/ensure workspaces exist in Neon
    const localWorkspaces = sqliteDb.prepare('SELECT * FROM workspaces').all();
    for (const ws of localWorkspaces) {
      await client.query(`
        INSERT INTO workspaces (id, name, description, slug, created_by)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO NOTHING
      `, [ws.id, ws.name, ws.description, ws.slug, ws.created_by]);
    }

    // 2. Sync projects
    const localProjects = sqliteDb.prepare('SELECT * FROM projects').all();
    console.log(`[Sync] Found ${localProjects.length} projects in local SQLite.`);

    let projectsInserted = 0;
    let projectsUpdated = 0;

    for (const p of localProjects) {
      const res = await client.query(`
        INSERT INTO projects (
          id, workspace_id, name, description, color, status, priority,
          start_date, due_date, created_by, doc_markdown, doc_pdf_path,
          project_folder, progress_percent, lifecycle_stage, location_path,
          github_repo, server_name, is_restricted, tech_stack,
          frontend_tech, backend_tech, database_tech
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          color = EXCLUDED.color,
          status = EXCLUDED.status,
          priority = EXCLUDED.priority,
          start_date = EXCLUDED.start_date,
          due_date = EXCLUDED.due_date,
          project_folder = EXCLUDED.project_folder,
          progress_percent = EXCLUDED.progress_percent,
          lifecycle_stage = EXCLUDED.lifecycle_stage,
          location_path = EXCLUDED.location_path,
          github_repo = EXCLUDED.github_repo,
          server_name = EXCLUDED.server_name,
          is_restricted = EXCLUDED.is_restricted,
          tech_stack = EXCLUDED.tech_stack,
          frontend_tech = EXCLUDED.frontend_tech,
          backend_tech = EXCLUDED.backend_tech,
          database_tech = EXCLUDED.database_tech
      `, [
        p.id, p.workspace_id || 'ws_primary', p.name, p.description, p.color || '#10b981',
        p.status || 'active', p.priority || 'Medium', p.start_date, p.due_date,
        p.created_by || 'usr_admin', p.doc_markdown, p.doc_pdf_path,
        p.project_folder, p.progress_percent || 0, p.lifecycle_stage || 'Development',
        p.location_path, p.github_repo, p.server_name, p.is_restricted || 0,
        p.tech_stack, p.frontend_tech, p.backend_tech, p.database_tech
      ]);
      projectsInserted++;
    }

    // 3. Sync boards
    const localBoards = sqliteDb.prepare('SELECT * FROM boards').all();
    for (const b of localBoards) {
      await client.query(`
        INSERT INTO boards (id, project_id, name)
        VALUES ($1, $2, $3)
        ON CONFLICT (id) DO NOTHING
      `, [b.id, b.project_id, b.name]);
    }

    // 4. Sync tasks
    const localTasks = sqliteDb.prepare('SELECT * FROM tasks').all();
    for (const t of localTasks) {
      await client.query(`
        INSERT INTO tasks (
          id, board_id, parent_id, title, description, status, priority,
          estimated_hours, actual_hours, start_date, due_date, order_index,
          assignee_ids, tags, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          status = EXCLUDED.status,
          priority = EXCLUDED.priority,
          estimated_hours = EXCLUDED.estimated_hours,
          actual_hours = EXCLUDED.actual_hours,
          due_date = EXCLUDED.due_date
      `, [
        t.id, t.board_id, t.parent_id, t.title, t.description, t.status || 'To Do',
        t.priority || 'Medium', t.estimated_hours || 0, t.actual_hours || 0,
        t.start_date, t.due_date, t.order_index || 0, t.assignee_ids, t.tags,
        t.created_by || 'usr_admin'
      ]);
    }

    const liveProjectsCount = await client.query('SELECT count(*) FROM projects');
    const liveBoardsCount = await client.query('SELECT count(*) FROM boards');
    const liveTasksCount = await client.query('SELECT count(*) FROM tasks');

    console.log(`[Sync Done] Neon live count -> Projects: ${liveProjectsCount.rows[0].count}, Boards: ${liveBoardsCount.rows[0].count}, Tasks: ${liveTasksCount.rows[0].count}`);
  } catch (err) {
    console.error('[Sync Error]', err);
  } finally {
    client.release();
    await pgPool.end();
  }
}

if (require.main === module) {
  syncAll();
}

module.exports = { syncAll };
