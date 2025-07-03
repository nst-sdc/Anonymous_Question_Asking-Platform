import React, { useState, useEffect } from 'react';
import { MessageCircle, LogOut, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

// StudentDashboard component
const StudentDashboard = () => {
  // State for room code input and error message
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');

  // Get functions and values from AppContext
  const { user, currentRoom, joinRoom, logout } = useApp();
  const navigate = useNavigate();

  // Logic to handle joining a room
  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      setError('Please enter a room code'); // Show error if input is empty
      return;
    }

    try {
      // Call joinRoom function and check for success
      const success = await joinRoom(roomCode.toUpperCase());
      if (success) {
        setError('');
        // Navigation is handled by the useEffect watching currentRoom
      }
    } catch (err) {
      setError(err.message || 'Invalid room code or you are banned from joining rooms');
    }
  };

  // Show ban screen if the user is banned
  if (user?.banned) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-2xl shadow-xl p-8 border border-red-500/20 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-500 mb-2">Account Banned</h2>
          <p className="text-text-secondary mb-6">
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
    <div className="min-h-screen bg-bg p-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="bg-card rounded-2xl shadow-lg p-6 mb-6 border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-text">Welcome, Anonymous Student</h1>
                <p className="text-text-secondary text-sm">Student Dashboard</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-4 py-2 text-text-secondary hover:bg-bg-hover rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Join Room Section */}
        <div className="bg-card rounded-2xl shadow-lg p-8 border border-border">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-text mb-2">Join a Room</h2>
            <p className="text-text-secondary">Enter the room code provided by your teacher</p>
          </div>

          <div className="max-w-sm mx-auto">
            <div className="mb-4">
              <input
                type="text"
                placeholder="ENTER CODE"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-xl border-2 border-border bg-bg-input text-text placeholder-text-secondary/70 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-center text-2xl font-mono tracking-widest"
                maxLength={6}
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm mb-4 text-center">{error}</div>
            )}

            <button
              onClick={handleJoinRoom}
              className="w-full bg-primary text-white py-3 px-4 rounded-xl font-semibold hover:bg-primary/90 transition-all duration-200 disabled:bg-border disabled:text-text-secondary"
              disabled={!roomCode.trim()}
            >
              Join Room
            </button>
          </div>

          {user?.violations > 0 && (
            <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <div className="flex items-center space-x-3 text-yellow-500">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">
                  Warning: You have {user.violations} violation{user.violations > 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-yellow-500/80 mt-1 pl-8">
                4 violations will result in a permanent ban.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
