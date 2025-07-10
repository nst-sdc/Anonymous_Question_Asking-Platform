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
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const TeacherDashboard = () => {
  const [roomName, setRoomName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [error, setError] = useState('');

  const {
    user,
    createRoom,
    logout,
    rooms,
    joinRoom,
    endRoom,
    isLoading,
    currentRoom,
    MAX_ROOM_NAME_LENGTH = 50,
  } = useApp();

  const navigate = useNavigate();

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
      const newRoom = await createRoom(roomName);
      if (newRoom) {
        toast.success('Room created successfully!');
        setRoomName('');
        setShowCreateForm(false);
        navigate(`/chat/${newRoom.id}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to create room');
    } finally {
      setIsCreatingRoom(false);
    }
  }, [roomName, createRoom, MAX_ROOM_NAME_LENGTH, navigate]);

  const handleJoinRoom = useCallback((roomCode) => {
    try {
      joinRoom(roomCode);
    } catch (err) {
      toast.error(err.message || 'Failed to join room');
    }
  }, [joinRoom]);

  useEffect(() => {
    if (currentRoom && currentRoom.id) {
      navigate(`/chat/${currentRoom.id}`);
    }
  }, [currentRoom, navigate]);

  const handleEndRoom = useCallback(async (roomId) => {
    if (window.confirm('Are you sure you want to end this classroom? This action cannot be undone.')) {
      try {
        await endRoom(roomId);
        toast.success('Classroom ended successfully.');
      } catch (err) {
        toast.error(err.message || 'Failed to end classroom.');
      }
    }
  }, [endRoom]);

  const copyToClipboard = useCallback(async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(''), 2000);
    } catch (err) {
      toast.error('Failed to copy code.');
    }
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCreateRoom();
    }
  };

  const teacherRooms = useMemo(() =>
    (rooms || []).filter(room => room.teacherId === user?.id && room.isActive),
    [rooms, user]
  );
  const hasRooms = teacherRooms.length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-text">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text font-sans">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <header className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text">Teacher Dashboard</h1>
              <p className="text-sm text-text-secondary">Welcome, {user?.anonymousName || 'Teacher'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-text-secondary bg-bg-hover rounded-lg hover:bg-border transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </header>

        <main className="space-y-10">
          <section>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-bold text-text tracking-tight">Classroom Management</h2>
                <p className="text-text-secondary mt-1">You have {teacherRooms.length} active classroom{teacherRooms.length !== 1 ? 's' : ''}</p>
              </div>
              <button
                onClick={() => setShowCreateForm(prev => !prev)}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-primary rounded-lg shadow-md hover:bg-primary/90 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background"
                aria-expanded={showCreateForm}
                aria-controls="create-room-form"
              >
                <Plus className="w-4 h-4" />
                <span>{showCreateForm ? 'Cancel' : 'Create Classroom'}</span>
              </button>
            </div>

            {showCreateForm && (
              <div id="create-room-form" className="bg-card p-6 rounded-2xl border border-border shadow-sm animate-fade-in">
                <div className="max-w-md">
                  <label htmlFor="roomName" className="block text-sm font-bold text-text mb-2">Room Name</label>
                  <div className="flex gap-3">
                    <input
                      id="roomName"
                      type="text"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="e.g., Physics 101"
                      className="flex-grow px-4 py-2 bg-bg-input border-2 border-border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition"
                      maxLength={MAX_ROOM_NAME_LENGTH}
                      aria-describedby="roomNameError"
                    />
                    <button
                      onClick={handleCreateRoom}
                      disabled={isCreatingRoom || !roomName.trim()}
                      className="px-6 py-2 font-semibold text-white bg-primary rounded-lg shadow-sm hover:bg-primary/90 transition-colors disabled:bg-border disabled:text-text-secondary disabled:cursor-not-allowed flex items-center justify-center w-32"
                    >
                      {isCreatingRoom ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <span>Create</span>
                      )}
                    </button>
                  </div>
                  {error && (
                    <p id="roomNameError" className="mt-2 text-sm text-red-500">{error}</p>
                  )}
                </div>
              </div>
            )}
          </section>

          <section>
            {hasRooms ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teacherRooms.map((room) => {
                  const participantCount = room.participants?.length || 0;
                  return (
                    <div key={room.id} className="bg-card p-5 rounded-2xl border border-border shadow-sm">
                      <div className="flex-1 mb-5">
                        <h3 className="font-bold text-lg text-text truncate pr-2" title={room.name}>{room.name}</h3>
                        <div className="flex items-center text-sm text-text-secondary mt-3 space-x-4">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{participantCount} participant{participantCount !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            <span>{room.questions?.length || 0} question{room.questions?.length !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="w-full flex items-center justify-between space-x-2 px-3 py-2 text-sm rounded-lg bg-bg-hover">
                          <span className="text-text-secondary font-mono text-xl tracking-wider">{room.code}</span>
                          <button onClick={() => copyToClipboard(room.code)} className="p-2 -m-1 rounded-full hover:bg-border" title="Copy room code">
                            {copiedCode === room.code ? (
                              <Check className="w-5 h-5 text-green-500" />
                            ) : (
                              <Copy className="w-5 h-5 text-text-secondary" />
                            )}
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <button onClick={() => handleJoinRoom(room.code)} className="w-full px-3 py-2.5 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors">
                            Enter Classroom
                          </button>
                          <button onClick={() => handleEndRoom(room.id)} className="w-full px-3 py-2.5 text-sm font-semibold rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors">
                            End Classroom
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 px-6 bg-card rounded-2xl border-2 border-dashed border-border">
                <div className="mx-auto w-20 h-20 flex items-center justify-center bg-primary/10 rounded-full mb-5">
                  <GraduationCap className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-text">No classrooms yet</h3>
                <p className="text-text-secondary mt-2 max-w-xs mx-auto">Click 'Create Classroom' to set up your first interactive session and engage with your students.</p>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default TeacherDashboard;
