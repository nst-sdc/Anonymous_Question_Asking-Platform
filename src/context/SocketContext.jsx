import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// Default context values
const SocketContext = createContext({
  socket: null,
  isConnected: false,
});

// Custom hook to use socket context
export const useSocket = () => useContext(SocketContext);

// Context provider
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketIo = io('http://localhost:3001', {
      withCredentials: true,
      autoConnect: true,
    });

    const onConnect = () => {
      console.log('Connected to Socket.IO server');
      setIsConnected(true);
    };

    const onDisconnect = () => {
      console.log('Disconnected from Socket.IO server');
      setIsConnected(false);
    };

    socketIo.on('connect', onConnect);
    socketIo.on('disconnect', onDisconnect);

    setSocket(socketIo);

    return () => {
      socketIo.off('connect', onConnect);
      socketIo.off('disconnect', onDisconnect);
      socketIo.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
