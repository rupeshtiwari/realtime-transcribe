import React, { useEffect, useRef } from 'react';

function TranscriptPane({ transcriptMessages, isRecording, status, currentSpeaker, onToggleSpeaker, onGetSuggestions }) {
  const chatRef = useRef(null);

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
    <section className="pane pane--transcript">
      <div className="pane__header">
        <h2 className="pane__title">Live Transcript</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn--small" onClick={onToggleSpeaker} title="Click when you (coach) are speaking">
            {currentSpeaker === 'coach' ? '✅ I\'m Speaking' : '🎤 I\'m Speaking'}
          </button>
          <button className="btn btn--small" disabled={transcriptMessages.length === 0} onClick={onGetSuggestions}>
            Get Suggestions
          </button>
        </div>
      </div>
      <div ref={chatRef} id="transcriptChat" className="transcript-chat">
        {transcriptMessages.length === 0 ? (
          <div className="transcript-chat__placeholder">Transcript will appear here as audio is captured...</div>
        ) : (
          transcriptMessages.map((msg) => {
            const speakerName = msg.speaker === 'coach' ? 'Coach' : 'Client';
            const speakerInitial = speakerName.charAt(0).toUpperCase();
            const timeStr = msg.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={msg.id} className={`transcript-message transcript-message--${msg.speaker}`}>
                <div className="transcript-message__avatar">{speakerInitial}</div>
                <div className="transcript-message__content">
                  <div className="transcript-message__bubble">{escapeHtml(msg.text)}</div>
                  <div className="transcript-message__meta">
                    <span className="transcript-message__speaker">{escapeHtml(speakerName)}</span>
                    <span className="transcript-message__time">{timeStr}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="status">
        <span className={`status__dot ${status.isActive ? 'status__dot--active' : ''}`}></span>
        <span>{status.text}</span>
      </div>
    </section>
  );
}

export default TranscriptPane;
