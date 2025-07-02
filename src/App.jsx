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
import { AlertTriangle } from 'lucide-react';
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
          className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
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
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Toggle theme and save preference
  const toggleTheme = () => {
    setDark(prev => {
      const newTheme = !prev;
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', newTheme ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', newTheme);
      return newTheme;
    });
  };
  
  // Set initial theme and mark as loaded
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', dark);
    
    // Set loading to false immediately after initial render
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500); // Short delay to ensure theme is applied
    
    // Set up system theme change listener
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (!localStorage.getItem('theme')) {
        setDark(e.matches);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      clearTimeout(timer);
    };
  }, []); // Only run once on mount, not when dark changes

  // Apply theme class to body and sync with system preference
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(dark ? 'light' : 'dark');
    root.classList.add(dark ? 'dark' : 'light');
    document.body.className = dark ? 'dark-mode' : 'light-mode';
  }, [dark]);

  if (isLoading) {
    return <LoadingOverlay />;
  }

  return (
    <div 
      className={`min-h-screen ${dark ? 'dark' : ''} transition-colors duration-200`}
      role="application"
      aria-live="polite"
      aria-busy={isLoading}
    >
      <button 
        onClick={toggleTheme}
        className="fixed top-4 right-4 p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-lg z-50 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-pressed={dark}
      >
        {dark ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
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
                theme="color"
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
