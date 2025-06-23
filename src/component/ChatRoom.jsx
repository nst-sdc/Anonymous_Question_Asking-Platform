import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useSocket } from '../context/SocketContext';
import { formatTime } from '../utils/helpers';

const ChatRoom = () => {
  const { currentRoom, user, setCurrentRoom, rooms, setRooms } = useApp();
  const { socket } = useSocket();
  const [message, setMessage] = useState('');

  if (!currentRoom) return null;


  const room = rooms.find(r => r.id === currentRoom.id) || currentRoom;
  const participants = room.participants || [];
  const messages = room.messages || [];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newMsg = {
      id: Math.random().toString(36).substr(2, 9),
      sender: user.anonymousName,
      senderId: user.id,
      text: message,
      timestamp: new Date().toISOString(),
    };
    setRooms(prevRooms => prevRooms.map(r =>
      r.id === room.id ? { ...r, messages: [...r.messages, newMsg] } : r
    ));
    setMessage('');

    if (socket) {
      socket.emit('send_message', { roomId: room.id, message: newMsg });
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 min-h-[70vh]">
      <div className="w-full md:w-1/4 bg-white/80 rounded-2xl shadow-lg p-4 mb-4 md:mb-0">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <span className="inline-block w-5 h-5 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mr-1"></span>
          Students
        </h3>
        <ul className="space-y-3">
          {participants.filter(p => p.role === 'student').map(student => (
            <li key={student.id} className="flex items-center gap-3 text-gray-700 bg-purple-50 rounded-xl px-3 py-2 shadow-sm">
              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center text-white font-bold text-sm">
                {student.anonymousName.split(' ')[0][0]}
              </span>
              <span className="font-medium">{student.anonymousName}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-1 bg-white/80 rounded-2xl shadow-lg p-4 flex flex-col">
        <div className="flex-1 overflow-y-auto mb-4 pr-2">
          {messages.length === 0 ? (
            <div className="text-gray-400 text-center mt-10">No messages yet.</div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className={`mb-3 flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-4 py-2 rounded-2xl shadow ${msg.senderId === user.id ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white' : 'bg-gray-100'} relative`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${msg.senderId === user.id ? 'bg-white/30 text-white' : 'bg-purple-200 text-purple-700'}`}>{msg.sender[0]}</span>
                    <span className={`text-xs ${msg.senderId === user.id ? 'text-white/80' : 'text-gray-500'}`}>{msg.sender}</span>
                  </div>
                  <div className="break-words text-sm">{msg.text}</div>
                  <div className="text-[10px] text-right mt-1 opacity-70">{formatTime(msg.timestamp)}</div>
                </div>
              </div>
            ))
          )}
        </div>
        <form onSubmit={handleSendMessage} className="flex gap-2 mt-auto">
          <input
            type="text"
            className="flex-1 border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white/90"
            placeholder="Type your message..."
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-5 py-2 rounded-xl font-semibold shadow hover:from-purple-600 hover:to-pink-700 transition-all duration-200"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;