import { useState } from 'react';
import { useSessionStore } from '../store/useSessionStore';
import { useRealtimeTranscription } from '../hooks/useRealtimeTranscription';
import SessionModal from '../components/SessionModal';
import TranscriptPane from '../components/TranscriptPane';
import AnalysisPane from '../components/AnalysisPane';
import AssistantPane from '../components/AssistantPane';
import SuggestionsPane from '../components/SuggestionsPane';

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Quick Start Banner */}
      <div className="mb-4 p-3 bg-primary/10 border-l-4 border-primary rounded-lg">
        <p className="text-sm text-text">
          <strong>Quick Start:</strong> Click "Start Session" → Fill form → Share tab audio → Start coaching!{' '}
          <a href="/help" className="text-primary underline">
            📖 Full Help Guide
          </a>
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Transcript Pane - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
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
        <div className="space-y-4">
          <SuggestionsPane />
          <AnalysisPane />
          <AssistantPane />
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
  );
}
