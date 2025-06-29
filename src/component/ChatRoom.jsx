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
  Trash2
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-white/20 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLeaveRoom}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{room.name}</h1>
              <p className="text-sm text-gray-600">Room Code: {room.code}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {user?.role === 'teacher' && (
              <>
                <button
                  onClick={() => setShowPollForm(true)}
                  className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Poll</span>
                </button>
                <button
                  onClick={() => setShowModerationPanel(!showModerationPanel)}
                  className="flex items-center space-x-2 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  <span>Moderate</span>
                </button>
                {user.id === room.teacherId && (
                  <button
                    onClick={handleEndClass}
                    className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>End Room</span>
                  </button>
                )}
              </>
            )}
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>{room.participants.length}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Active Poll */}
          {activePoll && (
            <div className="bg-green-50 border-b border-green-200 p-4">
              <div className="max-w-4xl mx-auto">
                <h3 className="font-semibold text-green-800 mb-3">{activePoll.question}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {activePoll.options.map((option, index) => {
                    const votes = activePoll.votes[option] || [];
                    const percentage = room.participants.length > 1 
                      ? Math.round((votes.length / (room.participants.length - 1)) * 100)
                      : 0;
                    const userVoted = user && votes.includes(user.id);
                    
                    return (
                      <button
                        key={index}
                        onClick={() => votePoll(activePoll.id, option)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          userVoted
                            ? 'bg-green-100 border-green-500'
                            : 'bg-white border-green-200 hover:border-green-400'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{option}</span>
                          <span className="text-sm text-gray-600">{votes.length} votes</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-4xl mx-auto space-y-4">
              {room.messages.map((msg) => (
                <div key={msg.id} className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-white/20">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {msg.username.charAt(0)}
                        </span>
                      </div>
                      <span className="font-medium text-gray-800">{msg.username}</span>
                      {user?.role === 'teacher' && msg.userId !== user.id && (
                        <button
                          onClick={() => {
                            setSelectedUser(msg.userId);
                            setShowModerationPanel(true);
                          }}
                          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Shield className="w-4 h-4 text-gray-500" />
                        </button>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{formatTime(msg.timestamp)}</span>
                  </div>
                  
                  <p className="text-gray-700 mb-3">{msg.content}</p>
                  
                  {/* Reactions */}
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      {reactions.map((emoji) => {
                        const reactionUsers = msg.reactions[emoji] || [];
                        const userReacted = user && reactionUsers.includes(user.id);
                        
                        return (
                          <button
                            key={emoji}
                            onClick={() => addReaction(msg.id, emoji)}
                            className={`px-2 py-1 rounded-lg text-sm transition-all ${
                              userReacted
                                ? 'bg-blue-100 border border-blue-300'
                                : 'bg-gray-100 hover:bg-gray-200 border border-transparent'
                            }`}
                          >
                            {emoji} {reactionUsers.length > 0 && reactionUsers.length}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input */}
          <div className="bg-white/80 backdrop-blur-sm border-t border-white/20 p-4">
            <div className="max-w-4xl mx-auto">
              {currentUserSilenced ? (
                <div className="flex items-center justify-center space-x-2 text-red-600 py-3">
                  <VolumeX className="w-5 h-5" />
                  <span>You are silenced until {user?.silencedUntil && formatTime(user.silencedUntil)}</span>
                </div>
              ) : (
                <div className="flex flex-col p-4 border-t border-gray-200 dark:border-gray-700">
                  {/* Error message */}
                  {showError && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-2 mx-4 rounded" role="alert">
                      <div className="flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        <p>{lastError}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 text-right">
                    {message.length}/500
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value.slice(0, 500))}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your message..."
                      className="flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      maxLength={500}
                      disabled={user?.silencedUntil && new Date() < new Date(user.silencedUntil)}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!message.trim() || (user?.silencedUntil && new Date() < new Date(user.silencedUntil))}
                      className={`p-2 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        !message.trim() || (user?.silencedUntil && new Date() < new Date(user.silencedUntil))
                          ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                      title={user?.silencedUntil && new Date() < new Date(user.silencedUntil) 
                        ? `You are silenced until ${new Date(user.silencedUntil).toLocaleTimeString()}` 
                        : 'Send message'}
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Silenced notice */}
                  {user?.silencedUntil && new Date() < new Date(user.silencedUntil) && (
                    <div className="mt-2 text-sm text-yellow-600 dark:text-yellow-400 flex items-center">
                      <VolumeX className="w-4 h-4 mr-1" />
                      <span>You are silenced until {new Date(user.silencedUntil).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Participants Sidebar */}
        {showParticipants && room && (
          <div className="w-80 bg-white/70 backdrop-blur-sm border-l border-white/20 p-4">
            <h3 className="font-semibold text-gray-800 mb-4">Participants ({room.participants.length})</h3>
            <div className="space-y-2">
              {room.participants.map((participant) => (
                <div key={participant.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {participant.anonymousName?.charAt(0) || 'T'}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">
                        {participant.anonymousName}
                        {participant.role === 'teacher' && ' (Teacher)'}
                      </div>
                      {participant.violations > 0 && (
                        <div className="text-xs text-yellow-600">
                          {participant.violations} violation{participant.violations > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {participant.banned && <Ban className="w-4 h-4 text-red-500" />}
                    {isUserSilenced(participant.id) && <VolumeX className="w-4 h-4 text-orange-500" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Poll Creation Modal */}
      {showPollForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Create Poll</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
              <input
                type="text"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Enter your question"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
              {pollOptions.map((option, index) => (
                <input
                  key={index}
                  type="text"
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...pollOptions];
                    newOptions[index] = e.target.value;
                    setPollOptions(newOptions);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none mb-2"
                  placeholder={`Option ${index + 1}`}
                />
              ))}
              <button
                onClick={() => setPollOptions([...pollOptions, ''])}
                className="text-blue-500 text-sm hover:text-blue-600"
              >
                + Add Option
              </button>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowPollForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePoll}
                className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                Create Poll
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Moderation Panel */}
      {showModerationPanel && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Moderate User</h3>
            
            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleSilence(selectedUser, 10)}
                className="w-full flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
              >
                <span>Silence for 10 minutes</span>
                <Clock className="w-4 h-4 text-yellow-600" />
              </button>
              
              <button
                onClick={() => handleSilence(selectedUser, 20)}
                className="w-full flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <span>Silence for 20 minutes</span>
                <Clock className="w-4 h-4 text-orange-600" />
              </button>
              
              <button
                onClick={() => handleSilence(selectedUser, 30)}
                className="w-full flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <span>Silence for 30 minutes</span>
                <Clock className="w-4 h-4 text-red-600" />
              </button>
              
              <button
                onClick={() => handleSilence(selectedUser, 60)}
                className="w-full flex items-center justify-between p-3 bg-red-100 border border-red-300 rounded-lg hover:bg-red-200 transition-colors"
              >
                <span>Silence for 1 hour</span>
                <AlertTriangle className="w-4 h-4 text-red-700" />
              </button>
              
              <button
                onClick={() => handleSilence(selectedUser, 1440)}
                className="w-full flex items-center justify-between p-3 bg-red-200 border border-red-400 rounded-lg hover:bg-red-300 transition-colors"
              >
                <span>Silence for 24 hours</span>
                <Ban className="w-4 h-4 text-red-800" />
              </button>
            </div>

            <button
              onClick={() => {
                setSelectedUser(null);
                setShowModerationPanel(false);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
