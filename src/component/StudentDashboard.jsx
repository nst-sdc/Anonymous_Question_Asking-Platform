import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useSocket } from '../context/SocketContext';
import { AlertCircle, Loader2, LogOut } from 'lucide-react';
import Chat from './Chat';

const StudentDashboard = () => {
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const { user, currentRoom, joinRoom, leaveRoom } = useApp();
  const { isConnected, socket } = useSocket();
  const navigate = useNavigate();

  // Handle join room
  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!roomCode.trim() || !isConnected) return;
    
    try {
      setIsJoining(true);
      setJoinError('');
      
      // First join the room through the app context
      const success = await joinRoom(roomCode);
      
      if (!success) {
        setJoinError('Failed to join room. Please try again.');
        return;
      }
      
      // Then join the socket room
      if (socket) {
        socket.emit('join_room', { 
          roomId: roomCode, 
          userId: user.id, 
          isTeacher: false 
        });
      }
      
    } catch (error) {
      console.error('Error joining room:', error);
      setJoinError('An error occurred while joining the room.');
    } finally {
      setIsJoining(false);
    }
  };

  // Handle leave room
  const handleLeaveRoom = async () => {
    try {
      if (socket && currentRoom) {
        // Leave the socket room
        socket.emit('leave_room', { 
          roomId: currentRoom.id, 
          userId: user.id 
        });
      }
      
      // Leave the room in the app context
      await leaveRoom();
      setRoomCode('');
      
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  };

  // Handle disconnect
  useEffect(() => {
    if (!isConnected) {
      setJoinError('Disconnected from server. Please refresh the page to reconnect.');
    } else {
      setJoinError('');
    }
  }, [isConnected]);

  // Redirect if not authenticated
  if (!user) {
    navigate('/');
    return null;
  }

  // Show banned screen if user is banned
  if (user.isBanned) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="mt-3 text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">
            You have been banned from joining rooms. Please contact support if you believe this is a mistake.
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">Student Dashboard</h1>
          <div className="flex items-center space-x-4">
            {currentRoom && (
              <button
                onClick={handleLeaveRoom}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <LogOut className="h-3 w-3 mr-1" />
                Leave Room
              </button>
            )}
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {user.name}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {currentRoom ? (
          <div className="bg-white shadow rounded-lg h-[calc(100vh-200px)]">
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium text-gray-900">Room: {currentRoom.name}</h2>
              <p className="text-sm text-gray-500">Room Code: {currentRoom.code}</p>
            </div>
            <Chat roomId={currentRoom.code} />
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="max-w-md mx-auto text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Join a Classroom</h2>
              <p className="text-gray-600 mb-6">
                Enter the room code provided by your teacher to join the classroom.
              </p>
              
              <form onSubmit={handleJoinRoom} className="space-y-4">
                <div>
                  <label htmlFor="roomCode" className="sr-only">
                    Room Code
                  </label>
                  <input
                    type="text"
                    id="roomCode"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter room code"
                    disabled={isJoining || !isConnected}
                    required
                  />
                </div>
                
                {joinError && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{joinError}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={!roomCode.trim() || isJoining || !isConnected}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Joining...
                    </>
                  ) : (
                    'Join Classroom'
                  )}
                </button>
                
                {!isConnected && (
                  <div className="text-center">
                    <p className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
                      <Loader2 className="inline-block w-4 h-4 animate-spin mr-1" />
                      Connecting to server...
                    </p>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;
