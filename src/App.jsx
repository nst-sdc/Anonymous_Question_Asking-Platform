import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { SocketProvider } from './context/SocketContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import AuthScreen from './component/AuthScreen';
import TeacherDashboard from './component/TeacherDashboard';
import StudentDashboard from './component/StudentDashboard';

function App() {
  return (
    <AppProvider>
      <SocketProvider>
        <Router>
          <>
            <Routes>
              <Route path="/" element={<AuthScreen />} />
              <Route path="/teacher" element={<TeacherDashboard />} />
              <Route path="/student" element={<StudentDashboard />} />
            </Routes>

            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </>
        </Router>
      </SocketProvider>
    </AppProvider>
  );
}

export default App;
