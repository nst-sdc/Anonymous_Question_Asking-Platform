import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { SocketProvider } from './context/SocketContext';

import AuthScreen from './component/AuthScreen';
import TeacherDashboard from './component/TeacherDashboard';
import StudentDashboard from './component/StudentDashboard';

function App() {
  return (
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
  );
}

export default App;
