import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSessionStore } from '../store/useSessionStore';
import { useRealtimeTranscription } from '../hooks/useRealtimeTranscription';
import {
  SessionModal,
  TranscriptPane,
  AnalysisPane,
  AssistantPane,
  SuggestionsPane,
} from '../components/features';

export default function HomePage() {
  const [showSessionModal, setShowSessionModal] = useState(false);
  const { currentSession, setCurrentSession, transcriptMessages } = useSessionStore();
  const {
    isRecording,
    status,
    startTranscription,
    stopTranscription,
    toggleSpeaker,
  } = useRealtimeTranscription();

  const handleStartSession = (sessionData) => {
    const session = {
      ...sessionData,
      startTime: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setCurrentSession(session);
    setShowSessionModal(false);
    
    // Auto-start transcription after a short delay
    setTimeout(() => {
      startTranscription().catch(console.error);
    }, 500);
  };

  const handleStop = () => {
    stopTranscription();
  };

  return (
    <div className="h-full w-full overflow-hidden relative flex flex-col">
      {/* Session Modal */}
      {showSessionModal && (
        <SessionModal
          onClose={() => setShowSessionModal(false)}
          onStart={handleStartSession}
        />
      )}

      {/* Modern Layout Container - Like Notion workspace */}
      <div className="flex-1 min-h-0 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full h-full flex flex-col overflow-hidden">
        {/* Quick Start Banner - Modern design */}
        {!currentSession && (
          <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-200/50 flex-shrink-0 backdrop-blur-sm glass">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              <strong className="font-semibold text-indigo-600 dark:text-indigo-400">New to Coach Copilot?</strong>{' '}
              Click <Link to="/help" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                📖 Help & Documentation
              </Link> for complete instructions on how to use the app.
            </p>
          </div>
        )}

        {/* Main Grid - Modern spacing like Linear */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 overflow-hidden">
          {/* Transcript Pane - Takes 7 columns on large screens */}
          <div className="lg:col-span-7 min-h-0 flex flex-col overflow-hidden">
            <TranscriptPane
              isRecording={isRecording}
              status={status}
              onStart={() => {
                if (!currentSession) {
                  setShowSessionModal(true);
                } else {
                  startTranscription().catch(console.error);
                }
              }}
              onStop={handleStop}
              onToggleSpeaker={toggleSpeaker}
            />
          </div>

          {/* Right Column - Suggestions, Analysis, Assistant - 5 columns */}
          <div className="lg:col-span-5 space-y-6 min-h-0 flex flex-col overflow-hidden">
            <div className="flex-1 min-h-0 overflow-hidden">
              <SuggestionsPane />
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <AnalysisPane />
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <AssistantPane />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
