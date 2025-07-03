import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AuthScreen from './component/AuthScreen';
import TeacherDashboard from './component/TeacherDashboard';
import StudentDashboard from './component/StudentDashboard';
import ChatRoom from './component/ChatRoom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingOverlay } from './components/LoadingSpinner';
import { useEffect, useState } from 'react';
import { AlertTriangle, Moon, Sun } from 'lucide-react';
import './App.css';

// Component to show mock socket warning
const MockSocketWarning = () => {
  const { isMock } = useSocket();
  
  useEffect(() => {
    if (isMock) {
      toast.warning(
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <span>Running in offline mode. Some features may be limited.</span>
        </div>,
        {
          autoClose: false,
          closeButton: false,
          closeOnClick: false,
          draggable: false,
          position: 'top-center',
        }
      );
    }
    
    return () => {
      if (isMock) {
        toast.dismiss();
      }
    };
  }, [isMock]);
  
  return null;
};
function App() {
  const [isLoading, setIsLoading] = useState(true);
  
  // Load theme preference from localStorage or use system preference
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply theme class to HTML element and save preference
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  // Toggle theme
  const toggleTheme = () => setDark(prev => !prev);
  
  // Set up system theme change listener and handle initial load
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (!localStorage.getItem('theme')) {
        setDark(e.matches);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500); // Short delay to ensure theme is applied

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      clearTimeout(timer);
    };
  }, []);

  if (isLoading) {
    return <LoadingOverlay />;
  }

  return (
    <div 
      className="min-h-screen bg-bg text-text transition-colors duration-300"
      role="application"
      aria-live="polite"
      aria-busy={isLoading}
    >
      <button 
        onClick={toggleTheme}
        className="fixed top-4 right-4 p-2 rounded-full bg-card text-text-secondary shadow-lg z-50 hover:bg-border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg"
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-pressed={dark}
      >
        {dark ? (
          <Sun className="h-6 w-6" />
        ) : (
          <Moon className="h-6 w-6" />
        )}
        <span className="sr-only">{dark ? 'Switch to light mode' : 'Switch to dark mode'}</span>
      </button>

    <ErrorBoundary>
      <AppProvider>
        <SocketProvider>
          <MockSocketWarning />
          <Router>
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={
                  <ErrorBoundary>
                    <AuthScreen />
                  </ErrorBoundary>
                } />
                <Route path="/teacher" element={
                  <ErrorBoundary>
                    <TeacherDashboard />
                  </ErrorBoundary>
                } />
                <Route path="/student" element={
                  <ErrorBoundary>
                    <StudentDashboard />
                  </ErrorBoundary>
                } />
                <Route path="/chat/:roomId" element={
                  <ErrorBoundary>
                    <ChatRoom />
                  </ErrorBoundary>
                } />
              </Routes>

              <ToastContainer
                position="top-bottom"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme={dark ? 'dark' : 'light'}
                role="alert"
                aria-live="assertive"
              />
            </ErrorBoundary>
          </Router>
        </SocketProvider>
      </AppProvider>
    </ErrorBoundary>
    </div> );
}

export default App;
