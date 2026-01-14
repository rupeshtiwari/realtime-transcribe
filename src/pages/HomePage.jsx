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
    <div className="h-[calc(100vh-4rem)] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 h-full flex flex-col">
        {/* Quick Start Banner */}
        <div className="mb-3 p-2 bg-primary/10 border-l-4 border-primary rounded-lg flex-shrink-0">
          <p className="text-xs text-text">
            <strong>Quick Start:</strong> Click "Start Session" → Fill form → Share tab audio → Start coaching!{' '}
            <a href="/help" className="text-primary underline">
              📖 Full Help Guide
            </a>
          </p>
        </div>

        {/* Main Grid - Full height */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
          {/* Transcript Pane - Takes 2 columns on large screens */}
          <div className="lg:col-span-2 min-h-0 flex flex-col">
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

          {/* Right Column - Suggestions, Analysis, Assistant */}
          <div className="space-y-4 min-h-0 flex flex-col">
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

        {/* Session Modal */}
        {showSessionModal && (
          <SessionModal
            onClose={() => setShowSessionModal(false)}
            onStart={handleStartSession}
          />
        )}
      </div>
    </div>
  );
}
