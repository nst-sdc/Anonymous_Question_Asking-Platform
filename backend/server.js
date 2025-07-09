require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { supabase } = require('./database');

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

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);

  socket.on('joinRoom', async ({ roomId, user }) => {
    try {
      socket.join(roomId);
      console.log(`${user.name} joined room: ${roomId}`);

      // Ensure the room exists before adding a user
      const { error: roomError } = await supabase
        .from('rooms')
        .upsert({ room_id: roomId }, { onConflict: 'room_id' });

      if (roomError) {
        console.error('Supabase error creating room:', roomError);
        throw roomError;
      }

      // Insert user into Supabase
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({ ...user, socket_id: socket.id, room_id: roomId })
        .select()
        .single();

      if (userError) {
        console.error('Supabase error inserting user:', userError);
        throw userError;
      }
      console.log('✅ User inserted:', newUser);

      // Get all users in the room
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('room_id', roomId);

      if (usersError) throw usersError;

      // Notify other users in the room
      socket.to(roomId).emit('userJoined', { user: newUser, users });

      // Send room data to the new user
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('timestamp', { ascending: true });

      if (messagesError) throw messagesError;

      socket.emit('roomData', { room: { roomId, users, messages } });
    } catch (error) {
      console.error('Error in joinRoom:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  socket.on('sendMessage', async ({ roomId, message, user }) => {
    try {
      const newMessage = {
        text: message.text,
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        room_id: roomId,
      };

      const { data, error } = await supabase
        .from('messages')
        .insert(newMessage)
        .select()
        .single();

      if (error) {
        console.error('Supabase error inserting message:', error);
        throw error;
      }
      console.log('✅ Message inserted:', data);

      io.to(roomId).emit('newMessage', data);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('disconnect', async () => {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .delete()
        .eq('socket_id', socket.id)
        .select()
        .single();

      if (error || !user) {
        return console.log(`No user found with socket ID ${socket.id} to disconnect.`);
      }

      console.log(`User ${user.name} disconnected`);

      const { data: users } = await supabase
        .from('users')
        .select('*')
        .eq('room_id', user.room_id);

      io.to(user.room_id).emit('userLeft', { userId: socket.id, users: users || [] });
    } catch (error) {
      console.error('Error on disconnect:', error);
    }
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const { count: roomCount, error: roomError } = await supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true });

    const { count: userCount, error: userError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (roomError || userError) {
      throw roomError || userError;
    }

    res.status(200).json({
      status: 'ok',
      dbState: 'connected', // Assuming if no error, we are connected
      timestamp: new Date().toISOString(),
      rooms: roomCount,
      users: userCount,
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Health check failed', 
      error: error.message 
    });
  }
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
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});
