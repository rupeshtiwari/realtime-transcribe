import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useSessionStore = create(
  persist(
    (set, get) => ({
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
        const message = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          text: text.trim(),
          speaker: speaker || get().currentSpeaker,
          timestamp: new Date(),
        };
        set((state) => ({
          transcriptMessages: [...state.transcriptMessages, message],
        }));
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
          analysisNotebook: [...state.analysisNotebook, entry],
        }));
      },
      
      addAssistantMessage: (text, role = 'assistant') => {
        const message = {
          id: `assistant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          text: text.trim(),
          role,
          timestamp: new Date(),
        };
        set((state) => ({
          assistantMessages: [...state.assistantMessages, message],
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
    }),
    {
      name: 'coach-copilot-session',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentSession: state.currentSession,
        transcriptMessages: state.transcriptMessages,
        analysisNotebook: state.analysisNotebook,
        assistantMessages: state.assistantMessages,
      }),
    }
  )
);

// Helper function to format analysis results
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
