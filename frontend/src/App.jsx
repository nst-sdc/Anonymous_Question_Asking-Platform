import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import StudentLogin from './component/StudentLogin.jsx'
import StudentDashboard from './component/StudentDashboard.jsx'
import JoinRoom from './component/JoinRoom.jsx'
import Navbar from "./component/Navbar";

import './App.css'

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<StudentLogin />} />
        <Route path="/dashboard" element={<StudentDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
