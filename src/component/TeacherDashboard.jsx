import React, { useState } from 'react';
import { GraduationCap, Plus, Users, LogOut, Copy, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

// TeacherDashboard component ka main logic
const TeacherDashboard = () => {
  // State variables
  const [roomName, setRoomName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');
  const { user, currentRoom, createRoom, logout, rooms, joinRoom } = useApp();

  // Room create karne ka handler
  const handleCreateRoom = () => {
    if (!roomName.trim()) return;
    createRoom(roomName); // naye room ka naam bhejkar create karo
    setRoomName('');
    setShowCreateForm(false); // form hide kar do
  };

  // Clipboard me room code copy karne ka function
  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code); // code copy karo
    setCopiedCode(code); // UI me check dikhane ke liye
    setTimeout(() => setCopiedCode(''), 2000); // 2 sec baad reset
  };

  // Agar user abhi kisi room me hai, toh ChatRoom dikhana chahiye
  if (currentRoom) {
    return <ChatRoom />;
  }

  // Sirf uss teacher ke rooms filter karo
  const teacherRooms = rooms.filter((room) => room.teacherId === user?.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 p-4">
      <div className="max-w-6xl mx-auto">
        
        {/* ==== Header Section ==== */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Dashboard icon */}
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Welcome, {user?.anonymousName}</h1>
                <p className="text-gray-600 text-sm">Teacher Dashboard</p>
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

        {/* ==== Room Management Section ==== */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Room Management</h2>

            {/* Create Room Button */}
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>Create Room</span>
            </button>
          </div>

          {/* ==== Room Creation Form ==== */}
          {showCreateForm && (
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex space-x-3">
                <input
                  type="text"
                  placeholder="Enter room name"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
                <button
                  onClick={handleCreateRoom}
                  className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          )}

          {/* ==== List of Created Rooms ==== */}
          {teacherRooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teacherRooms.map((room) => (
                <div key={room.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  
                  {/* Room name aur participants count */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800">{room.name}</h3>
                    <div className="flex items-center space-x-1 text-gray-500">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{room.participants?.length || 0}</span>
                    </div>
                  </div>

                  {/* Room code aur copy button */}
                  <div className="flex items-center space-x-2 mb-3">
                    <code className="bg-gray-100 px-3 py-1 rounded-lg font-mono text-sm">
                      {room.code}
                    </code>
                    <button
                      onClick={() => copyToClipboard(room.code)}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {copiedCode === room.code ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </div>

                  {/* Enter Room Button */}
                  <button
                    onClick={() => joinRoom(room.code)}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-2 px-4 rounded-lg text-sm hover:from-purple-600 hover:to-pink-700 transition-all duration-200"
                  >
                    Enter Room
                  </button>
                </div>
              ))}
            </div>
          ) : (
            // Agar koi room nahi bana hai
            <div className="text-center py-8 text-gray-500">
              <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No rooms created yet. Create your first room to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
