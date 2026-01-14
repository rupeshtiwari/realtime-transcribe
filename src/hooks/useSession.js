import { useState, useEffect } from 'react';

export function useSession() {
  const [currentSession, setCurrentSession] = useState(null);

  useEffect(() => {
    // Load current session from localStorage
    const saved = localStorage.getItem('currentSession');
    if (saved) {
      try {
        setCurrentSession(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading session:', e);
      }
    }
  }, []);

  const startSession = (sessionData) => {
    const session = {
      ...sessionData,
      startTime: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setCurrentSession(session);
    localStorage.setItem('currentSession', JSON.stringify(session));
    localStorage.setItem(`session_${session.startTime}`, JSON.stringify(session));
    
    // Update sessions list
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    sessions.unshift({
      id: session.startTime,
      name: session.name,
      candidateName: session.candidateName || '',
      role: session.role || '',
      coachingType: session.coachingType || '',
      startTime: session.startTime,
      updatedAt: session.createdAt,
    });
    localStorage.setItem('sessions', JSON.stringify(sessions.slice(0, 50)));
  };

  const stopSession = () => {
    if (currentSession) {
      saveSession();
    }
    setCurrentSession(null);
  };

  const saveSession = () => {
    if (!currentSession) return;
    
    const sessionData = {
      ...currentSession,
      updatedAt: new Date().toISOString(),
    };
    
    localStorage.setItem('currentSession', JSON.stringify(sessionData));
    localStorage.setItem(`session_${currentSession.startTime}`, JSON.stringify(sessionData));
  };

  return {
    currentSession,
    startSession,
    stopSession,
    saveSession,
  };
}
