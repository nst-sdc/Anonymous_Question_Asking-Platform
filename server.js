const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Simple profanity filter (you might want to use a more comprehensive solution in production)
const profanityWords = ['badword1', 'badword2', 'badword3']; // Add your list of profane words

function checkProfanity(input) {
  // Return empty string if input is not a string
  if (typeof input !== 'string') return '';

  let result = input;

  profanityWords.forEach(word => {
    try {
      // Match whole words only using word boundaries
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      result = result.replace(regex, '*'.repeat(word.length));
    } catch (error) {
      console.error('Error in profanity filter:', error);
    }
  });

  return result; // Make sure to return the result
}

// Test cases
console.log('Test 1 (clean input):', checkProfanity("Arpit"));           // Should return "Arpit"
console.log('Test 2 (profanity):', checkProfanity("You badword1!"));   // Should return "You ********!"
console.log('Test 3 (null input):', checkProfanity(null));             // Should return ""
console.log('Test 4 (number input):', checkProfanity(123));           // Should return ""

const app = express();
const server = http.createServer(app);

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  path: '/socket.io/',
  serveClient: false,
  // below are engine.IO options
  pingInterval: 10000,
  pingTimeout: 5000,
  cookie: false
});

// Store active rooms and their users
const rooms = new Map();

// Connection logging
io.on('connection', (socket) => {
  console.log(' New client connected:', socket.id);
  
  // Log when client disconnects
  socket.on('disconnect', (reason) => {
    console.log(` Client ${socket.id} disconnected. Reason: ${reason}`);
  });

  // Log connection errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  // Handle joining a room
  socket.on('join_room', ({ roomId, userId, isTeacher }, callback) => {
    try {
      console.log(` User ${userId} (${isTeacher ? 'Teacher' : 'Student'}) attempting to join room ${roomId}`);
      
      // Create room if it doesn't exist
      if (!rooms.has(roomId)) {
        console.log(` Creating new room: ${roomId}`);
        rooms.set(roomId, new Set());
      }
      
      // Add user to room
      rooms.get(roomId).add({
        socketId: socket.id,
        userId,
        isTeacher
      });
      
      // Join the socket room
      socket.join(roomId);
      
      // Notify the user they've joined
      if (callback && typeof callback === 'function') {
        callback({ success: true, roomId });
      }
      
      console.log(` User ${userId} joined room ${roomId}`);
      
      // Notify others in the room
      socket.to(roomId).emit('user_joined', { userId, isTeacher });
      
    } catch (error) {
      console.error('Error joining room:', error);
      if (callback && typeof callback === 'function') {
        callback({ success: false, error: 'Failed to join room' });
      }
    }
  });

  // Handle leaving a room
  socket.on('leave_room', ({ roomId, userId }) => {
    if (rooms.has(roomId)) {
      // Remove user from room
      const roomUsers = Array.from(rooms.get(roomId));
      const user = roomUsers.find(u => u.userId === userId);
      
      if (user) {
        rooms.get(roomId).delete(user);
        
        // If room is empty, delete it
        if (rooms.get(roomId).size === 0) {
          rooms.delete(roomId);
        }
        
        // Leave the socket room
        socket.leave(roomId);
        
        // Notify the user they've left
        socket.emit('room_left', roomId);
        
        console.log(`User ${userId} left room ${roomId}`);
      }
    }
  });

  // Handle sending a message
  socket.on('send_message', (message) => {
    // Filter profanity from the message
    const filteredMessage = {
      ...message,
      content: checkProfanity(message.content)
    };
    
    // Broadcast the message to everyone in the room
    io.to(message.roomId).emit('message', filteredMessage);
    console.log(`Message in room ${message.roomId} from ${message.sender}: ${filteredMessage.content}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Remove user from all rooms
    for (const [roomId, users] of rooms.entries()) {
      const user = Array.from(users).find(u => u.socketId === socket.id);
      if (user) {
        users.delete(user);
        
        // If room is empty, delete it
        if (users.size === 0) {
          rooms.delete(roomId);
        }
        
        console.log(`User ${user.userId} disconnected from room ${roomId}`);
      }
    }
  });
});

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
  console.log(` Socket.IO endpoint: http://localhost:${PORT}/socket.io/`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
