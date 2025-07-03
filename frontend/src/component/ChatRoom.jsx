import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Send, 
  ArrowLeft, 
  Users, 
  Volume, 
  VolumeX, 
  Shield, 
  Clock,
  BarChart3,
  Smile,
  AlertTriangle,
  Ban,
  Trash2,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatTime, getTimeRemaining } from '../utils/helpers';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ChatRoom = () => {
  const [message, setMessage] = useState('');
  const [showParticipants, setShowParticipants] = useState(false);
  const [showPollForm, setShowPollForm] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModerationPanel, setShowModerationPanel] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');
  const messagesEndRef = useRef(null);
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  const { 
    user, 
    currentRoom, 
    leaveRoom, 
    sendMessage, 
    silenceUser,
    addReaction,
    createPoll,
    votePoll,
    closePoll,
    endRoom,
    rooms
  } = useApp();
  
  // Find the room from the URL parameter
  const room = rooms.find(r => r.id === roomId);
  
  // If room not found, redirect to dashboard
  const userRole = user?.role;
  useEffect(() => {
    if (!room && rooms.length > 0) {
      navigate(userRole === 'teacher' ? '/teacher' : '/student');
    }
  }, [room, rooms, navigate, userRole]);

  // Create a ref to store the previous message length
  const prevMessagesLength = useRef(0);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (currentRoom?.messages) {
      const currentLength = currentRoom.messages.length;
      // Only scroll if new messages were added (not removed)
      if (currentLength > prevMessagesLength.current) {
        // Use 'auto' for initial load, 'smooth' for subsequent updates
        const behavior = prevMessagesLength.current === 0 ? 'auto' : 'smooth';
        scrollToBottom(behavior);
      }
      prevMessagesLength.current = currentLength;
    }
  }, [currentRoom?.messages, scrollToBottom]);
  
  // Initial scroll to bottom
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom('auto');
    }, 100);
    return () => clearTimeout(timer);
  }, [scrollToBottom]);

  const [lastError, setLastError] = useState('');
  const [showError, setShowError] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    try {
      const success = sendMessage(message);
      if (success) {
        setMessage('');
        setShowError(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setLastError(error.message || 'Message could not be sent. Please try again.');
      setShowError(true);
      
      // Auto-hide error after 5 seconds
      setTimeout(() => {
        setShowError(false);
      }, 5000);
    }
  };
  
  // Handle pressing Enter to send message
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSilence = (userId, duration) => {
    silenceUser(userId, duration);
    setSelectedUser(null);
    setShowModerationPanel(false);
  };

  const handleCreatePoll = () => {
    const validOptions = pollOptions.filter(opt => opt.trim());
    if (!pollQuestion.trim() || validOptions.length < 2) return;
    
    createPoll(pollQuestion, validOptions);
    setPollQuestion('');
    setPollOptions(['', '']);
    setShowPollForm(false);
  };

  // Memoize currentRoom.id to prevent unnecessary re-renders
  const currentRoomId = useMemo(() => currentRoom?.id, [currentRoom?.id]);

  const handleEndClass = useCallback(() => {
    if (window.confirm('Are you sure you want to end this class? This will close the room for all participants.')) {
      if (currentRoomId) {
        endRoom(currentRoomId);
        // Redirect teacher back to dashboard after ending class
        navigate('/teacher');
      } else {
        toast.error('No active room found', {
          position: 'top-center',
          autoClose: 2000,
        });
      }
    }
  }, [currentRoomId, endRoom, navigate]);

  const reactions = ['👍', '👎', '❤️', '😂', '😮', '🤔'];

  const isUserSilenced = (userId) => {
    const participant = room?.participants.find(p => p.id === userId);
    return participant?.silencedUntil && new Date() < participant.silencedUntil;
  };

  if (!room) return null;

  const activePoll = room.polls.find(poll => poll.active);
  const currentUserSilenced = user && isUserSilenced(user.id);
  
  // Handle copy room code
  const handleCopyCode = useCallback(() => {
    if (currentRoom?.code) {
      navigator.clipboard.writeText(currentRoom.code);
      setCopiedCode(currentRoom.code);
      toast.success('Room code copied to clipboard!', {
        position: 'top-center',
        autoClose: 2000,
      });
      setTimeout(() => setCopiedCode(''), 2000);
    }
  }, [currentRoom?.code]);

  // Handle leave room
  const handleLeaveRoom = () => {
    leaveRoom();
    navigate(user?.role === 'teacher' ? '/teacher' : '/student');
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm shadow-sm border-b border-border p-3 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleLeaveRoom}
              className="p-2 rounded-full text-text-secondary hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-text">{room.name}</h1>
              <p className="text-sm text-text-secondary">Room Code: <span className="font-mono">{room.code}</span></p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {user?.role === 'teacher' && (
              <>
                <button
                  onClick={() => setShowPollForm(true)}
                  className="hidden sm:flex items-center space-x-2 bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Create Poll</span>
                </button>
                <button
                  onClick={() => setShowModerationPanel(!showModerationPanel)}
                  className="flex items-center space-x-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-lg hover:bg-amber-500/20 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Moderate</span>
                </button>
                {user.id === room.teacherId && (
                  <button
                    onClick={handleEndClass}
                    className="flex items-center space-x-2 bg-red-500/10 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">End Room</span>
                  </button>
                )}
              </>
            )}
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className="flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>{room.participants.length}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Active Poll */}
          {activePoll && (
            <div className="p-4 border-b border-border bg-primary/5 dark:bg-primary/10">
              <div className="max-w-md mx-auto bg-card rounded-xl p-5 shadow-lg border border-primary/20">
                <h3 className="font-bold text-text text-lg mb-3">Poll: {activePoll.question}</h3>
                <div className="space-y-2">
                  {activePoll.options.map(option => {
                    const userVoted = user && (activePoll.votes[option] || []).includes(user.id);
                    return (
                      <button
                        key={option}
                        onClick={() => votePoll(activePoll.id, option)}
                        disabled={user?.role === 'teacher' || activePoll.closedAt}
                        className={`w-full p-3 rounded-lg text-left transition-all border ${userVoted ? 'bg-primary/20 border-primary font-semibold' : 'bg-bg-hover border-border hover:border-primary/50'} disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {option}
                      </button>
                    )
                  })}
                </div>
                {user?.role === 'teacher' && !activePoll.closedAt && (
                  <button onClick={() => closePoll(activePoll.id)} className="w-full mt-3 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 text-sm font-semibold">End Poll</button>
                )}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="max-w-4xl mx-auto space-y-5">
              {room.messages?.map((msg) => {
                if (!msg.reactions) msg.reactions = {};
                const isAuthor = msg.userId === user?.id;
                return (
                <div key={msg.id} className={`flex items-start gap-2 sm:gap-3 ${isAuthor ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-xs sm:text-sm font-bold">
                      {msg.userRole === 'teacher' ? msg.username.charAt(0).toUpperCase() : 'S'}
                    </span>
                  </div>
                  <div className={`bg-card rounded-xl p-3 shadow-sm border border-border w-fit max-w-md ${isAuthor ? 'rounded-br-none bg-primary/10 dark:bg-primary/20 border-primary/20' : 'rounded-bl-none'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-text">{msg.username}</span>
                        {user?.role === 'teacher' && !isAuthor && (
                          <button
                            onClick={() => {
                              setSelectedUser(msg.userId);
                              setShowModerationPanel(true);
                            }}
                            className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"
                          >
                            <Shield className="w-4 h-4 text-text-secondary" />
                          </button>
                        )}
                      </div>
                      <span className="text-xs text-text-secondary ml-2">{formatTime(msg.timestamp)}</span>
                    </div>
                    
                    <p className="text-text-secondary dark:text-text-secondary mb-2 whitespace-pre-wrap">{msg.content}</p>
                    
                    {/* Reactions */}
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex space-x-1">
                        {reactions.map((emoji) => {
                          const reactionUsers = msg.reactions?.[emoji] || [];
                          const userReacted = user && reactionUsers.includes(user.id);
                          
                          return (
                            <button
                              key={emoji}
                              onClick={() => addReaction(msg.id, emoji)}
                              className={`px-2 py-0.5 rounded-full text-xs transition-all border ${ 
                                userReacted
                                  ? 'bg-primary/20 border-primary/50 text-primary'
                                  : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border-transparent'
                              }`}
                            >
                              {emoji} {reactionUsers.length > 0 && reactionUsers.length}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )})}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input */}
          <div className="bg-card/80 backdrop-blur-sm border-t border-border p-2 sm:p-4">
            <div className="max-w-4xl mx-auto">
              {currentUserSilenced ? (
                <div className="flex items-center justify-center space-x-2 text-red-500 py-2 text-sm">
                  <VolumeX className="w-5 h-5" />
                  <span>You are silenced until {user?.silencedUntil && formatTime(user.silencedUntil)}</span>
                </div>
              ) : (
                <div className="relative">
                  {showError && (
                    <div className="absolute bottom-full left-0 right-0 p-2">
                      <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-2 mb-2 rounded-lg flex items-center text-sm" role="alert">
                        <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
                        <p>{lastError}</p>
                        <button onClick={() => setShowError(false)} className="ml-auto p-1"><X className="w-4 h-4"/></button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center bg-bg rounded-xl border-2 border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your message... (Shift+Enter for new line)"
                      className="flex-1 px-4 py-3 bg-transparent resize-none outline-none text-text placeholder-text-secondary/70"
                      maxLength={500}
                      rows={1}
                      style={{maxHeight: '100px'}}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!message.trim()}
                      className="p-2 text-primary rounded-full hover:bg-primary/10 disabled:text-text-secondary disabled:hover:bg-transparent transition-colors mr-2"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Participants Sidebar */}
        {showParticipants && room && (
          <div className="w-72 bg-card/70 backdrop-blur-sm border-l border-border p-4 overflow-y-auto">
            <h3 className="font-bold text-text mb-4">Participants ({room.participants.length})</h3>
            <div className="space-y-2">
              {room.participants.map((participant) => (
                <div key={participant.id} className="flex items-center justify-between p-2 bg-bg-hover rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-medium">
                        {participant.role === 'teacher' ? (participant.anonymousName?.charAt(0).toUpperCase() || 'T') : 'S'}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-text-secondary text-sm truncate">
                        {participant.role === 'teacher' ? participant.anonymousName : 'Anonymous Student'}
                        {participant.role === 'teacher' && ' (Teacher)'}
                      </div>
                      {participant.violations > 0 && (
                        <div className="text-xs text-yellow-500">
                          {participant.violations} violation{participant.violations > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {participant.banned && <Ban className="w-4 h-4 text-red-500" title="Banned" />}
                    {isUserSilenced(participant.id) && <VolumeX className="w-4 h-4 text-orange-500" title="Silenced" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Poll Creation Modal */}
      {showPollForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowPollForm(false)} className="absolute top-3 right-3 p-2 text-text-secondary hover:bg-bg-hover rounded-full"><X/></button>
            <h2 className="text-2xl font-bold text-text text-center mb-2">Create a Poll</h2>
            <p className="mb-6 text-text-secondary text-center">Engage your students with a quick poll.</p>
            <div className="w-full mb-4">
              <label className="block text-text-secondary font-semibold mb-1">Question</label>
              <input
                type="text"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-bg-input border-2 border-border focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-base"
                placeholder="What would you like to ask?"
                maxLength={100}
              />
            </div>
            <div className="w-full mb-6">
              {pollOptions.map((option, index) => (
                <div key={index} className="flex items-center mb-3">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...pollOptions];
                      newOptions[index] = e.target.value;
                      setPollOptions(newOptions);
                    }}
                    className="flex-1 px-4 py-3 rounded-xl bg-bg-input border-2 border-border focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-base mr-2"
                    placeholder={`Option ${index + 1}`}
                    maxLength={50}
                  />
                  {pollOptions.length > 2 && (
                    <button
                      onClick={() => {
                        const newOptions = [...pollOptions];
                        newOptions.splice(index, 1);
                        setPollOptions(newOptions);
                      }}
                      className="text-text-secondary hover:text-red-500 p-2 rounded-full hover:bg-red-500/10 transition-colors"
                      title="Remove option"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              {pollOptions.length < 4 && (
                <button
                  onClick={() => setPollOptions([...pollOptions, ''])}
                  className="w-full mt-2 py-2 rounded-xl bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors"
                >
                  + Add Option
                </button>
              )}
            </div>
            <button
              onClick={handleCreatePoll}
              disabled={!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2}
              className="w-full py-3 rounded-xl text-lg font-bold shadow-md transition-all bg-primary text-white hover:bg-primary/90 disabled:bg-border disabled:text-text-secondary disabled:cursor-not-allowed"
            >
              Create Poll
            </button>
          </div>
        </div>
      )}

      {/* Moderation Panel */}
      {showModerationPanel && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-text mb-4">Moderate User</h3>
            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleSilence(selectedUser, 10)}
                className="w-full flex items-center justify-between p-3 bg-yellow-500/10 border-2 border-transparent rounded-lg hover:border-yellow-500/50 transition-colors"
              >
                <span className="text-yellow-500">Silence for 10 minutes</span>
                <Clock className="w-4 h-4 text-yellow-500" />
              </button>
              <button
                onClick={() => handleSilence(selectedUser, 60)}
                className="w-full flex items-center justify-between p-3 bg-orange-500/10 border-2 border-transparent rounded-lg hover:border-orange-500/50 transition-colors"
              >
                <span className="text-orange-500">Silence for 1 hour</span>
                <Clock className="w-4 h-4 text-orange-500" />
              </button>
              <button
                onClick={() => handleSilence(selectedUser, 1440)} // 24 hours
                className="w-full flex items-center justify-between p-3 bg-red-500/10 border-2 border-transparent rounded-lg hover:border-red-500/50 transition-colors"
              >
                <span className="text-red-500">Silence for 24 hours</span>
                <Clock className="w-4 h-4 text-red-500" />
              </button>
            </div>
            <button
              onClick={() => setShowModerationPanel(false)}
              className="w-full py-2 bg-bg-hover rounded-lg text-text font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
