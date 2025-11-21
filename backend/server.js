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
  socket.on('send_message', async (data) => {
    const { roomId, userId, content, anonymousId, replyTo } = data;

    // Check for profanity
    if (containsProfanity(content)) {
      socket.emit('message_error', {
        error: 'Message contains inappropriate content and cannot be sent.'
      });
      return;
    }

    const cleanedContent = cleanMessage(content);

    // Fetch parent message if this is a reply
    let parentMessage = null;
    if (replyTo) {
      try {
        const { data: parent } = await supabase
          .from('messages')
          .select('id, content, user_id')
          .eq('id', replyTo)
          .single();

        if (parent) {
          // Get anonymous_id for parent message author
          const { data: parentMember } = await supabase
            .from('room_members')
            .select('anonymous_id')
            .eq('room_id', roomId)
            .eq('user_id', parent.user_id)
            .single();

          parentMessage = {
            id: parent.id,
            content: parent.content,
            anonymous_id: parentMember?.anonymous_id || 'Unknown'
          };
        }
      } catch (error) {
        console.error('Error fetching parent message:', error);
      }
    }

    // Prepare message data for broadcast
    // Note: Frontend will save to Supabase with proper authentication
    // Backend only broadcasts for real-time updates
    const messageData = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      content: cleanedContent,
      anonymous_id: anonymousId,
      created_at: new Date().toISOString(),
      reactions: {},
      user_reactions: {},
      reply_to: replyTo,
      parent_message: parentMessage
    };

    // Broadcast message to all users in room for real-time updates
    io.to(roomId).emit('new_message', messageData);
    console.log(`Message sent in room ${roomId} by ${anonymousId}`);
  });

  // Handle message reaction
  socket.on('add_reaction', async (data) => {
    const { roomId, messageId, userId, reactionType } = data;

    try {
      // Frontend already saved the reaction to Supabase with proper auth
      // Backend just fetches updated counts and broadcasts to other users

      // Fetch updated reaction counts from Supabase
      const { data: allReactions } = await supabase
        .from('message_reactions')
        .select('reaction_type, user_id')
        .eq('message_id', messageId);

      // Calculate reaction counts
      const reactions = allReactions?.reduce((acc, reaction) => {
        acc[reaction.reaction_type] = (acc[reaction.reaction_type] || 0) + 1;
        return acc;
      }, {}) || {};

      // Create user_reactions map
      const userReactions = allReactions?.reduce((acc, reaction) => {
        acc[reaction.user_id] = reaction.reaction_type;
        return acc;
      }, {}) || {};

      const reactionData = {
        messageId,
        reactions,
        user_reactions: userReactions
      };

      // Broadcast reaction update to all users in room
      io.to(roomId).emit('reaction_update', reactionData);
      console.log(`Reaction updated for message ${messageId} by ${userId}`);
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
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

    try {
      // Save poll to Supabase first to get a proper UUID
      const { data: savedPoll, error } = await supabase
        .from('polls')
        .insert([{
          room_id: roomId,
          created_by: userId,
          creator_anonymous_id: anonymousId,
          question: cleanMessage(question),
          poll_type: pollType,
          options: cleanOptions,
          votes: {},
          vote_counts: new Array(cleanOptions.length).fill(0),
          is_active: true
        }])
        .select()
        .single();

      if (error) {
        console.error('Error saving poll to Supabase:', error);
        socket.emit('poll_error', { error: 'Could not save the poll.' });
        return;
      }

      // Prepare poll data for in-memory storage and broadcast
      const pollData = {
        id: savedPoll.id,
        roomId,
        createdBy: userId,
        question: savedPoll.question,
        pollType,
        options: cleanOptions,
        votes: {},
        voteCounts: new Array(cleanOptions.length).fill(0),
        isActive: true,
        createdAt: savedPoll.created_at,
        creatorAnonymousId: anonymousId
      };

      // Store poll in room for active tracking
      const room = rooms.get(roomId);
      if (room) {
        room.polls.set(savedPoll.id, pollData);
      }

      // Broadcast new poll to all users in room
      io.to(roomId).emit('new_poll', pollData);
      console.log(`Poll created in room ${roomId} by ${anonymousId}`);
    } catch (error) {
      console.error('Error creating poll:', error);
      socket.emit('poll_error', { error: 'An error occurred while creating the poll.' });
    }
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
