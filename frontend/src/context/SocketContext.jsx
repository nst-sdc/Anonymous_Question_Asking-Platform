import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { io } from 'socket.io-client';

// Default context values
const SocketContext = createContext({
  socket: null,
  isConnected: false,
  isMock: false,
});

// Custom hook to use socket context
export const useSocket = () => useContext(SocketContext);

// Mock socket implementation for development
const createMockSocket = () => {
  const callbacks = {};
  
  return {
    connected: false,
    on: (event, callback) => {
      if (!callbacks[event]) callbacks[event] = [];
      callbacks[event].push(callback);
    },
    off: (event, callback) => {
      if (callbacks[event]) {
        callbacks[event] = callbacks[event].filter(cb => cb !== callback);
      }
    },
    emit: (event, ...args) => {
      console.log(`[MOCK SOCKET] Emitted ${event}`, args);
      // Simulate server response
      if (event === 'createRoom') {
        const [data, ack] = args;
        if (typeof ack === 'function') {
          setTimeout(() => ack({ 
            success: true, 
            room: { 
              id: 'mock-room-123',
              name: data.roomName,
              createdBy: 'mock-user',
              createdAt: new Date().toISOString()
            } 
          }), 500);
        }
      }
    },
    disconnect: () => {
      console.log('[MOCK SOCKET] Disconnected');
    },
    connect: () => {
      console.log('[MOCK SOCKET] Connected');
      return this;
    },
    // Add other socket methods as needed
  };
};

// Context provider
export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMock, setIsMock] = useState(false);

  // Create socket instance
  const socket = useMemo(() => {
    try {
      // Try to connect to real socket server
      const socketIo = io('http://localhost:3001', {
        withCredentials: true,
        autoConnect: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
      });

      socketIo.on('connect', () => {
        console.log('✅ Socket connected with ID:', socketIo.id);
        setIsConnected(true);
        setIsMock(false);
      });

      socketIo.on('disconnect', () => {
        console.log('Disconnected from Socket.IO server');
        setIsConnected(false);
      });

      socketIo.on('connect_error', (error) => {
        console.error('❌ Connection error:', error.message);
        setIsConnected(false);
        // Fall back to mock socket if real connection fails
        if (!isMock) {
          console.log('Falling back to mock socket');
          setIsMock(true);
          setIsConnected(true); 
        }
      });

      return socketIo;
    } catch (error) {
      console.error('Failed to initialize socket:', error);
      // Return mock socket if initialization fails
      console.log('Using mock socket');
      setIsMock(true);
      setIsConnected(true);
      return createMockSocket();
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (socket && !isMock) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('connect_error');
        socket.disconnect();
      }
    };
  }, [socket, isMock]);

  const value = useMemo(() => ({
    socket,
    isConnected,
    isMock,
  }), [socket, isConnected, isMock]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
