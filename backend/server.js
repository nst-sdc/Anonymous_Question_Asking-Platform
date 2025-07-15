const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const Filter = require('bad-words');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      "https://annoymeet.vercel.app"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: [
    "https://annoymeet.vercel.app"
  ],
  credentials: true
}));
app.use(express.json());

// Profanity filter
const filter = new Filter();

// Store active rooms and users
const rooms = new Map();
const userSockets = new Map();

// Helper functions
const getRoomMembers = (roomId) => {
  const room = rooms.get(roomId);
  return room ? Array.from(room.members.values()) : [];
};

const addUserToRoom = (roomId, userId, socketId, anonymousId) => {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      members: new Map(),
      polls: new Map()
    });
  }
  
  const room = rooms.get(roomId);
  room.members.set(userId, {
    userId,
    socketId,
    anonymousId,
    joinedAt: new Date().toISOString()
  });
  
  userSockets.set(socketId, { userId, roomId });
};

const removeUserFromRoom = (roomId, userId) => {
  const room = rooms.get(roomId);
  if (room) {
    room.members.delete(userId);
    if (room.members.size === 0) {
      rooms.delete(roomId);
    }
  }
};

const cleanMessage = (content) => {
  try {
    return filter.clean(content);
  } catch (error) {
    console.error('Error filtering message:', error);
    return content;
  }
};

const containsProfanity = (content) => {
  try {
    return filter.isProfane(content);
  } catch (error) {
    console.error('Error checking profanity:', error);
    return false;
  }
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join room
  socket.on('join_room', (data) => {
    const { roomId, userId, anonymousId } = data;
    
    socket.join(roomId);
    addUserToRoom(roomId, userId, socket.id, anonymousId);
    
    const members = getRoomMembers(roomId);
    
    // Notify all users in room about new member
    io.to(roomId).emit('user_joined', {
      userId,
      anonymousId,
      members
    });
    
    // Send current room state to joining user
    const room = rooms.get(roomId);
    if (room) {
      socket.emit('room_state', {
        members,
        polls: Array.from(room.polls.values())
      });
    }
    
    console.log(`User ${anonymousId} joined room ${roomId}`);
  });

  // Leave room
  socket.on('leave_room', (data) => {
    const { roomId, userId, anonymousId } = data;
    
    socket.leave(roomId);
    removeUserFromRoom(roomId, userId);
    
    const members = getRoomMembers(roomId);
    
    // Notify remaining users
    socket.to(roomId).emit('user_left', {
      userId,
      anonymousId,
      members
    });
    
    userSockets.delete(socket.id);
    console.log(`User ${anonymousId} left room ${roomId}`);
  });

  // Handle new message
  socket.on('send_message', (data) => {
    const { roomId, userId, content, anonymousId, replyTo } = data;
    
    // Check for profanity
    if (containsProfanity(content)) {
      socket.emit('message_error', {
        error: 'Message contains inappropriate content and cannot be sent.'
      });
      return;
    }
    
    const cleanedContent = cleanMessage(content);
    
    const messageData = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      roomId,
      userId,
      content: cleanedContent,
      anonymousId,
      replyTo,
      timestamp: new Date().toISOString(),
      reactions: { yes: 0, no: 0 }
    };
    
    // Broadcast to all users in room
    io.to(roomId).emit('new_message', messageData);
    console.log(`Message sent in room ${roomId} by ${anonymousId}`);
  });

  // Handle message reaction
  socket.on('add_reaction', (data) => {
    const { roomId, messageId, userId, reactionType, anonymousId } = data;
    
    const reactionData = {
      messageId,
      userId,
      reactionType,
      anonymousId,
      timestamp: new Date().toISOString()
    };
    
    // Broadcast reaction to all users in room
    io.to(roomId).emit('reaction_added', reactionData);
    console.log(`Reaction ${reactionType} added to message ${messageId} by ${anonymousId}`);
  });

  // Handle poll creation
  socket.on('create_poll', (data) => {
    const { roomId, userId, question, pollType, options, anonymousId } = data;
    
    // Check for profanity in question and options
    if (containsProfanity(question)) {
      socket.emit('poll_error', {
        error: 'Poll question contains inappropriate content.'
      });
      return;
    }
    
    const cleanOptions = options.map(option => {
      if (containsProfanity(option)) {
        socket.emit('poll_error', {
          error: 'Poll option contains inappropriate content.'
        });
        return null;
      }
      return cleanMessage(option);
    });
    
    if (cleanOptions.includes(null)) return;
    
    const pollId = `poll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const pollData = {
      id: pollId,
      roomId,
      createdBy: userId,
      question: cleanMessage(question),
      pollType,
      options: cleanOptions,
      votes: {},
      voteCounts: new Array(cleanOptions.length).fill(0),
      isActive: true,
      createdAt: new Date().toISOString(),
      creatorAnonymousId: anonymousId
    };
    
    // Store poll in room
    const room = rooms.get(roomId);
    if (room) {
      room.polls.set(pollId, pollData);
    }
    
    // Broadcast new poll to all users in room
    io.to(roomId).emit('new_poll', pollData);
    console.log(`Poll created in room ${roomId} by ${anonymousId}`);
  });

  // Handle poll vote
  socket.on('vote_poll', (data) => {
    const { roomId, pollId, userId, optionIndex, anonymousId } = data;
    
    const room = rooms.get(roomId);
    if (!room || !room.polls.has(pollId)) {
      socket.emit('vote_error', { error: 'Poll not found' });
      return;
    }
    
    const poll = room.polls.get(pollId);
    
    if (!poll.isActive) {
      socket.emit('vote_error', { error: 'Poll has ended' });
      return;
    }
    
    // Remove previous vote if exists
    if (poll.votes[userId] !== undefined) {
      poll.voteCounts[poll.votes[userId]]--;
    }
    
    // Add new vote
    poll.votes[userId] = optionIndex;
    poll.voteCounts[optionIndex]++;
    
    const voteData = {
      pollId,
      userId,
      optionIndex,
      anonymousId,
      voteCounts: poll.voteCounts,
      totalVotes: Object.keys(poll.votes).length
    };
    
    // Broadcast vote update to all users in room
    io.to(roomId).emit('poll_vote_update', voteData);
    console.log(`Vote cast in poll ${pollId} by ${anonymousId}`);
  });

  // Handle end poll
  socket.on('end_poll', (data) => {
    const { roomId, pollId, userId } = data;
    
    const room = rooms.get(roomId);
    if (!room || !room.polls.has(pollId)) {
      socket.emit('poll_error', { error: 'Poll not found' });
      return;
    }
    
    const poll = room.polls.get(pollId);
    
    // Check if user is poll creator or room organizer
    if (poll.createdBy !== userId) {
      socket.emit('poll_error', { error: 'Only poll creator can end the poll' });
      return;
    }
    
    poll.isActive = false;
    poll.endedAt = new Date().toISOString();
    
    // Broadcast poll end to all users in room
    io.to(roomId).emit('poll_ended', {
      pollId,
      endedBy: userId,
      finalResults: {
        voteCounts: poll.voteCounts,
        totalVotes: Object.keys(poll.votes).length
      }
    });
    
    console.log(`Poll ${pollId} ended in room ${roomId}`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const userInfo = userSockets.get(socket.id);
    if (userInfo) {
      const { userId, roomId } = userInfo;
      removeUserFromRoom(roomId, userId);
      
      const members = getRoomMembers(roomId);
      
      // Notify remaining users
      socket.to(roomId).emit('user_left', {
        userId,
        members
      });
      
      userSockets.delete(socket.id);
    }
    
    console.log('User disconnected:', socket.id);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    activeRooms: rooms.size,
    connectedUsers: userSockets.size
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});