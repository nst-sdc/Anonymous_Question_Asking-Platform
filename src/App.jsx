import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { SocketProvider } from './context/SocketContext';
import { useEffect, useState } from 'react';
import './App.css';  
import AuthScreen from './component/AuthScreen';
import TeacherDashboard from './component/TeacherDashboard';
import StudentDashboard from './component/StudentDashboard';

function App() {
  const [dark, setDark] = useState(false);

  const toggleTheme = () => setDark(prev => !prev);

  useEffect(() => {
   
    document.body.className = dark ? 'dark-mode' : 'light-mode';
  }, [dark]);
  return (
  <>
    <button onClick={toggleTheme} style={{ position: 'fixed', top: 10, right: 10 }}>
    {dark ? '🌞' : '🌙'}
    </button>

    <AppProvider>
      <SocketProvider>
        <Router>
          <Routes>
            <Route path="/" element={<AuthScreen />} />
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/student" element={<StudentDashboard />} />
          </Routes>
        </Router>
      </SocketProvider>
    </AppProvider>
  </> );
}

export default App;
