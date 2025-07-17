import React, { useState } from 'react';
import { ArrowLeft, Users, Copy, CheckCircle, Sparkles } from 'lucide-react';
import { useRoom } from '../contexts/RoomContext';

const CreateRoom = ({ onBack, onRoomCreated }) => {
  const { createRoom, loading } = useRoom();
  const [roomName, setRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');


  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const room = await createRoom(roomName);
      if (room && room.code) {
        setRoomCode(room.code);
      } else {
        throw new Error('Failed to create room');
      }
    } catch (err) {
      console.error('Room creation error:', err);
      setError(err.message || 'Failed to create room. Please try again.');
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleEnterRoom = () => {
    onRoomCreated(roomCode);
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
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
              Create Your Room
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Give your chatroom a name and start collaborating
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {!roomCode ? (
            <form onSubmit={handleCreateRoom} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Room Name
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g., Team Brainstorm, Study Group..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !roomName.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? 'Creating room...' : 'Create Room'}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center space-x-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
                  <CheckCircle className="w-4 h-4" />
                  <span>Room created successfully!</span>
                </div>
                
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                  {roomName}
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                  Share this code with others to invite them
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6 border border-slate-200 dark:border-slate-600">
                <div className="text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Room Code</p>
                  <div className="text-3xl font-bold text-slate-800 dark:text-white tracking-wider mb-4">
                    {roomCode}
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center space-x-2 bg-white dark:bg-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-500 hover:border-slate-300 dark:hover:border-slate-400 transition-colors mx-auto"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <button
                onClick={handleEnterRoom}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200"
              >
                Enter Room
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateRoom;
