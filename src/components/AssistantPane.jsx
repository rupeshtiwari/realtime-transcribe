import React, { useState } from 'react';

function AssistantPane({ currentSession, transcriptMessages }) {
  const [messages, setMessages] = useState([
    {
      id: 'system_welcome',
      text: 'Ask me anything about the conversation, candidate, or coaching strategies. I work offline too!',
      role: 'system',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: `user_${Date.now()}`,
      text: input.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // TODO: Call assistant API
    const loadingMessage = {
      id: `loading_${Date.now()}`,
      text: 'Thinking...',
      role: 'assistant',
      timestamp: new Date(),
      loading: true,
    };

    setMessages((prev) => [...prev, loadingMessage]);

    // Simulate API call
    setTimeout(() => {
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.loading);
        return [
          ...filtered,
          {
            id: `assistant_${Date.now()}`,
            text: 'This is a placeholder response. Assistant API integration coming soon!',
            role: 'assistant',
            timestamp: new Date(),
          },
        ];
      });
    }, 1000);
  };

  return (
    <section className="pane pane--assistant">
      <h2 className="pane__title">🤖 Coach Assistant</h2>
      <div className="assistant-chat">
        <div className="assistant-chat__messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`assistant-message assistant-message--${msg.role}`}>
              <div className="assistant-message__bubble">{msg.text}</div>
            </div>
          ))}
        </div>
        <div className="assistant-chat__input">
          <input
            type="text"
            className="assistant-chat__input-field"
            placeholder="Ask a question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button className="assistant-chat__send-btn" disabled={!input.trim()} onClick={handleSend}>
            Send
          </button>
        </div>
      </div>
    </section>
  );
}

export default AssistantPane;
