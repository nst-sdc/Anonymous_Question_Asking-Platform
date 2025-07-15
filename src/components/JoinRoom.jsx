import React, { useState } from 'react';
import { ArrowLeft, MessageSquare, Users } from 'lucide-react';
import { useRoom } from '../contexts/RoomContext';

const JoinRoom = ({ onBack, onRoomJoined }) => {
  const { joinRoom, loading } = useRoom();
  const [roomCode, setRoomCode] = useState('');
  const [roomPreview, setRoomPreview] = useState(null);
  const [error, setError] = useState('');

  const handleCodeChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setRoomCode(value);
    
    // Simulate room preview when code is 6 characters
    if (value.length === 6) {
      setTimeout(() => {
        setRoomPreview({
          name: "Team Brainstorm Session",
          memberCount: 4
        });
      }, 500);
    } else {
      setRoomPreview(null);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const room = await joinRoom(roomCode);
      onRoomJoined(roomCode);
    } catch (err) {
      console.error('Room join error:', err);
      if (err.message && err.message.includes('ended')) {
        setError('This room has ended and cannot be joined.');
      } else {
        setError(err.message || 'Failed to join room. Please check the code and try again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to home</span>
        </button>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
              Join a Room
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Enter the room code to join the conversation
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-medium text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleJoinRoom} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Room Code
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={handleCodeChange}
                className="w-full px-4 py-3 text-center text-2xl font-bold tracking-wider border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="ABC123"
                maxLength={6}
                required
              />
            </div>

            {roomPreview && (
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                      {roomPreview.name}
                    </h3>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      {roomPreview.memberCount} members online
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || roomCode.length !== 6}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? 'Joining room...' : 'Join Room'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Don't have a code?{' '}
              <button
                onClick={onBack}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Create your own room
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinRoom;