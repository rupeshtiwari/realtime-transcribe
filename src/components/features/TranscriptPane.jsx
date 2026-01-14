import { useEffect, useRef, useMemo, useState } from 'react';
import { useSessionStore } from '../../store/useSessionStore';
import { Mic, MicOff, Play, Square } from 'lucide-react';
import { clsx } from 'clsx';
import { List } from 'react-window';

export default function TranscriptPane({
  isRecording,
  status,
  onStart,
  onStop,
  onToggleSpeaker,
}) {
  const listRef = useRef(null);
  
  // Defensive store access with try-catch
  let transcriptMessages = [];
  let currentSpeaker = 'client';
  try {
    const store = useSessionStore();
    transcriptMessages = Array.isArray(store?.transcriptMessages) 
      ? store.transcriptMessages 
      : [];
    currentSpeaker = store?.currentSpeaker || 'client';
  } catch (error) {
    console.error('Error accessing session store:', error);
    // Use defaults if store access fails
    transcriptMessages = [];
    currentSpeaker = 'client';
  }
  
  const shouldAutoScroll = useRef(true);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (shouldAutoScroll.current && listRef.current && transcriptMessages.length > 0) {
      // react-window v2 API: scrollToRow with config object
      if (listRef.current.scrollToRow) {
        listRef.current.scrollToRow({ 
          index: transcriptMessages.length - 1, 
          align: 'end' 
        });
      }
    }
  }, [transcriptMessages.length]);

  // Handle scroll events to detect user scrolling up
  const handleScroll = useMemo(() => {
    return ({ scrollOffset, scrollUpdateWasRequested }) => {
      if (!scrollUpdateWasRequested) {
        // User is manually scrolling
        const list = listRef.current;
        if (list) {
          const maxScroll = list.props.height - scrollOffset;
          const isNearBottom = scrollOffset >= maxScroll - 100; // 100px threshold
          shouldAutoScroll.current = isNearBottom;
        }
      }
    };
  }, []);

  const escapeHtml = (text) => {
    if (typeof text !== 'string') return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };


  // Calculate list height dynamically based on container
  const containerRef = useRef(null);
  const [listHeight, setListHeight] = useState(500);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Subtract header (60px) and controls (80px) and padding
        setListHeight(rect.height - 140);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  return (
    <div ref={containerRef} className="pane flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
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

      {/* Transcript List - Virtualized for performance, no scrollbar */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        {transcriptMessages.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-center text-text-secondary">
            <div>
              <p className="text-lg mb-2">📝</p>
              <p>Transcript will appear here as audio is captured...</p>
            </div>
          </div>
        ) : (
          <div className="h-full bg-gray-50 dark:bg-slate-800/50 rounded-xl overflow-hidden scrollbar-hide">
            {Array.isArray(transcriptMessages) && transcriptMessages.length > 0 ? (
              <List
                ref={listRef}
                height={Math.max(listHeight, 300)}
                itemCount={transcriptMessages.length}
                itemSize={120}
                width="100%"
                onScroll={handleScroll}
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
                className="scrollbar-hide"
              >
                {({ index, style }) => {
                  // Defensive: ensure transcriptMessages is valid
                  if (!Array.isArray(transcriptMessages) || index < 0 || index >= transcriptMessages.length) {
                    return null;
                  }
                  
                  const msg = transcriptMessages[index];
                  if (!msg || typeof msg !== 'object' || msg === null) {
                    return null;
                  }

                  const speakerName = msg.speaker === 'coach' ? 'Coach' : 'Client';
                  const speakerInitial = speakerName.charAt(0).toUpperCase();
                  let timeStr = '';
                  try {
                    const timestamp = msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp);
                    timeStr = timestamp.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                  } catch (e) {
                    timeStr = new Date().toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                  }
                  const isCoach = msg.speaker === 'coach';
                  
                  const textLength = String(msg.text || '').length;
                  const estimatedLines = Math.max(1, Math.ceil(textLength / 50));
                  const minHeight = 80 + (estimatedLines - 1) * 24;

                  const validStyle = style && typeof style === 'object' ? style : {};

                  return (
                    <div style={{ ...validStyle, minHeight: `${minHeight}px` }} className="px-4 py-2">
                      <div className={clsx('flex gap-3', isCoach ? 'flex-row-reverse' : 'flex-row')}>
                        <div
                          className={clsx(
                            'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0',
                            isCoach ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                          )}
                        >
                          {speakerInitial}
                        </div>
                        <div className={clsx('flex flex-col flex-1', isCoach ? 'items-end' : 'items-start')}>
                          <div
                            className={clsx(
                              'px-4 py-2 rounded-2xl max-w-[80%] break-words',
                              isCoach
                                ? 'bg-green-100 text-green-900'
                                : 'bg-white border border-border text-text'
                            )}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {escapeHtml(String(msg.text || ''))}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-text-secondary">
                            <span>{speakerName}</span>
                            <span>•</span>
                            <span>{timeStr}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }}
              </List>
            ) : (
              <div className="h-full flex items-center justify-center text-text-secondary">
                <p>No messages yet</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status & Controls */}
      <div className="mt-4 flex items-center justify-between flex-shrink-0 pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <div
            className={clsx(
              'w-2 h-2 rounded-full animate-pulse',
              status.isActive ? 'bg-green-500' : 'bg-gray-400'
            )}
          />
          <span>{status.text}</span>
          {transcriptMessages.length > 0 && (
            <span className="text-xs">• {transcriptMessages.length} messages</span>
          )}
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
