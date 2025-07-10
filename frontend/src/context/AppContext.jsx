import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useSocket } from './SocketContext';
import { generateAnonymousName, checkProfanity } from '../utils/helpers';

// Context for global state management
const AppContext = createContext();

// Custom hook to use the context easily
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

// Load state from localStorage with error handling
const loadState = (key, defaultValue) => {
  try {
    const savedState = localStorage.getItem(key);
    if (savedState === null) return defaultValue;
    return JSON.parse(savedState, (key, value) => {
      if (value && (key === 'timestamp' || key === 'silencedUntil' || key.endsWith('At'))) {
        return new Date(value);
      }
      return value;
    });
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

// Save state to localStorage with error handling
const saveState = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

// Main AppProvider component
export const AppProvider = ({ children }) => {
  const { socket, isConnected } = useSocket();
  // State management with localStorage persistence
  const [user, setUser] = useState(() => loadState('chat-user', null));
  const [currentRoom, setCurrentRoom] = useState(() => loadState('current-room', null));
  const [rooms, setRooms] = useState(() => loadState('chat-rooms', []));
  const [isLoading, setIsLoading] = useState(false); // Initialize as false to prevent relentless loading
  const [error, setError] = useState(null);

  // Save state to localStorage when it changes
  useEffect(() => {
    saveState('chat-user', user);
  }, [user]);

  useEffect(() => {
    saveState('current-room', currentRoom);
  }, [currentRoom]);

  useEffect(() => {
    saveState('chat-rooms', rooms);
    // Don't set isLoading here as it might cause issues with frequent room updates
  }, [rooms]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleRoomData = (data) => {
      console.log('Received roomData:', data);
      if (data && data.room) {
        // The backend sends { room: { roomId, users, messages } }
        // We need to find the full room object from our local state
        const roomFromState = rooms.find(r => r.code === data.room.roomId);
        if (roomFromState) {
          setCurrentRoom({
            ...roomFromState,
            participants: data.room.users,
            messages: data.room.messages,
          });
        } else {
          // If the room is not in local state (e.g., student joining),
          // we might need to fetch room details or create a placeholder.
          // For now, we'll just set what we have.
          setCurrentRoom({
            id: data.room.roomId, // Note: This might not be the UUID id
            code: data.room.roomId,
            name: 'Classroom', // Placeholder name
            participants: data.room.users,
            messages: data.room.messages,
          });
        }
      }
    };

    socket.on('roomData', handleRoomData);

    // Auto-rejoin room on socket reconnection
    if (isConnected && user && currentRoom) {
      console.log(`🟡 Reconnecting to room: ${currentRoom.name}`);
      socket.emit('joinRoom', { 
        roomId: currentRoom.code, 
        user: {
          id: user.id,
          name: user.anonymousName,
          role: user.role
        } 
      });
      console.log('✅ joinRoom event emitted on reconnect.');
    }

    return () => {
      socket.off('roomData', handleRoomData);
    };
  }, [socket, isConnected, user, currentRoom, rooms]);

  // Login function with validation and error handling
  const login = useCallback((role, username) => {
    try {
      if (!role || (role === 'teacher' && !username?.trim())) {
        throw new Error(role === 'teacher' ? 'Please enter your name' : 'Invalid role');
      }

      const newUser = {
        id: uuidv4(),
        role,
        anonymousName: role === 'student' ? generateAnonymousName() : username.trim(),
        violations: 0,
        banned: false,
        lastActive: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        isOnline: true
      };

      setUser(newUser);
      setError(null);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to login. Please try again.');
      return false;
    }
  }, []);

  // Logout function with cleanup
  const logout = useCallback(() => {
    try {
      // Update user's last active time before logging out
      if (user) {
        const updatedRooms = rooms.map(room => {
          const userIndex = room.participants.findIndex(p => p.id === user.id);
          if (userIndex !== -1) {
            const updatedParticipants = [...room.participants];
            // If user is a teacher, don't mark them as offline in their own room
            if (room.teacherId === user.id) {
              updatedParticipants[userIndex] = {
                ...updatedParticipants[userIndex],
                lastActive: new Date().toISOString()
                // Keep isOnline as true for teachers in their own rooms
              };
            } else {
              updatedParticipants[userIndex] = {
                ...updatedParticipants[userIndex],
                lastActive: new Date().toISOString(),
                isOnline: false
              };
            }
            return {
              ...room,
              participants: updatedParticipants,
              updatedAt: new Date().toISOString()
            };
          }
          return room;
        });
        
        setRooms(updatedRooms);
      }

      // Clear user and current room
      setUser(null);
      setCurrentRoom(null);
      
      // Clear localStorage
      localStorage.removeItem('chat-user');
      localStorage.removeItem('current-room');
      
      setError(null);
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to logout. Please try again.');
      return false;
    }
  }, [user, rooms]);

  // Create a new room with validation
  const createRoom = useCallback((name) => {
    try {
      if (!user || user.role !== 'teacher') {
        throw new Error('Only teachers can create rooms');
      }

      if (!name?.trim()) {
        throw new Error('Room name cannot be empty');
      }
      
      // A teacher can only have one active room at a time.
      const activeRoom = rooms.find(room => room.teacherId === user.id && room.isActive);
      if (activeRoom) {
        throw new Error('You already have an active classroom. Please end it before creating a new one.');
      }

      // Generate a unique room code
      let code;
      let isCodeUnique = false;
      const existingCodes = new Set(rooms.map(room => room.code));
      
      // Ensure the code is unique
      while (!isCodeUnique) {
        code = Math.random().toString(36).substr(2, 6).toUpperCase();
        if (!existingCodes.has(code)) {
          isCodeUnique = true;
        }
      }

      const newRoom = {
        id: uuidv4(),
        code,
        name: name.trim(),
        teacherId: user.id,
        teacherName: user.anonymousName,
        messages: [],
        polls: [],
        participants: [{
          ...user,
          isOnline: true,
          lastActive: new Date().toISOString()
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true
      };

      setRooms(prev => [...prev, newRoom]);
      setCurrentRoom(newRoom);
      setError(null);
      return newRoom;
    } catch (error) {
      console.error('Create room error:', error);
      setError(error.message || 'Failed to create room. Please try again.');
      throw error;
    }
  }, [user, rooms]);

  // Join a room with validation and error handling
  const joinRoom = useCallback((roomCode) => {
    if (!socket || !isConnected || !user) {
      console.error('Cannot join room: socket not connected or user not logged in.');
      setError('Cannot join room. Please check your connection and try again.');
      return false;
    }
    
    console.log(`Attempting to join room with code: ${roomCode}`);
    socket.emit('joinRoom', { 
      roomId: roomCode, 
      user: {
        name: user.anonymousName,
        role: user.role,
        id: user.id
      } 
    });

    // The 'roomData' event from the server will update the current room state.
    return true;
  }, [socket, isConnected, user]);

  // Leave the current room with cleanup
  const leaveRoom = useCallback(() => {
    try {
      if (!user || !currentRoom) return false;

      const room = rooms.find(r => r.id === currentRoom.id);
      if (!room) return false;

      // Update room participants
      const updatedParticipants = room.participants
        .filter(p => p.id !== user.id)
        .map(p => ({
          ...p,
          isOnline: p.id === user.id ? false : p.isOnline
        }));

      const updatedRoom = {
        ...room,
        participants: updatedParticipants,
        updatedAt: new Date().toISOString(),
        participantCount: Math.max(0, (room.participantCount || room.participants.length) - 1)
      };

      // If no participants left and not a teacher, remove the room
      const shouldRemoveRoom = updatedParticipants.length === 0 && user.role !== 'teacher';

      if (shouldRemoveRoom) {
        setRooms(prev => prev.filter(r => r.id !== room.id));
      } else {
        setRooms(prev => prev.map(r => r.id === room.id ? updatedRoom : r));
      }

      // If user was in the room they're leaving, update current room
      if (currentRoom.id === room.id) {
        setCurrentRoom(null);
      }

      setError(null);
      return true;
    } catch (error) {
      console.error('Leave room error:', error);
      setError('Failed to leave room. Please try again.');
      return false;
    }
  }, [user, currentRoom, rooms]);

  // End a room (teacher only)
  const endRoom = useCallback(async (roomId) => {
    if (!user || user.role !== 'teacher') {
      throw new Error('Only teachers can end a classroom.');
    }

    try {
      const updatedRooms = rooms.map(room => {
        if (room.id === roomId && room.teacherId === user.id) {
          return {
            ...room,
            isActive: false,
            endedAt: new Date().toISOString(),
          };
        }
        return room;
      });

      // Persist changes immediately to localStorage to prevent race conditions
      saveState('chat-rooms', updatedRooms);
      setRooms(updatedRooms);

      if (currentRoom?.id === roomId) {
        setCurrentRoom(null);
        saveState('current-room', null); // Also persist this change
      }
      return true;
    } catch (error) {
      console.error('Failed to end room:', error);
      throw new Error('An error occurred while ending the classroom.');
    }
  }, [user, currentRoom]);

  // Send a message with validation and error handling
  const sendMessage = useCallback((content, replyTo = null) => {
    try {
      if (!user || !currentRoom) {
        throw new Error('You must be in a room to send messages');
      }

      if (user.banned) {
        throw new Error('Your account has been banned from sending messages');
      }

      // Check if user is silenced
      if (user.silencedUntil && new Date() < new Date(user.silencedUntil)) {
        const timeLeft = Math.ceil((new Date(user.silencedUntil) - new Date()) / 60000);
        throw new Error(`You are silenced for ${timeLeft} more minutes`);
      }

      // Validate message content
      content = content?.trim();
      if (!content) {
        throw new Error('Message cannot be empty');
      }

      // Check for prohibited and warning terms
      const { isProhibited, isWarning } = checkProfanity(content);
      
      // Handle prohibited terms (auto-delete and warn)
      if (isProhibited) {
        const newViolations = (user.violations || 0) + 2; // More severe penalty
        const updatedUser = {
          ...user,
          violations: newViolations,
          ...(newViolations >= 3 && { 
            banned: true,
            banReason: 'Multiple violations of community guidelines'
          })
        };
        
        setUser(updatedUser);
        
        if (updatedUser.banned) {
          leaveRoom();
          throw new Error('Your account has been banned due to severe violations of our community guidelines.');
        }
        
        throw new Error('Your message was removed because it violated our community guidelines. Further violations may result in a ban.');
      }
      
      // Handle warning terms (warn user but allow message)
      if (isWarning) {
        const newViolations = (user.violations || 0) + 1;
        const updatedUser = {
          ...user,
          violations: newViolations,
          ...(newViolations >= 4 && { 
            silencedUntil: new Date(Date.now() + 60 * 60 * 1000), // Silence for 1 hour
            silenceReason: 'Multiple warnings for inappropriate content'
          }),
          ...(newViolations >= 6 && { 
            banned: true,
            banReason: 'Multiple violations of community guidelines'
          })
        };
        
        setUser(updatedUser);
        
        if (updatedUser.banned) {
          leaveRoom();
          throw new Error('Your account has been banned due to multiple violations of our community guidelines.');
        }
        
        if (updatedUser.silencedUntil) {
          throw new Error('Your message contains content that may be inappropriate. You have been temporarily silenced.');
        }
        
        // If we get here, just show a warning but allow the message
        throw new Error('Your message contains content that may be inappropriate. Please review our community guidelines.');
      }

      const message = {
        id: uuidv4(),
        content,
        userId: user.id,
        username: user.role === 'teacher' ? user.anonymousName : 'Anonymous Student',
        userRole: user.role,
        timestamp: new Date().toISOString(),
        reactions: {},
        isEdited: false,
        replyTo,
      };

      const updatedRoom = {
        ...currentRoom,
        messages: [...currentRoom.messages, message],
        updatedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };

      setRooms(prev => prev.map(r => r.id === currentRoom.id ? updatedRoom : r));
      setCurrentRoom(updatedRoom);
      setError(null);
      return true;
    } catch (error) {
      console.error('Send message error:', error);
      setError(error.message || 'Failed to send message. Please try again.');
      return false;
    }
  }, [user, currentRoom, leaveRoom, setUser, setRooms, setCurrentRoom, setError]);

  // Silence or ban a user (teacher only)
  const silenceUser = useCallback((userId, duration) => {
    try {
      if (!user || user.role !== 'teacher' || !currentRoom) {
        throw new Error('Only teachers can moderate users');
      }

      const targetUser = currentRoom.participants.find(p => p.id === userId);
      if (!targetUser) {
        throw new Error('User not found in this room');
      }

      // Don't allow moderating other teachers
      if (targetUser.role === 'teacher' && targetUser.id !== user.id) {
        throw new Error('You cannot moderate other teachers');
      }

      const silencedUntil = new Date(Date.now() + duration * 60 * 1000);
      const newViolations = targetUser.violations + 1;
      
      // Ban user if they've been silenced 4+ times for 20+ minutes
      const shouldBan = newViolations >= 4 && duration >= 20;

      const updatedUser = {
        ...targetUser,
        violations: newViolations,
        silencedUntil: shouldBan ? null : silencedUntil,
        banned: shouldBan,
        lastModerated: new Date().toISOString(),
        moderatedBy: user.id,
        ...(shouldBan && { bannedAt: new Date().toISOString() })
      };

      // Update room participants
      const updatedParticipants = currentRoom.participants.map(p =>
        p.id === userId ? updatedUser : p
      );

      const updatedRoom = {
        ...currentRoom,
        participants: updatedParticipants,
        updatedAt: new Date().toISOString(),
        moderationLogs: [
          ...(currentRoom.moderationLogs || []),
          {
            id: uuidv4(),
            userId: targetUser.id,
            moderatorId: user.id,
            action: shouldBan ? 'banned' : 'silenced',
            duration: shouldBan ? null : duration,
            reason: 'Inappropriate behavior',
            timestamp: new Date().toISOString()
          }
        ]
      };

      // If user was banned, remove them from the room
      if (shouldBan) {
        updatedRoom.participants = updatedParticipants.filter(p => p.id !== userId);
        
        // Notify other users
        const banMessage = {
          id: uuidv4(),
          content: `${targetUser.role === 'teacher' ? targetUser.anonymousName : 'A student'} has been banned for violating community guidelines.`,
          userId: 'system',
          username: 'System',
          userRole: 'system',
          timestamp: new Date().toISOString(),
          isSystemMessage: true
        };
        
        updatedRoom.messages = [...updatedRoom.messages, banMessage];
      } else {
        // Notify about silence
        const silenceMessage = {
          id: uuidv4(),
          content: `${targetUser.role === 'teacher' ? targetUser.anonymousName : 'A student'} has been silenced for ${duration} minutes.`,
          userId: 'system',
          username: 'System',
          userRole: 'system',
          timestamp: new Date().toISOString(),
          isSystemMessage: true
        };
        
        updatedRoom.messages = [...updatedRoom.messages, silenceMessage];
      }

      setRooms(prev => prev.map(r => r.id === currentRoom.id ? updatedRoom : r));
      setCurrentRoom(updatedRoom);
      setError(null);
      return true;
    } catch (error) {
      console.error('Silence user error:', error);
      setError(error.message || 'Failed to moderate user. Please try again.');
      return false;
    }
  }, [user, currentRoom]);

  // Add or remove a reaction to a message
  const addReaction = useCallback((messageId, emoji) => {
    try {
      if (!user || !currentRoom) {
        throw new Error('You must be in a room to react to messages');
      }

      // Validate emoji (basic check)
      if (!emoji || typeof emoji !== 'string' || emoji.length > 4) {
        throw new Error('Invalid emoji');
      }

      const updatedMessages = currentRoom.messages.map(msg => {
        if (msg.id === messageId) {
          const reactions = { ...msg.reactions };
          
          // Initialize array for this emoji if it doesn't exist
          if (!reactions[emoji]) {
            reactions[emoji] = [];
          }

          // Toggle user's reaction
          const userIndex = reactions[emoji].indexOf(user.id);
          if (userIndex > -1) {
            // Remove reaction
            reactions[emoji].splice(userIndex, 1);
            // Remove emoji if no more reactions
            if (reactions[emoji].length === 0) {
              delete reactions[emoji];
            }
          } else {
            // Add reaction
            reactions[emoji].push(user.id);
            
            // Limit number of reactions per user
            let userReactionCount = 0;
            Object.values(reactions).forEach(users => {
              if (users.includes(user.id)) {
                userReactionCount++;
              }
            });
            
            if (userReactionCount > 5) {
              throw new Error('You can only add up to 5 reactions per message');
            }
          }

          return { ...msg, reactions };
        }
        return msg;
      });

      const updatedRoom = { 
        ...currentRoom, 
        messages: updatedMessages,
        updatedAt: new Date().toISOString()
      };
      
      setRooms(prev => prev.map(r => r.id === currentRoom.id ? updatedRoom : r));
      setCurrentRoom(updatedRoom);
      setError(null);
      return true;
    } catch (error) {
      console.error('Add reaction error:', error);
      setError(error.message || 'Failed to add reaction. Please try again.');
      return false;
    }
  }, [user, currentRoom]);

  // Create a new poll (teacher only)
  const createPoll = useCallback((question, options) => {
    try {
      if (!user || user.role !== 'teacher' || !currentRoom) {
        throw new Error('Only teachers can create polls');
      }

      // Validate inputs
      question = question?.trim();
      if (!question) {
        throw new Error('Poll question cannot be empty');
      }

      // Clean and validate options
      const cleanOptions = options
        .map(opt => opt.trim())
        .filter(opt => opt.length > 0);
      
      if (cleanOptions.length < 2) {
        throw new Error('Poll must have at least 2 options');
      }

      // Check for duplicate options
      const uniqueOptions = [...new Set(cleanOptions)];
      if (uniqueOptions.length !== cleanOptions.length) {
        throw new Error('Poll options must be unique');
      }

      // Deactivate any other active polls in this room
      const updatedPolls = currentRoom.polls.map(poll => ({
        ...poll,
        active: false
      }));

      const newPoll = {
        id: uuidv4(),
        question,
        options: cleanOptions,
        votes: {},
        createdBy: user.id,
        creatorName: user.anonymousName,
        active: true,
        createdAt: new Date().toISOString(),
        totalVotes: 0
      };

      // Add poll to room
      const updatedRoom = {
        ...currentRoom,
        polls: [...updatedPolls, newPoll],
        updatedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };

      // Add system message about new poll
      const pollMessage = {
        id: uuidv4(),
        content: `📊 New poll: ${question}`,
        userId: 'system',
        username: 'System',
        userRole: 'system',
        timestamp: new Date().toISOString(),
        isSystemMessage: true,
        pollId: newPoll.id
      };

      updatedRoom.messages = [...updatedRoom.messages, pollMessage];

      setRooms(prev => prev.map(r => r.id === currentRoom.id ? updatedRoom : r));
      setCurrentRoom(updatedRoom);
      setError(null);
      return true;
    } catch (error) {
      console.error('Create poll error:', error);
      setError(error.message || 'Failed to create poll. Please try again.');
      return false;
    }
  }, [user, currentRoom]);

  // Close a poll (teacher only)
  const closePoll = useCallback((pollId) => {
    try {
      if (!user || user.role !== 'teacher' || !currentRoom) {
        throw new Error('Only teachers can close polls');
      }

      // Find the poll
      const pollIndex = currentRoom.polls.findIndex(p => p.id === pollId);
      if (pollIndex === -1) {
        throw new Error('Poll not found');
      }

      // Update the poll to inactive
      const updatedPolls = [...currentRoom.polls];
      updatedPolls[pollIndex] = {
        ...updatedPolls[pollIndex],
        active: false,
        closedAt: new Date().toISOString()
      };

      // Add system message about closed poll
      const pollMessage = {
        id: uuidv4(),
        content: `📊 Poll closed: ${updatedPolls[pollIndex].question}`,
        userId: 'system',
        username: 'System',
        userRole: 'system',
        timestamp: new Date().toISOString(),
        isSystemMessage: true,
        pollId: pollId
      };

      // Update the room
      const updatedRoom = {
        ...currentRoom,
        polls: updatedPolls,
        messages: [...currentRoom.messages, pollMessage],
        updatedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };

      setRooms(prev => prev.map(r => r.id === currentRoom.id ? updatedRoom : r));
      setCurrentRoom(updatedRoom);
      setError(null);
      return true;
    } catch (error) {
      console.error('Close poll error:', error);
      setError(error.message || 'Failed to close poll. Please try again.');
      return false;
    }
  }, [user, currentRoom]);

  // Vote on a poll
  const votePoll = useCallback((pollId, option) => {
    try {
      if (!user || !currentRoom) {
        throw new Error('You must be in a room to vote');
      }

      const poll = currentRoom.polls.find(p => p.id === pollId);
      if (!poll) {
        throw new Error('Poll not found');
      }

      if (!poll.active) {
        throw new Error('This poll is no longer active');
      }

      if (!poll.options.includes(option)) {
        throw new Error('Invalid poll option');
      }

      const updatedPolls = currentRoom.polls.map(p => {
        if (p.id === pollId) {
          const votes = { ...p.votes };
          let totalVotes = p.totalVotes || 0;

          // Remove user's previous vote if any
          Object.keys(votes).forEach(opt => {
            const userIndex = votes[opt].indexOf(user.id);
            if (userIndex > -1) {
              votes[opt].splice(userIndex, 1);
              totalVotes--;
              if (votes[opt].length === 0) {
                delete votes[opt];
              }
            }
          });

          // Add new vote
          if (!votes[option]) {
            votes[option] = [];
          }
          votes[option].push(user.id);
          totalVotes++;

          return {
            ...p,
            votes,
            totalVotes,
            lastVotedAt: new Date().toISOString()
          };
        }
        return p;
      });

      const updatedRoom = {
        ...currentRoom,
        polls: updatedPolls,
        updatedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };

      setRooms(prev => prev.map(r => r.id === currentRoom.id ? updatedRoom : r));
      setCurrentRoom(updatedRoom);
      setError(null);
      return true;
    } catch (error) {
      console.error('Vote poll error:', error);
      setError(error.message || 'Failed to submit vote. Please try again.');
      return false;
    }
  }, [user, currentRoom]);

// Get a room by ID
const getRoomById = useCallback((roomId) => {
  return rooms.find(room => room.id === roomId);
}, [rooms]);

// Get messages for a specific room
const getRoomMessages = useCallback((roomId) => {
  const room = getRoomById(roomId);
  return room ? room.messages : [];
}, [getRoomById]);

// Get active poll for a room
const getActivePoll = useCallback((roomId) => {
  const room = getRoomById(roomId);
  if (!room) return null;
  return room.polls.find(poll => poll.active) || null;
}, [getRoomById]);

// Check if user has voted in a poll
const hasUserVoted = useCallback((poll, userId) => {
  if (!poll || !userId) return false;
  return Object.values(poll.votes).some(voters => voters.includes(userId));
}, []);

  // Get user's vote in a poll
  const getUserVote = useCallback((poll, userId) => {
    if (!poll || !userId) return null;
    for (const [option, voters] of Object.entries(poll.votes || {})) {
      if (voters.includes(userId)) {
        return option;
      }
    }
    return null;
  }, []);

  // Get poll results
  const getPollResults = useCallback((poll) => {
    if (!poll) return [];
    return (poll.options || []).map(option => ({
      option,
      votes: ((poll.votes || {})[option] || []).length,
      percentage: (poll.totalVotes || 0) > 0 
        ? Math.round((((poll.votes || {})[option]?.length || 0) / (poll.totalVotes || 1)) * 100) 
        : 0
    }));
  }, []);

  // Check if user is room owner
  const isRoomOwner = useCallback((room) => {
    return user && room && room.teacherId === user.id;
  }, [user]);

  // Check if user is participant in room
  const isParticipant = useCallback((room, userId) => {
    return room && room.participants && room.participants.some(p => p.id === userId);
  }, []);

  // Get user by ID
  const getUserById = useCallback((userId) => {
    if (!userId) return null;
    
    // Check in current room first
    if (currentRoom && currentRoom.participants) {
      const participant = currentRoom.participants.find(p => p.id === userId);
      if (participant) return participant;
    }
    
    // Check in all rooms
    for (const room of rooms) {
      if (room.participants) {
        const participant = room.participants.find(p => p.id === userId);
        if (participant) return participant;
      }
    }
    
    return null;
  }, [currentRoom, rooms]);

  // Format timestamp
  const formatTimestamp = useCallback((timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      console.error('Error formatting timestamp:', e);
      return '';
    }
  }, []);

  // Check if user is online
  const isUserOnline = useCallback((user) => {
    if (!user) return false;

    // If user has lastActive, check if it was within last 5 minutes
    if (user.lastActive) {
      const lastActiveDate = new Date(user.lastActive);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return lastActiveDate > fiveMinutesAgo;
    }

    return !!user.isOnline;
  }, []);

  const contextValue = {
    socket,
    isConnected,
    user,
    currentRoom,
    rooms,
    isLoading,
    error,

    // Actions
    login,
    logout,
    createRoom,
    joinRoom,
    leaveRoom,
    endRoom,
    sendMessage,
    silenceUser,
    addReaction,
    createPoll,
    closePoll,
    votePoll,

    // Utility functions
    getRoomById,
    getRoomMessages,
    getActivePoll,
    hasUserVoted,
    getUserVote,
    getPollResults,
    isRoomOwner,
    isParticipant,
    getUserById,
    formatTimestamp,
    isUserOnline,

    // Constants
    MAX_MESSAGE_LENGTH: 1000,
    MAX_POLL_OPTIONS: 10,
    MAX_POLL_QUESTION_LENGTH: 200,
    MAX_POLL_OPTION_LENGTH: 100,
    MAX_USERNAME_LENGTH: 30,
    MAX_ROOM_NAME_LENGTH: 50,

    // Error handling
    clearError: () => setError(null),
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
