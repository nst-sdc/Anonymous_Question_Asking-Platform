const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

// Create Express app
const app = express();
const server = http.createServer(app);

// Enable CORS for all routes
app.use(cors());

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST"],
    credentials: true
  },
  // Enable HTTP long-polling as fallback
  transports: ["websocket", "polling"]
});

// Store active rooms and users
const rooms = new Map();
const users = new Map();

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);
  
  // Handle joining a room
  socket.on('joinRoom', ({ roomId, user }) => {
    try {
      // Add user to the room
      socket.join(roomId);
      
      // Initialize room if it doesn't exist
      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          id: roomId,
          users: new Map(),
          messages: [],
          questions: [],
          polls: []
        });
      }
      
      const room = rooms.get(roomId);
      
      // Add user to the room
      room.users.set(socket.id, {
        id: socket.id,
        ...user,
        joinedAt: new Date()
      });
      
      // Store user info
      users.set(socket.id, {
        ...user,
        roomId,
        socketId: socket.id
      });
      
      // Notify room about new user
      socket.to(roomId).emit('userJoined', {
        user: {
          id: socket.id,
          ...user
        },
        users: Array.from(room.users.values())
      });
      
      // Send room data to the new user
      socket.emit('roomData', {
        room: {
          ...room,
          users: Array.from(room.users.values()),
          messages: room.messages.slice(-50) // Send last 50 messages
        }
      });
      
      console.log(`User ${user.name} joined room ${roomId}`);
      
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });
  
  // Handle new message
  socket.on('sendMessage', ({ roomId, message, user }) => {
    try {
      const room = rooms.get(roomId);
      if (!room) return;
      
      const newMessage = {
        id: Date.now().toString(),
        text: message.text,
        user: {
          id: user.id,
          name: user.name,
          role: user.role
        },
        timestamp: new Date()
      };
      
      // Store message
      room.messages.push(newMessage);
      
      // Broadcast to room
      io.to(roomId).emit('newMessage', newMessage);
      
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    
    const user = users.get(socket.id);
    if (!user) return;
    
    const { roomId } = user;
    const room = rooms.get(roomId);
    
    if (room) {
      // Remove user from room
      room.users.delete(socket.id);
      
      // Notify room if there are still users
      if (room.users.size > 0) {
        socket.to(roomId).emit('userLeft', {
          userId: socket.id,
          users: Array.from(room.users.values())
        });
      } else {
        // Remove empty room after a delay
        setTimeout(() => {
          if (rooms.has(roomId) && rooms.get(roomId).users.size === 0) {
            rooms.delete(roomId);
            console.log(`Room ${roomId} removed (empty)`);
          }
        }, 60000); // 1 minute delay
      }
    }
    
    // Remove user from users map
    users.delete(socket.id);
  });
  
  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    rooms: rooms.size,
    users: users.size
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);n  // Application specific logging, throwing an error, or other logic here
});
