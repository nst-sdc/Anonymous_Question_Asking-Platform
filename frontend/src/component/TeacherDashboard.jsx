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
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
          <p className="text-text-secondary">Loading your dashboard...</p>
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
      className="min-h-screen bg-bg p-4"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="max-w-6xl mx-auto">
        {/* Error Alert */}
        {(error || contextError) && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-500">{error || contextError}</p>
            </div>
            <button 
              onClick={() => setError('')}
              className="text-red-500/70 hover:text-red-500"
              aria-label="Dismiss error"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}
        
        {/* Header Section */}
        <div className="bg-card rounded-2xl shadow-lg p-6 mb-6 border border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-md">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-text">Welcome, {user?.anonymousName || 'Teacher'}</h1>
                <p className="text-text-secondary text-sm">Teacher Dashboard</p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center justify-center space-x-2 px-4 py-2 text-text-secondary hover:bg-bg-hover rounded-lg transition-colors self-start sm:self-center"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Room Management Section */}
        <div className="bg-card rounded-2xl shadow-lg p-6 mb-6 border border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-text">Classroom Management</h2>
              <p className="text-sm text-text-secondary">
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
              className={`flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl transition-all duration-200 font-semibold ${ 
                showCreateForm 
                  ? 'bg-bg-hover text-text' 
                  : 'bg-primary text-white hover:bg-primary/90 shadow-md'
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
              className="bg-bg rounded-xl p-4 mb-6 border border-border"
            >
              <div className="space-y-3">
                <div>
                  <label htmlFor="roomName" className="block text-sm font-medium text-text-secondary mb-1">
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
                        className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg-input text-text focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        aria-required="true"
                        aria-invalid={error ? 'true' : 'false'}
                        aria-describedby={error ? 'roomNameError' : undefined}
                      />
                      {roomName && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-text-secondary/70">
                          {roomName.length}/{MAX_ROOM_NAME_LENGTH}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleCreateRoom}
                      disabled={isCreatingRoom || !roomName.trim()}
                      className={`px-6 py-2.5 rounded-lg font-medium transition-all flex items-center space-x-2 ${ 
                        isCreatingRoom || !roomName.trim()
                          ? 'bg-border text-text-secondary cursor-not-allowed'
                          : 'bg-primary text-white hover:bg-primary/90 shadow-md'
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
                    <p id="roomNameError" className="mt-1 text-sm text-red-500">
                      {error}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center text-xs text-text-secondary">
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
                      className={`bg-card rounded-xl p-4 shadow-sm border transition-all duration-200 ${ 
                        isActive 
                          ? 'border-border hover:border-primary/50 hover:shadow-md'
                          : 'border-border/50 bg-card/50 opacity-80'
                      }`}
                    >
                      <div className="flex flex-col h-full">
                        <div className="flex-1 mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-text truncate pr-2" title={room.name}>{room.name}</h3>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${ 
                              isActive 
                                ? 'bg-green-500/10 text-green-500'
                                : 'bg-border text-text-secondary'
                            }`}>
                              {isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          
                          <div className="flex items-center text-sm text-text-secondary mb-3">
                            <Users className="w-4 h-4 mr-2" />
                            <span>{participantCount} participant{participantCount !== 1 ? 's' : ''}</span>
                          </div>

                          <div className="flex items-center text-sm text-text-secondary">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            <span>{room.questions?.length || 0} question{room.questions?.length !== 1 ? 's' : ''}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <button 
                            onClick={() => copyToClipboard(room.code)}
                            className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm rounded-lg bg-bg-hover hover:bg-border transition-colors"
                          >
                            {copiedCode === room.code ? (
                              <>
                                <Check className="w-4 h-4 text-green-500" />
                                <span className="text-green-500">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 text-text-secondary" />
                                <span className="text-text-secondary font-mono text-xs">{room.code}</span>
                              </>
                            )}
                          </button>

                          <button 
                            onClick={() => handleJoinRoom(room.code)}
                            disabled={!isActive}
                            className="w-full px-3 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:bg-border disabled:text-text-secondary disabled:cursor-not-allowed"
                          >
                            Enter Classroom
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 px-6 bg-bg rounded-xl border-2 border-dashed border-border">
              <div className="mx-auto w-16 h-16 flex items-center justify-center bg-primary/10 rounded-full mb-4">
                <GraduationCap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-text">No classrooms yet</h3>
              <p className="text-text-secondary mt-1">Click 'Create Classroom' to set up your first interactive session.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
