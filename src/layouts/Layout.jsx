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
        height: '100vh',
        width: '100vw',
        bgcolor: 'background.default',
        color: 'text.primary',
        position: 'fixed',
        top: 0,
        left: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Modern gradient background overlay */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
            : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      {/* Header - Modern glassmorphism like Notion */}
      <Box
        component="header"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: theme.palette.mode === 'dark'
            ? 'rgba(30, 41, 59, 0.85)'
            : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          flexShrink: 0,
        }}
      >
        <Box sx={{ maxWidth: '1600px', mx: 'auto', px: { xs: 3, sm: 4, lg: 6 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
            {/* Logo & Title - Modern typography */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Link
                to="/"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  textDecoration: 'none',
                }}
              >
                <Box
                  sx={{
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontWeight: 700,
                    color: 'primary.main',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Coach Copilot
                </Box>
                <Box
                  sx={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: 'text.primary',
                    letterSpacing: '-0.025em',
                  }}
                >
                  {currentSession?.name || 'No active session'}
                </Box>
              </Link>
            </Box>

            {/* Navigation - Modern pill buttons like Linear */}
            <Box component="nav" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {[
                { path: '/help', icon: HelpCircle, label: 'Help' },
                { path: '/sessions', icon: BookOpen, label: 'Sessions' },
                { path: '/materials', icon: FolderOpen, label: 'Materials' },
              ].map(({ path, icon: Icon, label }) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 16px',
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      textDecoration: 'none',
                      color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                      background: isActive
                        ? theme.palette.mode === 'dark'
                          ? 'rgba(129, 140, 248, 0.2)'
                          : 'rgba(99, 102, 241, 0.1)'
                        : 'transparent',
                      transition: 'all 0.2s ease',
                      border: isActive ? `1px solid ${theme.palette.primary.main}40` : '1px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background =
                          theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <Icon size={18} />
                    {label}
                  </Link>
                );
              })}
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <ThemeToggle />
              {currentSession && (
                <>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={!currentSession || transcriptMessages.length === 0}
                    title="Save to Google Drive"
                    sx={{
                      minWidth: 'auto',
                      px: 2,
                      borderRadius: '10px',
                      borderColor: 'divider',
                      textTransform: 'none',
                      fontWeight: 500,
                    }}
                  >
                    📄 Drive
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={!currentSession}
                    title="Export session"
                    sx={{
                      minWidth: 'auto',
                      px: 2,
                      borderRadius: '10px',
                      borderColor: 'divider',
                      textTransform: 'none',
                      fontWeight: 500,
                    }}
                  >
                    💾 Export
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Main Content - Fixed height, absolutely no scrollbars */}
      <Box
        component="main"
        sx={{
          flex: 1,
          height: 'calc(100vh - 72px)',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
