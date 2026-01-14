import { useEffect, useRef } from 'react';
import { useSessionStore } from '../store/useSessionStore';
import { Mic, MicOff, Play, Square } from 'lucide-react';
import { clsx } from 'clsx';

export default function TranscriptPane({
  isRecording,
  status,
  onStart,
  onStop,
  onToggleSpeaker,
}) {
  const chatRef = useRef(null);
  const { transcriptMessages, currentSpeaker } = useSessionStore();

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [transcriptMessages]);

  const escapeHtml = (text) => {
    if (typeof text !== 'string') return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  return (
    <div className="pane">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="pane__title">Live Transcript</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSpeaker}
            className={clsx(
              'btn btn--small flex items-center gap-1.5',
              currentSpeaker === 'coach' && 'bg-green-100 border-green-300'
            )}
            title="Click when you (coach) are speaking"
          >
            {currentSpeaker === 'coach' ? (
              <>
                <MicOff className="w-4 h-4" />
                I'm Speaking
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                I'm Speaking
              </>
            )}
          </button>
        </div>
      </div>

      {/* Transcript Chat */}
      <div
        ref={chatRef}
        className="flex-1 overflow-y-auto min-h-[400px] max-h-[600px] space-y-3 p-4 bg-gray-50 rounded-lg"
      >
        {transcriptMessages.length === 0 ? (
          <div className="text-center text-text-secondary py-12">
            Transcript will appear here as audio is captured...
          </div>
        ) : (
          transcriptMessages.map((msg) => {
            const speakerName = msg.speaker === 'coach' ? 'Coach' : 'Client';
            const speakerInitial = speakerName.charAt(0).toUpperCase();
            const timeStr = msg.timestamp.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            });
            const isCoach = msg.speaker === 'coach';

            return (
              <div
                key={msg.id}
                className={clsx(
                  'flex gap-3',
                  isCoach ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                {/* Avatar */}
                <div
                  className={clsx(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0',
                    isCoach
                      ? 'bg-green-500 text-white'
                      : 'bg-blue-500 text-white'
                  )}
                >
                  {speakerInitial}
                </div>

                {/* Message Content */}
                <div className={clsx('flex flex-col', isCoach ? 'items-end' : 'items-start')}>
                  <div
                    className={clsx(
                      'px-4 py-2 rounded-2xl max-w-[80%]',
                      isCoach
                        ? 'bg-green-100 text-green-900'
                        : 'bg-white border border-border text-text'
                    )}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {escapeHtml(msg.text)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-text-secondary">
                    <span>{speakerName}</span>
                    <span>•</span>
                    <span>{timeStr}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Status & Controls */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <div
            className={clsx(
              'w-2 h-2 rounded-full',
              status.isActive ? 'bg-green-500' : 'bg-gray-400'
            )}
          />
          <span>{status.text}</span>
        </div>

        <div className="flex items-center gap-2">
          {!isRecording ? (
            <button onClick={onStart} className="btn btn--primary flex items-center gap-2">
              <Play className="w-4 h-4" />
              Start Session
            </button>
          ) : (
            <button onClick={onStop} className="btn btn--danger flex items-center gap-2">
              <Square className="w-4 h-4" />
              End Session
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
