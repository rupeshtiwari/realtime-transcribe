import { Link, useLocation } from 'react-router-dom';
import { useSessionStore } from '../store/useSessionStore';
import { BookOpen, HelpCircle, FolderOpen } from 'lucide-react';
import { useThemeMode } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import { Box } from '@mui/material';

export default function Layout({ children }) {
  const location = useLocation();
  const { currentSession, transcriptMessages } = useSessionStore();
  const { actualMode } = useThemeMode();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary',
      }}
    >
      {/* Header */}
      <Box
        component="header"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          boxShadow: 1,
        }}
      >
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
              <Link
                to="/materials"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/materials'
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:bg-gray-100'
                }`}
              >
                <FolderOpen className="w-4 h-4" />
                Materials
              </Link>
            </nav>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
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
      </Box>

      {/* Main Content - Fixed height to prevent page scroll */}
      <Box
        component="main"
        sx={{
          height: 'calc(100vh - 4rem)',
          overflow: 'hidden',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
