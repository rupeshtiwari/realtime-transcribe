import { Link, useLocation } from 'react-router-dom';
import { useSessionStore } from '../store/useSessionStore';
import { BookOpen, HelpCircle, FolderOpen } from 'lucide-react';
import ThemeToggle from '../components/common/ThemeToggle';
import { Box, Button } from '@mui/material';
import { useSafeTheme } from '../utils/safeTheme';
import { safeSx } from '../utils/safeSx';

export default function Layout({ children }) {
  const location = useLocation();
  
  // Defensive store access with try-catch
  let currentSession = null;
  let transcriptMessages = [];
  try {
    const store = useSessionStore();
    currentSession = store?.currentSession || null;
    transcriptMessages = Array.isArray(store?.transcriptMessages) ? store.transcriptMessages : [];
  } catch (error) {
    console.error('Error accessing session store in Layout:', error);
    // Use defaults
    currentSession = null;
    transcriptMessages = [];
  }
  
  // Defensive theme access with full validation
  let theme;
  let themeMode = 'light';
  let textPrimary = '#0f172a';
  let textSecondary = '#64748b';
  let primaryMain = '#6366f1';
  let backgroundDefault = '#fafbfc';
  let dividerColor = 'rgba(148, 163, 184, 0.2)';
  
  try {
    theme = useSafeTheme();
    // Deep validation - ensure theme is valid and all properties are objects
    if (theme && typeof theme === 'object' && theme !== null && !Array.isArray(theme)) {
      // Validate palette exists and is a valid object
      if (theme.palette && typeof theme.palette === 'object' && theme.palette !== null && !Array.isArray(theme.palette)) {
        themeMode = theme.palette.mode || 'light';
        
        // Validate text object
        if (theme.palette.text && typeof theme.palette.text === 'object' && theme.palette.text !== null && !Array.isArray(theme.palette.text)) {
          textPrimary = theme.palette.text.primary || '#0f172a';
          textSecondary = theme.palette.text.secondary || '#64748b';
        }
        
        // Validate primary object
        if (theme.palette.primary && typeof theme.palette.primary === 'object' && theme.palette.primary !== null && !Array.isArray(theme.palette.primary)) {
          primaryMain = theme.palette.primary.main || '#6366f1';
        }
        
        // Validate background object
        if (theme.palette.background && typeof theme.palette.background === 'object' && theme.palette.background !== null && !Array.isArray(theme.palette.background)) {
          backgroundDefault = theme.palette.background.default || '#fafbfc';
        }
        
        // Validate divider
        if (theme.palette.divider && typeof theme.palette.divider === 'string') {
          dividerColor = theme.palette.divider;
        }
      } else {
        console.warn('Invalid theme.palette in Layout, using defaults');
      }
      
      // Test that Object.values can be called safely on palette
      try {
        if (theme.palette) {
          const paletteValues = Object.values(theme.palette);
          // Ensure all values are valid (not null/undefined)
          paletteValues.forEach((value, idx) => {
            if (value === null || value === undefined) {
              console.warn(`Invalid palette value at index ${idx}, using defaults`);
            }
          });
        }
      } catch (validationError) {
        console.error('Theme palette validation failed:', validationError);
        // Use defaults
      }
    } else {
      console.warn('Invalid theme in Layout, using defaults');
    }
  } catch (error) {
    console.error('Error accessing theme in Layout:', error);
    // Use safe defaults
    themeMode = 'light';
    textPrimary = '#0f172a';
    textSecondary = '#64748b';
    primaryMain = '#6366f1';
    backgroundDefault = '#fafbfc';
    dividerColor = 'rgba(148, 163, 184, 0.2)';
  }

  return (
    <Box
      sx={safeSx({
        height: '100vh',
        width: '100vw',
        bgcolor: backgroundDefault,
        color: textPrimary,
        position: 'fixed',
        top: 0,
        left: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: themeMode === 'dark'
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
          : 'linear-gradient(135deg, #fafbfc 0%, #f1f5f9 50%, #fafbfc 100%)',
        backgroundSize: '200% 200%',
        animation: 'gradientShift 15s ease infinite',
        '@keyframes gradientShift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      })}
    >
      {/* Header for Home Page - Navigation + Theme Toggle */}
      {location.pathname === '/' && (
        <Box
          component="header"
          sx={safeSx({
            position: 'sticky',
            top: 0,
            zIndex: 50,
            background: themeMode === 'dark'
              ? 'rgba(30, 41, 59, 0.9)'
              : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px) saturate(180%)',
            borderBottom: '1px solid',
            borderColor: dividerColor,
            flexShrink: 0,
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
          })}
        >
          {/* Navigation */}
          <Box component="nav" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {[
              { path: '/sessions', icon: BookOpen, label: 'Sessions' },
              { path: '/materials', icon: FolderOpen, label: 'Materials' },
              { path: '/help', icon: HelpCircle, label: 'Help' },
            ].map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  color: textSecondary,
                  background: 'transparent',
                  transition: 'all 0.2s ease',
                  border: '1px solid transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    themeMode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </Box>
          
          {/* Theme Toggle */}
          <ThemeToggle />
        </Box>
      )}
      
      {/* Full Header for other pages */}
      {location.pathname !== '/' && (
        <Box
          component="header"
          sx={safeSx({
            position: 'sticky',
            top: 0,
            zIndex: 50,
            background: themeMode === 'dark'
              ? 'rgba(30, 41, 59, 0.9)'
              : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px) saturate(180%)',
            borderBottom: '1px solid',
            borderColor: dividerColor,
            boxShadow: themeMode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.4)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            flexShrink: 0,
          })}
        >
          <Box sx={{ maxWidth: '1600px', mx: 'auto', px: { xs: 3, sm: 4, lg: 6 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
              {/* Logo & Title - Premium Typography */}
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
                      letterSpacing: '0.15em',
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    Coach Copilot
                  </Box>
                  <Box
                    sx={{
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      color: textPrimary,
                      letterSpacing: '-0.025em',
                    }}
                  >
                    {currentSession?.name || 'No active session'}
                  </Box>
                </Link>
              </Box>

              {/* Navigation - Premium Pill Buttons */}
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
                        color: isActive ? primaryMain : textSecondary,
                        background: isActive
                          ? themeMode === 'dark'
                            ? 'rgba(129, 140, 248, 0.2)'
                            : 'rgba(99, 102, 241, 0.1)'
                          : 'transparent',
                        transition: 'all 0.2s ease',
                        border: isActive ? `1px solid ${primaryMain}40` : '1px solid transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background =
                            themeMode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
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

              {/* Action Buttons & Theme Toggle - Prominently Displayed */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {/* Theme Toggle - Prominent */}
                <ThemeToggle />
                
                {currentSession && (
                  <>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={!currentSession || transcriptMessages.length === 0}
                      title="Save to Google Drive"
                      sx={safeSx({
                        minWidth: 'auto',
                        px: 2,
                        borderRadius: '12px',
                        borderColor: dividerColor,
                        textTransform: 'none',
                        fontWeight: 500,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                        },
                      })}
                    >
                      📄 Drive
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={!currentSession}
                      title="Export session"
                      sx={safeSx({
                        minWidth: 'auto',
                        px: 2,
                        borderRadius: '12px',
                        borderColor: dividerColor,
                        textTransform: 'none',
                        fontWeight: 500,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                        },
                      })}
                    >
                      💾 Export
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {/* Main Content - Fixed height, no scrollbars */}
      <Box
        component="main"
        sx={safeSx({
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
        })}
      >
        {children}
      </Box>
    </Box>
  );
}
