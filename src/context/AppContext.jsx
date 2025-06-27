import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateAnonymousName, checkProfanity } from '../utils/helpers';

// Context banaya gaya jisse globally data share ho sake
const AppContext = createContext();

// Custom hook to use the app context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

// Custom hook specifically for authentication
export const useAuth = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAuth must be used within AppProvider');
  }
  const { user, login, logout, isAuthenticated } = context;
  return { user, login, logout, isAuthenticated };
};

// Main AppProvider component
export const AppProvider = ({ children }) => {
  // User ki info track karne ke liye state
  const [user, setUser] = useState(null);

  // Current room jisme user hai
  const [currentRoom, setCurrentRoom] = useState(null);

  // Rooms list ko localStorage se load kiya gaya
  const [rooms, setRooms] = useState(() => {
    try {
      const savedRooms = localStorage.getItem('chat-rooms');
      if (savedRooms) {
        return JSON.parse(savedRooms, (key, value) => {
          if (value && (key === 'timestamp' || key === 'silencedUntil')) {
            return new Date(value);
          }
          return value;
        });
      }
    } catch (error) {
      console.error('Error loading rooms from localStorage:', error);
    }
    return [];
  });

  // Jab bhi rooms update hote hain, unhe localStorage me save kar dete hain
  useEffect(() => {
    localStorage.setItem('chat-rooms', JSON.stringify(rooms));
  }, [rooms]);

  // Login function
  const login = (role, username) => {
    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      role,
      anonymousName: role === 'student' ? generateAnonymousName() : username,
      violations: 0,
      banned: false,
    };
    setUser(newUser);
  };

  // Logout karne par user aur currentRoom null ho jaata hai
  const logout = () => {
    setUser(null);
    setCurrentRoom(null);
  };

  // Teacher room create kar sakta hai
  const createRoom = (name) => {
    if (!user || user.role !== 'teacher') return '';

    const code = Math.random().toString(36).substr(2, 6).toUpperCase();
    const newRoom = {
      id: Math.random().toString(36).substr(2, 9),
      code,
      name,
      teacherId: user.id,
      messages: [],
      polls: [],
      participants: [user],
    };

    setRooms(prev => [...prev, newRoom]);
    setCurrentRoom(newRoom);
    return code;
  };

  // Room join karne ka logic
  const joinRoom = (code) => {
    if (!user) return false;

    const room = rooms.find(r => r.code === code);
    if (!room || user.banned) return false;

    const isUserInRoom = room.participants.some(p => p.id === user.id);
    if (isUserInRoom) {
      setCurrentRoom(room);
      return true;
    }

    const updatedRoom = {
      ...room,
      participants: [...room.participants, user],
    };

    setRooms(prev => prev.map(r => r.id === room.id ? updatedRoom : r));
    setCurrentRoom(updatedRoom);
    return true;
  };

  // Room chhodne ka function
  const leaveRoom = () => {
    setCurrentRoom(null);
  };

  // Room ko permanently end karne ka logic
  const endRoom = (roomId) => {
    const roomToEnd = rooms.find(r => r.id === roomId);
    if (!user || user.role !== 'teacher' || !roomToEnd || roomToEnd.teacherId !== user.id) return false;

    if (window.confirm(`Are you sure you want to end the room "${roomToEnd.name}"? This action is permanent.`)) {
      setRooms(prev => prev.filter(r => r.id !== roomId));
      if (currentRoom && currentRoom.id === roomId) {
        setCurrentRoom(null);
      }
      return true;
    }
    return false;
  };

  // Message bhejne ka function
  const sendMessage = (content) => {
    if (!user || !currentRoom || user.banned) return false;

    // Agar user silenced hai toh message na jaaye
    if (user.silencedUntil && new Date() < new Date(user.silencedUntil)) return false;

    // Profanity check karo
    if (checkProfanity(content)) {
      setUser({ ...user, violations: user.violations + 1 });
      return false;
    }

    const message = {
      id: Math.random().toString(36).substr(2, 9),
      content,
      userId: user.id,
      username: user.anonymousName || 'Anonymous',
      timestamp: new Date(),
      reactions: {},
    };

    const updatedRoom = {
      ...currentRoom,
      messages: [...currentRoom.messages, message],
    };

    setRooms(prev => prev.map(r => r.id === currentRoom.id ? updatedRoom : r));
    setCurrentRoom(updatedRoom);
    return true;
  };

  // Kisi user ko silence karne ka function
  const silenceUser = (userId, duration) => {
    if (!user || user.role !== 'teacher' || !currentRoom) return;

    const targetUser = currentRoom.participants.find(p => p.id === userId);
    if (!targetUser) return;

    const silencedUntil = new Date(Date.now() + duration * 60 * 1000);
    const newViolations = targetUser.violations + 1;

    // Agar user ko 4 baar silence kiya gaya 20+ min ke liye toh ban
    const shouldBan = newViolations >= 4 && duration >= 20;

    const updatedUser = {
      ...targetUser,
      violations: newViolations,
      silencedUntil,
      banned: shouldBan,
    };

    const updatedParticipants = currentRoom.participants.map(p =>
      p.id === userId ? updatedUser : p
    );

    const updatedRoom = {
      ...currentRoom,
      participants: updatedParticipants,
    };

    setRooms(prev => prev.map(r => r.id === currentRoom.id ? updatedRoom : r));
    setCurrentRoom(updatedRoom);
  };

  // Message pe reaction add/remove karne ka logic
  const addReaction = (messageId, emoji) => {
    if (!user || !currentRoom) return;

    const updatedMessages = currentRoom.messages.map(msg => {
      if (msg.id === messageId) {
        const reactions = { ...msg.reactions };
        if (!reactions[emoji]) reactions[emoji] = [];

        const userIndex = reactions[emoji].indexOf(user.id);
        if (userIndex > -1) {
          reactions[emoji].splice(userIndex, 1);
          if (reactions[emoji].length === 0) delete reactions[emoji];
        } else {
          reactions[emoji].push(user.id);
        }

        return { ...msg, reactions };
      }
      return msg;
    });

    const updatedRoom = { ...currentRoom, messages: updatedMessages };
    setRooms(prev => prev.map(r => r.id === currentRoom.id ? updatedRoom : r));
    setCurrentRoom(updatedRoom);
  };

  // Poll create karne ka function (sirf teacher ke liye)
  const createPoll = (question, options) => {
    if (!user || user.role !== 'teacher' || !currentRoom) return;

    const poll = {
      id: Math.random().toString(36).substr(2, 9),
      question,
      options,
      votes: {},
      createdBy: user.id,
      active: true,
    };

    const updatedRoom = {
      ...currentRoom,
      polls: [...currentRoom.polls, poll],
    };

    setRooms(prev => prev.map(r => r.id === currentRoom.id ? updatedRoom : r));
    setCurrentRoom(updatedRoom);
  };

  // Poll pe vote daalne ka function
  const votePoll = (pollId, option) => {
    if (!user || !currentRoom) return;

    const updatedPolls = currentRoom.polls.map(poll => {
      if (poll.id === pollId && poll.active) {
        const votes = { ...poll.votes };

        // Purani vote remove karni hai agar hai
        Object.keys(votes).forEach(opt => {
          votes[opt] = votes[opt].filter(id => id !== user.id);
          if (votes[opt].length === 0) delete votes[opt];
        });

        // New vote add karo
        if (!votes[option]) votes[option] = [];
        votes[option].push(user.id);

        return { ...poll, votes };
      }
      return poll;
    });

    const updatedRoom = { ...currentRoom, polls: updatedPolls };
    setRooms(prev => prev.map(r => r.id === currentRoom.id ? updatedRoom : r));
    setCurrentRoom(updatedRoom);
  };

  const isAuthenticated = user !== null;

  return (
    <AppContext.Provider
      value={{
        user,
        currentRoom,
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
        votePoll,
        rooms,
        isAuthenticated,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
