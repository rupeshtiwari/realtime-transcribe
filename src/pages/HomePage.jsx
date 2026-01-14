import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSessionStore } from '../store/useSessionStore';
import { useRealtimeTranscription } from '../hooks/useRealtimeTranscription';
import { 
  TranscriptPane, 
  SuggestionsPane, 
  AnalysisPane, 
  AssistantPane,
  SessionModal 
} from '../components/features';
import { Play, BookOpen } from 'lucide-react';

export default function HomePage() {
  const { currentSession, setCurrentSession, clearTranscript } = useSessionStore();
  const [showSessionModal, setShowSessionModal] = useState(false);
  
  const {
    isRecording,
    status,
    error,
    startTranscription,
    stopTranscription,
    toggleSpeaker,
  } = useRealtimeTranscription();

  const handleStartSession = (sessionData) => {
    setCurrentSession({
      ...sessionData,
      startTime: new Date().toISOString(),
    });
    setShowSessionModal(false);
    clearTranscript();
  };

  const handleStartRecording = async () => {
    if (!currentSession) {
      setShowSessionModal(true);
      return;
    }
    await startTranscription();
  };

  const handleStopRecording = () => {
    stopTranscription();
  };

  // If no session, show start button
  if (!currentSession) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">Start a Coaching Session</h2>
          <p className="text-text-secondary">Click below to begin a new coaching session</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setShowSessionModal(true)}
              className="btn btn--primary flex items-center gap-2"
            >
              <Play className="w-5 h-5" />
              Start New Session
            </button>
            <Link
              to="/sessions"
              className="btn flex items-center gap-2"
            >
              <BookOpen className="w-5 h-5" />
              View Old Sessions
            </Link>
          </div>
        </div>
        
        {showSessionModal && (
          <SessionModal
            onClose={() => setShowSessionModal(false)}
            onStart={handleStartSession}
          />
        )}
      </div>
    );
  }

  // Session active - show full layout
  return (
    <div className="h-full w-full overflow-hidden relative flex flex-col">
      {/* Session Layout - 3 Column Grid */}
      <div className="flex-1 min-h-0 px-4 sm:px-6 lg:px-8 py-6 w-full h-full grid grid-cols-3 gap-6 overflow-hidden">
        {/* Left Column - Transcript */}
        <div className="min-h-0 flex flex-col overflow-hidden">
          <TranscriptPane
            isRecording={isRecording}
            status={status}
            onStart={handleStartRecording}
            onStop={handleStopRecording}
            onToggleSpeaker={toggleSpeaker}
          />
        </div>

        {/* Middle Column - Suggestions & Analysis */}
        <div className="min-h-0 flex flex-col gap-6 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-hidden">
            <SuggestionsPane />
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <AnalysisPane />
          </div>
        </div>

        {/* Right Column - Assistant Chat */}
        <div className="min-h-0 flex flex-col overflow-hidden">
          <AssistantPane />
        </div>
      </div>

      {showSessionModal && (
        <SessionModal
          onClose={() => setShowSessionModal(false)}
          onStart={handleStartSession}
        />
      )}
    </div>
  );
}
