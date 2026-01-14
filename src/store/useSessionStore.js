import { create } from 'zustand';

// Helper function to format analysis results (must be defined before use)
function formatAnalysisResult(type, result) {
  if (typeof result === 'string') return result;
  if (Array.isArray(result)) {
    return result.map((item, idx) => `<div>${idx + 1}. ${escapeHtml(String(item))}</div>`).join('');
  }
  return JSON.stringify(result, null, 2);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// TEMPORARILY DISABLE PERSIST TO FIX CRASH
// Clear corrupted localStorage first (only in browser)
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    window.localStorage.removeItem('coach-copilot-session');
    window.localStorage.removeItem('coach-copilot-materials');
  } catch (e) {
    // Ignore
  }
}

// Create store WITHOUT persist to avoid Object.values() crash
export const useSessionStore = create((set, get) => ({
  // Current session
  currentSession: null,
  
  // Transcript messages (WhatsApp-style)
  transcriptMessages: [],
  
  // Analysis notebook
  analysisNotebook: [],
  
  // Assistant messages
  assistantMessages: [
    {
      id: 'system_welcome',
      text: 'Ask me anything about the conversation, candidate, or coaching strategies. I work offline too!',
      role: 'system',
      timestamp: new Date(),
    },
  ],
  
  // Current speaker
  currentSpeaker: 'client', // 'coach' | 'client'
  
  // Actions
  setCurrentSession: (session) => set({ currentSession: session }),
  
  addTranscriptMessage: (text, speaker) => {
    try {
      const message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: String(text || '').trim(),
        speaker: speaker || get().currentSpeaker || 'client',
        timestamp: new Date(),
      };
      set((state) => {
        const currentMessages = Array.isArray(state?.transcriptMessages) 
          ? state.transcriptMessages 
          : [];
        return {
          transcriptMessages: [...currentMessages, message],
        };
      });
    } catch (error) {
      console.error('Error adding transcript message:', error, { text, speaker });
    }
  },
  
  clearTranscript: () => set({ transcriptMessages: [] }),
  
  setCurrentSpeaker: (speaker) => set({ currentSpeaker: speaker }),
  
  addAnalysisResult: (type, result) => {
    const entry = {
      type,
      result,
      timestamp: new Date().toLocaleTimeString(),
      content: formatAnalysisResult(type, result),
    };
    set((state) => ({
      analysisNotebook: [...(state.analysisNotebook || []), entry],
    }));
  },
  
  addAssistantMessage: (text, role = 'assistant') => {
    const message = {
      id: `assistant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: String(text || '').trim(),
      role,
      timestamp: new Date(),
    };
    set((state) => ({
      assistantMessages: [...(state.assistantMessages || []), message],
    }));
  },
  
  clearAssistantMessages: () => set({
    assistantMessages: [{
      id: 'system_welcome',
      text: 'Ask me anything about the conversation, candidate, or coaching strategies. I work offline too!',
      role: 'system',
      timestamp: new Date(),
    }],
  }),
}));
