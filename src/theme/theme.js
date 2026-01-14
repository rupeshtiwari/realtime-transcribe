import { createTheme } from '@mui/material/styles';

// Light theme (Daylight)
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2d62ff',
      light: '#5a7fff',
      dark: '#1a4acc',
    },
    secondary: {
      main: '#6366f1',
    },
    background: {
      default: '#f6f7fb',
      paper: '#ffffff',
    },
    text: {
      primary: '#0b1220',
      secondary: '#5a6274',
    },
    divider: '#e5e7ef',
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 20px',
          minHeight: 44,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        },
      },
    },
  },
});

// Dark theme (Dim)
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#5a7fff',
      light: '#7a9fff',
      dark: '#2d62ff',
    },
    secondary: {
      main: '#818cf8',
    },
    background: {
      default: '#0f1419',
      paper: '#1a1f2e',
    },
    text: {
      primary: '#f6f7fb',
      secondary: '#9ca3af',
    },
    divider: '#2d3748',
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 20px',
          minHeight: 44,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        },
      },
    },
  },
});

// Get theme based on mode
export const getTheme = (mode) => {
  if (mode === 'dark') return darkTheme;
  return lightTheme;
};
