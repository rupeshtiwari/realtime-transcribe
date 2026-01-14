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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                <Box sx={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  Coach Copilot
                </Box>
                <Box sx={{ fontSize: '1.125rem', fontWeight: 600, color: 'text.primary' }}>
                  {currentSession?.name || 'No active session'}
                </Box>
              </Link>
            </Box>

            {/* Navigation */}
            <Box component="nav" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Link
                to="/help"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  color: location.pathname === '/help' ? 'primary.main' : 'text.secondary',
                  backgroundColor: location.pathname === '/help' ? 'primary.light' : 'transparent',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== '/help') {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== '/help') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <HelpCircle size={16} />
                Help
              </Link>
              <Link
                to="/sessions"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  color: location.pathname === '/sessions' ? 'primary.main' : 'text.secondary',
                  backgroundColor: location.pathname === '/sessions' ? 'primary.light' : 'transparent',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== '/sessions') {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== '/sessions') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <BookOpen size={16} />
                Sessions
              </Link>
              <Link
                to="/materials"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  color: location.pathname === '/materials' ? 'primary.main' : 'text.secondary',
                  backgroundColor: location.pathname === '/materials' ? 'primary.light' : 'transparent',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== '/materials') {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== '/materials') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <FolderOpen size={16} />
                Materials
              </Link>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
            </Box>
          </Box>
        </Box>
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
