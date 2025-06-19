import { useState } from 'react';
import StudentLogin from './component/StudentLogin.jsx';
// import Navbar from './component/Navbar';
import './App.css';

function App() {
  // const [username] = useState(`Anonymous_${Math.floor(1000 + Math.random() * 9000)}`);

  return (
    <>
      {/* <Navbar username={username} /> */}
      <StudentLogin />
    </>
  );
}

export default App;

