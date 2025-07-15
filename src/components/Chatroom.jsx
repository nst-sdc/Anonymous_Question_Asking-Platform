import React, { useState, useRef, useEffect } from 'react';
import { generateAvatarSvg } from '../utils/avatar';
import { useParams } from 'react-router-dom';
import { Send, Users, BarChart3, Hash, LogOut, Settings, Crown, Plus, Smile } from 'lucide-react';
import ScrollToBottomButton from './ScrollToBottomButton';
import { useRoom } from '../contexts/RoomContext';
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
    if (user && code && !currentRoom) {
      joinRoom(code).catch((err) => {
        // Optionally handle error (room not found, etc)
        // You could add a toast or notification here
        console.error('Failed to join room from URL:', err);
      });
    }
    // eslint-disable-next-line
  }, [user, code, currentRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!currentRoom) {
    return <div>Loading...</div>;
  }

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    sendMessage(message.trim(), replyingTo || undefined)
      .then(() => {
        // Message sent successfully
      })
      .catch((error) => {
        console.error('Failed to send message:', error);
        // You could add a toast notification here
      });
      
    setMessage('');
    setReplyingTo(null);
  };

  const handleReaction = (messageId, type) => {
    addReaction(messageId, type);
  };

  const handleReply = (messageId) => {
    setReplyingTo(messageId);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex transition-all duration-500">
      {/* Sidebar */}
      <div className="hidden lg:block w-80 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-700/50 shadow-2xl">
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Hash className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-800 dark:text-white">{currentRoom.name}</h2>
              <div className="flex items-center space-x-2">
                <p className="text-sm font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">#{currentRoom.code}</p>
                {isOrganizer && (
                  <Crown className="w-4 h-4 text-amber-500" title="Room Organizer" />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Members</span>
              <span className="text-xs bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full font-semibold">
                {roomMembers.length}
              </span>
            </div>

            <div className="space-y-2">
              {roomMembers.map((member, index) => (
                <div key={member.id} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-200 group">
                  <div className="w-8 h-8 rounded-full overflow-hidden border shadow-lg flex-shrink-0 bg-white dark:bg-slate-800">
  <img
    src={`data:image/svg+xml;utf8,${encodeURIComponent(generateAvatarSvg(member.anonymous_id || 'Anon'))}`}
    alt="avatar"
    className="w-full h-full object-cover"
    draggable={false}
  />
</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {member.user_id === user?.id ? 'You' : member.anonymous_id}
                      </span>
                      {currentRoom.created_by === member.user_id && (
                        <Crown className="w-3 h-3 text-amber-500" />
                      )}
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-sm" title="Online"></div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={() => setShowPollModal(true)}
              className="w-full flex items-center space-x-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 px-4 py-4 rounded-xl hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/50 dark:hover:to-purple-900/50 transition-all duration-300 hover:shadow-lg border border-indigo-200/50 dark:border-indigo-700/50 font-semibold"
            >
              <Plus className="w-5 h-5" />
              <span>Create Poll</span>
            </button>
            
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Theme</span>
              <ThemeToggle />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 left-0 right-0 space-y-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl pt-4 pb-6 z-40">
          {isOrganizer && (
          <button
            onClick={async () => {
              if (window.confirm('Are you sure you want to end this room for everyone?')) {
                try {
                  await endRoom();
                  if (typeof onLeaveRoom === 'function') onLeaveRoom();
                } catch (err) {
                  alert('Failed to end room. Please try again.');
                  console.error('End room error:', err);
                }
              }
            }}
            className="w-full flex items-center space-x-3 text-red-600 hover:text-red-700 px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 font-semibold border border-red-200/50 dark:border-red-700/50"
          >
            <Settings className="w-4 h-4" />
            <span>End Room</span>
          </button>
        )}  
          <button
            onClick={handleLeaveRoom}
            className="w-full flex items-center space-x-3 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 px-4 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all duration-200 font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Leave Room</span>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 px-6 py-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Hash className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{currentRoom.name}</h1>
                  {isOrganizer && (
                    <Crown className="w-5 h-5 text-amber-500" title="You are the organizer" />
                  )}
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  <span className="inline-flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{roomMembers.length} member{roomMembers.length !== 1 ? 's' : ''}</span>
                  </span>
                  <span className="mx-2">•</span>
                  <span className="font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">#{currentRoom.code}</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="lg:hidden">
                <ThemeToggle />
              </div>
              
              <button
                onClick={() => setShowPollModal(true)}
                className="lg:hidden p-3 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-200"
              >
                <Plus className="w-5 h-5" />
              </button>
              
              {isOrganizer && (
                <button
                  onClick={handleEndRoom}
                  className="lg:hidden p-3 text-red-600 hover:text-red-700 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                >
                  <Settings className="w-5 h-5" />
                </button>
              )}
              
              <button
                onClick={handleLeaveRoom}
                className="lg:hidden p-3 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Messages */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-6 space-y-6" onScroll={handleScroll} id="chat-messages-list">
              {messages.map(msg => (
                <Message
                  key={msg.id}
                  message={{ ...msg, user_reaction: msg.user_reaction ?? null }}
                  onReaction={handleReaction}
                  onReply={handleReply}
                  isCurrentUser={msg.user_id === user?.id}
                />
              ))}
              <div ref={messagesEndRef} />
<ScrollToBottomButton visible={showScrollButton} onClick={scrollToBottom} />
            </div>

            {/* Reply indicator */}
            {replyingTo && (
              <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border-t border-indigo-200/50 dark:border-indigo-700/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                    Replying to message...
                  </span>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-medium px-3 py-1 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {/* Fixed Chat Input Bar */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/50 p-6 fixed bottom-0 left-0 right-0 z-30" style={{maxWidth:'100vw'}}>
              <form onSubmit={handleSendMessage} className="flex items-end space-x-4 max-w-4xl mx-auto">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-6 py-4 pr-16 border-2 border-slate-200 dark:border-slate-600 rounded-2xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-lg"
                    placeholder="Type your message..."
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
          </div>

          {/* Polls Sidebar */}
          {polls.length > 0 && (
            <div className="hidden xl:block w-96 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-l border-slate-200/50 dark:border-slate-700/50 overflow-y-auto shadow-2xl">
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
                <div className="space-y-6">
                  {polls.map(poll => (
                    <PollCard
                      key={poll.id}
                      poll={poll}
                      onVote={handleVotePoll}
                      isOrganizer={currentRoom && currentRoom.organizer_id === (user?.id || localStorage.getItem(`anonymeet_anon_id_${code}`))}
                      currentUserId={user?.id}
                      currentAnonymousId={localStorage.getItem(`anonymeet_anon_id_${code}`)}
                      onEndPoll={endPoll}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Polls */}
        {polls.length > 0 && (
          <div className="xl:hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/50">
            <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white">Active Polls</h3>
                <span className="bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-700 dark:text-emerald-300 text-xs px-3 py-1 rounded-full font-semibold">
                  {polls.length}
                </span>
              </div>
            </div>
            <div className="p-4 flex space-x-6 overflow-x-auto">
              {polls.map(poll => (
                <div key={poll.id} className="flex-shrink-0 w-96">
                  <PollCard
                    poll={poll}
                    onVote={handleVotePoll}
                    isOrganizer={currentRoom && currentRoom.organizer_id === (user?.id || localStorage.getItem(`anonymeet_anon_id_${code}`))}
                    currentUserId={user?.id}
                    currentAnonymousId={localStorage.getItem(`anonymeet_anon_id_${code}`)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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