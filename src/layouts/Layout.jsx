import { Link, useLocation } from 'react-router-dom';
import { useSessionStore } from '../store/useSessionStore';
import { BookOpen, HelpCircle } from 'lucide-react';

export default function Layout({ children }) {
  const location = useLocation();
  const { currentSession, transcriptMessages } = useSessionStore();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2">
                <div className="text-xs uppercase tracking-wider text-text-secondary">Coach Copilot</div>
                <div className="text-lg font-semibold text-text">
                  {currentSession?.name || 'No active session'}
                </div>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-2">
              <Link
                to="/help"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/help'
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:bg-gray-100'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                Help
              </Link>
              <Link
                to="/sessions"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/sessions'
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:bg-gray-100'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Sessions
              </Link>
            </nav>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {currentSession && (
                <>
                  <button
                    className="btn btn--small"
                    disabled={!currentSession || transcriptMessages.length === 0}
                    title="Save to Google Drive"
                  >
                    📄 Drive
                  </button>
                  <button className="btn btn--small" disabled={!currentSession} title="Export session">
                    💾 Export
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
