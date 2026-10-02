const API_BASE = (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '') + '/api';

function authFetch(url, options = {}) {
  const token = localStorage.getItem('apex_token');
  const headers = { ...(options.headers || {}) };
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(url, { ...options, headers });
}

async function parseResponse(res, defaultError = 'Request failed') {
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // Non-JSON response (e.g. HTML gateway error)
    if (!res.ok) {
      throw new Error(`Server temporarily unavailable (${res.status}). Please try again in a few seconds.`);
    }
    throw new Error('Received unexpected response format from server.');
  }

  if (!res.ok) {
    const errorMsg = (json && (json.error || json.message)) || defaultError;
    throw new Error(errorMsg);
  }
  return json;
}

export const api = {
  // Authentication
  async register(data) {
    const res = await authFetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return parseResponse(res, 'Registration failed');
  },

  async login(data) {
    const res = await authFetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return parseResponse(res, 'Login failed');
  },

  async forgotPassword(data) {
    const res = await authFetch(`${API_BASE}/auth/forgot-password`, {
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
    const res = await authFetch(`${API_BASE}/auth/me`, {
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
    const res = await authFetch(`${API_BASE}/auth/social`, {
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
    const res = await authFetch(`${API_BASE}/logs${query ? `?${query}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch activity logs');
    return res.json();
  },

  // Stats
  async getStats() {
    const res = await authFetch(`${API_BASE}/dashboard/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  // Gamification & Leaderboard
  async getLeaderboard() {
    const res = await authFetch(`${API_BASE}/gamification/leaderboard`);
    if (!res.ok) throw new Error('Failed to fetch leaderboard data');
    return res.json();
  },

  // Users & Onboarding
  async getUsers(includeDeactivated = false) {
    const res = await authFetch(`${API_BASE}/users${includeDeactivated ? '?include_deactivated=true' : ''}`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async onboardUser(userData) {
    let role = 'member';
    try {
      const u = JSON.parse(localStorage.getItem('apex_user') || '{}');
      if (u.role) role = u.role;
    } catch(e) {}

    const res = await authFetch(`${API_BASE}/users/onboard`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-role': role
      },
      body: JSON.stringify(userData),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to onboard employee');
    return json;
  },

  async updateUser(userId, data) {
    const res = await authFetch(`${API_BASE}/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update user');
    return json;
  },

  async uploadUserAvatar(userId, avatarData, actorName) {
    const res = await authFetch(`${API_BASE}/users/${userId}/avatar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        avatar_data: avatarData,
        avatar_url: typeof avatarData === 'string' && avatarData.startsWith('http') ? avatarData : undefined,
        actor_name: actorName
      })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to upload profile image');
    return json;
  },

  // Upload reporting images, visual evidence, screenshots to Cloudinary / storage
  async uploadImage(imageData, folder = 'reports') {
    const res = await authFetch(`${API_BASE}/upload/image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_data: imageData, folder })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to upload image');
    return json;
  },

  async updateUserStatus(userId, status, actorName) {
    let role = 'member';
    let currentUserId = '';
    try {
      const u = JSON.parse(localStorage.getItem('apex_user') || '{}');
      if (u.role) role = u.role;
      if (u.id) currentUserId = u.id;
    } catch(e) {}

    const res = await authFetch(`${API_BASE}/users/${userId}/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-role': role,
        'x-user-id': currentUserId
      },
      body: JSON.stringify({ status, actor_name: actorName })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update user status');
    return json;
  },

  async deleteUser(userId, actorName) {
    let role = 'member';
    let currentUserId = '';
    try {
      const u = JSON.parse(localStorage.getItem('apex_user') || '{}');
      if (u.role) role = u.role;
      if (u.id) currentUserId = u.id;
    } catch(e) {}

    const res = await authFetch(`${API_BASE}/users/${userId}?actor_name=${encodeURIComponent(actorName || 'Admin')}`, {
      method: 'DELETE',
      headers: {
        'x-user-role': role,
        'x-user-id': currentUserId
      }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete user');
    return json;
  },

  async getUserOnboarding(userId) {
    const res = await authFetch(`${API_BASE}/users/${userId}/onboarding`);
    if (!res.ok) throw new Error('Failed to fetch onboarding tasks');
    return res.json();
  },

  async addOnboardingTask(userId, taskData) {
    const res = await authFetch(`${API_BASE}/users/${userId}/onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to assign onboarding task');
    return json;
  },

  async deleteOnboardingTask(taskId) {
    const res = await authFetch(`${API_BASE}/onboarding/${taskId}`, {
      method: 'DELETE'
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to remove onboarding task');
    return json;
  },

  async updateOnboardingTask(taskId, taskData) {
    const res = await authFetch(`${API_BASE}/onboarding/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update onboarding task');
    return json;
  },

  async toggleOnboardingTask(taskId, actorName, role, action) {
    const res = await authFetch(`${API_BASE}/onboarding/${taskId}/toggle`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actor_name: actorName, role, action })
    });
    if (!res.ok) throw new Error('Failed to toggle task');
    return res.json();
  },

  // Common Onboarding Tasks (Global template for any new user)
  async getCommonOnboardingTasks() {
    const res = await authFetch(`${API_BASE}/common-onboarding-tasks`);
    if (!res.ok) throw new Error('Failed to fetch common onboarding tasks');
    return res.json();
  },

  async createCommonOnboardingTask(taskData) {
    let role = 'admin';
    try {
      const u = JSON.parse(localStorage.getItem('apex_user') || '{}');
      if (u.role) role = u.role;
    } catch(e) {}

    const res = await authFetch(`${API_BASE}/common-onboarding-tasks`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-role': role
      },
      body: JSON.stringify(taskData)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create common onboarding task');
    return json;
  },

  async updateCommonOnboardingTask(id, taskData) {
    let role = 'admin';
    try {
      const u = JSON.parse(localStorage.getItem('apex_user') || '{}');
      if (u.role) role = u.role;
    } catch(e) {}

    const res = await authFetch(`${API_BASE}/common-onboarding-tasks/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-role': role
      },
      body: JSON.stringify(taskData)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update common onboarding task');
    return json;
  },

  async deleteCommonOnboardingTask(id) {
    let role = 'admin';
    try {
      const u = JSON.parse(localStorage.getItem('apex_user') || '{}');
      if (u.role) role = u.role;
    } catch(e) {}

    const res = await authFetch(`${API_BASE}/common-onboarding-tasks/${id}`, {
      method: 'DELETE',
      headers: { 'x-user-role': role }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete common onboarding task');
    return json;
  },

  async syncCommonOnboardingTasks() {
    const res = await authFetch(`${API_BASE}/common-onboarding-tasks/sync-all`, {
      method: 'POST'
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to sync common onboarding tasks');
    return json;
  },

  // Projects & Boards
  async getProjects() {
    let role = 'member';
    let userId = '';
    try {
      const stored = localStorage.getItem('apex_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.role) role = u.role;
        if (u.id) userId = u.id;
      }
    } catch (e) {}

    const headers = { 'x-user-role': role };
    if (userId) headers['x-user-id'] = userId;

    const res = await authFetch(`${API_BASE}/projects`, {
      headers
    });
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },

  async getProject(projectId) {
    const res = await authFetch(`${API_BASE}/projects/${projectId}`);
    if (!res.ok) throw new Error('Failed to fetch project details');
    return res.json();
  },

  async createProject(projectData) {
    const res = await authFetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create project');
    return json;
  },

  async updateProject(projectId, projectData) {
    const res = await authFetch(`${API_BASE}/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update project');
    return json;
  },

  async deleteProject(projectId, mode = 'archive', actorName = 'Admin') {
    const res = await authFetch(`${API_BASE}/projects/${projectId}?mode=${encodeURIComponent(mode)}&actor_name=${encodeURIComponent(actorName)}`, {
      method: 'DELETE'
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete project');
    return json;
  },

  async restoreProject(projectId, actorName = 'Admin') {
    const res = await authFetch(`${API_BASE}/projects/${projectId}/restore`, {
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
    const res = await authFetch(`${API_BASE}/projects/${projectId}/doc?file=${encodeURIComponent(filename)}`);
    if (!res.ok) throw new Error('Failed to fetch project document');
    return res.json();
  },

  // Project Sync & Replication (Local <-> Live Server)
  async exportProjectsBundle(baseUrl) {
    const targetUrl = (baseUrl ? baseUrl.replace(/\/$/, '') : API_BASE);
    const res = await authFetch(`${targetUrl}/projects/sync/export-bundle`);
    if (!res.ok) throw new Error('Failed to export projects bundle');
    return res.json();
  },

  async importProjectsBundle(bundleData, targetApiUrl) {
    const targetUrl = (targetApiUrl ? targetApiUrl.replace(/\/$/, '') : API_BASE);
    const res = await authFetch(`${targetUrl}/projects/sync/import-bundle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bundleData)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to import projects bundle');
    return json;
  },

  async scanLocalProjects() {
    const res = await authFetch(`${API_BASE}/projects/scan/local-dirs`);
    if (!res.ok) throw new Error('Local scanning not supported on this environment');
    return res.json();
  },

  async getProjectBoard(projectId) {
    const res = await authFetch(`${API_BASE}/projects/${projectId}/board`);
    if (!res.ok) throw new Error('Failed to fetch project board');
    return res.json();
  },

  // Tasks
  async createTask(taskData) {
    const res = await authFetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create task');
    return json;
  },

  async updateTask(taskId, updates) {
    const res = await authFetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update task');
    return json;
  },

  async bulkUpdateTasks(taskIds, action, value, actorName) {
    const res = await authFetch(`${API_BASE}/tasks/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_ids: taskIds, action, value, actor_name: actorName }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to bulk update tasks');
    return json;
  },

  async deleteTask(taskId, actorName) {
    const res = await authFetch(`${API_BASE}/tasks/${taskId}?actor_name=${encodeURIComponent(actorName || 'Admin')}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete task');
    return res.json();
  },

  async getSubtasks(taskId) {
    const res = await authFetch(`${API_BASE}/tasks/${taskId}/subtasks`);
    if (!res.ok) throw new Error('Failed to fetch subtasks');
    return res.json();
  },

  // Comments
  async getComments(taskId) {
    const res = await authFetch(`${API_BASE}/tasks/${taskId}/comments`);
    if (!res.ok) throw new Error('Failed to fetch comments');
    return res.json();
  },

  async addComment(taskId, commentData) {
    const res = await authFetch(`${API_BASE}/tasks/${taskId}/comments`, {
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
    const res = await authFetch(`${API_BASE}/reports/productivity${query ? `?${query}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch productivity report');
    return res.json();
  },

  // Work Time Logging (Employee Timesheet Entry)
  async logWorkTime(logData) {
    const res = await authFetch(`${API_BASE}/work-logs`, {
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
    const res = await authFetch(`${API_BASE}/work-logs${query ? `?${query}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch work logs');
    return res.json();
  },

  // Message Board API
  async getMessages(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await authFetch(`${API_BASE}/messages${query ? `?${query}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch messages');
    return res.json();
  },

  async sendMessage(data) {
    const res = await authFetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to send message');
    return json;
  },

  async togglePinMessage(messageId) {
    const res = await authFetch(`${API_BASE}/messages/${messageId}/pin`, {
      method: 'PATCH'
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to toggle pin');
    return json;
  },

  async deleteMessage(messageId, actorName) {
    const res = await authFetch(`${API_BASE}/messages/${messageId}?actor_name=${encodeURIComponent(actorName || 'Admin')}`, {
      method: 'DELETE'
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete message');
    return json;
  },

  // Instruction Videos API
  async getVideos(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await authFetch(`${API_BASE}/videos${query ? `?${query}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch instruction videos');
    return res.json();
  },

  async uploadVideo(data) {
    const res = await authFetch(`${API_BASE}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to upload video');
    return json;
  },

  async deleteVideo(videoId, actorName) {
    const res = await authFetch(`${API_BASE}/videos/${videoId}?actor_name=${encodeURIComponent(actorName || 'Admin')}`, {
      method: 'DELETE'
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete video');
    return json;
  }
};
