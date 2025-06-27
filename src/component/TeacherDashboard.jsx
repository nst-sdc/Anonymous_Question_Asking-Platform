import React, { useState } from 'react';
import { GraduationCap, Plus, Users, LogOut, Copy, Check, MessageSquare } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Chat from './Chat';

// TeacherDashboard component
const TeacherDashboard = () => {
  const [roomName, setRoomName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');
  const { user, currentRoom, createRoom, logout, rooms, joinRoom } = useApp();

  const handleCreateRoom = () => {
    if (!roomName.trim()) return;
    createRoom(roomName);
    setRoomName('');
    setShowCreateForm(false);
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  // If user is in a room, show the Chat component
  if (currentRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 p-4">
        <div className="max-w-6xl mx-auto h-screen flex flex-col">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-4 mb-4 border border-white/20 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Room: {currentRoom.name}</h1>
                <p className="text-gray-600 text-sm">Share this code with students: {currentRoom.code}</p>
              </div>
            </div>
            <button
              onClick={() => joinRoom(null)}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Leave Room</span>
            </button>
          </div>
          <div className="flex-1 bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 overflow-hidden">
            <Chat roomId={currentRoom.code} />
          </div>
        </div>
      </div>
    );
  }

  // Filter rooms for the current teacher
  const teacherRooms = rooms.filter((room) => room.teacherId === user?.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Welcome, {user?.anonymousName}</h1>
                <p className="text-gray-600 text-sm">Teacher Dashboard</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Create Room Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border border-white/20">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Your Classrooms</h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create New</span>
            </button>
          </div>

          {showCreateForm && (
            <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-100">
              <h3 className="font-medium text-gray-700 mb-2">Create New Classroom</h3>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Enter classroom name"
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={handleCreateRoom}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          )}

          {/* List of Rooms */}
          {teacherRooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teacherRooms.map((room) => (
                <div
                  key={room.code}
                  className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-800">{room.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">Code: {room.code}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {room.students?.length || 0} students
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => copyToClipboard(room.code)}
                        className="p-2 text-gray-500 hover:text-purple-600 transition-colors"
                        title="Copy code"
                      >
                        {copiedCode === room.code ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => joinRoom(room.code)}
                        className="p-2 text-gray-500 hover:text-purple-600 transition-colors"
                        title="Enter classroom"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p>No classrooms yet. Create your first classroom to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
