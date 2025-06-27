import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  LogOut
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatTime } from '../utils/helpers';

const ChatRoom = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [showParticipants, setShowParticipants] = useState(false);
  const [showPollForm, setShowPollForm] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModerationPanel, setShowModerationPanel] = useState(false);
  const messagesEndRef = useRef(null);
  
  const { 
    user, 
    currentRoom, 
    leaveRoom: leaveRoomContext, 
    silenceUser,
    addReaction,
    createPoll: createPollContext,
    votePoll,
    endRoom: endRoomContext,
    logout
  } = useApp();
  
  const { 
    messages: socketMessages, 
    sendMessage: sendSocketMessage, 
    isConnected 
  } = useSocket();
  
  // Combine room messages with socket messages
  const allMessages = React.useMemo(() => {
    try {
      if (!currentRoom?.messages && !socketMessages) return [];
      
      const combined = [
        ...(currentRoom?.messages?.map(msg => ({
          ...msg,
          id: msg.id || `msg-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: msg.timestamp || new Date().toISOString()
        })) || []),
        ...(socketMessages?.map(msg => ({
          ...msg,
          id: msg.id || `msg-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: msg.timestamp || new Date().toISOString()
        })) || [])
      ];
      
      return combined.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } catch (error) {
      console.error('Error combining messages:', error);
      return [];
    }
  }, [currentRoom?.messages, socketMessages]);

  // Redirect to login if no user is logged in
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  const scrollToBottom = React.useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentRoom?.messages]);

  const handleLeaveRoom = () => {
    leaveRoomContext();
    // Navigate based on user role after leaving
    if (user?.role === 'teacher') {
      navigate('/teacher');
    } else {
      navigate('/student');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSendMessage = () => {
    if (!message.trim() || !user || !currentRoom) return;
    
    // Check if user is silenced
    const isSilenced = user.silencedUntil && new Date() < new Date(user.silencedUntil);
    if (isSilenced) {
      alert('You have been silenced by the teacher.');
      return;
    }
    
    // Create message object
    const messageObj = {
      content: message,
      sender: user.id,
      username: user.anonymousName || 'Anonymous',
      roomId: currentRoom.id,
      isTeacher: user.role === 'teacher',
      timestamp: new Date().toISOString()
    };
    
    // Send message through socket
    sendSocketMessage(messageObj);
    
    // Clear the input field
    setMessage('');
  };
  
  // Handle pressing Enter key to send message
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [allMessages, scrollToBottom]);

  const handleSilence = (userId, duration) => {
    silenceUser(userId, duration);
    setSelectedUser(null);
    setShowModerationPanel(false);
  };

  const handleCreatePoll = () => {
    const validOptions = pollOptions.filter(opt => opt.trim());
    if (!pollQuestion.trim() || validOptions.length < 2) return;
    
    createPollContext(pollQuestion, validOptions);
    setPollQuestion('');
    setPollOptions(['', '']);
    setShowPollForm(false);
  };

  const handleEndRoom = () => {
    if (currentRoom && window.confirm(`Are you sure you want to end the room "${currentRoom.name}"? This action is permanent.`)) {
      endRoomContext(currentRoom.id);
      navigate(user?.role === 'teacher' ? '/teacher' : '/student');
    }
  };

  const reactions = ['👍', '👎', '❤️', '😂', '😮', '🤔'];

  const isUserSilenced = (userId) => {
    const participant = currentRoom?.participants?.find(p => p.id === userId);
    return participant?.silencedUntil && new Date() < new Date(participant.silencedUntil);
  };

  if (!currentRoom || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading room...</p>
        </div>
      </div>
    );
  }

  const activePoll = currentRoom.polls?.find(poll => poll.active);
  const currentUserSilenced = isUserSilenced(user.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex">
      <div className="flex-1 flex flex-col h-screen">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-white/20 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLeaveRoom}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Leave room"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{currentRoom.name}</h1>
              <p className="text-sm text-gray-600">Room Code: {currentRoom.code}</p>
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
                {user.id === currentRoom.teacherId && (
                  <button
                    onClick={handleEndRoom}
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
              <span>{currentRoom.participants?.length || 0}</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Active Poll */}
      {activePoll && (
        <div className="bg-green-50 border-b border-green-200 p-4">
          <div className="max-w-4xl mx-auto">
            <h3 className="font-semibold text-green-800 mb-3">{activePoll.question}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {activePoll.options.map((option, index) => {
                const votes = activePoll.votes?.[option] || [];
                const percentage = currentRoom.participants?.length > 1 
                  ? Math.round((votes.length / (currentRoom.participants.length - 1)) * 100)
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
            {allMessages.map((msg, index) => (
              <div key={msg.id || `msg-${index}`} className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-white/20">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {(msg.sender === user?.id ? user?.anonymousName?.charAt(0) : msg.username?.charAt(0)) || '?'}
                      </span>
                    </div>
                    <span className="font-medium text-gray-800">
                      {msg.sender === user?.id ? 'You' : (msg.username || 'Anonymous')}
                    </span>
                    {user?.role === 'teacher' && msg.sender !== user?.id && (
                      <button
                        onClick={() => {
                          setSelectedUser(msg.sender || msg.userId);
                          setShowModerationPanel(true);
                        }}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Shield className="w-4 h-4 text-gray-500" title="Moderate user" />
                      </button>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {msg.timestamp ? formatTime(msg.timestamp) : 'Just now'}
                  </span>
                </div>
                
                <p className="text-gray-700 mb-3">{msg.content}</p>
                
                {/* Reactions */}
                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(msg.reactions).map(([emoji, users]) => (
                        <button
                          key={emoji}
                          onClick={() => msg.id && addReaction(msg.id, emoji)}
                          className={`px-2 py-1 rounded-lg text-sm transition-all ${
                            users.includes(user?.id)
                              ? 'bg-blue-100 border border-blue-300'
                              : 'bg-gray-100 hover:bg-gray-200 border border-transparent'
                          }`}
                          title={Array.isArray(users) ? users.join(', ') : ''}
                        >
                          {emoji} {Array.isArray(users) ? users.length : 0}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
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
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleSendMessage}
                disabled={!message.trim()}
                className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Participants Sidebar */}
      {showParticipants && (
        <div className="w-80 bg-white/70 backdrop-blur-sm border-l border-white/20 p-4">
          <h3 className="font-semibold text-gray-800 mb-4">Participants ({currentRoom.participants?.length || 0})</h3>
          <div className="space-y-2">
            {currentRoom.participants?.map((participant) => (
              <div key={participant.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {participant.anonymousName?.charAt(0) || 'T'}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">
                      {participant.anonymousName || 'Anonymous'}
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
