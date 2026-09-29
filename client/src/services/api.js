const API_BASE = (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '') + '/api';

export const api = {
  // Authentication
  async register(data) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Registration failed');
    return json;
  },

  async login(data) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Login failed');
    return json;
  },

  async forgotPassword(data) {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Password reset failed');
    return json;
  },

  async getMe(token) {
    const t = token || localStorage.getItem('apex_token');
    if (!t) return null;
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${t}` }
    });
    if (!res.ok) {
      localStorage.removeItem('apex_token');
      localStorage.removeItem('apex_user');
      return null;
    }
    return res.json();
  },

  async socialAuth(data) {
    const res = await fetch(`${API_BASE}/auth/social`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Social authentication failed');
    return json;
  },

  // Audit Logs
  async getLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/logs${query ? `?${query}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch activity logs');
    return res.json();
  },

  // Stats
  async getStats() {
    const res = await fetch(`${API_BASE}/dashboard/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  // Gamification & Leaderboard
  async getLeaderboard() {
    const res = await fetch(`${API_BASE}/gamification/leaderboard`);
    if (!res.ok) throw new Error('Failed to fetch leaderboard data');
    return res.json();
  },

  // Users & Onboarding
  async getUsers(includeDeactivated = false) {
    const res = await fetch(`${API_BASE}/users${includeDeactivated ? '?include_deactivated=true' : ''}`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async onboardUser(userData) {
    const res = await fetch(`${API_BASE}/users/onboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to onboard employee');
    return json;
  },

  async updateUserStatus(userId, status, actorName) {
    const res = await fetch(`${API_BASE}/users/${userId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, actor_name: actorName })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update user status');
    return json;
  },

  async deleteUser(userId, actorName) {
    const res = await fetch(`${API_BASE}/users/${userId}?actor_name=${encodeURIComponent(actorName || 'Admin')}`, {
      method: 'DELETE'
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete user');
    return json;
  },

  async getUserOnboarding(userId) {
    const res = await fetch(`${API_BASE}/users/${userId}/onboarding`);
    if (!res.ok) throw new Error('Failed to fetch onboarding tasks');
    return res.json();
  },

  async addOnboardingTask(userId, taskData) {
    const res = await fetch(`${API_BASE}/users/${userId}/onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to assign onboarding task');
    return json;
  },

  async deleteOnboardingTask(taskId) {
    const res = await fetch(`${API_BASE}/onboarding/${taskId}`, {
      method: 'DELETE'
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to remove onboarding task');
    return json;
  },

  async toggleOnboardingTask(taskId, actorName) {
    const res = await fetch(`${API_BASE}/onboarding/${taskId}/toggle`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actor_name: actorName })
    });
    if (!res.ok) throw new Error('Failed to toggle task');
    return res.json();
  },

  // Projects & Boards
  async getProjects() {
    let role = 'admin';
    try {
      const stored = localStorage.getItem('apex_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.role) role = u.role;
      }
    } catch (e) {}

    const res = await fetch(`${API_BASE}/projects`, {
      headers: { 'x-user-role': role }
    });
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },

  async getProject(projectId) {
    const res = await fetch(`${API_BASE}/projects/${projectId}`);
    if (!res.ok) throw new Error('Failed to fetch project details');
    return res.json();
  },

  async createProject(projectData) {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create project');
    return json;
  },

  async updateProject(projectId, projectData) {
    const res = await fetch(`${API_BASE}/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update project');
    return json;
  },

  async deleteProject(projectId, mode = 'archive', actorName = 'Admin') {
    const res = await fetch(`${API_BASE}/projects/${projectId}?mode=${encodeURIComponent(mode)}&actor_name=${encodeURIComponent(actorName)}`, {
      method: 'DELETE'
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete project');
    return json;
  },

  async restoreProject(projectId, actorName = 'Admin') {
    const res = await fetch(`${API_BASE}/projects/${projectId}/restore`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actor_name: actorName })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to restore project');
    return json;
  },

  getProjectPdfUrl(projectId, filename = '') {
    return `${API_BASE}/projects/${projectId}/pdf${filename ? `?file=${encodeURIComponent(filename)}` : ''}`;
  },

  async getProjectDoc(projectId, filename) {
    const res = await fetch(`${API_BASE}/projects/${projectId}/doc?file=${encodeURIComponent(filename)}`);
    if (!res.ok) throw new Error('Failed to fetch project document');
    return res.json();
  },

  // Project Sync & Replication (Local <-> Live Server)
  async exportProjectsBundle(baseUrl) {
    const targetUrl = (baseUrl ? baseUrl.replace(/\/$/, '') : API_BASE);
    const res = await fetch(`${targetUrl}/projects/sync/export-bundle`);
    if (!res.ok) throw new Error('Failed to export projects bundle');
    return res.json();
  },

  async importProjectsBundle(bundleData, targetApiUrl) {
    const targetUrl = (targetApiUrl ? targetApiUrl.replace(/\/$/, '') : API_BASE);
    const res = await fetch(`${targetUrl}/projects/sync/import-bundle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bundleData)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to import projects bundle');
    return json;
  },

  async scanLocalProjects() {
    const res = await fetch(`${API_BASE}/projects/scan/local-dirs`);
    if (!res.ok) throw new Error('Local scanning not supported on this environment');
    return res.json();
  },

  async getProjectBoard(projectId) {
    const res = await fetch(`${API_BASE}/projects/${projectId}/board`);
    if (!res.ok) throw new Error('Failed to fetch project board');
    return res.json();
  },

  // Tasks
  async createTask(taskData) {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create task');
    return json;
  },

  async updateTask(taskId, updates) {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update task');
    return json;
  },

  async bulkUpdateTasks(taskIds, action, value, actorName) {
    const res = await fetch(`${API_BASE}/tasks/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_ids: taskIds, action, value, actor_name: actorName }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to bulk update tasks');
    return json;
  },

  async deleteTask(taskId, actorName) {
    const res = await fetch(`${API_BASE}/tasks/${taskId}?actor_name=${encodeURIComponent(actorName || 'Admin')}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete task');
    return res.json();
  },

  // Comments
  async getComments(taskId) {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/comments`);
    if (!res.ok) throw new Error('Failed to fetch comments');
    return res.json();
  },

  async addComment(taskId, commentData) {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(commentData),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to add comment');
    return json;
  },

  // Productivity Reports (Day, Week, Month)
  async getProductivityReport(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/reports/productivity${query ? `?${query}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch productivity report');
    return res.json();
  },

  // Work Time Logging (Employee Timesheet Entry)
  async logWorkTime(logData) {
    const res = await fetch(`${API_BASE}/work-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to log work time');
    return json;
  },

  async getWorkLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/work-logs${query ? `?${query}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch work logs');
    return res.json();
  },

  // Message Board API
  async getMessages(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/messages${query ? `?${query}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch messages');
    return res.json();
  },

  async sendMessage(data) {
    const res = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to send message');
    return json;
  },

  async togglePinMessage(messageId) {
    const res = await fetch(`${API_BASE}/messages/${messageId}/pin`, {
      method: 'PATCH'
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to toggle pin');
    return json;
  },

  async deleteMessage(messageId, actorName) {
    const res = await fetch(`${API_BASE}/messages/${messageId}?actor_name=${encodeURIComponent(actorName || 'Admin')}`, {
      method: 'DELETE'
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete message');
    return json;
  },

  // Instruction Videos API
  async getVideos(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/videos${query ? `?${query}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch instruction videos');
    return res.json();
  },

  async uploadVideo(data) {
    const res = await fetch(`${API_BASE}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to upload video');
    return json;
  },

  async deleteVideo(videoId, actorName) {
    const res = await fetch(`${API_BASE}/videos/${videoId}?actor_name=${encodeURIComponent(actorName || 'Admin')}`, {
      method: 'DELETE'
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete video');
    return json;
  }
};
