import { useState } from 'react';
import { useSessionStore } from '../store/useSessionStore';
import { api } from '../services/api';
import { FileText, Loader2 } from 'lucide-react';

const ANALYSIS_TYPES = [
  { id: 'followup', label: 'Follow-up Questions', endpoint: 'followup' },
  { id: 'revised-story', label: 'Revised Story', endpoint: 'revised-story' },
  { id: 'feedback-summary', label: 'Feedback Summary', endpoint: 'feedback-summary' },
  { id: 'interview-prep', label: 'Interview Prep', endpoint: 'interview-prep' },
  { id: 'full', label: 'Full Analysis', endpoint: 'full' },
];

export default function AnalysisPane() {
  const { transcriptMessages, analysisNotebook, addAnalysisResult } = useSessionStore();
  const [loading, setLoading] = useState(null);

  const getTranscriptText = () => {
    return transcriptMessages
      .map((msg) => {
        const speaker = msg.speaker === 'coach' ? 'Coach' : 'Client';
        return `${speaker}: ${msg.text}`;
      })
      .join('\n');
  };

  const handleAnalysis = async (type) => {
    const transcript = getTranscriptText().trim();
    if (!transcript) {
      alert('Please add transcript text first');
      return;
    }

    setLoading(type.id);
    try {
      const data = await api.analyze(type.endpoint, transcript);
      addAnalysisResult(type.label, data.result);
    } catch (err) {
      console.error('Analysis error:', err);
      alert(`Error generating ${type.label}: ${err.message}`);
    } finally {
      setLoading(null);
    }
  };

  const hasTranscript = transcriptMessages.length > 0;

  return (
    <div className="pane">
      <h2 className="pane__title flex items-center gap-2 mb-4">
        <FileText className="w-4 h-4" />
        Coach Analysis
        <span className="text-xs font-normal text-text-secondary">(Works Offline)</span>
      </h2>

      {/* Analysis Buttons */}
      <div className="grid grid-cols-1 gap-2 mb-4">
        {ANALYSIS_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => handleAnalysis(type)}
            disabled={!hasTranscript || loading === type.id}
            className="btn text-left flex items-center justify-between"
          >
            <span>{type.label}</span>
            {loading === type.id && <Loader2 className="w-4 h-4 animate-spin" />}
          </button>
        ))}
      </div>

      {/* Analysis Results */}
      <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[400px]">
        {analysisNotebook.length === 0 ? (
          <div className="text-center text-text-secondary py-8 text-sm">
            Select an analysis option above. All results will be saved here.
          </div>
        ) : (
          <div className="space-y-4">
            {analysisNotebook.slice().reverse().map((entry, idx) => (
              <div key={idx} className="card">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">{entry.type}</h3>
                  <span className="text-xs text-text-secondary">{entry.timestamp}</span>
                </div>
                <div className="text-sm text-text whitespace-pre-wrap">
                  {typeof entry.result === 'string' ? (
                    entry.result
                  ) : Array.isArray(entry.result) ? (
                    <ul className="list-disc list-inside space-y-1">
                      {entry.result.map((item, i) => (
                        <li key={i}>{String(item)}</li>
                      ))}
                    </ul>
                  ) : (
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(entry.result, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
