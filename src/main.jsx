import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Clear ALL localStorage data on app start to prevent crashes
// This is a nuclear option but necessary to fix the Object.values() crash
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    console.log('Clearing all localStorage to prevent crashes...');
    window.localStorage.clear();
    console.log('localStorage cleared successfully');
  } catch (e) {
    console.error('Failed to clear localStorage:', e);
  }
}

// Global error handler to catch Object.values errors from Material-UI
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (event.error && event.error.message && event.error.message.includes('Cannot convert undefined or null to object')) {
      console.error('Caught Object.values error:', {
        message: event.error.message,
        stack: event.error.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
      // Don't prevent default - let ErrorBoundary handle it
    }
  });
  
  // Also catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.message && event.reason.message.includes('Cannot convert undefined or null to object')) {
      console.error('Caught unhandled Object.values error:', event.reason);
    }
  });
}

// Wait a bit to ensure localStorage is cleared before React renders
setTimeout(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}, 100);
