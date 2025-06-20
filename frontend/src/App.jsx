import { useState } from 'react';
import { ToastContainer } from 'react-toastify'
import StudentLogin from './component/StudentLogin.jsx';
import Navbar from './component/Navbar';
import './App.css';

function App() {
  const [username] = useState(`Anonymous_${Math.floor(1000 + Math.random() * 9000)}`);

  return (
    <>
      <Navbar username={username} />
      <StudentLogin />
      <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
      />
    </>
  );
}

export default App;

