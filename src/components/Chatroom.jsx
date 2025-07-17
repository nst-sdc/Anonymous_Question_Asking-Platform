import React, { useState, useRef, useEffect } from 'react';
import { generateAvatarSvg } from '../utils/avatar';
import { useParams } from 'react-router-dom';
import { Send, Users, BarChart3, Hash, LogOut, Settings, Crown, Plus, Smile, X } from 'lucide-react';
import ScrollToBottomButton from './ScrollToBottomButton';
import { useRoom } from '../contexts/RoomContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';
import Message from './Message';
import PollModal from './PollModal';
import PollCard from './PollCard';


const Chatroom = ({ onLeaveRoom }) => {
  const [showScrollButton, setShowScrollButton] = useState(false);
  const { code } = useParams();
  const { user } = useAuth();
  const { 
    currentRoom, 
    roomMembers, 
    messages, 
    polls, 
    isOrganizer,
    sendMessage, 
    addReaction, 
    createPoll,
    votePoll,
    endPoll,
    leaveRoom,
    endRoom,
    joinRoom
  } = useRoom();
  const [message, setMessage] = useState('');
  const [showPollModal, setShowPollModal] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (user && code && !currentRoom) {
      joinRoom(code).catch((err) => {
        // Optionally handle error (room not found, etc)
        // You could add a toast or notification here
        console.error('Failed to join room from URL:', err);
      });
    }
    // eslint-disable-next-line
  }, [user, code, currentRoom]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Show scroll button if not at the bottom
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    setShowScrollButton(scrollTop + clientHeight < scrollHeight - 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!currentRoom) {
    return <div>Loading...</div>;
  }

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    sendMessage(message.trim(), replyingTo?.id || undefined)
      .then(() => {
        // Message sent successfully
      })
      .catch((error) => {
        console.error('Failed to send message:', error);
        // You could add a toast notification here
      });
      
    setMessage('');
    setReplyingTo(null);
    inputRef.current?.focus();
  };

  const handleReaction = (messageId, type) => {
    addReaction(messageId, type);
  };

  const handleReply = (message) => {
    setReplyingTo(message);
    inputRef.current?.focus();
  };

  const handleLeaveRoom = async () => {
    await leaveRoom();
    onLeaveRoom();
  };

  const handleEndRoom = async () => {
    if (confirm('Are you sure you want to end this room for everyone?')) {
      await endRoom();
      onLeaveRoom();
    }
  };
  const handleCreatePoll = (poll) => {
    createPoll(poll.question, poll.type, poll.options);
    setShowPollModal(false);
  };

  const handleVotePoll = (pollId, optionIndex) => {
    votePoll(pollId, optionIndex);
  };

  // Get current user's anonymous ID
  const currentUserMember = roomMembers.find(member => member.user_id === user?.id);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-500">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-80 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-700/50 shadow-2xl flex-shrink-0 overflow-hidden">
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Hash className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">{currentRoom.name}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Room Code: <span className="font-semibold text-indigo-600 dark:text-indigo-400 select-all">{code}</span></p>
            </div>
          </div>
        </div>

        {/* Member List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Members</h3>
            </div>
            <span className="px-2 py-1 text-xs font-bold bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300 rounded-full">{roomMembers.length}</span>
          </div>
          <ul className="space-y-3">
            {roomMembers.map((member) => (
              <li key={member.anonymous_id} className="flex items-center space-x-3">
                <div className="relative w-10 h-10">
                  <img
                    src={`data:image/svg+xml;utf8,${encodeURIComponent(generateAvatarSvg(member.anonymous_id))}`}
                    alt={member.anonymous_id}
                    className="rounded-full w-full h-full object-cover"
                  />
                  {isOrganizer && member.user_id === currentRoom.organizer_id && (
                    <div className="absolute -bottom-1 -right-1 bg-amber-400 p-0.5 rounded-full shadow-md">
                      <Crown className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <span className="font-medium text-slate-700 dark:text-slate-200 truncate">
                  {member.anonymous_id}
                  {member.user_id === user?.id && <span className="text-slate-500 dark:text-slate-400"> (You)</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer Controls */}
        <div className="p-4 border-t border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
            <ThemeToggle />
            <button
              onClick={handleLeaveRoom}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          {showSettings && (
            <div className="mt-4 space-y-2">
              <button
                onClick={() => setShowPollModal(true)}
                className="w-full text-left flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 p-2 rounded-lg font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Poll</span>
              </button>
              {isOrganizer && (
                <button
                  onClick={handleEndRoom}
                  className="w-full text-left flex items-center space-x-2 text-sm text-red-700 dark:text-red-500 bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 p-2 rounded-lg font-semibold transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>End Room for All</span>
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Chat</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Welcome to the conversation!</p>
          </div>
          <button
            onClick={() => setShowPollModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">Create Poll</span>
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 relative" onScroll={handleScroll}>
          {messages.length > 0 ? (
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                >
                  <Message
                    message={msg}
                    onReaction={handleReaction}
                    onReply={handleReply}
                    isCurrentUser={msg.user_id === user?.id}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400">
              <div className="w-24 h-24 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                <Hash className="w-12 h-12 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">No messages yet</h3>
              <p className="max-w-xs mx-auto mt-1">Be the first to break the ice! Send a message or create a poll to get the conversation started.</p>
            </div>
          )}
          <div ref={messagesEndRef} />
          {showScrollButton && <ScrollToBottomButton onClick={scrollToBottom} />}
        </div>

        {/* Message Input Area */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/50 flex-shrink-0">
          {/* Reply Preview */}
          {replyingTo && (
            <div className="p-3 bg-slate-200/60 dark:bg-slate-900/40 border-l-4 border-indigo-500 mx-6 mt-2 rounded-r-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">Replying to {replyingTo.anonymous_id}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{replyingTo.content}</p>
                </div>
                <button onClick={() => setReplyingTo(null)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500 font-semibold text-xs">
                  Cancel
                </button>
              </div>
            </div>
          )}
          {/* Message Input Form */}
          <form onSubmit={handleSendMessage} className="p-6 pt-2">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="w-full bg-slate-100 dark:bg-slate-900/50 border-2 border-transparent focus:border-indigo-500 rounded-xl py-3 pl-4 pr-14 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-0 transition-all duration-300"
              />
              <button
                type="submit"
                disabled={!message.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Polls Sidebar */}
      {polls.length > 0 && (
        <aside className="hidden xl:flex flex-col w-96 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-l border-slate-200/50 dark:border-slate-700/50 overflow-hidden shadow-2xl flex-shrink-0">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Active Polls</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{polls.length} poll{polls.length !== 1 ? 's' : ''} running</p>
              </div>
            </div>
            <div className="space-y-6 overflow-y-auto">
              <AnimatePresence>
                {polls.map(poll => (
                  <motion.div
                    key={poll.id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  >
                    <PollCard
                      poll={poll}
                      onVote={handleVotePoll}
                      isOrganizer={currentRoom && currentRoom.organizer_id === user?.id}
                      currentUserId={user?.id}
                      onEndPoll={endPoll}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </aside>
      )}

      {/* Poll Modal */}
      {showPollModal && (
        <PollModal
          isOpen={showPollModal}
          onClose={() => setShowPollModal(false)}
          onCreatePoll={handleCreatePoll}
        />
      )}
    </div>
  );
};

export default Chatroom;
