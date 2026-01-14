import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SessionModal from './components/SessionModal';
import TranscriptPane from './components/TranscriptPane';
import AnalysisPane from './components/AnalysisPane';
import AssistantPane from './components/AssistantPane';
import { useRealtimeTranscription } from './hooks/useRealtimeTranscription';
import { useSession } from './hooks/useSession';

function App() {
  const [showSessionModal, setShowSessionModal] = useState(false);
  const { currentSession, startSession, stopSession, saveSession } = useSession();
  const {
    isRecording,
    transcriptMessages,
    status,
    startTranscription,
    stopTranscription,
    toggleSpeaker,
    currentSpeaker,
  } = useRealtimeTranscription();

  // Load session on mount if requested
  useEffect(() => {
    const loadSessionId = localStorage.getItem('loadSessionId');
    if (loadSessionId) {
      localStorage.removeItem('loadSessionId');
      // Load session logic here
    }
  }, []);

  const handleStart = () => {
    setShowSessionModal(true);
  };

  const handleStop = () => {
    stopTranscription();
    stopSession();
  };

  return (
    <div className="app">
      <Header
        sessionInfo={currentSession?.name || 'No active session'}
        onStart={handleStart}
        onStop={handleStop}
        isRecording={isRecording}
        currentSession={currentSession}
        transcriptMessages={transcriptMessages}
      />

      <div className="quick-start" style={{ margin: '14px', padding: '12px', background: '#f0f4ff', borderRadius: '8px', borderLeft: '4px solid #2d62ff' }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#0b1220' }}>
          <strong>Quick Start:</strong> Click "Start Session" → Fill form → Share tab audio → Start coaching!{' '}
          <a href="/help.html" style={{ color: '#2d62ff', textDecoration: 'underline', marginLeft: '8px' }}>
            📖 Full Help Guide
          </a>
        </p>
      </div>

      <main className="grid">
        <TranscriptPane
          transcriptMessages={transcriptMessages}
          isRecording={isRecording}
          status={status}
          currentSpeaker={currentSpeaker}
          onToggleSpeaker={toggleSpeaker}
          onGetSuggestions={() => {
            // TODO: Implement suggestions
            console.log('Get suggestions');
          }}
        />

        <AnalysisPane currentSession={currentSession} transcriptMessages={transcriptMessages} />

        <AssistantPane currentSession={currentSession} transcriptMessages={transcriptMessages} />
      </main>

      {showSessionModal && (
        <SessionModal
          onClose={() => setShowSessionModal(false)}
          onStart={(sessionData) => {
            startSession(sessionData);
            setShowSessionModal(false);
            // Start transcription after a short delay
            setTimeout(() => {
              startTranscription();
            }, 500);
          }}
        />
      )}
    </div>
  );
}

export default App;
