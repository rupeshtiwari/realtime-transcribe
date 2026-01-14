import { useState, useEffect, useRef } from 'react';
import { useSessionStore } from '../../store/useSessionStore';
import { api } from '../../services/api';
import { Bot, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AssistantPane() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { assistantMessages, addAssistantMessage, currentSession, transcriptMessages } = useSessionStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [assistantMessages]);

  const getTranscriptText = () => {
    return transcriptMessages
      .map((msg) => {
        const speaker = msg.speaker === 'coach' ? 'Coach' : 'Client';
        return `${speaker}: ${msg.text}`;
      })
      .join('\n');
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const question = input.trim();
    setInput('');
    addAssistantMessage(question, 'user');

    setLoading(true);
    try {
      const transcript = getTranscriptText();
      const sessionContext = currentSession
        ? `
Session: ${currentSession.name}
Candidate: ${currentSession.candidateName}
Role: ${currentSession.role}
Type: ${currentSession.coachingType}
Agenda: ${currentSession.coachingAgenda || 'N/A'}
`
        : '';

      const context = `${sessionContext}

Current Transcript:
${transcript || 'No transcript yet.'}

Question: ${question}

Please provide a helpful answer based on the conversation context. Be concise and actionable.`;

      const data = await api.askAssistant(question, context, transcript);
      addAssistantMessage(data.answer || "I couldn't generate a response. Please try again.", 'assistant');
    } catch (err) {
      console.error('Assistant error:', err);
      addAssistantMessage(`Error: ${err.message}. You can still ask questions offline using the transcript.`, 'assistant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pane flex flex-col">
      <h2 className="pane__title flex items-center gap-2 mb-4">
        <Bot className="w-4 h-4" />
        Coach Assistant
      </h2>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[300px] space-y-3 mb-4">
        {assistantMessages.map((msg) => {
          const isUser = msg.role === 'user';
          const isSystem = msg.role === 'system';

          return (
            <div
              key={msg.id}
              className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`px-3 py-2 rounded-lg text-sm max-w-[85%] ${
                  isUser
                    ? 'bg-primary text-white'
                    : isSystem
                    ? 'bg-gray-100 text-text-secondary'
                    : 'bg-white border border-border text-text'
                }`}
              >
                {msg.loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask a question..."
          className="flex-1 px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="btn btn--primary flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Send
        </button>
      </div>
    </div>
  );
}
