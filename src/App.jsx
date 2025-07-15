import React, { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { RoomProvider } from './contexts/RoomContext';
import { Routes, Route, useNavigate } from 'react-router-dom';

import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
import CreateRoom from './components/CreateRoom';
import JoinRoom from './components/JoinRoom';
import Chatroom from './components/Chatroom';
import RoomHistory from './components/RoomHistory';

function App() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authAction, setAuthAction] = useState('signin'); // 'signin' | 'signup'
  const navigate = useNavigate();

  const handleAuthRequired = (action) => {
    setAuthAction(action);
    setShowAuthModal(true);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <RoomProvider>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 transition-colors duration-300">
            <Routes>
              <Route path="/" element={
                <LandingPage
                  onCreateRoom={() => navigate('/create-room')}
                  onJoinRoom={() => navigate('/join-room')}
                  onViewHistory={() => navigate('/history')}
                  onAuthRequired={handleAuthRequired}
                />
              } />
              <Route path="/create-room" element={
                <CreateRoom onBack={() => navigate('/')} onRoomCreated={code => navigate(`/room/${code}`)} />
              } />
              <Route path="/join-room" element={
                <JoinRoom onBack={() => navigate('/')} onRoomJoined={code => navigate(`/room/${code}`)} />
              } />
              <Route path="/history" element={
                <RoomHistory onBack={() => navigate('/')} onRejoinRoom={code => navigate(`/room/${code}`)} />
              } />
              <Route path="/room/:code" element={
                <Chatroom onLeaveRoom={() => navigate('/')} />
              } />
              <Route path="*" element={<div className="flex flex-col items-center justify-center min-h-screen"><h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1><button className="px-4 py-2 bg-blue-600 text-white rounded-xl" onClick={() => navigate('/')}>Go to Home</button></div>} />
            </Routes>
            {showAuthModal && (
              <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onSuccess={handleAuthSuccess}
                defaultAction={authAction}
              />
            )}
          </div>
        </RoomProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
