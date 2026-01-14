import React from 'react';

function Header({ sessionInfo, onStart, onStop, isRecording, currentSession, transcriptMessages }) {
  const handleExport = () => {
    if (!currentSession) return;
    // Export logic
    console.log('Export session');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        // Import logic
        console.log('Import session');
      }
    };
    input.click();
  };

  const handleSaveToDrive = async () => {
    if (!currentSession || transcriptMessages.length === 0) {
      alert('No session or transcript to save');
      return;
    }
    // Google Drive save logic
    console.log('Save to Drive');
  };

  return (
    <header className="header">
      <div className="header__title">
        <div className="header__kicker">Coach Copilot</div>
        <div className="header__headline">
          <span>{sessionInfo}</span>
        </div>
      </div>
      <nav className="header__nav">
        <a href="/help.html" className="header__nav-link">
          📖 Help
        </a>
        <a href="/sessions.html" className="header__nav-link">
          📚 Sessions
        </a>
      </nav>
      <div className="header__actions">
        <button
          className="btn btn--small"
          disabled={!currentSession || transcriptMessages.length === 0}
          onClick={handleSaveToDrive}
        >
          📄 Save to Drive
        </button>
        <button className="btn btn--small" disabled={!currentSession} onClick={handleExport}>
          💾 Export
        </button>
        <button className="btn btn--small" onClick={handleImport}>
          📥 Import
        </button>
        <button className="btn btn--primary" onClick={onStart} disabled={isRecording}>
          Start Session
        </button>
        <button className="btn" onClick={onStop} disabled={!isRecording}>
          End Session
        </button>
      </div>
    </header>
  );
}

export default Header;
