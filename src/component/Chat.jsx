import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AppContext';
import { Loader2, AlertCircle } from 'lucide-react';

const Chat = ({ roomId }) => {
  const [message, setMessage] = useState('');
  const { socket, isConnected, messages, sendMessage } = useSocket();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle connection state changes
  useEffect(() => {
    if (!isConnected) {
      setError('Disconnected from server. Reconnecting...');
    } else {
      setError(null);
    }
  }, [isConnected]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim() || !user || !isConnected) return;
    
    try {
      setIsSending(true);
      
      await sendMessage({
        content: message,
        sender: user.name || 'Anonymous',
        roomId,
        isTeacher: user.role === 'teacher'
      });
      
      setMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mb-2" />
        <p>Connecting to chat...</p>
      </div>
    );
  }

  // Join room when component mounts
  useEffect(() => {
    if (socket && user) {
      // Join the room when the component mounts
      socket.emit('join_room', { 
        roomId, 
        userId: user.id,
        isTeacher: user.role === 'teacher' 
      });
    }

    // Cleanup on unmount
    return () => {
      if (socket && user) {
        socket.emit('leave_room', { 
          roomId, 
          userId: user.id 
        });
      }
    };
  }, [roomId, socket, user]);

  return (
    <div className="flex flex-col h-full">
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            No messages yet. Send a message to start the conversation!
          </div>
        ) : (
          messages.map((msg, index) => (
            <div 
              key={index} 
              className={`flex ${msg.sender === (user?.name || 'Anonymous') ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.sender === (user?.name || 'Anonymous')
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : msg.isTeacher
                    ? 'bg-green-500 text-white rounded-bl-none'
                    : 'bg-gray-200 text-gray-800 rounded-bl-none'
                }`}
              >
                {msg.sender !== (user?.name || 'Anonymous') && (
                  <div className="font-bold text-xs">
                    {msg.sender} {msg.isTeacher ? '(Teacher)' : ''}
                  </div>
                )}
                <div>{msg.content}</div>
                <div className="text-xs opacity-70 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message input */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-white/50">
        <div className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={!isConnected || isSending}
          />
          <button
            type="submit"
            disabled={!message.trim() || !isConnected || isSending}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px]"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Send'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
