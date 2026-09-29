const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { initDB, query, getOne, getDbType } = require('./db');
const { seedData } = require('./seed');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'apexboard_super_secret_jwt_key_2026';

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Ensure uploads directory exists and is statically accessible
const uploadsDir = path.join(__dirname, '../uploads');
const videosUploadDir = path.join(uploadsDir, 'videos');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(videosUploadDir)) fs.mkdirSync(videosUploadDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Initialize DB and Seed
initDB();
setTimeout(() => {
  seedData();
  syncUserLevelsAndXP();
}, 600);

// --- GAMIFICATION & XP LEVEL PROGRESSION ENGINE ---
// User requested milestone thresholds:
// 100 XP -> Level 1 (Apprentice)
// 500 XP -> Level 2 (Specialist)
// 1,000 XP -> Level 3 (Expert)
// 2,000 XP -> Level 4 (Master)
// 3,500 XP -> Level 5 (Grandmaster)
// 5,500 XP -> Level 6 (Legend)
// Extended progression ladder:
// 8,000 XP -> Level 7 (Mythic)
// 11,000 XP -> Level 8 (Champion)
// 15,000 XP -> Level 9 (Vanguard)
// 20,000 XP -> Level 10 (Apex Titan)

const LEVEL_THRESHOLDS = [
  { level: 0, minXp: 0, title: 'Novice', badge: '🌱', color: '#94a3b8' },
  { level: 1, minXp: 100, title: 'Apprentice', badge: '⭐', color: '#10b981' },
  { level: 2, minXp: 500, title: 'Specialist', badge: '⚡', color: '#06b6d4' },
  { level: 3, minXp: 1000, title: 'Expert', badge: '🔥', color: '#f59e0b' },
  { level: 4, minXp: 2000, title: 'Master', badge: '💎', color: '#8b5cf6' },
  { level: 5, minXp: 3500, title: 'Grandmaster', badge: '👑', color: '#ec4899' },
  { level: 6, minXp: 5500, title: 'Legend', badge: '🏆', color: '#f43f5e' },
  { level: 7, minXp: 8000, title: 'Mythic', badge: '🌌', color: '#6366f1' },
  { level: 8, minXp: 11000, title: 'Champion', badge: '⚔️', color: '#14b8a6' },
  { level: 9, minXp: 15000, title: 'Vanguard', badge: '🛡️', color: '#eab308' },
  { level: 10, minXp: 20000, title: 'Apex Titan', badge: '🚀', color: '#d946ef' }
];

function getLevelInfo(xp) {
  const points = Math.max(0, Number(xp) || 0);
  let currentTier = LEVEL_THRESHOLDS[0];
  let nextTier = LEVEL_THRESHOLDS[1];

  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i].minXp) {
      currentTier = LEVEL_THRESHOLDS[i];
      nextTier = LEVEL_THRESHOLDS[i + 1] || null;
      break;
    }
  }

  let progressPercent = 100;
  let xpNeededForNext = 0;

  if (nextTier) {
    const range = nextTier.minXp - currentTier.minXp;
    const progress = points - currentTier.minXp;
    progressPercent = Math.min(100, Math.max(0, Math.round((progress / range) * 100)));
    xpNeededForNext = Math.max(0, nextTier.minXp - points);
  }

  return {
    level: currentTier.level,
    title: currentTier.title,
    badge: currentTier.badge,
    color: currentTier.color,
    currentXp: points,
    currentLevelMinXp: currentTier.minXp,
    nextLevelMinXp: nextTier ? nextTier.minXp : currentTier.minXp,
    progressPercent,
    xpNeededForNext,
    isMaxLevel: !nextTier
  };
}

async function syncUserLevelsAndXP() {
  try {
    const users = await query('SELECT id, xp, level FROM users');
    const totalXp = users.reduce((sum, u) => sum + (Number(u.xp) || 0), 0);
    
    // If all users have 0 XP, seed starter XP for team members so the leaderboard is immediately exciting
    if (totalXp === 0) {
      const demoXpMap = {
        'usr_admin': 2450, // Level 4 (Master)
        'usr_dev_1': 1620, // Level 3 (Expert)
        'usr_dev_2': 780,  // Level 2 (Specialist)
        'usr_new_1': 320,  // Level 1 (Apprentice)
        'usr_new_2': 90,   // Level 0 (Novice, 10 XP to Lvl 1)
        'usr_ee99d199': 540, // Level 2 (Specialist)
        'usr_e8f42870': 150  // Level 1 (Apprentice)
      };

      for (const [uid, xpVal] of Object.entries(demoXpMap)) {
        const lvl = getLevelInfo(xpVal).level;
        await query('UPDATE users SET xp = ?, level = ? WHERE id = ?', [xpVal, lvl, uid]);
      }
      console.log('[Gamification] Seeded baseline XP and synchronized level milestones.');
    } else {
      // Recalculate level according to the new exact thresholds for all users
      for (const u of users) {
        const accurateLvl = getLevelInfo(u.xp).level;
        if (accurateLvl !== Number(u.level)) {
          await query('UPDATE users SET level = ? WHERE id = ?', [accurateLvl, u.id]);
        }
      }
      console.log('[Gamification] Synchronized all user levels against milestone ladder.');
    }
  } catch (err) {
    console.warn('[Gamification] Sync warning:', err.message);
  }
}

// Helper for universal audit logging
async function logActivity({ entity_type, entity_id, user_id, user_name, action, details }) {
  try {
    const logId = 'log_' + uuidv4().substring(0, 8);
    await query(`
      INSERT INTO activity_logs (id, entity_type, entity_id, user_id, user_name, action, details)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      logId,
      entity_type,
      entity_id,
      user_id || 'usr_system',
      user_name || 'System',
      action,
      details
    ]);
  } catch (err) {
    console.error('[AuditLog] Failed to log:', err.message);
  }
}

// --- 1. SYSTEM & HEALTH ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: getDbType(), version: 'v1.0.3-datesafe', timestamp: new Date().toISOString() });
});

// --- 2. AUTHENTICATION & SOCIAL LOGINS ---
// Verify current session token / get current user
app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ error: 'Session expired or invalid token' });
    }

    const user = await getOne('SELECT id, email, full_name, avatar_url, role, department, designation, auth_provider, status, xp, level FROM users WHERE id = ?', [decoded.id]);
    if (!user || user.status === 'deactivated') {
      return res.status(401).json({ error: 'User account not active' });
    }

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register with email & password
app.post('/api/auth/register', async (req, res) => {
  try {
    const { full_name, email, password, department = 'Engineering', designation = 'Team Member' } = req.body;
    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'Full name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const existing = await getOne('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const userId = 'usr_' + uuidv4().substring(0, 8);
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(full_name)}`;
    const joinDate = new Date().toISOString().split('T')[0];

    await query(`
      INSERT INTO users (id, email, password_hash, full_name, avatar_url, role, department, designation, auth_provider, join_date, status, onboarding_progress)
      VALUES (?, ?, ?, ?, ?, 'member', ?, ?, 'local', ?, 'active', 100)
    `, [userId, email.toLowerCase().trim(), password_hash, full_name, avatarUrl, department, designation, joinDate]);

    // Create token
    const token = jwt.sign({ id: userId, email: email.toLowerCase().trim(), role: 'member' }, JWT_SECRET, { expiresIn: '7d' });

    // Universal Audit Log
    await logActivity({
      entity_type: 'auth',
      entity_id: userId,
      user_id: userId,
      user_name: full_name,
      action: 'USER_REGISTER',
      details: `New account registered with email (${email})`
    });

    const user = await getOne('SELECT id, email, full_name, avatar_url, role, department, designation, auth_provider, status, xp, level FROM users WHERE id = ?', [userId]);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login with email & password
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await getOne('SELECT * FROM users WHERE LOWER(TRIM(email)) = ?', [email.toLowerCase().trim()]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.password_hash) {
      return res.status(401).json({ error: 'This account was created with social login. Please sign in using your social provider or reset password.' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    // Universal Audit Log
    await logActivity({
      entity_type: 'auth',
      entity_id: user.id,
      user_id: user.id,
      user_name: user.full_name,
      action: 'USER_LOGIN',
      details: `User logged in successfully via credentials`
    });

    const safeUser = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      role: user.role,
      department: user.department,
      designation: user.designation,
      auth_provider: user.auth_provider || 'local',
      status: user.status,
      xp: user.xp || 0,
      level: user.level || 1
    };

    res.json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Social Login / Registration (Google, Facebook, Twitter, GitHub, LinkedIn)
app.post('/api/auth/social', async (req, res) => {
  try {
    const { provider, email, full_name, avatar_url, provider_id } = req.body;
    const validProviders = ['google', 'facebook', 'twitter', 'github', 'linkedin'];

    if (!validProviders.includes(provider)) {
      return res.status(400).json({ error: `Unsupported social provider: ${provider}` });
    }

    const cleanEmail = (email || `${provider}_user_${Date.now()}@auth.${provider}.com`).toLowerCase().trim();
    const cleanName = full_name || `${provider.toUpperCase()} User`;
    const cleanAvatar = avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanName)}`;

    let user = await getOne('SELECT * FROM users WHERE email = ? OR (auth_provider = ? AND auth_provider_id = ?)', [
      cleanEmail,
      provider,
      provider_id || cleanEmail
    ]);

    let isNewRegistration = false;

    if (!user) {
      // Register new user from social auth
      isNewRegistration = true;
      const userId = 'usr_' + uuidv4().substring(0, 8);
      const joinDate = new Date().toISOString().split('T')[0];

      await query(`
        INSERT INTO users (id, email, full_name, avatar_url, role, department, designation, auth_provider, auth_provider_id, join_date, status, onboarding_progress)
        VALUES (?, ?, ?, ?, 'member', 'General', 'Team Member', ?, ?, ?, 'active', 100)
      `, [userId, cleanEmail, cleanName, cleanAvatar, provider, provider_id || cleanEmail, joinDate]);

      user = await getOne('SELECT * FROM users WHERE id = ?', [userId]);
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    // Universal Audit Log
    const actionName = isNewRegistration ? 'OAUTH_REGISTER' : 'OAUTH_LOGIN';
    await logActivity({
      entity_type: 'auth',
      entity_id: user.id,
      user_id: user.id,
      user_name: user.full_name,
      action: actionName,
      details: `${isNewRegistration ? 'Registered' : 'Logged in'} using ${provider.charAt(0).toUpperCase() + provider.slice(1)} account (${cleanEmail})`
    });

    const safeUser = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      role: user.role,
      department: user.department,
      designation: user.designation,
      auth_provider: provider,
      status: user.status
    };

    res.json({ token, user: safeUser, isNewRegistration });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 3. UNIVERSAL AUDIT LOGS ENDPOINT ---
app.get('/api/logs', async (req, res) => {
  try {
    const { entity_type, action, search, limit = 100 } = req.query;
    let sql = 'SELECT * FROM activity_logs';
    let conditions = [];
    let params = [];

    if (entity_type && entity_type !== 'all') {
      conditions.push('entity_type = ?');
      params.push(entity_type);
    }

    if (action && action !== 'all') {
      conditions.push('action = ?');
      params.push(action);
    }

    if (search) {
      conditions.push('(details LIKE ? OR user_name LIKE ? OR action LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(Number(limit) || 100);

    const logs = await query(sql, params);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 4. USERS & ONBOARDING ---
app.get('/api/users', async (req, res) => {
  try {
    const { include_deactivated } = req.query;
    let sql = 'SELECT * FROM users';
    if (include_deactivated !== 'true') {
      sql += " WHERE status != 'deactivated'";
    }
    sql += ' ORDER BY created_at DESC';

    const users = await query(sql);
    const parsed = users.map(u => ({
      ...u,
      skills: u.skills ? JSON.parse(u.skills) : []
    }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create/Onboard new employee
app.post('/api/users/onboard', async (req, res) => {
  try {
    const {
      full_name,
      email,
      role = 'member',
      department = 'General',
      designation = 'Team Member',
      phone = '',
      location = '',
      skills = [],
      actor_id = 'usr_admin',
      actor_name = 'Alex Morgan',
      custom_checklists = []
    } = req.body;

    if (!full_name || !email) {
      return res.status(400).json({ error: 'Full name and email are required.' });
    }

    const userId = 'usr_' + uuidv4().substring(0, 8);
    const joinDate = new Date().toISOString().split('T')[0];

    await query(`
      INSERT INTO users (id, email, full_name, avatar_url, role, department, designation, phone, location, skills, join_date, status, onboarding_progress)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      email,
      full_name,
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(full_name)}`,
      role,
      department,
      designation,
      phone,
      location,
      JSON.stringify(skills),
      joinDate,
      'onboarding',
      0
    ]);

    // Create default onboarding checklist with gamified reward XP
    const defaultChecklists = [
      { title: 'Personal and emergency contact information verification', category: 'HR', xp: 30 },
      { title: 'Sign employment agreement and company policies', category: 'Legal & HR', xp: 40 },
      { title: 'Setup company credentials, Google Workspace & 2FA', category: 'IT Security', xp: 50 },
      { title: 'Schedule 1-on-1 welcome session with mentor & manager', category: 'Team & Culture', xp: 35 },
      { title: 'Configure workstation tools & software licenses', category: 'IT & Dev', xp: 45 },
      { title: 'Review company mission, project roadmap & team workflows', category: 'Training', xp: 50 }
    ];

    const tasksToInsert = custom_checklists.length > 0 ? custom_checklists : defaultChecklists;

    for (const t of tasksToInsert) {
      const taskXp = t.xp || t.xp_reward || 35;
      await query(`
        INSERT INTO onboarding_tasks (id, user_id, title, category, is_completed, due_date, xp_reward)
        VALUES (?, ?, ?, ?, 0, ?, ?)
      `, [uuidv4(), userId, t.title || t, t.category || 'General', '2026-10-15', taskXp]);
    }

    // Universal Audit Log
    await logActivity({
      entity_type: 'onboarding',
      entity_id: userId,
      user_id: actor_id,
      user_name: actor_name,
      action: 'EMPLOYEE_ONBOARDED',
      details: `Onboarded new hire ${full_name} into ${department} as ${designation}`
    });

    const created = await getOne('SELECT * FROM users WHERE id = ?', [userId]);
    res.status(201).json({
      ...created,
      skills: JSON.parse(created.skills || '[]')
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user details
app.put('/api/users/:id', async (req, res) => {
  try {
    const { full_name, role, department, designation, phone, location, status, skills, actor_name = 'Admin' } = req.body;
    await query(`
      UPDATE users
      SET full_name = COALESCE(?, full_name),
          role = COALESCE(?, role),
          department = COALESCE(?, department),
          designation = COALESCE(?, designation),
          phone = COALESCE(?, phone),
          location = COALESCE(?, location),
          status = COALESCE(?, status),
          skills = COALESCE(?, skills),
          updated_at = datetime('now')
      WHERE id = ?
    `, [
      full_name, role, department, designation, phone, location, status,
      skills ? JSON.stringify(skills) : null,
      req.params.id
    ]);

    await logActivity({
      entity_type: 'user',
      entity_id: req.params.id,
      user_name: actor_name,
      action: 'USER_UPDATED',
      details: `Updated profile details for user ID ${req.params.id}`
    });

    const updated = await getOne('SELECT * FROM users WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Soft-Delete (Deactivate) or Reactivate a member
app.patch('/api/users/:id/status', async (req, res) => {
  try {
    const { status, actor_name = 'Admin' } = req.body; // 'active', 'deactivated', 'suspended'
    if (!status) return res.status(400).json({ error: 'Status is required' });

    const user = await getOne('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await query("UPDATE users SET status = ?, updated_at = datetime('now') WHERE id = ?", [status, req.params.id]);

    // Universal Audit Log
    const actionName = status === 'deactivated' ? 'USER_DEACTIVATED' : 'USER_ACTIVATED';
    await logActivity({
      entity_type: 'user',
      entity_id: user.id,
      user_name: actor_name,
      action: actionName,
      details: `${status === 'deactivated' ? 'Soft-deleted / Deactivated' : 'Re-activated'} member "${user.full_name}" (${user.email})`
    });

    const updated = await getOne('SELECT * FROM users WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Permanent Delete a member
app.delete('/api/users/:id', async (req, res) => {
  try {
    const actor_name = req.query.actor_name || 'Admin';
    const user = await getOne('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await query('DELETE FROM users WHERE id = ?', [req.params.id]);

    // Universal Audit Log
    await logActivity({
      entity_type: 'user',
      entity_id: req.params.id,
      user_name: actor_name,
      action: 'USER_DELETED',
      details: `Permanently removed member "${user.full_name}" (${user.email})`
    });

    res.json({ success: true, message: `Member ${user.full_name} removed.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user onboarding tasks
app.get('/api/users/:id/onboarding', async (req, res) => {
  try {
    const tasks = await query('SELECT * FROM onboarding_tasks WHERE user_id = ? ORDER BY is_completed ASC, title ASC', [req.params.id]);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Assign a new onboarding task to an employee with custom reward XP
app.post('/api/users/:id/onboarding', async (req, res) => {
  try {
    const { title, category = 'General', xp_reward = 35, due_date, actor_name = 'Admin' } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const user = await getOne('SELECT id, full_name FROM users WHERE id = ?', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const taskId = 'ot_' + uuidv4().substring(0, 8);
    const dueDateToUse = due_date || new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 10);
    const rewardToUse = Number(xp_reward) || 35;

    await query(`
      INSERT INTO onboarding_tasks (id, user_id, title, category, is_completed, due_date, xp_reward)
      VALUES (?, ?, ?, ?, 0, ?, ?)
    `, [taskId, user.id, title.trim(), category, dueDateToUse, rewardToUse]);

    // Recalculate user onboarding progress
    const allTasks = await query('SELECT count(*) as total, sum(is_completed) as completed FROM onboarding_tasks WHERE user_id = ?', [user.id]);
    const total = allTasks[0].total || 1;
    const completed = allTasks[0].completed || 0;
    const progressPercent = Math.round((completed / total) * 100);

    const userStatus = progressPercent === 100 ? 'active' : 'onboarding';
    await query('UPDATE users SET onboarding_progress = ?, status = ? WHERE id = ?', [progressPercent, userStatus, user.id]);

    await logActivity({
      entity_type: 'onboarding',
      entity_id: taskId,
      user_name: actor_name,
      action: 'ONBOARDING_TASK_ASSIGNED',
      details: `Assigned new onboarding checklist task "${title.trim()}" (${category}, +${rewardToUse} XP) to ${user.full_name}`
    });

    const created = await getOne('SELECT * FROM onboarding_tasks WHERE id = ?', [taskId]);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an onboarding task
app.delete('/api/onboarding/:taskId', async (req, res) => {
  try {
    const task = await getOne('SELECT * FROM onboarding_tasks WHERE id = ?', [req.params.taskId]);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    await query('DELETE FROM onboarding_tasks WHERE id = ?', [req.params.taskId]);

    // Recalculate user onboarding progress
    const allTasks = await query('SELECT count(*) as total, sum(is_completed) as completed FROM onboarding_tasks WHERE user_id = ?', [task.user_id]);
    const total = allTasks[0].total || 1;
    const completed = allTasks[0].completed || 0;
    const progressPercent = Math.round((completed / total) * 100);

    const userStatus = progressPercent === 100 ? 'active' : 'onboarding';
    await query('UPDATE users SET onboarding_progress = ?, status = ? WHERE id = ?', [progressPercent, userStatus, task.user_id]);

    res.json({ success: true, message: 'Onboarding task removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle onboarding task completion
app.put('/api/onboarding/:taskId/toggle', async (req, res) => {
  try {
    const { actor_name = 'Admin' } = req.body;
    const task = await getOne('SELECT * FROM onboarding_tasks WHERE id = ?', [req.params.taskId]);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const newStatus = task.is_completed ? 0 : 1;
    const completedAt = newStatus ? new Date().toISOString() : null;

    await query('UPDATE onboarding_tasks SET is_completed = ?, completed_at = ? WHERE id = ?', [newStatus, completedAt, task.id]);

    // Recalculate user onboarding progress
    const allTasks = await query('SELECT count(*) as total, sum(is_completed) as completed FROM onboarding_tasks WHERE user_id = ?', [task.user_id]);
    const total = allTasks[0].total || 1;
    const completed = allTasks[0].completed || 0;
    const progressPercent = Math.round((completed / total) * 100);

    const userStatus = progressPercent === 100 ? 'active' : 'onboarding';
    await query('UPDATE users SET onboarding_progress = ?, status = ? WHERE id = ?', [progressPercent, userStatus, task.user_id]);

    // Gamification XP Award on Onboarding Task Completion
    let xpGained = 0;
    if (newStatus === 1) {
      xpGained = Number(task.xp_reward) || 35;
      if (progressPercent === 100) {
        xpGained += 150; // Bonus for graduating onboarding!
      }
      const u = await getOne('SELECT xp, level, full_name FROM users WHERE id = ?', [task.user_id]);
      if (u) {
        const currentXp = Number(u.xp) || 0;
        const newXp = currentXp + xpGained;
        const levelInfo = getLevelInfo(newXp);
        const leveledUp = levelInfo.level > (Number(u.level) || 0);
        await query('UPDATE users SET xp = ?, level = ? WHERE id = ?', [newXp, levelInfo.level, task.user_id]);
        
        await logActivity({
          entity_type: 'gamification',
          entity_id: task.user_id,
          user_name: u.full_name,
          action: 'XP_AWARDED',
          details: `Earned +${xpGained} XP for completing onboarding milestone "${task.title}". (Total: ${newXp} XP, Level ${levelInfo.level} ${levelInfo.title} ${levelInfo.badge})${progressPercent === 100 ? ' (Graduation Bonus +150 XP!)' : ''}`
        });

        if (leveledUp) {
          await logActivity({
            entity_type: 'gamification',
            entity_id: task.user_id,
            user_name: u.full_name,
            action: 'LEVEL_UP',
            details: `🎉 Promoted to Level ${levelInfo.level}: ${levelInfo.title} ${levelInfo.badge}!`
          });
        }
      }
    }

    res.json({ success: true, is_completed: newStatus, progressPercent, userStatus, xpGained });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper: Automatic Tech Stack Detector across project files
function detectTechStack(folderPath) {
  const result = {
    frontend: [],
    backend: [],
    database: [],
    technologies: []
  };

  if (!folderPath || !fs.existsSync(folderPath)) {
    return result;
  }

  try {
    const files = fs.readdirSync(folderPath);

    // 1. package.json inspection
    if (files.includes('package.json')) {
      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(folderPath, 'package.json'), 'utf8'));
        const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

        // Frontend
        if (deps['react']) result.frontend.push('React');
        if (deps['next']) result.frontend.push('Next.js');
        if (deps['vue']) result.frontend.push('Vue');
        if (deps['@angular/core']) result.frontend.push('Angular');
        if (deps['svelte']) result.frontend.push('Svelte');
        if (deps['vite']) result.frontend.push('Vite');
        if (deps['tailwindcss']) result.frontend.push('Tailwind CSS');
        if (deps['@mui/material'] || deps['@chakra-ui/react']) result.frontend.push('Component UI');

        // Backend
        if (deps['express']) result.backend.push('Express.js');
        if (deps['@nestjs/core']) result.backend.push('NestJS');
        if (deps['koa']) result.backend.push('Koa');
        if (deps['fastify']) result.backend.push('Fastify');
        if (deps['socket.io']) result.backend.push('Socket.io');
        if (!result.backend.length && (deps['express'] || deps['next'] || pkg.main)) {
          if (!result.backend.includes('Node.js')) result.backend.push('Node.js');
        }

        // Database
        if (deps['prisma'] || deps['@prisma/client']) result.database.push('Prisma');
        if (deps['mongoose']) {
          if (!result.database.includes('MongoDB')) result.database.push('MongoDB');
        }
        if (deps['pg'] || deps['postgres']) {
          if (!result.database.includes('PostgreSQL')) result.database.push('PostgreSQL');
        }
        if (deps['mysql'] || deps['mysql2']) {
          if (!result.database.includes('MySQL')) result.database.push('MySQL');
        }
        if (deps['better-sqlite3'] || deps['sqlite3'] || deps['sqlite']) {
          if (!result.database.includes('SQLite')) result.database.push('SQLite');
        }
        if (deps['sequelize']) result.database.push('Sequelize');
        if (deps['typeorm']) result.database.push('TypeORM');
        if (deps['drizzle-orm']) result.database.push('Drizzle');
        if (deps['redis'] || deps['ioredis']) result.database.push('Redis');
        if (deps['firebase'] || deps['@firebase/app']) result.database.push('Firebase');
        if (deps['@supabase/supabase-js']) result.database.push('Supabase');

        result.technologies.push('Node.js / npm');
        if (deps['typescript'] || files.includes('tsconfig.json')) result.technologies.push('TypeScript');
      } catch (e) {}
    }

    // 2. Client / Frontend subfolder check
    const clientDirCandidates = ['client', 'frontend', 'app', 'ui', 'src'];
    for (const cName of clientDirCandidates) {
      if (files.includes(cName)) {
        const sub = path.join(folderPath, cName);
        if (fs.existsSync(path.join(sub, 'package.json'))) {
          try {
            const pkg = JSON.parse(fs.readFileSync(path.join(sub, 'package.json'), 'utf8'));
            const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
            if (deps['react'] && !result.frontend.includes('React')) result.frontend.push('React');
            if (deps['next'] && !result.frontend.includes('Next.js')) result.frontend.push('Next.js');
            if (deps['vite'] && !result.frontend.includes('Vite')) result.frontend.push('Vite');
            if (deps['tailwindcss'] && !result.frontend.includes('Tailwind CSS')) result.frontend.push('Tailwind CSS');
            if (deps['vue'] && !result.frontend.includes('Vue')) result.frontend.push('Vue');
            if (deps['typescript'] && !result.technologies.includes('TypeScript')) result.technologies.push('TypeScript');
          } catch (e) {}
        }
      }
    }

    // 3. Server / Backend subfolder check
    const serverDirCandidates = ['server', 'backend', 'api'];
    for (const sName of serverDirCandidates) {
      if (files.includes(sName)) {
        const sub = path.join(folderPath, sName);
        if (fs.existsSync(path.join(sub, 'package.json'))) {
          try {
            const pkg = JSON.parse(fs.readFileSync(path.join(sub, 'package.json'), 'utf8'));
            const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
            if (deps['express'] && !result.backend.includes('Express.js')) result.backend.push('Express.js');
            if (deps['better-sqlite3'] && !result.database.includes('SQLite')) result.database.push('SQLite');
            if (deps['pg'] && !result.database.includes('PostgreSQL')) result.database.push('PostgreSQL');
            if (deps['mysql2'] && !result.database.includes('MySQL')) result.database.push('MySQL');
            if (deps['prisma'] && !result.database.includes('Prisma')) result.database.push('Prisma');
            if (!result.backend.includes('Node.js')) result.backend.push('Node.js');
          } catch (e) {}
        }
      }
    }

    // 4. PHP / Laravel / WordPress checks
    if (files.includes('composer.json') || files.some(f => f.endsWith('.php'))) {
      if (!result.backend.includes('PHP')) result.backend.push('PHP');
      if (files.includes('artisan')) {
        if (!result.backend.includes('Laravel')) result.backend.push('Laravel');
        if (!result.technologies.includes('Laravel Artisan')) result.technologies.push('Laravel Artisan');
        if (!result.database.includes('MySQL')) result.database.push('MySQL');
      }
      if (files.includes('wp-config.php') || files.includes('wp-content')) {
        if (!result.backend.includes('WordPress')) result.backend.push('WordPress');
        if (!result.technologies.includes('WordPress CMS')) result.technologies.push('WordPress CMS');
        if (!result.database.includes('MySQL')) result.database.push('MySQL');
      }
      if (files.includes('composer.json')) {
        try {
          const comp = JSON.parse(fs.readFileSync(path.join(folderPath, 'composer.json'), 'utf8'));
          const req = comp.require || {};
          if (req['laravel/framework'] && !result.backend.includes('Laravel')) result.backend.push('Laravel');
          if (req['slim/slim']) result.backend.push('Slim PHP');
        } catch (e) {}
      }
      if (!result.database.length) {
        result.database.push('MySQL');
      }
    }

    // 5. Python checks
    if (files.includes('requirements.txt') || files.includes('Pipfile') || files.some(f => f.endsWith('.py'))) {
      if (!result.backend.includes('Python')) result.backend.push('Python');
      if (files.includes('manage.py')) {
        if (!result.backend.includes('Django')) result.backend.push('Django');
        if (!result.database.includes('SQLite') && !result.database.includes('PostgreSQL')) {
          result.database.push('SQLite');
        }
      }
      if (files.some(f => f.toLowerCase().includes('app.py') || f.toLowerCase().includes('main.py'))) {
        if (!result.backend.includes('Flask') && !result.backend.includes('FastAPI')) {
          result.backend.push('FastAPI / Flask');
        }
      }
    }

    // 6. Static HTML / CSS fallback
    if (!result.frontend.length) {
      if (files.some(f => f.endsWith('.html') || f.endsWith('.htm'))) {
        result.frontend.push('HTML5 / CSS3 / Vanilla JS');
      }
    }
  } catch (e) {}

  return result;
}

// --- 5. WORKSPACES & PROJECTS ---
app.get('/api/workspaces', async (req, res) => {
  try {
    const workspaces = await query('SELECT * FROM workspaces ORDER BY created_at ASC');
    res.json(workspaces);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/projects', async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'] || 'admin';
    const canViewAll = userRole === 'admin' || userRole === 'manager';
    const includeArchived = req.query.include_archived === 'true';

    let conditions = [];
    if (!canViewAll) {
      conditions.push('(p.is_restricted = 0 OR p.is_restricted IS NULL)');
    }
    if (!includeArchived) {
      conditions.push("(p.status != 'archived' OR p.status IS NULL)");
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const dateNowExpr = getDbType() === 'postgres' ? "TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD')" : "date('now')";

    const projects = await query(`
      SELECT p.*,
        (SELECT count(*) FROM boards b JOIN tasks t ON t.board_id = b.id WHERE b.project_id = p.id) as task_count,
        (SELECT count(*) FROM boards b JOIN tasks t ON t.board_id = b.id WHERE b.project_id = p.id AND t.status = 'Done') as completed_task_count,
        (SELECT count(*) FROM boards b JOIN tasks t ON t.board_id = b.id WHERE b.project_id = p.id AND t.status = 'In Progress') as in_progress_task_count,
        (SELECT count(*) FROM boards b JOIN tasks t ON t.board_id = b.id WHERE b.project_id = p.id AND (t.status = 'Blocked' OR t.priority = 'Urgent')) as blocked_task_count,
        (SELECT count(*) FROM boards b JOIN tasks t ON t.board_id = b.id WHERE b.project_id = p.id AND t.status != 'Done' AND t.due_date IS NOT NULL AND t.due_date < ${dateNowExpr}) as overdue_task_count,
        (SELECT COALESCE(sum(t.actual_hours), 0) FROM boards b JOIN tasks t ON t.board_id = b.id WHERE b.project_id = p.id) as total_logged_hours
      FROM projects p
      ${whereClause}
      ORDER BY p.created_at DESC
    `);

    // For each project, fetch top blocked/urgent issues and sanitize fields if employee
    const enrichedProjects = await Promise.all(projects.map(async (proj) => {
      const issues = await query(`
        SELECT t.id, t.title, t.status, t.priority, t.due_date
        FROM boards b
        JOIN tasks t ON t.board_id = b.id
        WHERE b.project_id = ? AND (t.status = 'Blocked' OR t.priority = 'Urgent' OR (t.status != 'Done' AND t.due_date IS NOT NULL AND t.due_date < ${dateNowExpr}))
        ORDER BY CASE WHEN t.status = 'Blocked' THEN 1 WHEN t.priority = 'Urgent' THEN 2 ELSE 3 END
        LIMIT 5
      `, [proj.id]);

      // Resolve folder path on disk
      let diskFolder = null;
      if (proj.location_path && fs.existsSync(proj.location_path)) {
        diskFolder = proj.location_path;
      } else if (proj.project_folder) {
        const p1 = path.resolve('F:/antigravity', proj.project_folder);
        const p2 = path.resolve('C:/xampp/htdocs', proj.project_folder);
        if (fs.existsSync(p1)) diskFolder = p1;
        else if (fs.existsSync(p2)) diskFolder = p2;
      }

      const detected = detectTechStack(diskFolder);

      // Merge explicit database columns with auto-detected tech stack
      const finalFrontend = proj.frontend_tech 
        ? proj.frontend_tech.split(',').map(s => s.trim()).filter(Boolean)
        : detected.frontend;
      const finalBackend = proj.backend_tech 
        ? proj.backend_tech.split(',').map(s => s.trim()).filter(Boolean)
        : detected.backend;
      const finalDatabase = proj.database_tech 
        ? proj.database_tech.split(',').map(s => s.trim()).filter(Boolean)
        : detected.database;
      const finalTechStack = proj.tech_stack 
        ? proj.tech_stack.split(',').map(s => s.trim()).filter(Boolean)
        : detected.technologies;

      const techInfo = {
        frontend: finalFrontend,
        backend: finalBackend,
        database: finalDatabase,
        technologies: finalTechStack,
        allTags: Array.from(new Set([...finalFrontend, ...finalBackend, ...finalDatabase, ...finalTechStack]))
      };

      // If user is regular employee/member, hide sensitive infrastructure data (github, server, local paths) unless authorized
      if (!canViewAll) {
        return {
          ...proj,
          location_path: null,
          github_repo: null,
          server_name: null,
          tech: techInfo,
          issues: issues || []
        };
      }

      return {
        ...proj,
        tech: techInfo,
        issues: issues || []
      };
    }));

    res.json(enrichedProjects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { 
      name, 
      description = '', 
      color = '#10b981', 
      status = 'active', 
      priority = 'Medium', 
      start_date, 
      due_date, 
      workspace_id, 
      project_folder = '',
      doc_markdown = '',
      doc_pdf_path = '',
      progress_percent = 0,
      lifecycle_stage = 'Development',
      location_path = '',
      github_repo = '',
      server_name = '',
      is_restricted = 0,
      tech_stack = '',
      frontend_tech = '',
      backend_tech = '',
      database_tech = '',
      actor_name = 'Admin' 
    } = req.body;
    const projId = 'proj_' + uuidv4().substring(0, 8);
    const ws = workspace_id || 'ws_primary';

    await query(`
      INSERT INTO projects (
        id, workspace_id, name, description, color, status, priority, 
        start_date, due_date, project_folder, doc_markdown, doc_pdf_path, 
        progress_percent, lifecycle_stage, location_path, github_repo, 
        server_name, is_restricted, tech_stack, frontend_tech, backend_tech, database_tech, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'usr_admin')
    `, [
      projId, ws, name, description, color, status, priority, 
      start_date || null, due_date || null, 
      project_folder || null, doc_markdown || null, doc_pdf_path || null,
      Number(progress_percent) || 0, lifecycle_stage || 'Development',
      location_path || null, github_repo || null, server_name || null,
      is_restricted ? 1 : 0,
      tech_stack || null, frontend_tech || null, backend_tech || null, database_tech || null
    ]);

    // Create default board for the project
    const boardId = 'board_' + uuidv4().substring(0, 8);
    await query('INSERT INTO boards (id, project_id, name) VALUES (?, ?, ?)', [boardId, projId, 'Main Board']);

    // Universal Audit Log
    await logActivity({
      entity_type: 'project',
      entity_id: projId,
      user_name: actor_name,
      action: 'PROJECT_CREATED',
      details: `Created new project "${name}" with color ${color}`
    });

    const newProj = await getOne('SELECT * FROM projects WHERE id = ?', [projId]);
    res.status(201).json(newProj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update project (Edit name, description, status, priority, dates, folder, documentation MD, PDF, progress percent, lifecycle stage)
app.put('/api/projects/:id', async (req, res) => {
  try {
    const {
      name,
      description,
      color,
      status,
      priority,
      start_date,
      due_date,
      project_folder,
      doc_markdown,
      doc_pdf_path,
      progress_percent,
      lifecycle_stage,
      location_path,
      github_repo,
      server_name,
      is_restricted,
      tech_stack,
      frontend_tech,
      backend_tech,
      database_tech,
      actor_name = 'Admin'
    } = req.body;

    const existing = await getOne('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Project not found' });

    await query(`
      UPDATE projects
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          color = COALESCE(?, color),
          status = COALESCE(?, status),
          priority = COALESCE(?, priority),
          start_date = COALESCE(?, start_date),
          due_date = COALESCE(?, due_date),
          project_folder = COALESCE(?, project_folder),
          doc_markdown = COALESCE(?, doc_markdown),
          doc_pdf_path = COALESCE(?, doc_pdf_path),
          progress_percent = COALESCE(?, progress_percent),
          lifecycle_stage = COALESCE(?, lifecycle_stage),
          location_path = COALESCE(?, location_path),
          github_repo = COALESCE(?, github_repo),
          server_name = COALESCE(?, server_name),
          is_restricted = COALESCE(?, is_restricted),
          tech_stack = COALESCE(?, tech_stack),
          frontend_tech = COALESCE(?, frontend_tech),
          backend_tech = COALESCE(?, backend_tech),
          database_tech = COALESCE(?, database_tech)
      WHERE id = ?
    `, [
      name, description, color, status, priority,
      start_date, due_date, project_folder, doc_markdown, doc_pdf_path,
      progress_percent !== undefined ? Number(progress_percent) : null,
      lifecycle_stage,
      location_path, github_repo, server_name,
      is_restricted !== undefined ? (is_restricted ? 1 : 0) : null,
      tech_stack, frontend_tech, backend_tech, database_tech,
      req.params.id
    ]);

    // Universal Audit Log
    await logActivity({
      entity_type: 'project',
      entity_id: req.params.id,
      user_name: actor_name,
      action: 'PROJECT_UPDATED',
      details: `Updated project "${name || existing.name}" (Stage: ${lifecycle_stage || existing.lifecycle_stage || 'Development'}, Progress: ${progress_percent !== undefined ? progress_percent : existing.progress_percent}%)`
    });

    const updated = await getOne('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove or Permanently Delete Project
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const mode = req.query.mode || req.body?.mode || 'archive'; // 'archive' or 'hard'
    const actorName = req.query.actor_name || req.body?.actor_name || 'Admin';

    const project = await getOne('SELECT * FROM projects WHERE id = ?', [id]);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (mode === 'hard') {
      // 1. Get all board IDs
      const boards = await query('SELECT id FROM boards WHERE project_id = ?', [id]);
      const boardIds = boards.map(b => b.id);

      if (boardIds.length > 0) {
        // 2. Get all task IDs
        const tasks = await query(`SELECT id FROM tasks WHERE board_id IN (${boardIds.map(() => '?').join(',')})`, boardIds);
        const taskIds = tasks.map(t => t.id);

        if (taskIds.length > 0) {
          // 3. Delete task comments
          await query(`DELETE FROM task_comments WHERE task_id IN (${taskIds.map(() => '?').join(',')})`, taskIds);
          // 4. Delete tasks
          await query(`DELETE FROM tasks WHERE board_id IN (${boardIds.map(() => '?').join(',')})`, boardIds);
        }

        // 5. Delete boards
        await query('DELETE FROM boards WHERE project_id = ?', [id]);
      }

      // 6. Detach work logs to preserve time entries without dangling project foreign key
      await query('UPDATE work_logs SET project_id = NULL WHERE project_id = ?', [id]);

      // 7. Delete project itself
      await query('DELETE FROM projects WHERE id = ?', [id]);

      await logActivity({
        entity_type: 'project',
        entity_id: id,
        user_name: actorName,
        action: 'PROJECT_HARD_DELETED',
        details: `Permanently hard-deleted project "${project.name}" (ID: ${id}) and wiped all associated boards and tasks.`
      });

      return res.json({ 
        success: true, 
        mode: 'hard', 
        message: `Project "${project.name}" has been permanently purged from the database.` 
      });
    } else {
      // Soft Archive / Remove from workspace
      await query("UPDATE projects SET status = 'archived' WHERE id = ?", [id]);

      await logActivity({
        entity_type: 'project',
        entity_id: id,
        user_name: actorName,
        action: 'PROJECT_ARCHIVED',
        details: `Archived project "${project.name}" (ID: ${id}) to Recovery Vault.`
      });

      return res.json({ 
        success: true, 
        mode: 'archive', 
        message: `Project "${project.name}" was safely archived.` 
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Restore an archived project back to active
app.put('/api/projects/:id/restore', async (req, res) => {
  try {
    const { id } = req.params;
    const actorName = req.body?.actor_name || 'Admin';

    const project = await getOne('SELECT * FROM projects WHERE id = ?', [id]);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    await query("UPDATE projects SET status = 'active' WHERE id = ?", [id]);

    await logActivity({
      entity_type: 'project',
      entity_id: id,
      user_name: actorName,
      action: 'PROJECT_RESTORED',
      details: `Restored archived project "${project.name}" (ID: ${id}) back to active status.`
    });

    res.json({ success: true, message: `Project "${project.name}" restored to active status.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single project details including resolved Overview documentation
app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await getOne('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    let resolvedMarkdown = project.doc_markdown || '';
    let resolvedPdf = project.doc_pdf_path || '';
    let availableDocs = [];

    // If project folder or location_path is linked, look up available MD and PDF files
    let folderPath = null;
    if (project.location_path && fs.existsSync(project.location_path)) {
      folderPath = project.location_path;
    } else if (project.project_folder) {
      const p1 = path.resolve('F:/antigravity', project.project_folder);
      const p2 = path.resolve('C:/xampp/htdocs', project.project_folder);
      if (fs.existsSync(p1)) folderPath = p1;
      else if (fs.existsSync(p2)) folderPath = p2;
    }

    if (folderPath && fs.existsSync(folderPath)) {
      try {
        const files = fs.readdirSync(folderPath);
        for (const f of files) {
          const lower = f.toLowerCase();
          if (lower.endsWith('.md') || lower.endsWith('.markdown') || lower.endsWith('.txt')) {
            availableDocs.push({
              name: f,
              type: 'markdown',
              relativePath: f
            });
          } else if (lower.endsWith('.pdf')) {
            availableDocs.push({
              name: f,
              type: 'pdf',
              relativePath: f
            });
          }
        }
      } catch (e) {
        console.warn('[DocScan] Error reading folder:', folderPath, e.message);
      }

      // If markdown is empty in DB, try auto-reading primary doc file (e.g. FEATURES.md, README.md, etc.)
      if (!resolvedMarkdown) {
        const candidates = ['FEATURES.md', 'User_Guide_EN_BN.md', 'README.md', 'ARCHITECTURE.md', 'ROADMAP.md', 'SETUP_GUIDE.md', 'GUIDE_BN.md', 'README.txt', 'features.txt'];
        for (const c of candidates) {
          const cp = path.join(folderPath, c);
          if (fs.existsSync(cp)) {
            try {
              resolvedMarkdown = fs.readFileSync(cp, 'utf8');
              break;
            } catch (e) {}
          }
        }
      }

      // If pdf is empty in DB, check if any PDF exists in folder
      if (!resolvedPdf) {
        const pdfDoc = availableDocs.find(d => d.type === 'pdf');
        if (pdfDoc) {
          resolvedPdf = pdfDoc.relativePath;
        }
      }
    }

    // Query project task metrics & issues for deep specs
    const taskStats = await query(`
      SELECT 
        count(*) as total_tasks,
        sum(case when status = 'Done' then 1 else 0 end) as completed_tasks,
        sum(case when status = 'In Progress' then 1 else 0 end) as in_progress_tasks,
        sum(case when status = 'Blocked' or priority = 'Urgent' then 1 else 0 end) as issue_tasks,
        coalesce(sum(actual_hours), 0) as total_hours
      FROM tasks t
      JOIN boards b ON t.board_id = b.id
      WHERE b.project_id = ?
    `, [project.id]);

    const stats = taskStats[0] || { total_tasks: 0, completed_tasks: 0, in_progress_tasks: 0, issue_tasks: 0, total_hours: 0 };

    const dateNowExpr = getDbType() === 'postgres' ? "TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD')" : "date('now')";
    const topIssues = await query(`
      SELECT t.id, t.title, t.status, t.priority, t.due_date
      FROM tasks t
      JOIN boards b ON t.board_id = b.id
      WHERE b.project_id = ? AND (t.status = 'Blocked' OR t.priority = 'Urgent' OR (t.status != 'Done' AND t.due_date IS NOT NULL AND t.due_date < ${dateNowExpr}))
      ORDER BY CASE WHEN t.status = 'Blocked' THEN 1 WHEN t.priority = 'Urgent' THEN 2 ELSE 3 END
      LIMIT 5
    `, [project.id]);

    // If still no markdown doc, generate an authoritative, real System Specification document
    if (!resolvedMarkdown) {
      let issuesText = 'No critical blockers or overdue items currently reported.';
      if (topIssues && topIssues.length > 0) {
        issuesText = '| Title | Status | Priority | Due Date |\n| :--- | :--- | :--- | :--- |\n' +
          topIssues.map(i => `| ${i.title} | **${i.status}** | ${i.priority} | ${i.due_date || 'N/A'} |`).join('\n');
      }

      resolvedMarkdown = `# ${project.name} — System Overview & Architecture Specification

> **Lifecycle Stage:** \`${project.lifecycle_stage || 'Development'}\` &nbsp;|&nbsp; **Status:** \`${(project.status || 'Active').toUpperCase()}\` &nbsp;|&nbsp; **Milestone Progress:** **${project.progress_percent || 0}%**

---

### 1. Executive Summary & Purpose
${project.description || 'Enterprise business solution maintained in the corporate repository. Designed for modular scalability, automated workflow execution, and secure data handling.'}

---

### 2. Infrastructure & Repository Details
- **Project ID:** \`${project.id}\`
- **Filesystem Path:** \`${project.location_path || project.project_folder || 'Central antigravity filesystem'}\`
- **GitHub Repository:** ${project.github_repo ? `[${project.github_repo}](${project.github_repo})` : '*Private / Internal Repository*'}
- **Deployment Host / Runtime:** \`${project.server_name || 'Local / Hybrid Cluster'}\`
- **Access Policy:** ${project.is_restricted ? '🔒 **Restricted / Management Only**' : '🌐 **Standard Employee Access**'}

---

### 3. Work Breakdown & Velocity Metrics
- **Total Work Items:** **${stats.total_tasks || 0}**
- **Completed Deliverables:** **${stats.completed_tasks || 0}** (${stats.total_tasks > 0 ? Math.round(((stats.completed_tasks || 0) / stats.total_tasks) * 100) : 0}%)
- **Active In-Progress:** **${stats.in_progress_tasks || 0}**
- **Pending Attention / Blocked:** **${stats.issue_tasks || 0}**
- **Logged Engineering Hours:** **${stats.total_hours || 0} hrs**

---

### 4. Active Issues & Blockers
${issuesText}

---

### 5. Architectural & Governance Guidelines
1. **Branching Strategy:** Ensure all feature work occurs on dedicated feature branches branched off \`main\`.
2. **Review Policy:** Pull requests require code review and all checks to pass prior to merging.
3. **Environment Sync:** Verify environment configuration against \`.env.example\` before running local builds.
`;
    }

    const detected = detectTechStack(folderPath);
    const finalFrontend = project.frontend_tech 
      ? project.frontend_tech.split(',').map(s => s.trim()).filter(Boolean)
      : detected.frontend;
    const finalBackend = project.backend_tech 
      ? project.backend_tech.split(',').map(s => s.trim()).filter(Boolean)
      : detected.backend;
    const finalDatabase = project.database_tech 
      ? project.database_tech.split(',').map(s => s.trim()).filter(Boolean)
      : detected.database;
    const finalTechStack = project.tech_stack 
      ? project.tech_stack.split(',').map(s => s.trim()).filter(Boolean)
      : detected.technologies;

    const techInfo = {
      frontend: finalFrontend,
      backend: finalBackend,
      database: finalDatabase,
      technologies: finalTechStack,
      allTags: Array.from(new Set([...finalFrontend, ...finalBackend, ...finalDatabase, ...finalTechStack]))
    };

    res.json({
      ...project,
      tech: techInfo,
      resolvedMarkdown,
      resolvedPdf,
      availableDocs,
      taskStats: stats,
      issues: topIssues
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve specific documentation text/markdown file content
app.get('/api/projects/:id/doc', async (req, res) => {
  try {
    const project = await getOne('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const requestedFile = req.query.file;
    if (!requestedFile) {
      return res.status(400).json({ error: 'Filename parameter is required' });
    }

    let baseFolder = null;
    if (project.location_path && fs.existsSync(project.location_path)) {
      baseFolder = project.location_path;
    } else if (project.project_folder) {
      const p1 = path.resolve('F:/antigravity', project.project_folder);
      const p2 = path.resolve('C:/xampp/htdocs', project.project_folder);
      if (fs.existsSync(p1)) baseFolder = p1;
      else if (fs.existsSync(p2)) baseFolder = p2;
    }

    if (!baseFolder) {
      return res.status(404).json({ error: 'Project folder not found on disk' });
    }

    // Security: sanitize path to avoid directory traversal
    const safeName = path.basename(requestedFile);
    const filePath = path.join(baseFolder, safeName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: `Documentation file "${safeName}" not found` });
    }

    const content = fs.readFileSync(filePath, 'utf8');
    res.json({ filename: safeName, content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve PDF files directly for browser inline viewing / downloading
app.get('/api/projects/:id/pdf', async (req, res) => {
  try {
    const project = await getOne('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    let targetPdf = req.query.file || project.doc_pdf_path;
    let baseFolder = null;
    if (project.location_path && fs.existsSync(project.location_path)) {
      baseFolder = project.location_path;
    } else if (project.project_folder) {
      const p1 = path.resolve('F:/antigravity', project.project_folder);
      const p2 = path.resolve('C:/xampp/htdocs', project.project_folder);
      if (fs.existsSync(p1)) baseFolder = p1;
      else if (fs.existsSync(p2)) baseFolder = p2;
    }

    if (!targetPdf && baseFolder && fs.existsSync(baseFolder)) {
      const files = fs.readdirSync(baseFolder);
      const firstPdf = files.find(f => f.endsWith('.pdf'));
      if (firstPdf) targetPdf = firstPdf;
    }

    if (!targetPdf) {
      return res.status(404).json({ error: 'No PDF documentation found for this project' });
    }

    // Resolve file path safely
    let safePdfPath = null;
    if (baseFolder && fs.existsSync(path.join(baseFolder, path.basename(targetPdf)))) {
      safePdfPath = path.join(baseFolder, path.basename(targetPdf));
    } else if (fs.existsSync(targetPdf)) {
      safePdfPath = targetPdf;
    }

    if (!safePdfPath || !fs.existsSync(safePdfPath)) {
      return res.status(404).json({ error: 'PDF file not found on disk' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(safePdfPath)}"`);
    fs.createReadStream(safePdfPath).pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 6. BOARDS & TASKS (MONDAY / CLICKUP STYLE) ---
// Get full board with tasks & assignees
app.get('/api/projects/:projectId/board', async (req, res) => {
  try {
    const board = await getOne('SELECT * FROM boards WHERE project_id = ? LIMIT 1', [req.params.projectId]);
    if (!board) return res.status(404).json({ error: 'No board found for this project' });

    const tasks = await query('SELECT * FROM tasks WHERE board_id = ? ORDER BY order_index ASC, created_at DESC', [board.id]);
    const parsedTasks = tasks.map(t => ({
      ...t,
      assignee_ids: t.assignee_ids ? JSON.parse(t.assignee_ids) : [],
      tags: t.tags ? JSON.parse(t.tags) : [],
      qc_issues: t.qc_issues ? JSON.parse(t.qc_issues) : []
    }));

    res.json({ board, tasks: parsedTasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create task
app.post('/api/tasks', async (req, res) => {
  try {
    const {
      board_id,
      title,
      description = '',
      status = 'To Do',
      priority = 'Medium',
      estimated_hours = 0,
      start_date = null,
      due_date = null,
      assignee_ids = [],
      tags = [],
      actor_name = 'Admin'
    } = req.body;

    if (!title || !board_id) {
      return res.status(400).json({ error: 'Task title and board_id are required' });
    }

    const taskId = 'tsk_' + uuidv4().substring(0, 8);
    const maxOrder = await query('SELECT MAX(order_index) as max_idx FROM tasks WHERE board_id = ?', [board_id]);
    const nextOrder = (maxOrder[0]?.max_idx || 0) + 1;

    await query(`
      INSERT INTO tasks (id, board_id, title, description, status, priority, estimated_hours, actual_hours, start_date, due_date, order_index, assignee_ids, tags, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, 'usr_admin')
    `, [
      taskId,
      board_id,
      title,
      description,
      status,
      priority,
      Number(estimated_hours) || 0,
      start_date,
      due_date,
      nextOrder,
      JSON.stringify(assignee_ids),
      JSON.stringify(tags)
    ]);

    // Universal Audit Log
    await logActivity({
      entity_type: 'task',
      entity_id: taskId,
      user_name: actor_name,
      action: 'TASK_CREATED',
      details: `Created task "${title}" [Status: ${status}, Priority: ${priority}]`
    });

    const created = await getOne('SELECT * FROM tasks WHERE id = ?', [taskId]);
    res.status(201).json({
      ...created,
      assignee_ids: JSON.parse(created.assignee_ids || '[]'),
      tags: JSON.parse(created.tags || '[]')
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update task (supports inline cell updates: status, priority, title, assignees, dates)
app.patch('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const task = await getOne('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const updates = req.body;
    const actor_name = updates.actor_name || 'Admin';
    const allowedFields = ['title', 'description', 'status', 'priority', 'estimated_hours', 'actual_hours', 'start_date', 'due_date', 'order_index'];
    
    let queryParts = [];
    let values = [];
    let logChanges = [];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        queryParts.push(`${field} = ?`);
        values.push(updates[field]);
        if (task[field] !== updates[field]) {
          logChanges.push(`${field}: "${task[field]}" -> "${updates[field]}"`);
        }
      }
    }

    if (updates.assignee_ids !== undefined) {
      queryParts.push('assignee_ids = ?');
      values.push(JSON.stringify(updates.assignee_ids));
      logChanges.push(`assignees updated to ${updates.assignee_ids.length} members`);
    }

    if (updates.tags !== undefined) {
      queryParts.push('tags = ?');
      values.push(JSON.stringify(updates.tags));
      logChanges.push(`tags updated`);
    }

    if (updates.qc_issues !== undefined) {
      queryParts.push('qc_issues = ?');
      values.push(JSON.stringify(updates.qc_issues));
      logChanges.push(`QC problem explanations & screenshots updated`);
    }

    if (queryParts.length === 0) {
      return res.json(task);
    }

    queryParts.push("updated_at = datetime('now')");
    values.push(id);

    await query(`UPDATE tasks SET ${queryParts.join(', ')} WHERE id = ?`, values);

    // Universal Audit Log
    if (logChanges.length > 0) {
      await logActivity({
        entity_type: 'task',
        entity_id: id,
        user_name: actor_name,
        action: 'TASK_UPDATED',
        details: `Updated "${task.title}": ${logChanges.join(', ')}`
      });
    }

    // Gamification XP Award & Completed Timestamp on Task Completion
    let xpAwarded = 0;
    let leveledUp = false;
    let awardedUserNames = [];

    if (updates.status === 'Done' && task.status !== 'Done') {
      await query("UPDATE tasks SET completed_at = datetime('now') WHERE id = ?", [id]);
      const taskXp = Number(task.xp_reward) || 50;
      const assignees = task.assignee_ids ? JSON.parse(task.assignee_ids) : [];
      
      // If no specific assignees, award to actor/updater
      const targetUserIds = assignees.length > 0 ? assignees : (updates.actor_id ? [updates.actor_id] : []);

      for (const uid of targetUserIds) {
        const u = await getOne('SELECT id, full_name, xp, level FROM users WHERE id = ?', [uid]);
        if (u) {
          const currentXp = Number(u.xp) || 0;
          const newXp = currentXp + taskXp;
          const levelInfo = getLevelInfo(newXp);
          if (levelInfo.level > (Number(u.level) || 0)) leveledUp = true;

          await query('UPDATE users SET xp = ?, level = ? WHERE id = ?', [newXp, levelInfo.level, uid]);
          awardedUserNames.push(u.full_name);

          await logActivity({
            entity_type: 'gamification',
            entity_id: uid,
            user_name: u.full_name,
            action: 'XP_AWARDED',
            details: `Earned +${taskXp} XP for completing task "${task.title}". (Total: ${newXp} XP, Level ${levelInfo.level} ${levelInfo.title} ${levelInfo.badge})`
          });

          if (leveledUp) {
            await logActivity({
              entity_type: 'gamification',
              entity_id: uid,
              user_name: u.full_name,
              action: 'LEVEL_UP',
              details: `🎉 Promoted to Level ${levelInfo.level}: ${levelInfo.title} ${levelInfo.badge}!`
            });
          }
        }
      }
      xpAwarded = taskXp;
    }

    const updated = await getOne('SELECT * FROM tasks WHERE id = ?', [id]);
    res.json({
      ...updated,
      assignee_ids: JSON.parse(updated.assignee_ids || '[]'),
      tags: JSON.parse(updated.tags || '[]'),
      qc_issues: JSON.parse(updated.qc_issues || '[]'),
      gamification: {
        xpAwarded,
        awardedUserNames,
        leveledUp
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk update tasks
app.post('/api/tasks/bulk', async (req, res) => {
  try {
    const { task_ids, action, value, actor_name = 'Admin' } = req.body;
    if (!Array.isArray(task_ids) || task_ids.length === 0) {
      return res.status(400).json({ error: 'task_ids array required' });
    }

    const placeholders = task_ids.map(() => '?').join(',');

    if (action === 'set_status') {
      await query(`UPDATE tasks SET status = ? WHERE id IN (${placeholders})`, [value, ...task_ids]);
      await logActivity({
        entity_type: 'task',
        entity_id: 'bulk',
        user_name: actor_name,
        action: 'TASK_BULK_UPDATE',
        details: `Batch set status to "${value}" for ${task_ids.length} tasks`
      });
    } else if (action === 'set_priority') {
      await query(`UPDATE tasks SET priority = ? WHERE id IN (${placeholders})`, [value, ...task_ids]);
      await logActivity({
        entity_type: 'task',
        entity_id: 'bulk',
        user_name: actor_name,
        action: 'TASK_BULK_UPDATE',
        details: `Batch set priority to "${value}" for ${task_ids.length} tasks`
      });
    } else if (action === 'delete') {
      await query(`DELETE FROM tasks WHERE id IN (${placeholders})`, task_ids);
      await logActivity({
        entity_type: 'task',
        entity_id: 'bulk',
        user_name: actor_name,
        action: 'TASK_BULK_DELETE',
        details: `Deleted ${task_ids.length} tasks in bulk`
      });
    }

    res.json({ success: true, updated_count: task_ids.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete individual task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const task = await getOne('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    await query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    
    // Universal Audit Log
    await logActivity({
      entity_type: 'task',
      entity_id: req.params.id,
      user_name: req.query.actor_name || 'Admin',
      action: 'TASK_DELETED',
      details: `Deleted task "${task?.title || req.params.id}"`
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Task comments
app.get('/api/tasks/:id/comments', async (req, res) => {
  try {
    const comments = await query(`
      SELECT c.*, u.full_name, u.avatar_url
      FROM task_comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.task_id = ?
      ORDER BY c.created_at ASC
    `, [req.params.id]);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks/:id/comments', async (req, res) => {
  try {
    const { user_id = 'usr_admin', content, actor_name = 'Alex Morgan' } = req.body;
    if (!content) return res.status(400).json({ error: 'Comment content cannot be empty' });

    const cId = uuidv4();
    await query(`
      INSERT INTO task_comments (id, task_id, user_id, content)
      VALUES (?, ?, ?, ?)
    `, [cId, req.params.id, user_id, content]);

    // Universal Audit Log
    await logActivity({
      entity_type: 'task',
      entity_id: req.params.id,
      user_name: actor_name,
      action: 'COMMENT_ADDED',
      details: `Added comment: "${content.substring(0, 60)}${content.length > 60 ? '...' : ''}"`
    });

    const created = await getOne(`
      SELECT c.*, u.full_name, u.avatar_url
      FROM task_comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.id = ?
    `, [cId]);

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 7. ADMIN ANALYTICS & STATS ---
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const [totalTasksRes, completedTasksRes, totalUsersRes, deactivatedUsersRes, onboardingRes, projectsRes] = await Promise.all([
      query('SELECT count(*) as count FROM tasks'),
      query("SELECT count(*) as count FROM tasks WHERE status = 'Done'"),
      query("SELECT count(*) as count FROM users WHERE status != 'deactivated'"),
      query("SELECT count(*) as count FROM users WHERE status = 'deactivated'"),
      query("SELECT count(*) as count FROM users WHERE status = 'onboarding'"),
      query('SELECT count(*) as count FROM projects')
    ]);

    const totalTasks = totalTasksRes[0]?.count || 0;
    const completedTasks = completedTasksRes[0]?.count || 0;
    const totalUsers = totalUsersRes[0]?.count || 0;
    const deactivatedUsers = deactivatedUsersRes[0]?.count || 0;
    const onboardingUsers = onboardingRes[0]?.count || 0;
    const totalProjects = projectsRes[0]?.count || 0;

    const statusCounts = await query('SELECT status, count(*) as count FROM tasks GROUP BY status');
    const priorityCounts = await query('SELECT priority, count(*) as count FROM tasks GROUP BY priority');
    const activities = await query('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 15');

    const topUsers = await query(`
      SELECT u.id, u.full_name, u.avatar_url, u.department, u.designation, u.xp, u.level
      FROM users u
      WHERE u.status != 'deactivated'
      ORDER BY u.xp DESC, u.full_name ASC
      LIMIT 10
    `);

    const topLeaderboard = topUsers.map((u, index) => ({
      rank: index + 1,
      ...u,
      xp: Number(u.xp) || 0,
      levelInfo: getLevelInfo(u.xp)
    }));

    res.json({
      overview: {
        totalTasks,
        completedTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        totalUsers,
        deactivatedUsers,
        onboardingUsers,
        totalProjects
      },
      statusDistribution: statusCounts,
      priorityDistribution: priorityCounts,
      recentActivities: activities,
      leaderboard: topLeaderboard,
      levelThresholds: LEVEL_THRESHOLDS
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 7.5 GAMIFICATION & EMPLOYEE LEADERBOARD ---
app.get('/api/gamification/leaderboard', async (req, res) => {
  try {
    const users = await query(`
      SELECT 
        u.id, u.full_name, u.email, u.avatar_url, u.role, u.department, u.designation, u.xp, u.level, u.status,
        (SELECT count(*) FROM tasks t WHERE t.status = 'Done' AND t.assignee_ids LIKE '%' || u.id || '%') as completed_tasks_count,
        (SELECT count(*) FROM onboarding_tasks ot WHERE ot.user_id = u.id AND ot.is_completed = 1) as completed_onboarding_count,
        (SELECT COALESCE(sum(wl.hours), 0) FROM work_logs wl WHERE wl.user_id = u.id) as total_logged_hours
      FROM users u
      WHERE u.status != 'deactivated'
      ORDER BY u.xp DESC, u.full_name ASC
    `);

    const enriched = users.map((u, index) => {
      const xp = Number(u.xp) || 0;
      const levelInfo = getLevelInfo(xp);
      return {
        rank: index + 1,
        ...u,
        xp,
        level: levelInfo.level,
        levelInfo
      };
    });

    const leaderboard = enriched.map((u, index) => {
      let deltaText = '';
      let deltaType = 'neutral';
      let gapXp = 0;

      if (index === 0) {
        const nextUser = enriched[1];
        if (nextUser) {
          gapXp = u.xp - nextUser.xp;
          deltaText = `+${gapXp} XP lead`;
          deltaType = 'lead';
        } else {
          deltaText = 'Leader';
          deltaType = 'lead';
        }
      } else {
        const userAhead = enriched[index - 1];
        gapXp = userAhead.xp - u.xp;
        deltaText = `${gapXp} XP behind #${index}`;
        deltaType = 'behind';
      }

      return {
        ...u,
        deltaText,
        deltaType,
        gapXp
      };
    });

    res.json({
      leaderboard,
      levelThresholds: LEVEL_THRESHOLDS,
      topPerformer: leaderboard[0] || null,
      totalXp: leaderboard.reduce((acc, curr) => acc + curr.xp, 0)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 8. EMPLOYEE WORK PRODUCTIVITY REPORTS (DAY, WEEK, MONTH) ---
app.get('/api/reports/productivity', async (req, res) => {
  try {
    const { timeframe = 'week', user_id, project_id, date } = req.query;
    // timeframe options: 'day', 'week', 'month', 'all'
    const targetDate = date ? new Date(date) : new Date();
    
    // Calculate start & end bounds for the timeframe
    let startIso, endIso;
    if (timeframe === 'day') {
      const start = new Date(targetDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(targetDate);
      end.setHours(23, 59, 59, 999);
      startIso = start.toISOString().replace('T', ' ').substring(0, 19);
      endIso = end.toISOString().replace('T', ' ').substring(0, 19);
    } else if (timeframe === 'week') {
      const start = new Date(targetDate);
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      startIso = start.toISOString().replace('T', ' ').substring(0, 19);
      endIso = end.toISOString().replace('T', ' ').substring(0, 19);
    } else if (timeframe === 'month') {
      const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1, 0, 0, 0);
      const end = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59);
      startIso = start.toISOString().replace('T', ' ').substring(0, 19);
      endIso = end.toISOString().replace('T', ' ').substring(0, 19);
    }

    // Fetch active users (or specific user if requested)
    let userSql = "SELECT id, full_name, email, avatar_url, role, department, designation, xp, level FROM users WHERE status != 'deactivated'";
    let userParams = [];
    if (user_id && user_id !== 'all') {
      userSql += " AND id = ?";
      userParams.push(user_id);
    }
    userSql += " ORDER BY xp DESC, full_name ASC";
    const users = await query(userSql, userParams);

    // Fetch tasks
    let taskSql = `
      SELECT t.*, p.id as project_id, p.name as project_name, p.color as project_color, b.name as board_name
      FROM tasks t
      JOIN boards b ON b.id = t.board_id
      JOIN projects p ON p.id = b.project_id
    `;
    let taskConditions = [];
    let taskParams = [];

    if (project_id && project_id !== 'all') {
      taskConditions.push("p.id = ?");
      taskParams.push(project_id);
    }

    if (taskConditions.length > 0) {
      taskSql += " WHERE " + taskConditions.join(" AND ");
    }
    taskSql += " ORDER BY t.updated_at DESC";

    const allTasks = await query(taskSql, taskParams);

    // Fetch relevant activity logs for this timeframe
    let logSql = `
      SELECT l.*, u.avatar_url
      FROM activity_logs l
      LEFT JOIN users u ON u.id = l.user_id
    `;
    let logConditions = [];
    let logParams = [];

    if (timeframe !== 'all' && startIso && endIso) {
      logConditions.push("(l.created_at >= ? AND l.created_at <= ?)");
      logParams.push(startIso, endIso);
    }
    if (user_id && user_id !== 'all') {
      logConditions.push("l.user_id = ?");
      logParams.push(user_id);
    }

    if (logConditions.length > 0) {
      logSql += " WHERE " + logConditions.join(" AND ");
    }
    logSql += " ORDER BY l.created_at DESC LIMIT 100";
    const logs = await query(logSql, logParams);

    // Calculate per-employee statistics
    const employeeReports = users.map(user => {
      // Find all tasks assigned to this user
      const assignedTasks = allTasks.filter(t => {
        try {
          const ids = JSON.parse(t.assignee_ids || '[]');
          return Array.isArray(ids) && ids.includes(user.id);
        } catch(e) {
          return false;
        }
      });

      // Filter tasks active/completed in the given timeframe
      const completedTasks = assignedTasks.filter(t => {
        if (t.status !== 'Done') return false;
        if (timeframe === 'all' || !startIso) return true;
        const taskTime = t.completed_at || t.updated_at;
        return taskTime >= startIso && taskTime <= endIso;
      });

      const inProgressTasks = assignedTasks.filter(t => t.status === 'In Progress');
      const totalEstimatedHours = assignedTasks.reduce((sum, t) => sum + (Number(t.estimated_hours) || 0), 0);
      const totalActualHours = assignedTasks.reduce((sum, t) => sum + (Number(t.actual_hours) || 0), 0);

      // Total XP gained from logs in timeframe
      const userLogs = logs.filter(l => l.user_id === user.id);
      const xpLogs = userLogs.filter(l => l.action === 'XP_AWARDED');

      return {
        user,
        assignedTasksCount: assignedTasks.length,
        completedTasksCount: completedTasks.length,
        inProgressTasksCount: inProgressTasks.length,
        completionRate: assignedTasks.length > 0 ? Math.round((completedTasks.length / assignedTasks.length) * 100) : 0,
        estimatedHours: totalEstimatedHours,
        actualHours: totalActualHours,
        activityCount: userLogs.length,
        completedTasksList: completedTasks.map(t => ({
          id: t.id,
          title: t.title,
          project_name: t.project_name,
          project_color: t.project_color,
          priority: t.priority,
          completed_at: t.completed_at || t.updated_at
        }))
      };
    });

    // Summary totals for whole company
    const totalAssigned = employeeReports.reduce((sum, r) => sum + r.assignedTasksCount, 0);
    const totalCompleted = employeeReports.reduce((sum, r) => sum + r.completedTasksCount, 0);
    const totalHours = employeeReports.reduce((sum, r) => sum + r.actualHours, 0);

    res.json({
      timeframe,
      range: { start: startIso, end: endIso },
      summary: {
        totalEmployees: users.length,
        totalTasksAssigned: totalAssigned,
        totalTasksCompleted: totalCompleted,
        overallCompletionRate: totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0,
        totalLoggedHours: totalHours
      },
      employeeReports,
      recentActivity: logs.slice(0, 30)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// --- 9. EMPLOYEE WORK TIME LOGGING (TIME TRACKER / TIMESHEET) ---
// Log work time (hours, task, project, description, date)
app.post('/api/work-logs', async (req, res) => {
  try {
    const { user_id, task_id, project_id, hours, description = '', work_date, actor_name } = req.body;
    if (!user_id || !hours) {
      return res.status(400).json({ error: 'User ID and hours are required' });
    }

    const logId = 'wlog_' + uuidv4().substring(0, 8);
    const dateToUse = work_date || new Date().toISOString().substring(0, 10);
    const numHours = parseFloat(hours) || 0;

    await query(`
      INSERT INTO work_logs (id, user_id, task_id, project_id, hours, description, work_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [logId, user_id, task_id || null, project_id || null, numHours, description, dateToUse]);

    // If task_id is provided, automatically add to actual_hours on the task
    if (task_id) {
      await query('UPDATE tasks SET actual_hours = actual_hours + ? WHERE id = ?', [numHours, task_id]);
    }

    // Award +20 XP for logging daily work
    const u = await getOne('SELECT id, full_name, xp, level FROM users WHERE id = ?', [user_id]);
    if (u) {
      const currentXp = Number(u.xp) || 0;
      const newXp = currentXp + 20;
      const levelInfo = getLevelInfo(newXp);
      const leveledUp = levelInfo.level > (Number(u.level) || 0);
      await query('UPDATE users SET xp = ?, level = ? WHERE id = ?', [newXp, levelInfo.level, user_id]);

      if (leveledUp) {
        await logActivity({
          entity_type: 'gamification',
          entity_id: user_id,
          user_name: u.full_name,
          action: 'LEVEL_UP',
          details: `🎉 Promoted to Level ${levelInfo.level}: ${levelInfo.title} ${levelInfo.badge}!`
        });
      }
    }

    // Universal Audit Log
    const userDisplay = actor_name || u?.full_name || 'Employee';
    await logActivity({
      entity_type: 'work_log',
      entity_id: logId,
      user_id,
      user_name: userDisplay,
      action: 'WORK_TIME_LOGGED',
      details: `${userDisplay} logged ${numHours} hours of work for date ${dateToUse}: "${description.substring(0, 50)}${description.length > 50 ? '...' : ''}" (+20 XP)`
    });

    const created = await getOne('SELECT * FROM work_logs WHERE id = ?', [logId]);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get work logs with filters
app.get('/api/work-logs', async (req, res) => {
  try {
    const { user_id, project_id, work_date, limit = 50 } = req.query;
    let sql = `
      SELECT wl.*, u.full_name, u.avatar_url, t.title as task_title, p.name as project_name, p.color as project_color
      FROM work_logs wl
      JOIN users u ON u.id = wl.user_id
      LEFT JOIN tasks t ON t.id = wl.task_id
      LEFT JOIN projects p ON p.id = wl.project_id
    `;
    let conditions = [];
    let params = [];

    if (user_id && user_id !== 'all') {
      conditions.push('wl.user_id = ?');
      params.push(user_id);
    }
    if (project_id && project_id !== 'all') {
      conditions.push('wl.project_id = ?');
      params.push(project_id);
    }
    if (work_date) {
      conditions.push('wl.work_date = ?');
      params.push(work_date);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY wl.work_date DESC, wl.created_at DESC LIMIT ?';
    params.push(Number(limit) || 50);

    const logs = await query(sql, params);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- MESSAGE BOARD API (Admin to Everyone or Individual Member) ---

// Get messages (with optional filtering by viewer, tab, search)
app.get('/api/messages', async (req, res) => {
  try {
    const { user_id, type, recipient_id, search, limit = 100 } = req.query;

    let sql = `
      SELECT 
        m.*,
        sender.full_name as sender_name,
        sender.avatar_url as sender_avatar,
        sender.role as sender_role,
        recipient.full_name as recipient_name,
        recipient.avatar_url as recipient_avatar,
        recipient.role as recipient_role
      FROM messages m
      JOIN users sender ON sender.id = m.sender_id
      LEFT JOIN users recipient ON recipient.id = m.recipient_id
    `;
    let conditions = [];
    let params = [];

    // Filter by type ('broadcast' or 'direct')
    if (type && type !== 'all') {
      conditions.push('m.recipient_type = ?');
      params.push(type);
    }

    // Filter by specific recipient
    if (recipient_id && recipient_id !== 'all') {
      conditions.push('m.recipient_id = ?');
      params.push(recipient_id);
    }

    // If user_id is passed and viewer is not admin, show:
    // 1) all broadcasts, plus 2) direct messages sent to them or sent by them
    if (user_id) {
      const viewer = await getOne('SELECT id, role FROM users WHERE id = ?', [user_id]);
      if (viewer && viewer.role !== 'admin') {
        conditions.push('(m.recipient_type = "broadcast" OR m.recipient_id = ? OR m.sender_id = ?)');
        params.push(user_id, user_id);
      }
    }

    // Search query on title, content, or sender/recipient name
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      conditions.push('(m.title LIKE ? OR m.content LIKE ? OR sender.full_name LIKE ? OR recipient.full_name LIKE ?)');
      params.push(term, term, term, term);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    // Pinned messages first, then newest created
    sql += ' ORDER BY m.is_pinned DESC, m.created_at DESC LIMIT ?';
    params.push(Number(limit) || 100);

    const messages = await query(sql, params);
    res.json(messages);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: err.message });
  }
});

// Post a new message (Admin sending to everyone or individual member)
app.post('/api/messages', async (req, res) => {
  try {
    const { 
      sender_id = 'usr_admin',
      recipient_type = 'broadcast', // 'broadcast' or 'direct'
      recipient_id = null,
      title = '',
      content,
      priority = 'Normal', // 'Normal', 'Important', 'Urgent'
      category = 'Announcement', // 'Announcement', 'Direct Notice', 'Task Directive', 'Policy Update'
      is_pinned = 0
    } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content cannot be empty' });
    }

    if (recipient_type === 'direct' && !recipient_id) {
      return res.status(400).json({ error: 'Recipient must be selected for individual direct messages' });
    }

    const messageId = 'msg_' + uuidv4().slice(0, 12);
    const targetRecipientId = recipient_type === 'broadcast' ? null : recipient_id;
    const finalPinned = is_pinned ? 1 : 0;

    await query(`
      INSERT INTO messages (id, sender_id, recipient_type, recipient_id, title, content, priority, category, is_pinned)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [messageId, sender_id, recipient_type, targetRecipientId, title.trim(), content.trim(), priority, category, finalPinned]);

    // Fetch created record with join
    const created = await getOne(`
      SELECT 
        m.*,
        sender.full_name as sender_name,
        sender.avatar_url as sender_avatar,
        sender.role as sender_role,
        recipient.full_name as recipient_name,
        recipient.avatar_url as recipient_avatar,
        recipient.role as recipient_role
      FROM messages m
      JOIN users sender ON sender.id = m.sender_id
      LEFT JOIN users recipient ON recipient.id = m.recipient_id
      WHERE m.id = ?
    `, [messageId]);

    // Universal Audit Log
    const targetDesc = recipient_type === 'broadcast' 
      ? 'Everyone (All Team Members)' 
      : (created.recipient_name || recipient_id);

    await logActivity({
      entity_type: 'message_board',
      entity_id: messageId,
      user_id: sender_id,
      user_name: created.sender_name || 'Admin',
      action: 'MESSAGE_SENT',
      details: `${created.sender_name || 'Admin'} posted a message to ${targetDesc}: "${title || content.substring(0, 40)}..." [Priority: ${priority}]`
    });

    res.status(201).json(created);
  } catch (err) {
    console.error('Error posting message:', err);
    res.status(500).json({ error: err.message });
  }
});

// Toggle pin status of a message
app.patch('/api/messages/:id/pin', async (req, res) => {
  try {
    const { id } = req.params;
    const msg = await getOne('SELECT id, is_pinned FROM messages WHERE id = ?', [id]);
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    const newPinned = msg.is_pinned ? 0 : 1;
    await query('UPDATE messages SET is_pinned = ? WHERE id = ?', [newPinned, id]);

    const updated = await getOne(`
      SELECT 
        m.*,
        sender.full_name as sender_name,
        sender.avatar_url as sender_avatar,
        sender.role as sender_role,
        recipient.full_name as recipient_name,
        recipient.avatar_url as recipient_avatar,
        recipient.role as recipient_role
      FROM messages m
      JOIN users sender ON sender.id = m.sender_id
      LEFT JOIN users recipient ON recipient.id = m.recipient_id
      WHERE m.id = ?
    `, [id]);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a message
app.delete('/api/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { actor_name = 'Admin' } = req.query;
    const msg = await getOne('SELECT * FROM messages WHERE id = ?', [id]);
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    await query('DELETE FROM messages WHERE id = ?', [id]);

    await logActivity({
      entity_type: 'message_board',
      entity_id: id,
      user_name: actor_name,
      action: 'MESSAGE_DELETED',
      details: `${actor_name} deleted message "${msg.title || msg.id}"`
    });

    res.json({ success: true, message: 'Message removed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- INSTRUCTION VIDEOS API (Upload & Audience Access Control) ---

// 1. Get instruction videos with audience-based filtering
app.get('/api/videos', async (req, res) => {
  try {
    const { user_id, category, search, limit = 50 } = req.query;

    let sql = `
      SELECT 
        v.*,
        u.full_name as uploader_name,
        u.avatar_url as uploader_avatar,
        u.role as uploader_role
      FROM instruction_videos v
      JOIN users u ON u.id = v.uploader_id
    `;
    let conditions = [];
    let params = [];

    // Filter by Category
    if (category && category !== 'all') {
      conditions.push('v.category = ?');
      params.push(category);
    }

    // Filter by Search (Title, Description, Category, Uploader)
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      conditions.push('(v.title LIKE ? OR v.description LIKE ? OR v.category LIKE ? OR u.full_name LIKE ?)');
      params.push(term, term, term, term);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY v.created_at DESC LIMIT ?';
    params.push(Number(limit) || 50);

    const rows = await query(sql, params);

    // Check user role for audience access control:
    // If viewer is admin, they can see ALL videos.
    // Otherwise, normal members see videos where audience_type = 'all' OR their user_id is in allowed_user_ids OR they are the uploader.
    let viewer = null;
    if (user_id) {
      viewer = await getOne('SELECT id, role FROM users WHERE id = ?', [user_id]);
    }

    const filtered = rows.filter(video => {
      const allowedIds = video.allowed_user_ids ? JSON.parse(video.allowed_user_ids) : [];
      video.allowed_user_ids = allowedIds;
      video.tags = video.tags ? JSON.parse(video.tags) : [];

      if (!viewer || viewer.role === 'admin') return true;
      if (video.audience_type === 'all') return true;
      if (video.uploader_id === viewer.id) return true;
      if (Array.isArray(allowedIds) && allowedIds.includes(viewer.id)) return true;
      return false;
    });

    res.json(filtered);
  } catch (err) {
    console.error('Error fetching instruction videos:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Upload / Create instruction video
app.post('/api/videos', async (req, res) => {
  try {
    const {
      uploader_id = 'usr_admin',
      title,
      description = '',
      video_data, // base64 string data or URL
      video_url,  // direct URL or file path
      video_type = 'upload', // 'upload' | 'url'
      thumbnail_url = null,
      audience_type = 'all', // 'all' (open for all) or 'selected' (particular people)
      allowed_user_ids = [], // Array of user IDs
      category = 'Training & SOP',
      tags = []
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Video title is required' });
    }

    let finalVideoUrl = video_url || '';

    // Handle base64 video data upload to disk
    if (video_data && video_data.startsWith('data:video')) {
      const match = video_data.match(/^data:video\/([a-zA-Z0-9.-]+);base64,(.+)$/);
      if (match) {
        const ext = match[1] === 'x-matroska' ? 'mkv' : (match[1] === 'quicktime' ? 'mov' : match[1]);
        const base64Content = match[2];
        const filename = `video_${Date.now()}_${uuidv4().slice(0, 8)}.${ext}`;
        const filePath = path.join(videosUploadDir, filename);
        fs.writeFileSync(filePath, Buffer.from(base64Content, 'base64'));
        finalVideoUrl = `/uploads/videos/${filename}`;
      } else {
        finalVideoUrl = video_data;
      }
    }

    if (!finalVideoUrl) {
      return res.status(400).json({ error: 'Please provide a video file or video URL' });
    }

    if (audience_type === 'selected' && (!allowed_user_ids || allowed_user_ids.length === 0)) {
      return res.status(400).json({ error: 'Please select at least one team member when restricting audience' });
    }

    const videoId = 'vid_' + uuidv4().slice(0, 12);
    const audienceJson = JSON.stringify(Array.isArray(allowed_user_ids) ? allowed_user_ids : []);
    const tagsJson = JSON.stringify(Array.isArray(tags) ? tags : []);

    await query(`
      INSERT INTO instruction_videos (id, uploader_id, title, description, video_url, video_type, thumbnail_url, audience_type, allowed_user_ids, category, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [videoId, uploader_id, title.trim(), description.trim(), finalVideoUrl, video_type, thumbnail_url, audience_type, audienceJson, category, tagsJson]);

    const created = await getOne(`
      SELECT 
        v.*,
        u.full_name as uploader_name,
        u.avatar_url as uploader_avatar,
        u.role as uploader_role
      FROM instruction_videos v
      JOIN users u ON u.id = v.uploader_id
      WHERE v.id = ?
    `, [videoId]);

    created.allowed_user_ids = JSON.parse(created.allowed_user_ids || '[]');
    created.tags = JSON.parse(created.tags || '[]');

    // Log Activity
    const audienceDesc = audience_type === 'all' 
      ? 'Everyone (Open for all)' 
      : `${created.allowed_user_ids.length} selected member(s)`;

    await logActivity({
      entity_type: 'instruction_video',
      entity_id: videoId,
      user_id: uploader_id,
      user_name: created.uploader_name || 'Admin',
      action: 'VIDEO_UPLOADED',
      details: `${created.uploader_name || 'Admin'} published instruction video "${title}" [Access: ${audienceDesc}]`
    });

    res.status(201).json(created);
  } catch (err) {
    console.error('Error creating instruction video:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Delete instruction video
app.delete('/api/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { actor_name = 'Admin' } = req.query;

    const video = await getOne('SELECT * FROM instruction_videos WHERE id = ?', [id]);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    // Remove local file if it resides in /uploads/videos/
    if (video.video_url && video.video_url.startsWith('/uploads/videos/')) {
      const localPath = path.join(__dirname, '..', video.video_url);
      if (fs.existsSync(localPath)) {
        try { fs.unlinkSync(localPath); } catch(e) {}
      }
    }

    await query('DELETE FROM instruction_videos WHERE id = ?', [id]);

    await logActivity({
      entity_type: 'instruction_video',
      entity_id: id,
      user_name: actor_name,
      action: 'VIDEO_DELETED',
      details: `${actor_name} deleted instruction video "${video.title}"`
    });

    res.json({ success: true, message: 'Video removed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- RFID ATTENDANCE SYSTEM API (CSV / Excel / Hardware Swipe Parser) ---

// 1. Get attendance records with filters & employee data
app.get('/api/attendance', async (req, res) => {
  try {
    const { date, start_date, end_date, user_id, status, search, limit = 100 } = req.query;

    let sql = `
      SELECT 
        a.*,
        u.full_name as matched_user_name,
        u.avatar_url as matched_user_avatar,
        u.department as matched_user_department,
        u.designation as matched_user_designation,
        u.email as matched_user_email
      FROM attendance_logs a
      LEFT JOIN users u ON u.id = a.user_id
    `;
    let conditions = [];
    let params = [];

    if (date) {
      conditions.push('a.attendance_date = ?');
      params.push(date);
    } else if (start_date && end_date) {
      conditions.push('a.attendance_date BETWEEN ? AND ?');
      params.push(start_date, end_date);
    }

    if (user_id && user_id !== 'all') {
      conditions.push('a.user_id = ?');
      params.push(user_id);
    }

    if (status && status !== 'all') {
      conditions.push('a.status = ?');
      params.push(status);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      conditions.push('(a.rfid_card LIKE ? OR a.employee_name LIKE ? OR u.full_name LIKE ? OR a.terminal_id LIKE ?)');
      params.push(term, term, term, term);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY a.attendance_date DESC, a.check_in_time DESC LIMIT ?';
    params.push(Number(limit) || 100);

    const logs = await query(sql, params);
    res.json(logs);
  } catch (err) {
    console.error('Error fetching attendance logs:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Attendance Stats & Summary (Present, Late, Total Hours, Unique Employees)
app.get('/api/attendance/summary', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const dateToQuery = req.query.date || today;

    const todayLogs = await query(`
      SELECT a.*, u.full_name, u.rfid_card as user_rfid
      FROM attendance_logs a
      LEFT JOIN users u ON u.id = a.user_id
      WHERE a.attendance_date = ?
    `, [dateToQuery]);

    const totalActiveUsers = await query("SELECT id, full_name, rfid_card, designation, department FROM users WHERE status != 'deactivated'");

    const presentCount = todayLogs.filter(l => l.status === 'Present' || l.status === 'Overtime').length;
    const lateCount = todayLogs.filter(l => l.status === 'Late').length;
    const totalHoursToday = todayLogs.reduce((acc, curr) => acc + (Number(curr.total_hours) || 0), 0);
    const absentCount = Math.max(0, totalActiveUsers.length - todayLogs.length);

    res.json({
      queryDate: dateToQuery,
      totalEmployees: totalActiveUsers.length,
      scannedToday: todayLogs.length,
      presentCount,
      lateCount,
      absentCount,
      totalHoursToday: parseFloat(totalHoursToday.toFixed(1)),
      attendanceRate: totalActiveUsers.length > 0 ? Math.round((todayLogs.length / totalActiveUsers.length) * 100) : 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Batch Import from parsed CSV or Excel records
app.post('/api/attendance/import', async (req, res) => {
  try {
    const { 
      records = [], // array of { rfid_card, date, check_in, check_out, employee_name, terminal_id }
      source = 'csv_import', 
      actor_name = 'Admin' 
    } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'No attendance records provided to import' });
    }

    const batchId = 'batch_' + Date.now();
    const allUsers = await query('SELECT id, full_name, rfid_card, email FROM users');

    let insertedCount = 0;
    let matchedCount = 0;

    for (const r of records) {
      const card = String(r.rfid_card || r.card_number || r.card || r.rfid || '').trim();
      if (!card) continue;

      const dateStr = String(r.date || r.attendance_date || new Date().toISOString().slice(0, 10)).trim();
      const checkIn = String(r.check_in || r.check_in_time || r.time_in || '09:00:00').trim();
      const checkOut = r.check_out || r.check_out_time || r.time_out ? String(r.check_out || r.check_out_time || r.time_out).trim() : null;
      const empName = String(r.name || r.employee_name || r.user_name || '').trim();
      const terminalId = String(r.terminal || r.terminal_id || r.reader || 'RFID-MAIN-GATE').trim();

      // Find user match either by rfid_card or by name match
      const matchedUser = allUsers.find(u => 
        (u.rfid_card && String(u.rfid_card).trim().toLowerCase() === card.toLowerCase()) ||
        (empName && u.full_name && u.full_name.toLowerCase() === empName.toLowerCase())
      );

      if (matchedUser) {
        matchedCount++;
        // If user didn't have rfid_card saved, associate it
        if (!matchedUser.rfid_card) {
          await query('UPDATE users SET rfid_card = ? WHERE id = ?', [card, matchedUser.id]);
        }
      }

      // Calculate total hours if check-in and check-out exist
      let hours = 8.0;
      let status = 'Present';

      if (checkIn && checkOut) {
        try {
          const dIn = new Date(`${dateStr}T${checkIn.length === 5 ? checkIn + ':00' : checkIn}`);
          const dOut = new Date(`${dateStr}T${checkOut.length === 5 ? checkOut + ':00' : checkOut}`);
          const diffMs = dOut - dIn;
          if (diffMs > 0) {
            hours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
          }
        } catch (e) {
          hours = 8.0;
        }
      }

      // Late threshold: after 09:30 AM
      const checkInHour = parseInt(checkIn.split(':')[0], 10);
      const checkInMin = parseInt(checkIn.split(':')[1] || '0', 10);
      if (checkInHour > 9 || (checkInHour === 9 && checkInMin > 30)) {
        status = 'Late';
      }

      const logId = 'att_' + uuidv4().slice(0, 12);

      await query(`
        INSERT INTO attendance_logs (
          id, user_id, rfid_card, employee_name, attendance_date, 
          check_in_time, check_out_time, total_hours, status, 
          terminal_id, raw_source, import_batch_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        logId,
        matchedUser?.id || null,
        card,
        empName || matchedUser?.full_name || 'Cardholder ' + card.slice(-4),
        dateStr,
        checkIn,
        checkOut,
        hours,
        status,
        terminalId,
        source,
        batchId
      ]);

      insertedCount++;
    }

    await logActivity({
      entity_type: 'rfid_attendance',
      entity_id: batchId,
      user_name: actor_name,
      action: 'ATTENDANCE_IMPORTED',
      details: `${actor_name} imported ${insertedCount} RFID card reader records from ${source} (${matchedCount} employees matched)`
    });

    res.status(201).json({
      success: true,
      batchId,
      insertedCount,
      matchedCount,
      message: `Successfully processed ${insertedCount} attendance scans from RFID reader file.`
    });
  } catch (err) {
    console.error('Error importing attendance records:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Live / Direct RFID Card Swipe (simulate hardware USB/Serial/TCP reader tap)
app.post('/api/attendance/scan', async (req, res) => {
  try {
    const { 
      rfid_card, 
      terminal_id = 'RFID-MAIN-READER',
      action_type = 'check_in' // 'check_in' | 'check_out'
    } = req.body;

    if (!rfid_card || !rfid_card.trim()) {
      return res.status(400).json({ error: 'RFID card number is required' });
    }

    const card = rfid_card.trim();
    const today = new Date().toISOString().slice(0, 10);
    const timeNow = new Date().toLocaleTimeString('en-US', { hour12: false });

    // Find if user matches
    const matchedUser = await getOne('SELECT id, full_name, designation, department FROM users WHERE rfid_card = ?', [card]);

    // Check if record exists for this card today
    const existing = await getOne('SELECT * FROM attendance_logs WHERE rfid_card = ? AND attendance_date = ?', [card, today]);

    if (existing) {
      // Update check out time
      const dIn = new Date(`${today}T${existing.check_in_time}`);
      const dOut = new Date(`${today}T${timeNow}`);
      const diffHrs = Math.max(0.1, parseFloat(((dOut - dIn) / (1000 * 60 * 60)).toFixed(2)));

      await query('UPDATE attendance_logs SET check_out_time = ?, total_hours = ? WHERE id = ?', [timeNow, diffHrs, existing.id]);

      const updated = await getOne('SELECT * FROM attendance_logs WHERE id = ?', [existing.id]);
      return res.json({
        type: 'check_out',
        log: updated,
        user: matchedUser,
        message: `Goodbye, ${matchedUser?.full_name || card}! Check-out registered at ${timeNow} (${diffHrs} hrs total).`
      });
    } else {
      // Create new check in
      const logId = 'att_' + uuidv4().slice(0, 12);
      const isLate = parseInt(timeNow.split(':')[0], 10) > 9;
      const status = isLate ? 'Late' : 'Present';

      await query(`
        INSERT INTO attendance_logs (id, user_id, rfid_card, employee_name, attendance_date, check_in_time, status, terminal_id, raw_source)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [logId, matchedUser?.id || null, card, matchedUser?.full_name || 'Cardholder ' + card, today, timeNow, status, terminal_id, 'live_reader_tap']);

      const created = await getOne('SELECT * FROM attendance_logs WHERE id = ?', [logId]);
      return res.status(201).json({
        type: 'check_in',
        log: created,
        user: matchedUser,
        message: `Welcome, ${matchedUser?.full_name || card}! Check-in recorded at ${timeNow} [Status: ${status}].`
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Link RFID card to User
app.patch('/api/users/:userId/rfid', async (req, res) => {
  try {
    const { userId } = req.params;
    const { rfid_card, actor_name = 'Admin' } = req.body;

    await query('UPDATE users SET rfid_card = ? WHERE id = ?', [rfid_card ? rfid_card.trim() : null, userId]);
    const user = await getOne('SELECT id, full_name, email, rfid_card FROM users WHERE id = ?', [userId]);

    await logActivity({
      entity_type: 'user',
      entity_id: userId,
      user_name: actor_name,
      action: 'RFID_CARD_LINKED',
      details: `${actor_name} assigned RFID Card "${rfid_card}" to employee ${user.full_name}`
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Delete an attendance log
app.delete('/api/attendance/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM attendance_logs WHERE id = ?', [id]);
    res.json({ success: true, message: 'Attendance log deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[API Server] Running on http://localhost:${PORT}`);
});
