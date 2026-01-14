// Session storage utilities

export const sessionStorage = {
  // Save session to localStorage
  saveSession: (sessionData) => {
    try {
      const sessionId = sessionData.startTime || Date.now().toString();
      localStorage.setItem(`session_${sessionId}`, JSON.stringify(sessionData));
      localStorage.setItem('currentSession', JSON.stringify(sessionData));

      // Update sessions list
      const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
      const existingIndex = sessions.findIndex((s) => s.id === sessionId);
      const sessionMeta = {
        id: sessionId,
        name: sessionData.name,
        candidateName: sessionData.candidateName,
        role: sessionData.role,
        coachingType: sessionData.coachingType,
        startTime: sessionData.startTime,
        updatedAt: sessionData.updatedAt || new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        sessions[existingIndex] = sessionMeta;
      } else {
        sessions.unshift(sessionMeta);
      }

      localStorage.setItem('sessions', JSON.stringify(sessions.slice(0, 50)));
      return sessionId;
    } catch (e) {
      console.warn('Could not save session:', e);
      return null;
    }
  },

  // Load session from localStorage
  loadSession: (sessionId) => {
    try {
      const sessionStr = localStorage.getItem(`session_${sessionId}`);
      return sessionStr ? JSON.parse(sessionStr) : null;
    } catch (e) {
      console.error('Error loading session:', e);
      return null;
    }
  },

  // Get all sessions
  getAllSessions: () => {
    try {
      return JSON.parse(localStorage.getItem('sessions') || '[]');
    } catch (e) {
      console.error('Error loading sessions:', e);
      return [];
    }
  },

  // Delete session
  deleteSession: (sessionId) => {
    try {
      localStorage.removeItem(`session_${sessionId}`);
      const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
      const filtered = sessions.filter((s) => s.id !== sessionId);
      localStorage.setItem('sessions', JSON.stringify(filtered));
      return true;
    } catch (e) {
      console.error('Error deleting session:', e);
      return false;
    }
  },

  // Export session as JSON
  exportSession: (sessionData) => {
    const jsonStr = JSON.stringify(sessionData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coaching-session-${(sessionData.name || 'untitled').replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
