import React from 'react';

function AnalysisPane({ currentSession, transcriptMessages }) {
  const hasTranscript = transcriptMessages.length > 0;

  return (
    <section className="pane pane--analysis">
      <h2 className="pane__title">Coach Analysis (Works Offline)</h2>
      <div className="analysis-buttons">
        <button className="btn btn--analysis" disabled={!hasTranscript}>
          Follow-up Questions
        </button>
        <button className="btn btn--analysis" disabled={!hasTranscript}>
          Revised Story
        </button>
        <button className="btn btn--analysis" disabled={!hasTranscript}>
          Feedback Summary
        </button>
        <button className="btn btn--analysis" disabled={!hasTranscript}>
          Interview Prep
        </button>
        <button className="btn btn--analysis" disabled={!hasTranscript}>
          Full Analysis
        </button>
      </div>
      <div id="analysisResults" className="analysis-results">
        <div className="analysis-results__placeholder">
          Select an analysis option above. All options work offline (after disconnect) as long as you have transcript
          text.
        </div>
      </div>
    </section>
  );
}

export default AnalysisPane;
