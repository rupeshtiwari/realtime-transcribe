// API service layer for all backend calls

const API_BASE = '/api';

export const api = {
  // Session management
  createSession: async () => {
    const res = await fetch(`${API_BASE}/session`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to create session');
    return res.json();
  },

  // Suggestions
  getSuggestions: async (transcript) => {
    const res = await fetch(`${API_BASE}/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript }),
    });
    if (!res.ok) throw new Error('Failed to get suggestions');
    return res.json();
  },

  // Analysis endpoints
  analyze: async (endpoint, transcript) => {
    const res = await fetch(`${API_BASE}/analysis/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript }),
    });
    if (!res.ok) throw new Error(`Analysis failed: ${endpoint}`);
    return res.json();
  },

  // Assistant chat
  askAssistant: async (question, context, transcript) => {
    const res = await fetch(`${API_BASE}/assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, context, transcript }),
    });
    if (!res.ok) throw new Error('Failed to get assistant response');
    return res.json();
  },

  // Materials matching
  matchMaterials: async (role, coachingType, agenda) => {
    const res = await fetch(`${API_BASE}/materials/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, coachingType, agenda }),
    });
    if (!res.ok) throw new Error('Failed to match materials');
    return res.json();
  },

  // Google Drive
  saveToDrive: async (sessionData, accessToken) => {
    const res = await fetch(`${API_BASE}/save-to-drive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionData, accessToken }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to save to Drive');
    }
    return res.json();
  },
};
