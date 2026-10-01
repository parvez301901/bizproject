const { query } = require('./db');
const { v4: uuidv4 } = require('uuid');

async function seedData() {
  try {
    const existingUsers = await query('SELECT count(*) as count FROM users');
    const count = existingUsers[0] ? (existingUsers[0].count || existingUsers[0]['count(*)']) : 0;
    if (parseInt(count, 10) > 0) {
      console.log(`[Seed] Database already contains ${count} users. Skipping seeding.`);
      return;
    }

    console.log('[Seed] Populating initial dataset...');

    // 1. Initial Users
    const users = [
      {
        id: 'usr_admin',
        email: 'parvez301@gmail.com',
        password_hash: '$2b$10$l1CEsvu.L0XSvBDNKAWGiOzigN5.6UTSMALau9SkbBT4ludni40TC', // Admin@12345
        full_name: 'Alex Morgan',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        role: 'admin',
        department: 'Operations & Strategy',
        designation: 'VP of Product',
        phone: '+1 555-0192',
        location: 'San Francisco, CA',
        skills: JSON.stringify(['Product Strategy', 'Agile Leadership', 'Resource Planning']),
        join_date: '2023-01-15',
        status: 'active',
        onboarding_progress: 100
      },
      {
        id: 'usr_dev_1',
        email: 'sarah.chen@company.com',
        full_name: 'Sarah Chen',
        avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
        role: 'manager',
        department: 'Engineering',
        designation: 'Principal Architect',
        phone: '+1 555-0283',
        location: 'Seattle, WA',
        skills: JSON.stringify(['PostgreSQL', 'System Architecture', 'Node.js', 'Distributed Systems']),
        join_date: '2023-04-10',
        status: 'active',
        onboarding_progress: 100
      },
      {
        id: 'usr_dev_2',
        email: 'marcus.vance@company.com',
        full_name: 'Marcus Vance',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        role: 'member',
        department: 'Engineering',
        designation: 'Senior Frontend Engineer',
        phone: '+1 555-0482',
        location: 'Austin, TX',
        skills: JSON.stringify(['React', 'TypeScript', 'Tailwind CSS', 'Vite', 'UI/UX']),
        join_date: '2023-08-20',
        status: 'active',
        onboarding_progress: 100
      },
      {
        id: 'usr_new_1',
        email: 'elena.rostova@company.com',
        full_name: 'Elena Rostova',
        avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        role: 'member',
        department: 'Product Design',
        designation: 'Product Designer (New Hire)',
        phone: '+1 555-0741',
        location: 'New York, NY',
        skills: JSON.stringify(['Figma', 'Design Systems', 'User Research', 'Prototyping']),
        join_date: '2026-09-18',
        status: 'onboarding',
        onboarding_progress: 40
      },
      {
        id: 'usr_new_2',
        email: 'liam.patel@company.com',
        full_name: 'Liam Patel',
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        role: 'member',
        department: 'Engineering',
        designation: 'Backend Developer (New Hire)',
        phone: '+1 555-0955',
        location: 'Toronto, Canada',
        skills: JSON.stringify(['Go', 'PostgreSQL', 'Docker', 'REST APIs']),
        join_date: '2026-09-22',
        status: 'onboarding',
        onboarding_progress: 20
      }
    ];

    for (const u of users) {
      await query(`
        INSERT INTO users (id, email, full_name, avatar_url, role, department, designation, phone, location, skills, join_date, status, onboarding_progress)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [u.id, u.email, u.full_name, u.avatar_url, u.role, u.department, u.designation, u.phone, u.location, u.skills, u.join_date, u.status, u.onboarding_progress]);
    }

    // 2. Onboarding tasks for new hires
    const onboardingChecklistTemplate = [
      { title: 'Complete personal profile and emergency contact details', category: 'HR', is_completed: 1 },
      { title: 'Sign employee agreement & NDA policies', category: 'Legal & HR', is_completed: 1 },
      { title: 'Setup work email, 2FA, and SSO authenticator', category: 'IT Security', is_completed: 1 },
      { title: 'Join company Slack channels and schedule intro coffee with mentor', category: 'Team & Culture', is_completed: 0 },
      { title: 'Setup local development environment & clone repositories', category: 'IT & Dev', is_completed: 0 },
      { title: 'Complete product architecture & design guidelines walkthrough', category: 'Training', is_completed: 0 },
    ];

    for (const user of [users[3], users[4]]) {
      for (const item of onboardingChecklistTemplate) {
        await query(`
          INSERT INTO onboarding_tasks (id, user_id, title, category, is_completed, due_date, xp_reward)
          VALUES (?, ?, ?, ?, ?, ?, 35)
        `, [uuidv4(), user.id, item.title, item.category, item.is_completed, '2026-09-30']);
      }
    }

    // 2b. Common Onboarding Tasks (Common template for all new users)
    const existingCommon = await query('SELECT count(*) as cnt FROM common_onboarding_tasks');
    const commonCount = Number(existingCommon[0]?.cnt || existingCommon[0]?.count || 0);
    if (commonCount === 0) {
      const defaultCommonTasks = [
        { id: 'cot_1', title: 'Complete personal profile and emergency contact details', category: 'HR & Profile', xp_reward: 30, order_index: 1 },
        { id: 'cot_2', title: 'Sign employee agreement & company policy documentation', category: 'Legal & HR', xp_reward: 40, order_index: 2 },
        { id: 'cot_3', title: 'Setup Google Workspace, 2FA credentials & password manager', category: 'IT Security', xp_reward: 50, order_index: 3 },
        { id: 'cot_4', title: 'Schedule 1-on-1 welcome session with mentor & manager', category: 'Team & Culture', xp_reward: 35, order_index: 4 },
        { id: 'cot_5', title: 'Configure workstation tools, software licenses & repository keys', category: 'Engineering & Dev', xp_reward: 45, order_index: 5 },
        { id: 'cot_6', title: 'Review company mission, SOP video tutorials & team workflows', category: 'Training & SOP', xp_reward: 50, order_index: 6 }
      ];
      for (const cot of defaultCommonTasks) {
        await query(`
          INSERT INTO common_onboarding_tasks (id, title, category, xp_reward, order_index)
          VALUES (?, ?, ?, ?, ?)
        `, [cot.id, cot.title, cot.category, cot.xp_reward, cot.order_index]);
      }
    }

    // 3. Workspace & Projects
    const wsId = 'ws_primary';
    await query(`
      INSERT INTO workspaces (id, name, description, slug, created_by)
      VALUES (?, ?, ?, ?, ?)
    `, [wsId, 'Global HQ Operations', 'Company-wide engineering and product execution workspace', 'global-hq', 'usr_admin']);

    const p1Id = 'proj_enterprise_core';
    await query(`
      INSERT INTO projects (id, workspace_id, name, description, color, status, priority, start_date, due_date, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [p1Id, wsId, 'Core Platform Modernization', 'Next-generation architecture scaling to millions of daily actions', '#10b981', 'active', 'High', '2026-09-01', '2026-12-15', 'usr_admin']);

    const p2Id = 'proj_design_system';
    await query(`
      INSERT INTO projects (id, workspace_id, name, description, color, status, priority, start_date, due_date, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [p2Id, wsId, 'Sage & Mint Design System', 'Component library with sleek light greenish tones and accessible tokens', '#059669', 'active', 'Medium', '2026-09-10', '2026-11-20', 'usr_admin']);

    // 4. Boards
    const b1Id = 'board_dev_sprint';
    await query(`
      INSERT INTO boards (id, project_id, name)
      VALUES (?, ?, ?)
    `, [b1Id, p1Id, 'Q3 Execution Sprint']);

    const b2Id = 'board_design';
    await query(`
      INSERT INTO boards (id, project_id, name)
      VALUES (?, ?, ?)
    `, [b2Id, p2Id, 'Design Tokens & Components']);

    // 5. Rich Tasks for Board 1 (Sprint Board)
    const tasks = [
      {
        id: 'tsk_101',
        board_id: b1Id,
        title: 'Design PostgreSQL schema & high-throughput indexing',
        description: 'Optimize B-tree indexes for tasks filtering by status, priority, and due date.',
        status: 'Done',
        priority: 'Urgent',
        estimated_hours: 12,
        actual_hours: 10.5,
        start_date: '2026-09-05',
        due_date: '2026-09-12',
        order_index: 0,
        assignee_ids: JSON.stringify(['usr_dev_1']),
        tags: JSON.stringify(['Database', 'Postgres', 'Backend']),
      },
      {
        id: 'tsk_102',
        board_id: b1Id,
        title: 'Implement Monday/ClickUp interactive spreadsheet table view',
        description: 'Create inline-editable cells for title, status pills, priority flags, and assignees with instant save.',
        status: 'In Progress',
        priority: 'High',
        estimated_hours: 18,
        actual_hours: 14,
        start_date: '2026-09-12',
        due_date: '2026-09-26',
        order_index: 1,
        assignee_ids: JSON.stringify(['usr_dev_2']),
        tags: JSON.stringify(['Frontend', 'UI', 'Table']),
      },
      {
        id: 'tsk_103',
        board_id: b1Id,
        title: 'Build drag-and-drop Kanban workflow columns',
        description: 'Smooth drag-and-drop between To Do, In Progress, In Review, and Done with column metrics.',
        status: 'In Progress',
        priority: 'High',
        estimated_hours: 15,
        actual_hours: 9,
        start_date: '2026-09-14',
        due_date: '2026-09-28',
        order_index: 2,
        assignee_ids: JSON.stringify(['usr_dev_2', 'usr_admin']),
        tags: JSON.stringify(['Kanban', 'Frontend', 'dnd-kit']),
      },
      {
        id: 'tsk_104',
        board_id: b1Id,
        title: 'Interactive Employee Onboarding Checklist & Progress Tracker',
        description: 'Step-by-step onboarding wizard for HR to invite new hires and track their equipment/system setup.',
        status: 'In Review',
        priority: 'Urgent',
        estimated_hours: 14,
        actual_hours: 13,
        start_date: '2026-09-15',
        due_date: '2026-09-25',
        order_index: 3,
        assignee_ids: JSON.stringify(['usr_admin', 'usr_new_1']),
        tags: JSON.stringify(['Onboarding', 'HR', 'Feature']),
      },
      {
        id: 'tsk_105',
        board_id: b1Id,
        title: 'Team Workload & Capacity Heatmap Analytics',
        description: 'Provide team leads with visibility into active task loads and estimated vs actual hours.',
        status: 'To Do',
        priority: 'Medium',
        estimated_hours: 10,
        actual_hours: 0,
        start_date: '2026-09-25',
        due_date: '2026-10-05',
        order_index: 4,
        assignee_ids: JSON.stringify(['usr_dev_1']),
        tags: JSON.stringify(['Analytics', 'Admin']),
      },
      {
        id: 'tsk_106',
        board_id: b1Id,
        title: 'Bulk task actions: multi-select reassign, status change, and archive',
        description: 'Allow managers to select 50+ rows and apply batch updates in single clicks.',
        status: 'To Do',
        priority: 'Low',
        estimated_hours: 8,
        actual_hours: 0,
        start_date: '2026-09-28',
        due_date: '2026-10-08',
        order_index: 5,
        assignee_ids: JSON.stringify(['usr_dev_2', 'usr_new_2']),
        tags: JSON.stringify(['Productivity', 'Batch']),
      },
      {
        id: 'tsk_107',
        board_id: b1Id,
        title: 'Automated audit logs & activity feed for task changes',
        description: 'Record status shifts, assignee alterations, and comments into real-time activity stream.',
        status: 'Backlog',
        priority: 'Low',
        estimated_hours: 6,
        actual_hours: 0,
        start_date: '2026-10-01',
        due_date: '2026-10-15',
        order_index: 6,
        assignee_ids: JSON.stringify(['usr_new_2']),
        tags: JSON.stringify(['Audit', 'Security']),
      }
    ];

    for (const t of tasks) {
      await query(`
        INSERT INTO tasks (id, board_id, title, description, status, priority, estimated_hours, actual_hours, start_date, due_date, order_index, assignee_ids, tags, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [t.id, t.board_id, t.title, t.description, t.status, t.priority, t.estimated_hours, t.actual_hours, t.start_date, t.due_date, t.order_index, t.assignee_ids, t.tags, 'usr_admin']);
    }

    // 6. Starter Messages (Broadcast and Direct)
    try {
      const msgCountRes = await query('SELECT COUNT(*) as count FROM messages');
      const count = Number(msgCountRes[0]?.count || 0);
      if (count === 0) {
        const starterMessages = [
          {
            id: 'msg_welcome_broadcast',
            sender_id: 'usr_admin',
            recipient_type: 'broadcast',
            recipient_id: null,
            title: 'Welcome to the Q4 Strategy & Product Acceleration Sprint',
            content: 'Hello everyone! Please make sure your daily work hours are logged under the Work Reports view. All milestone deliverables for the core architecture and design tokens are tracked in real-time. Reach out directly if you face any blockers!',
            priority: 'Important',
            category: 'Announcement',
            is_pinned: 1,
            created_at: '2026-09-24 09:00:00'
          },
          {
            id: 'msg_security_broadcast',
            sender_id: 'usr_admin',
            recipient_type: 'broadcast',
            recipient_id: null,
            title: 'Security Notice: Mandatory 2FA & Password Guidelines',
            content: 'Please review your authentication settings. All developers pushing to production repositories must enforce hardware or authenticator-app 2FA.',
            priority: 'Normal',
            category: 'Policy Update',
            is_pinned: 0,
            created_at: '2026-09-24 14:30:00'
          },
          {
            id: 'msg_direct_elena',
            sender_id: 'usr_admin',
            recipient_type: 'direct',
            recipient_id: 'usr_new_1',
            title: 'Welcome onboard Elena! Onboarding check-in',
            content: 'Hi Elena, welcome to the design team! We are thrilled to have you lead the Sage & Mint design tokens. Let us know if you need any extra Figma permissions or workspace setup help.',
            priority: 'Normal',
            category: 'Direct Notice',
            is_pinned: 0,
            created_at: '2026-09-25 10:15:00'
          },
          {
            id: 'msg_direct_marcus',
            sender_id: 'usr_admin',
            recipient_type: 'direct',
            recipient_id: 'usr_dev_1',
            title: 'PostgreSQL High-Throughput Indexing Review',
            content: 'Marcus, excellent work on the B-tree indexes for the tasks table. The query benchmarks look exceptionally fast.',
            priority: 'Normal',
            category: 'Task Directive',
            is_pinned: 0,
            created_at: '2026-09-25 11:45:00'
          }
        ];

        for (const m of starterMessages) {
          await query(`
            INSERT INTO messages (id, sender_id, recipient_type, recipient_id, title, content, priority, category, is_pinned, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [m.id, m.sender_id, m.recipient_type, m.recipient_id, m.title, m.content, m.priority, m.category, m.is_pinned, m.created_at]);
        }
      }
    } catch (msgErr) {
      console.warn('[Seed] Notice on messages seeding:', msgErr.message);
    }

    console.log('[Seed] Database seeded with 5 users, 2 projects, 2 boards, and multiple tasks successfully.');
  } catch (err) {
    console.error('[Seed] Error seeding data:', err.message);
  }
}

module.exports = { seedData };
