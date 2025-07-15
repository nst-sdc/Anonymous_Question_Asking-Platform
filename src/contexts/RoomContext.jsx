import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { socketService } from '../lib/socket';
import { useAuth } from './AuthContext';

const RoomContext = createContext(undefined);

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (context === undefined) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
};

export const RoomProvider = ({ children }) => {
  const { user } = useAuth();
  const [currentRoom, setCurrentRoom] = useState(null);
  const [roomMembers, setRoomMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [currentUserMember, setCurrentUserMember] = useState(null);

  // Generate anonymous ID
  const generateAnonymousId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'Anon#';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Generate room code
  const generateRoomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Setup Socket.IO listeners
  useEffect(() => {
    if (!currentRoom || !user) return;

    const socket = socketService.connect();

    // Message listeners
    socket.on('new_message', (messageData) => {
      const newMessage = {
        id: messageData.id,
        room_id: messageData.roomId,
        user_id: messageData.userId,
        content: messageData.content,
        reply_to: messageData.replyTo,
        created_at: messageData.timestamp,
        anonymous_id: messageData.anonymousId,
        reactions: messageData.reactions
      };
      
      setMessages(prev => [...prev, newMessage]);
    });

    socket.on('reaction_added', (reactionData) => {
      setMessages(prev => prev.map(msg => {
        if (msg.id === reactionData.messageId) {
          const newReactions = { ...msg.reactions };
          if (reactionData.reactionType === 'yes') {
            newReactions.yes = (newReactions.yes || 0) + 1;
          } else {
            newReactions.no = (newReactions.no || 0) + 1;
          }
          return { ...msg, reactions: newReactions };
        }
        return msg;
      }));
    });

    // Poll listeners
    socket.on('new_poll', (pollData) => {
      const newPoll = {
        id: pollData.id,
        room_id: pollData.roomId,
        created_by: pollData.createdBy,
        question: pollData.question,
        poll_type: pollData.pollType,
        options: pollData.options,
        created_at: pollData.createdAt,
        is_active: pollData.isActive,
        vote_counts: pollData.voteCounts,
        user_vote: null,
        total_votes: 0
      };
      
      setPolls(prev => [newPoll, ...prev]);
    });

    socket.on('poll_vote_update', (voteData) => {
      setPolls(prev => prev.map(poll => {
        if (poll.id === voteData.pollId) {
          return {
            ...poll,
            vote_counts: voteData.voteCounts,
            total_votes: voteData.totalVotes,
            user_vote: voteData.userId === user.id ? voteData.optionIndex : poll.user_vote
          };
        }
        return poll;
      }));
    });

    socket.on('poll_ended', (endData) => {
      setPolls(prev => prev.map(poll => {
        if (poll.id === endData.pollId) {
          return {
            ...poll,
            is_active: false,
            vote_counts: endData.finalResults.voteCounts,
            total_votes: endData.finalResults.totalVotes
          };
        }
        return poll;
      }));
    });

    // Member listeners
    socket.on('user_joined', (data) => {
      setRoomMembers(data.members.map((member) => ({
        id: member.userId,
        room_id: currentRoom.id,
        user_id: member.userId,
        anonymous_id: member.anonymousId,
        joined_at: member.joinedAt,
        is_active: true
      })));
    });

    socket.on('user_left', (data) => {
      setRoomMembers(data.members.map((member) => ({
        id: member.userId,
        room_id: currentRoom.id,
        user_id: member.userId,
        anonymous_id: member.anonymousId,
        joined_at: member.joinedAt,
        is_active: true
      })));
    });

    socket.on('room_state', (state) => {
      setRoomMembers(state.members.map((member) => ({
        id: member.userId,
        room_id: currentRoom.id,
        user_id: member.userId,
        anonymous_id: member.anonymousId,
        joined_at: member.joinedAt,
        is_active: true
      })));
      
      setPolls(state.polls.map((poll) => ({
        id: poll.id,
        room_id: poll.roomId,
        created_by: poll.createdBy,
        question: poll.question,
        poll_type: poll.pollType,
        options: poll.options,
        created_at: poll.createdAt,
        is_active: poll.isActive,
        vote_counts: poll.voteCounts,
        user_vote: poll.votes[user.id] ?? null,
        total_votes: Object.keys(poll.votes).length
      })));
    });

    // Error listeners
    socket.on('message_error', (error) => {
      console.error('Message error:', error.error);
      alert(error.error);
    });

    socket.on('poll_error', (error) => {
      console.error('Poll error:', error.error);
      alert(error.error);
    });

    socket.on('vote_error', (error) => {
      console.error('Vote error:', error.error);
      alert(error.error);
    });

    return () => {
      socket.off('new_message');
      socket.off('reaction_added');
      socket.off('new_poll');
      socket.off('poll_vote_update');
      socket.off('poll_ended');
      socket.off('user_joined');
      socket.off('user_left');
      socket.off('room_state');
      socket.off('message_error');
      socket.off('poll_error');
      socket.off('vote_error');
    };
  }, [currentRoom, user]);

  // Create room
  const createRoom = async (name) => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      const code = generateRoomCode();
      
      const { data: room, error } = await supabase
        .from('rooms')
        .insert({
          name,
          code,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Join the room as creator
      const anonymousId = generateAnonymousId();
      const { error: memberError } = await supabase
        .from('room_members')
        .insert({
          room_id: room.id,
          user_id: user.id,
          anonymous_id: anonymousId,
        });

      if (memberError) throw memberError;

      setCurrentRoom(room);
      setIsOrganizer(true);
      
      const memberData = {
        id: user.id,
        room_id: room.id,
        user_id: user.id,
        anonymous_id: anonymousId,
        joined_at: new Date().toISOString(),
        is_active: true
      };
      setCurrentUserMember(memberData);
      
      // Join Socket.IO room
      socketService.joinRoom(room.id, user.id, anonymousId);
      
      // Store in localStorage for persistence
      localStorage.setItem('anonymeet_current_room', JSON.stringify({
        room,
        isOrganizer: true,
        anonymousId
      }));
      
      return room;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Join room
  const joinRoom = async (code) => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      // Find room by code
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', code)
        .single();

      if (roomError) throw new Error('Room not found');
      if (room.is_active === false) throw new Error('This room has ended and can no longer be joined.');

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('room_members')
        .select('*')
        .eq('room_id', room.id)
        .eq('user_id', user.id)
        .maybeSingle();

      let anonymousId;
      
      if (!existingMember) {
        // Join the room
        anonymousId = generateAnonymousId();
        const { error: memberError } = await supabase
          .from('room_members')
          .insert({
            room_id: room.id,
            user_id: user.id,
            anonymous_id: anonymousId,
          });
        
        if (memberError) throw memberError;
      } else {
        // Reactivate membership if inactive
        anonymousId = existingMember.anonymous_id;
        await supabase
          .from('room_members')
          .update({ is_active: true })
          .eq('id', existingMember.id);
      }

      setCurrentRoom(room);
      const organizer = room.created_by === user.id;
      setIsOrganizer(organizer);
      
      const memberData = {
        id: user.id,
        room_id: room.id,
        user_id: user.id,
        anonymous_id: anonymousId,
        joined_at: new Date().toISOString(),
        is_active: true
      };
      setCurrentUserMember(memberData);
      
      // Join Socket.IO room
      socketService.joinRoom(room.id, user.id, anonymousId);
      
      // Store in localStorage for persistence
      localStorage.setItem('anonymeet_current_room', JSON.stringify({
        room,
        isOrganizer: organizer,
        anonymousId
      }));
      
      return room;
    } catch (error) {
      console.error('Error joining room:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Leave room
  const leaveRoom = async () => {
    if (!user || !currentRoom || !currentUserMember) return;

    try {
      await supabase
        .from('room_members')
        .update({ is_active: false })
        .eq('room_id', currentRoom.id)
        .eq('user_id', user.id);

      // Leave Socket.IO room
      socketService.leaveRoom(currentRoom.id, user.id, currentUserMember.anonymous_id);

      setCurrentRoom(null);
      setRoomMembers([]);
      setMessages([]);
      setPolls([]);
      setIsOrganizer(false);
      setCurrentUserMember(null);
      
      // Clear from localStorage
      localStorage.removeItem('anonymeet_current_room');
    } catch (error) {
      console.error('Error leaving room:', error);
      throw error;
    }
  };

  // End room (organizer only)
  const endRoom = async () => {
    if (!user || !currentRoom || !isOrganizer) return;

    try {
      // Mark room as inactive
      await supabase
        .from('rooms')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', currentRoom.id);

      // Remove all members
      await supabase
        .from('room_members')
        .update({ is_active: false })
        .eq('room_id', currentRoom.id);

      if (currentUserMember) {
        socketService.leaveRoom(currentRoom.id, user.id, currentUserMember.anonymous_id);
      }

      setCurrentRoom(null);
      setRoomMembers([]);
      setMessages([]);
      setPolls([]);
      setIsOrganizer(false);
      setCurrentUserMember(null);
      
      // Clear from localStorage
      localStorage.removeItem('anonymeet_current_room');
    } catch (error) {
      console.error('Error ending room:', error);
      throw error;
    }
  };

  // Send message
  const sendMessage = async (content, replyTo) => {
    if (!user || !currentRoom || !currentUserMember) return;

    try {
      // Send via Socket.IO for real-time delivery
      socketService.sendMessage(
        currentRoom.id, 
        user.id, 
        content, 
        currentUserMember.anonymous_id, 
        replyTo
      );

      // Also store in Supabase for persistence
      await supabase
        .from('messages')
        .insert({
          room_id: currentRoom.id,
          user_id: user.id,
          content,
          reply_to: replyTo || null,
        });
      
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  // Add reaction
  const addReaction = async (messageId, type) => {
    if (!user || !currentRoom || !currentUserMember) return;

    try {
      // Send via Socket.IO for real-time updates
      socketService.addReaction(
        currentRoom.id, 
        messageId, 
        user.id, 
        type, 
        currentUserMember.anonymous_id
      );

      // Handle database storage
      const { data: existingReaction } = await supabase
        .from('message_reactions')
        .select('*')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('reaction_type', type)
        .maybeSingle();

      if (existingReaction) {
        // Remove reaction if it exists
        await supabase
          .from('message_reactions')
          .delete()
          .eq('id', existingReaction.id);
      } else {
        // Remove opposite reaction if it exists
        await supabase
          .from('message_reactions')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', user.id)
          .neq('reaction_type', type);

        // Add new reaction
        await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            reaction_type: type,
          });
      }
      
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  };

  // Create poll
  const createPoll = async (question, type, options) => {
    if (!user || !currentRoom || !currentUserMember) return;

    try {
      const pollOptions = type === 'yesno' ? ['Yes', 'No'] : (options || []);
      
      // Send via Socket.IO for real-time delivery
      socketService.createPoll(
        currentRoom.id,
        user.id,
        question,
        type,
        pollOptions,
        currentUserMember.anonymous_id
      );

      // Also store in Supabase for persistence
      await supabase
        .from('polls')
        .insert({
          room_id: currentRoom.id,
          created_by: user.id,
          question,
          poll_type: type,
          options: pollOptions,
        });
      
    } catch (error) {
      console.error('Error creating poll:', error);
      throw error;
    }
  };

  // Vote on poll
  const votePoll = async (pollId, optionIndex) => {
    if (!user || !currentRoom || !currentUserMember) return;

    try {
      // Send via Socket.IO for real-time updates
      socketService.votePoll(
        currentRoom.id,
        pollId,
        user.id,
        optionIndex,
        currentUserMember.anonymous_id
      );

      // Handle database storage
      const { data: existingVote } = await supabase
        .from('poll_votes')
        .select('*')
        .eq('poll_id', pollId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingVote) {
        // Update existing vote
        await supabase
          .from('poll_votes')
          .update({ option_index: optionIndex })
          .eq('id', existingVote.id);
      } else {
        // Create new vote
        await supabase
          .from('poll_votes')
          .insert({
            poll_id: pollId,
            user_id: user.id,
            option_index: optionIndex,
          });
      }
      
    } catch (error) {
      console.error('Error voting on poll:', error);
      throw error;
    }
  };

  // End poll
  const endPoll = async (pollId) => {
    if (!user || !currentRoom) return;

    try {
      // Send via Socket.IO for real-time updates
      socketService.endPoll(currentRoom.id, pollId, user.id);

      // Update in Supabase
      await supabase
        .from('polls')
        .update({ is_active: false })
        .eq('id', pollId);
      
    } catch (error) {
      console.error('Error ending poll:', error);
      throw error;
    }
  };

  // Restore room from localStorage on app start
  useEffect(() => {
    if (!user) return;

    const savedRoom = localStorage.getItem('anonymeet_current_room');
    if (savedRoom && !currentRoom) {
      try {
        const { room, isOrganizer: savedIsOrganizer, anonymousId } = JSON.parse(savedRoom);
        
        // Verify room still exists and user is still a member
        supabase
          .from('room_members')
          .select('*, rooms(*)')
          .eq('room_id', room.id)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle()
          .then(({ data, error }) => {
            if (data && !error) {
              setCurrentRoom(room);
              setIsOrganizer(savedIsOrganizer);
              setCurrentUserMember({
                id: user.id,
                room_id: room.id,
                user_id: user.id,
                anonymous_id: anonymousId,
                joined_at: data.joined_at,
                is_active: true
              });
              
              // Rejoin Socket.IO room
              socketService.joinRoom(room.id, user.id, anonymousId);
            } else {
              localStorage.removeItem('anonymeet_current_room');
            }
          });
      } catch (error) {
        localStorage.removeItem('anonymeet_current_room');
      }
    }
  }, [user, currentRoom]);

  // Load initial room data from Supabase
  useEffect(() => {
    if (!currentRoom || !user) return;

    const loadInitialData = async () => {
      try {
        // Load messages
        const { data: messagesData } = await supabase
          .from('messages')
          .select('*')
          .eq('room_id', currentRoom.id)
          .order('created_at', { ascending: true });

        if (messagesData) {
          const messagesWithReactions = await Promise.all(
            messagesData.map(async (msg) => {
              const { data: reactions } = await supabase
                .from('message_reactions')
                .select('reaction_type')
                .eq('message_id', msg.id);

              const reactionCounts = reactions?.reduce(
                (acc, reaction) => {
                  acc[reaction.reaction_type]++;
                  return acc;
                },
                { yes: 0, no: 0 }
              ) || { yes: 0, no: 0 };

              return {
                ...msg,
                reactions: reactionCounts,
              };
            })
          );

          setMessages(messagesWithReactions);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadInitialData();
  }, [currentRoom, user]);

  const value = {
    currentRoom,
    roomMembers,
    messages,
    polls,
    loading,
    isOrganizer,
    replyingTo,
    createRoom,
    joinRoom,
    leaveRoom,
    sendMessage,
    addReaction,
    createPoll,
    votePoll,
    endPoll,
    endRoom,
    setReplyingTo,
  };

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
};