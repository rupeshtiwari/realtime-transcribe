import { Link, useLocation } from 'react-router-dom';
import { useSessionStore } from '../store/useSessionStore';
import { BookOpen, HelpCircle, FolderOpen } from 'lucide-react';
import { useThemeMode } from '../context/ThemeContext';
import ThemeToggle from '../components/common/ThemeToggle';
import { Box, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function Layout({ children }) {
  const location = useLocation();
  const { currentSession, transcriptMessages } = useSessionStore();
  const theme = useTheme();

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
        <Box sx={{ maxWidth: '1280px', mx: 'auto', px: { xs: 2, sm: 3, lg: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
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
                  color: location.pathname === '/help' ? theme.palette.primary.main : theme.palette.text.secondary,
                  backgroundColor: location.pathname === '/help' ? theme.palette.primary.main + '1A' : 'transparent',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== '/help') {
                    e.currentTarget.style.backgroundColor = theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';
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
                  color: location.pathname === '/sessions' ? theme.palette.primary.main : theme.palette.text.secondary,
                  backgroundColor: location.pathname === '/sessions' ? theme.palette.primary.main + '1A' : 'transparent',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== '/sessions') {
                    e.currentTarget.style.backgroundColor = theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';
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
                  color: location.pathname === '/materials' ? theme.palette.primary.main : theme.palette.text.secondary,
                  backgroundColor: location.pathname === '/materials' ? theme.palette.primary.main + '1A' : 'transparent',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== '/materials') {
                    e.currentTarget.style.backgroundColor = theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';
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
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={!currentSession || transcriptMessages.length === 0}
                    title="Save to Google Drive"
                    sx={{ minWidth: 'auto', px: 1.5 }}
                  >
                    📄 Drive
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={!currentSession}
                    title="Export session"
                    sx={{ minWidth: 'auto', px: 1.5 }}
                  >
                    💾 Export
                  </Button>
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
          height: 'calc(100vh - 64px)',
          overflow: 'hidden',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
