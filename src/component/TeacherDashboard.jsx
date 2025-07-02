import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  GraduationCap, 
  Plus, 
  Users, 
  LogOut, 
  Copy, 
  Check, 
  MessageSquare, 
  Loader2,
  AlertCircle,
  XCircle,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const TeacherDashboard = () => {
  // State variables
  const [roomName, setRoomName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [error, setError] = useState('');
  
  // Get context values
  const { 
    user, 
    currentRoom, 
    createRoom, 
    logout, 
    rooms, 
    joinRoom, 
    isLoading,
    error: contextError,
    MAX_ROOM_NAME_LENGTH = 50
  } = useApp();
  
  const navigate = useNavigate();

  // Handle room creation or rejoining
  const handleCreateRoom = useCallback(async () => {
    if (!roomName.trim()) {
      setError('Room name cannot be empty');
      return;
    }
    
    if (roomName.length > MAX_ROOM_NAME_LENGTH) {
      setError(`Room name must be less than ${MAX_ROOM_NAME_LENGTH} characters`);
      return;
    }
    
    setIsCreatingRoom(true);
    setError('');
    
    try {
      const roomCode = await createRoom(roomName);
      if (roomCode) {
        toast.success('Room created successfully!', {
          position: 'top-center',
          autoClose: 3000,
        });
        setRoomName('');
        setShowCreateForm(false);
        
        // Redirect to the room if not already there
        const newRoom = rooms.find(r => r.code === roomCode);
        if (newRoom && currentRoom?.id !== newRoom.id) {
          navigate(`/chat/${newRoom.id}`);
        }
      }
    } catch (err) {
      // If error is about existing room, try to join it
      if (err.message.includes('already has a room')) {
        const existingRoom = rooms.find(r => r.teacherId === user?.id);
        if (existingRoom) {
          const success = await joinRoom(existingRoom.code);
          if (success) {
            toast.success('Rejoined your existing room!', {
              position: 'top-center',
              autoClose: 3000,
            });
            navigate(`/chat/${existingRoom.id}`);
            return;
          }
        }
      }
      setError(err.message || 'Failed to create room');
    } finally {
      setIsCreatingRoom(false);
    }
  }, [roomName, createRoom, MAX_ROOM_NAME_LENGTH, navigate, currentRoom]);

  // Handle room joining
  const handleJoinRoom = useCallback(async (roomCode) => {
    try {
      const success = await joinRoom(roomCode);
      if (success) {
        // Find the room by code to get its ID for navigation
        const roomToJoin = rooms.find(r => r.code === roomCode);
        if (roomToJoin) {
          navigate(`/chat/${roomToJoin.id}`);
        }
        toast.success('Joining room...', {
          position: 'top-right',
          autoClose: 2000,
          hideProgressBar: true
        });
      }
    } catch (err) {
      console.error('Error joining room:', err);
      toast.error(err.message || 'Failed to join room', {
        position: 'top-right',
        autoClose: 3000
      });
    }
  }, [joinRoom]);

  // Copy room code to clipboard
  const copyToClipboard = useCallback(async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success('Room code copied to clipboard!', {
        position: 'top-right',
        autoClose: 2000,
        hideProgressBar: true
      });
      setTimeout(() => setCopiedCode(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy room code', {
        position: 'top-right',
        autoClose: 2000
      });
    }
  }, []);

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      toast.success('Logged out successfully', {
        position: 'top-right',
        autoClose: 2000
      });
    } catch (err) {
      console.error('Logout error:', err);
      toast.error('Failed to logout. Please try again.', {
        position: 'top-right',
        autoClose: 3000
      });
    }
  }, [logout]);

  // Effect to handle room redirection
  const userId = user?.id;
  const userRole = user?.role;
  const currentRoomId = currentRoom?.id;
  
  // Memoize the active teacher room
  const activeTeacherRoom = useMemo(() => 
    rooms.find(r => r.teacherId === userId && r.isActive),
    [rooms, userId]
  );

  // Effect to handle room redirection
  useEffect(() => {
    if (!userRole || !userId) return;

    // Get current path once when the effect runs
    const currentPath = window.location.pathname;
    
    // Function to handle navigation
    const handleNavigation = (roomId) => {
      if (!currentPath.includes(`/chat/${roomId}`)) {
        navigate(`/chat/${roomId}`);
      }
    };

    if (currentRoomId) {
      // Only navigate if we're not already on the chat page
      handleNavigation(currentRoomId);
    } else if (userRole === 'teacher' && activeTeacherRoom) {
      // If teacher has an active room, try to rejoin it
      const isInRoom = activeTeacherRoom.participants.some(p => p.id === userId);
      if (!isInRoom) {
        joinRoom(activeTeacherRoom.code).then(() => {
          // Navigate using room ID after joining
          handleNavigation(activeTeacherRoom.id);
        }).catch(err => {
          console.error('Failed to rejoin room:', err);
        });
      }
    }
  }, [currentRoomId, userRole, userId, activeTeacherRoom, joinRoom, navigate]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-purple-500 animate-spin" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Filter rooms for the current teacher
  const teacherRooms = (rooms || []).filter((room) => room.teacherId === user?.id);
  const hasRooms = teacherRooms.length > 0;

  // Handle keyboard events for accessibility
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && showCreateForm) {
      handleCreateRoom();
    } else if (e.key === 'Escape') {
      setShowCreateForm(false);
      setRoomName('');
      setError('');
    }
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 p-4"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="max-w-6xl mx-auto">
        {/* Error Alert */}
        {(error || contextError) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-700">{error || contextError}</p>
            </div>
            <button 
              onClick={() => {
                setError('');
                // Note: We can't clear contextError here as it's managed by the context
              }}
              className="text-red-500 hover:text-red-700"
              aria-label="Dismiss error"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}
        
        {/* Header Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border border-white/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-md">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Welcome, {user?.anonymousName || 'Teacher'}</h1>
                <p className="text-gray-600 text-sm">Teacher Dashboard</p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center justify-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors self-start sm:self-center"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Room Management Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border border-white/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Classroom Management</h2>
              <p className="text-sm text-gray-500">
                {hasRooms 
                  ? `You have ${teacherRooms.length} active classroom${teacherRooms.length !== 1 ? 's' : ''}`
                  : 'Create your first classroom to get started'}
              </p>
            </div>

            <button
              onClick={() => {
                setShowCreateForm(!showCreateForm);
                setError('');
                if (showCreateForm) setRoomName('');
              }}
              className={`flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                showCreateForm 
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                  : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700 shadow-md'
              }`}
              aria-expanded={showCreateForm}
              aria-controls="create-room-form"
            >
              {showCreateForm ? (
                <>
                  <XCircle className="w-4 h-4" />
                  <span>Cancel</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create Classroom</span>
                </>
              )}
            </button>
          </div>

          {/* Room Creation Form */}
          {showCreateForm && (
            <div 
              id="create-room-form"
              className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200"
            >
              <div className="space-y-3">
                <div>
                  <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-1">
                    Classroom Name
                  </label>
                  <div className="flex space-x-3">
                    <div className="flex-1 relative">
                      <input
                        id="roomName"
                        type="text"
                        placeholder="e.g., Math 101 - Spring 2024"
                        value={roomName}
                        onChange={(e) => {
                          setRoomName(e.target.value);
                          setError('');
                        }}
                        maxLength={MAX_ROOM_NAME_LENGTH}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                        aria-required="true"
                        aria-invalid={error ? 'true' : 'false'}
                        aria-describedby={error ? 'roomNameError' : undefined}
                      />
                      {roomName && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                          {roomName.length}/{MAX_ROOM_NAME_LENGTH}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleCreateRoom}
                      disabled={isCreatingRoom || !roomName.trim()}
                      className={`px-6 py-2.5 rounded-lg font-medium transition-all flex items-center space-x-2 ${
                        isCreatingRoom || !roomName.trim()
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-purple-600 text-white hover:bg-purple-700 shadow-md'
                      }`}
                      aria-busy={isCreatingRoom}
                    >
                      {isCreatingRoom ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Creating...</span>
                        </>
                      ) : (
                        <span>Create</span>
                      )}
                    </button>
                  </div>
                  {error && (
                    <p id="roomNameError" className="mt-1 text-sm text-red-600">
                      {error}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center text-xs text-gray-500">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mr-1.5 flex-shrink-0" />
                  <span>Classrooms are private and only accessible with the room code</span>
                </div>
              </div>
            </div>
          )}

          {/* List of Created Classrooms */}
          {hasRooms ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teacherRooms.map((room) => {
                  const participantCount = room.participants?.length || 0;
                  const isActive = room.isActive !== false; // Default to true if not set
                  
                  return (
                    <div 
                      key={room.id} 
                      className={`bg-white rounded-xl p-4 shadow-sm border transition-all duration-200 ${
                        isActive 
                          ? 'border-gray-200 hover:border-purple-300 hover:shadow-md' 
                          : 'border-gray-100 bg-gray-50 opacity-80'
                      }`}
                    >
                      {/* Classroom header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 
                            className="font-semibold text-gray-800 text-lg truncate"
                            title={room.name}
                          >
                            {room.name}
                          </h3>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <span className="flex items-center">
                              <Users className="w-3.5 h-3.5 mr-1" />
                              {participantCount} {participantCount === 1 ? 'student' : 'students'}
                            </span>
                            <span className="mx-2">•</span>
                            <span className={`inline-flex items-center ${
                              isActive ? 'text-green-600' : 'text-amber-600'
                            }`}>
                              <span className={`w-2 h-2 rounded-full mr-1.5 ${
                                isActive ? 'bg-green-500' : 'bg-amber-500'
                              }`}></span>
                              {isActive ? 'Active' : 'Ended'}
                            </span>
                          </div>
                        </div>
                        
                        {!isActive && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 ml-2">
                            Archived
                          </span>
                        )}
                      </div>

                      {/* Room code */}
                      <div className="mb-4">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Class Code
                        </label>
                        <div className="flex items-center">
                          <code className="bg-gray-100 px-3 py-1.5 rounded-lg font-mono text-sm flex-1 truncate">
                            {room.code}
                          </code>
                          <button
                            onClick={() => copyToClipboard(room.code)}
                            className="ml-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label={`Copy class code ${room.code}`}
                            title="Copy to clipboard"
                          >
                            {copiedCode === room.code ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`/chat/${room.id}`)}
                          disabled={!isActive}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                            isActive
                              ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700 shadow-md'
                              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {isActive ? 'Enter Class' : 'Class Ended'}
                        </button>
                        
                        {isActive && (
                          <button
                            onClick={() => copyToClipboard(room.code)}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Copy class code"
                            title="Copy class code"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      {/* Additional info */}
                      <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                        <div className="flex justify-between">
                          <span>Created on</span>
                          <span className="font-medium">
                            {room.createdAt 
                              ? new Date(room.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })
                              : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Help text */}
              <div className="mt-6 text-center text-sm text-gray-500">
                <p>Share the class code with your students so they can join your classroom.</p>
              </div>
            </div>
          ) : (
            // Empty state
            <div className="text-center py-12 px-4">
              <div className="mx-auto w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                <GraduationCap className="w-8 h-8 text-purple-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No classrooms yet</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                Create your first classroom to start engaging with your students in real-time.
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Classroom
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
