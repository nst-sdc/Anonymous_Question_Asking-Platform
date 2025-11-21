const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const Filter = require('bad-words');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Frontend URL that is allowed to connect
const allowedOrigins = [
  "https://annoymeet.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000"
];

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Profanity filter
const filter = new Filter();

// Store active rooms and users
const rooms = new Map();
const userSockets = new Map();
const roomCleanupTimers = new Map();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Helper functions
const getRoomMembers = (roomId) => {
  const room = rooms.get(roomId);
  return room ? Array.from(room.members.values()) : [];
};

const addUserToRoom = (roomId, userId, socketId, anonymousId) => {
  if (roomCleanupTimers.has(roomId)) {
    clearTimeout(roomCleanupTimers.get(roomId));
    roomCleanupTimers.delete(roomId);
    console.log(`Canceled cleanup for room ${roomId}`);
  }

  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      members: new Map(),
      messages: [],
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

  userSockets.set(socketId, { userId, roomId, anonymousId });
};

const removeUserFromRoom = (roomId, userId) => {
  const room = rooms.get(roomId);
  if (room) {
    room.members.delete(userId);
    if (room.members.size === 0) {
      console.log(`Room ${roomId} is empty, starting cleanup timer.`);
      const timerId = setTimeout(() => {
        rooms.delete(roomId);
        roomCleanupTimers.delete(roomId);
        console.log(`Cleaned up empty room ${roomId}`);
      }, 30000); // 30 seconds
      roomCleanupTimers.set(roomId, timerId);
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
  socket.on('join_room', async (data) => {
    const { roomId, userId, anonymousId } = data;

    socket.join(roomId);
    addUserToRoom(roomId, userId, socket.id, anonymousId);

    const members = getRoomMembers(roomId);

    // Notify all users in room about new member
    io.to(roomId).emit('user_joined', {
      userId,
      anonymousId,
      members,
      organizer_id: rooms.get(roomId)?.organizer_id
    });

    // Fetch active polls from Supabase
    const { data: activePolls, error: pollsError } = await supabase
      .from('polls')
      .select('*')
      .eq('room_id', roomId)
      .eq('is_active', true);

    if (pollsError) {
      console.error('Error fetching polls from Supabase:', pollsError);
    } else {
      // Update in-memory poll store for now
      const room = rooms.get(roomId);
      if (room) {
        room.polls.clear();
        activePolls.forEach(poll => room.polls.set(poll.id, poll));
      }
    }

    // Send current room state to joining user
    const room = rooms.get(roomId);
    if (room) {
      socket.emit('room_state', {
        members,
        messages: room.messages,
        polls: activePolls || []
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
    const room = rooms.get(roomId);

    const messageData = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      content: cleanedContent,
      anonymous_id: anonymousId,
      created_at: new Date().toISOString(),
      reactions: {},
      user_reactions: {},
      reply_to: replyTo,
      parent_message: null
    };

    if (replyTo && room) {
      const parentMessage = room.messages.find(m => m.id === replyTo);
      if (parentMessage) {
        messageData.parent_message = {
          id: parentMessage.id,
          content: parentMessage.content,
          anonymous_id: parentMessage.anonymous_id
        };
      }
    }

    if (room) {
      room.messages.push(messageData);
    }

    // Broadcast message to all users in room
    io.to(roomId).emit('new_message', messageData);
    console.log(`Message sent in room ${roomId} by ${anonymousId}`);
  });

  // Handle message reaction
  socket.on('add_reaction', (data) => {
    const { roomId, messageId, userId, reactionType } = data;
    const room = rooms.get(roomId);
    if (!room) return;

    const message = room.messages.find(m => m.id === messageId);
    if (!message) return;

    const userCurrentReaction = message.user_reactions[userId];

    // If user is clicking the same reaction, undo it
    if (userCurrentReaction === reactionType) {
      message.reactions[reactionType] = (message.reactions[reactionType] || 0) - 1;
      if (message.reactions[reactionType] <= 0) {
        delete message.reactions[reactionType];
      }
      delete message.user_reactions[userId];
    } else {
      // If user has an existing reaction, remove it first
      if (userCurrentReaction) {
        message.reactions[userCurrentReaction] = (message.reactions[userCurrentReaction] || 0) - 1;
        if (message.reactions[userCurrentReaction] <= 0) {
          delete message.reactions[userCurrentReaction];
        }
      }
      // Add the new reaction
      message.reactions[reactionType] = (message.reactions[reactionType] || 0) + 1;
      message.user_reactions[userId] = reactionType;
    }

    const reactionData = {
      messageId,
      reactions: message.reactions,
      user_reactions: message.user_reactions
    };

    io.to(roomId).emit('reaction_update', reactionData);
    console.log(`Reaction updated for message ${messageId} by ${userId}`);
  });

  // Handle poll creation
  socket.on('create_poll', async (data) => {
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

    // Save poll to Supabase
    const { error } = await supabase.from('polls').insert([{
      id: pollId,
      room_id: roomId,
      created_by: userId,
      creator_anonymous_id: anonymousId,
      question: pollData.question,
      poll_type: pollType,
      options: cleanOptions,
      votes: {},
      vote_counts: pollData.voteCounts,
      is_active: true
    }]);

    if (error) {
      console.error('Error saving poll to Supabase:', error);
      socket.emit('poll_error', { error: 'Could not save the poll.' });
      return;
    }

    // Broadcast new poll to all users in room
    io.to(roomId).emit('new_poll', pollData);
    console.log(`Poll created in room ${roomId} by ${anonymousId}`);
  });

  // Handle poll vote
  socket.on('vote_poll', async ({ roomId, pollId, userId, optionIndex, anonymousId }) => {
    if (!rooms.has(roomId)) return;

    const room = rooms.get(roomId);
    const poll = room.polls.get(pollId);
    if (!poll) return;

    // Update vote
    poll.votes[userId] = optionIndex;

    // Recalculate and update vote counts
    poll.voteCounts = poll.options.map((_, index) =>
      Object.values(poll.votes).filter(vote => vote === index).length
    );
    const totalVotes = Object.keys(poll.votes).length;

    const voteData = {
      pollId,
      userId,
      optionIndex,
      anonymousId,
      voteCounts: poll.voteCounts,
      totalVotes
    };

    // Update poll in Supabase
    const { error } = await supabase
      .from('polls')
      .update({ votes: poll.votes, vote_counts: poll.voteCounts })
      .eq('id', pollId);

    if (error) {
      console.error('Error updating poll vote in Supabase:', error);
      socket.emit('poll_error', { error: 'Could not save your vote.' });
      return;
    }

    // Broadcast vote update to all users in room
    io.to(roomId).emit('poll_vote_update', voteData);
    console.log(`Vote cast in poll ${pollId} by ${anonymousId}`);
  });

  // Handle end poll
  socket.on('end_poll', async (data) => {
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

    // Mark the poll as inactive in Supabase
    const { error } = await supabase
      .from('polls')
      .update({ is_active: false })
      .eq('id', pollId);

    if (error) {
      console.error('Error ending poll in Supabase:', error);
      socket.emit('poll_error', { error: 'Could not end the poll.' });
      return;
    }

    // Remove the poll from memory
    room.polls.delete(pollId);

    // Broadcast poll end to all users in room
    io.to(roomId).emit('poll_ended', { pollId });

    console.log(`Poll ${pollId} ended in room ${roomId}`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const userInfo = userSockets.get(socket.id);
    if (userInfo) {
      const { userId, roomId, anonymousId } = userInfo;
      removeUserFromRoom(roomId, userId);

      const members = getRoomMembers(roomId);

      // Notify remaining users
      socket.to(roomId).emit('user_left', {
        userId,
        anonymousId,
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

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
