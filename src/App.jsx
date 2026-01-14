import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider, useThemeMode } from './context/ThemeContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import HomePage from './pages/HomePage';
import SessionsPage from './pages/SessionsPage';
import HelpPage from './pages/HelpPage';
import MaterialsPage from './pages/MaterialsPage';
import Layout from './layouts/Layout';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Toast wrapper to use theme with defensive checks
function ToastWrapper() {
  let actualMode = 'light';
  let isDark = false;
  try {
    const themeMode = useThemeMode();
    actualMode = themeMode?.actualMode || 'light';
    isDark = actualMode === 'dark';
  } catch (error) {
    console.error('Error accessing theme mode in ToastWrapper:', error);
    // Use defaults
    actualMode = 'light';
    isDark = false;
  }
  
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: isDark ? '#1a1f2e' : '#ffffff',
          color: isDark ? '#f6f7fb' : '#0b1220',
          borderRadius: '12px',
          padding: '12px 16px',
          boxShadow: isDark 
            ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
            : '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },
      }}
    />
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/sessions" element={<SessionsPage />} />
                <Route path="/help" element={<HelpPage />} />
                <Route path="/materials" element={<MaterialsPage />} />
              </Routes>
            </Layout>
            <ToastWrapper />
          </BrowserRouter>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
