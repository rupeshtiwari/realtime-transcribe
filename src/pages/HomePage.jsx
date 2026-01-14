import { useState } from 'react';
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
    <div className="h-full w-full overflow-hidden">
      {/* Session Modal */}
      {showSessionModal && (
        <SessionModal
          onClose={() => setShowSessionModal(false)}
          onStart={handleStartSession}
        />
      )}

      {/* Modern Layout Container */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 h-full flex flex-col">
        {/* Quick Start Banner - Modern design */}
        {!currentSession && (
          <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-200/50 flex-shrink-0 backdrop-blur-sm">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              <strong className="font-semibold text-indigo-600 dark:text-indigo-400">Quick Start:</strong>{' '}
              Click "Start Session" → Fill form → Share tab audio → Start coaching!{' '}
              <a href="/help" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                📖 Full Help Guide
              </a>
            </p>
          </div>
        )}

        {/* Main Grid - Modern spacing */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
          {/* Transcript Pane - Takes 7 columns on large screens */}
          <div className="lg:col-span-7 min-h-0 flex flex-col">
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
          <div className="lg:col-span-5 space-y-6 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0">
              <SuggestionsPane />
            </div>
            <div className="flex-1 min-h-0">
              <AnalysisPane />
            </div>
            <div className="flex-1 min-h-0">
              <AssistantPane />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
