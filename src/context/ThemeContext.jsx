import { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getTheme } from '../theme/theme';

const ThemeContext = createContext();

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState(() => {
    // Get from localStorage or default to 'system'
    try {
      const saved = localStorage.getItem('themeMode');
      return saved || 'system';
    } catch (e) {
      console.warn('Failed to read themeMode from localStorage:', e);
      return 'system';
    }
  });

  const [actualMode, setActualMode] = useState(() => {
    if (themeMode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return themeMode;
  });

  useEffect(() => {
    // Set data-theme attribute for CSS
    document.documentElement.setAttribute('data-theme', actualMode);
    
    // Listen for system theme changes
    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => {
        setActualMode(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      setActualMode(themeMode);
    }
  }, [themeMode, actualMode]);

  const changeTheme = (mode) => {
    setThemeMode(mode);
    try {
      localStorage.setItem('themeMode', mode);
    } catch (e) {
      console.warn('Failed to save themeMode to localStorage:', e);
    }
  };

  // Ensure theme is always valid with deep validation
  let theme;
  try {
    theme = getTheme(actualMode);
    // Deep validate theme structure - Material-UI needs specific structure
    if (!theme || typeof theme !== 'object' || theme === null || Array.isArray(theme)) {
      console.warn('Invalid theme structure, using light theme');
      theme = getTheme('light');
    }
    // Validate palette exists and is an object
    if (!theme.palette || typeof theme.palette !== 'object' || theme.palette === null || Array.isArray(theme.palette)) {
      console.warn('Invalid theme.palette, recreating theme');
      theme = getTheme('light');
    }
    // Ensure all required palette properties exist and are valid objects
    if (!theme.palette.mode) theme.palette.mode = 'light';
    if (!theme.palette.text || typeof theme.palette.text !== 'object' || theme.palette.text === null || Array.isArray(theme.palette.text)) {
      theme.palette.text = { primary: '#0f172a', secondary: '#64748b' };
    }
    if (!theme.palette.primary || typeof theme.palette.primary !== 'object' || theme.palette.primary === null || Array.isArray(theme.palette.primary)) {
      theme.palette.primary = { main: '#6366f1' };
    }
    if (!theme.palette.background || typeof theme.palette.background !== 'object' || theme.palette.background === null || Array.isArray(theme.palette.background)) {
      theme.palette.background = { default: '#fafbfc', paper: '#ffffff' };
    }
    // Ensure divider exists
    if (!theme.palette.divider) {
      theme.palette.divider = 'rgba(148, 163, 184, 0.2)';
    }
    // Ensure components object exists
    if (!theme.components || typeof theme.components !== 'object' || theme.components === null || Array.isArray(theme.components)) {
      theme.components = {};
    }
    // Ensure typography exists
    if (!theme.typography || typeof theme.typography !== 'object' || theme.typography === null || Array.isArray(theme.typography)) {
      theme.typography = { fontFamily: 'Inter, sans-serif' };
    }
    // Ensure shape exists
    if (!theme.shape || typeof theme.shape !== 'object' || theme.shape === null || Array.isArray(theme.shape)) {
      theme.shape = { borderRadius: 8 };
    }
  } catch (error) {
    console.error('Error creating theme:', error);
    theme = getTheme('light');
  }
  
  // Final validation - ensure theme is a valid Material-UI theme object
  // Material-UI will call Object.values() on theme properties, so we must ensure they're all objects
  try {
    // Test that Object.values can be called on critical properties
    if (theme.palette) {
      Object.values(theme.palette);
    }
    if (theme.components) {
      Object.values(theme.components);
    }
  } catch (validationError) {
    console.error('Theme validation failed, recreating:', validationError);
    theme = getTheme('light');
  }

  return (
    <ThemeContext.Provider value={{ themeMode, changeTheme, actualMode }}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
};
