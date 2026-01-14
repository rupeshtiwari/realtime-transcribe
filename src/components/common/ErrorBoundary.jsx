import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { safeSx } from '../../utils/safeSx';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    // Clear localStorage and reload
    try {
      localStorage.removeItem('coach-copilot-session');
      localStorage.removeItem('coach-copilot-materials');
    } catch (e) {
      console.warn('Failed to clear localStorage:', e);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={safeSx({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            p: 4,
            bgcolor: '#fafbfc',
            background: 'linear-gradient(135deg, #fafbfc 0%, #f1f5f9 100%)',
          })}
        >
          <Typography variant="h4" gutterBottom sx={safeSx({ color: '#ef4444' })}>
            Something went wrong
          </Typography>
          <Typography variant="body1" sx={safeSx({ mb: 3, textAlign: 'center', maxWidth: 600, color: '#64748b' })}>
            The app encountered an error. This is usually caused by corrupted browser data.
          </Typography>
          {this.state.error && (
            <Box
              sx={safeSx({
                p: 2,
                mb: 3,
                bgcolor: '#fee2e2',
                color: '#991b1b',
                borderRadius: 1,
                maxWidth: 800,
                overflow: 'auto',
                fontSize: '0.875rem',
              })}
            >
              <Typography variant="subtitle2" gutterBottom>
                Error: {this.state.error?.toString() || 'Unknown error'}
              </Typography>
              {this.state.error?.stack && (
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.75rem' }}>
                  {this.state.error.stack}
                </pre>
              )}
              {this.state.errorInfo?.componentStack && (
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.75rem', marginTop: '8px' }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </Box>
          )}
          <Button 
            variant="contained" 
            onClick={this.handleReload} 
            size="large"
            sx={safeSx({
              bgcolor: '#6366f1',
              color: '#ffffff',
              '&:hover': {
                bgcolor: '#4f46e5',
              },
            })}
          >
            Clear Data & Reload
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
