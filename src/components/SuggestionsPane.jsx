import { useState } from 'react';
import { useSessionStore } from '../store/useSessionStore';
import { api } from '../services/api';
import { Sparkles } from 'lucide-react';

export default function SuggestionsPane() {
  const { transcriptMessages } = useSessionStore();
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);

  const getTranscriptText = () => {
    return transcriptMessages
      .map((msg) => {
        const speaker = msg.speaker === 'coach' ? 'Coach' : 'Client';
        return `${speaker}: ${msg.text}`;
      })
      .join('\n');
  };

  const handleGetSuggestions = async () => {
    const transcript = getTranscriptText().trim();
    if (!transcript) {
      alert('Please add transcript text first');
      return;
    }

    setLoading(true);
    try {
      const data = await api.getSuggestions(transcript);
      setSuggestions(data);
    } catch (err) {
      console.error('Error getting suggestions:', err);
      alert('Failed to get suggestions: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pane">
      <div className="flex items-center justify-between mb-4">
        <h2 className="pane__title flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          AI Suggestions
        </h2>
        <button
          onClick={handleGetSuggestions}
          disabled={transcriptMessages.length === 0 || loading}
          className="btn btn--small"
        >
          {loading ? 'Generating...' : 'Get Suggestions'}
        </button>
      </div>

      {suggestions ? (
        <div className="space-y-3">
          <div>
            <div className="text-xs font-semibold text-text-secondary mb-1">Best Reply</div>
            <div className="p-3 bg-primary/10 rounded-lg text-sm">{suggestions.bestReply || '—'}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-text-secondary mb-1">Alternate 1</div>
            <div className="p-3 bg-gray-50 rounded-lg text-sm">{suggestions.alternate1 || '—'}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-text-secondary mb-1">Alternate 2</div>
            <div className="p-3 bg-gray-50 rounded-lg text-sm">{suggestions.alternate2 || '—'}</div>
          </div>
          {suggestions.nextQuestion && (
            <div>
              <div className="text-xs font-semibold text-text-secondary mb-1">Next Question</div>
              <div className="p-3 bg-blue-50 rounded-lg text-sm">{suggestions.nextQuestion}</div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-text-secondary py-8 text-sm">
          Click "Get Suggestions" to generate AI coaching suggestions based on the transcript.
        </div>
      )}
    </div>
  );
}
