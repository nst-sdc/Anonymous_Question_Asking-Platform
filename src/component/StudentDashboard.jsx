import React, { useState, useEffect } from 'react';
import { MessageCircle, LogOut, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

// StudentDashboard component
const StudentDashboard = () => {
  // Room code input aur error message ke liye state
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');

  // AppContext se functions aur values
  const { user, currentRoom, joinRoom, logout } = useApp();
  const navigate = useNavigate();

  // Room join karne ka logic
  const handleJoinRoom = () => {
    if (!roomCode.trim()) {
      setError('Please enter a room code'); // Agar input empty hai toh error
      return;
    }

    // joinRoom function call karke success check karo
    const success = joinRoom(roomCode.toUpperCase());
    if (!success) {
      setError('Invalid room code or you are banned from joining rooms');
    } else {
      setError('');
    }
  };

  // Agar user banned hai toh ban screen dikhao
  if (user?.banned) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-red-200 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-600 mb-2">Account Banned</h2>
          <p className="text-gray-600 mb-6">
            Your account has been permanently banned due to multiple violations.
          </p>
          <button
            onClick={logout}
            className="bg-red-500 text-white px-6 py-3 rounded-xl hover:bg-red-600 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // Redirect to chat room if user is in a room
  useEffect(() => {
    if (currentRoom) {
      navigate(`/chat/${currentRoom.id}`);
    }
  }, [currentRoom, navigate]);

  // Main dashboard UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">

        {/* ==== Header ==== */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Dashboard icon */}
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Welcome, {user?.anonymousName}</h1>
                <p className="text-gray-600 text-sm">Student Dashboard</p>
              </div>
            </div>
            {/* Logout button */}
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* ==== Join Room Section ==== */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/20">
          {/* Heading */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Join a Room</h2>
            <p className="text-gray-600">Enter the room code provided by your teacher</p>
          </div>

          {/* Input field */}
          <div className="max-w-sm mx-auto">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Enter room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-center text-lg font-mono tracking-wider"
                maxLength={6}
              />
            </div>

            {/* Error message show karo agar kuch galat ho */}
            {error && (
              <div className="text-red-500 text-sm mb-4 text-center">{error}</div>
            )}

            {/* Join Room Button */}
            <button
              onClick={handleJoinRoom}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
            >
              Join Room
            </button>
          </div>

          {/* Violation warning agar user pe warning ho */}
          {user?.violations > 0 && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-center space-x-2 text-yellow-700">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Warning: You have {user.violations} violation{user.violations > 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-yellow-600 mt-1">
                4 violations will result in a permanent ban
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
