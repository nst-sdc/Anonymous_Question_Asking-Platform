import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { checkProfanity } from '../utils/helpers';

// Default context values
const SocketContext = createContext({
  socket: null,
  isConnected: false,
  sendMessage: () => {},
  messages: [],
  room: null,
  joinRoom: () => {},
  leaveRoom: () => {},
});

// Custom hook to use socket context
export const useSocket = () => useContext(SocketContext);

// Context provider
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [room, setRoom] = useState(null);
  const [pendingMessages, setPendingMessages] = useState(new Map());

  // Initialize socket connection
  useEffect(() => {
    console.log('Initializing socket connection...');
    const socketIo = io('http://localhost:3001', {
      withCredentials: true,
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const onConnect = () => {
      console.log('✅ Connected to Socket.IO server');
      setIsConnected(true);
    };

    const onDisconnect = (reason) => {
      console.log('❌ Disconnected from Socket.IO server. Reason:', reason);
      setIsConnected(false);
    };

    const onConnectError = (error) => {
      console.error('Connection error:', error);
    };

    const onMessage = (message) => {
      // Check if this is a message we've already handled locally
      if (pendingMessages.has(message.tempId)) {
        // Update the message with server-side data if needed
        setMessages(prev => prev.map(msg => 
          msg.tempId === message.tempId ? { ...message, tempId: undefined } : msg
        ));
        // Remove from pending messages
        setPendingMessages(prev => {
          const newMap = new Map(prev);
          newMap.delete(message.tempId);
          return newMap;
        });
      } else {
        // This is a new message from another user
        setMessages(prev => [...prev, message]);
      }
    };

    const onRoomJoined = (roomId) => {
      console.log(`Joined room: ${roomId}`);
      setRoom(roomId);
      // Clear messages when joining a new room
      setMessages([]);
    };

    const onRoomLeft = (roomId) => {
      console.log(`Left room: ${roomId}`);
      if (room === roomId) {
        setRoom(null);
        setMessages([]);
      }
    };

    socketIo.on('connect', onConnect);
    socketIo.on('disconnect', onDisconnect);
    socketIo.on('connect_error', onConnectError);
    socketIo.on('message', onMessage);
    socketIo.on('room_joined', onRoomJoined);
    socketIo.on('room_left', onRoomLeft);

    setSocket(socketIo);

    return () => {
      socketIo.off('connect', onConnect);
      socketIo.off('disconnect', onDisconnect);
      socketIo.off('connect_error', onConnectError);
      socketIo.off('message', onMessage);
      socketIo.off('room_joined', onRoomJoined);
      socketIo.off('room_left', onRoomLeft);
      socketIo.disconnect();
    };
  }, [room]);

  // Function to send a message
  const sendMessage = useCallback(({ content, sender, roomId, isTeacher = false }) => {
    if (!socket || !content.trim()) return;
    
    // Filter profanity from the message
    const filteredContent = checkProfanity(content);
    
    const tempId = Date.now().toString();
    const message = {
      content: filteredContent,
      sender,
      roomId,
      isTeacher,
      timestamp: new Date().toISOString(),
      tempId, // Temporary ID to track pending messages
    };
    
    // Add to pending messages
    setPendingMessages(prev => new Map(prev).set(tempId, true));
    
    // Add to local state for immediate feedback (without tempId to avoid duplicates)
    const { tempId: _, ...messageForState } = message;
    setMessages(prev => [...prev, messageForState]);
    
    // Send to server
    socket.emit('send_message', message);
  }, [socket]);

  // Function to join a room
  const joinRoom = useCallback((roomId, user) => {
    if (!socket || !roomId) return;
    
    socket.emit('join_room', { 
      roomId, 
      userId: user.id,
      isTeacher: user.role === 'teacher' 
    });
  }, [socket]);

  // Function to leave a room
  const leaveRoom = useCallback((roomId, userId) => {
    if (!socket || !roomId) return;
    
    socket.emit('leave_room', { roomId, userId });
    setRoom(null);
    setMessages([]);
  }, [socket]);

  return (
    <SocketContext.Provider 
      value={{ 
        socket, 
        isConnected, 
        sendMessage, 
        messages, 
        room,
        joinRoom,
        leaveRoom 
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
