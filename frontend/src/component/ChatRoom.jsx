import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Send,
  ArrowLeft,
  Users,
  Shield,
  BarChart3,
  X,
  MessageSquare, // For reply button
  Clock,
  Trash2,
  Copy,
  LogOut,
  Check, // For poll vote indicator
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatTime } from '../utils/helpers';
import { useParams, useNavigate } from 'react-router-dom';

// Poll Component to display active poll



import MessageCard from './MessageCard';
import PollForm from './PollForm';
import ParticipantsSidebar from './ParticipantsSidebar';
import ModerationPanel from './ModerationPanel'
import PollDisplay from './PollDisplay';

const ChatRoom = () => {
  const [message, setMessage] = useState('');
  const [showParticipants, setShowParticipants] = useState(false);
  const [showPollForm, setShowPollForm] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModerationPanel, setShowModerationPanel] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { roomId } = useParams();
  const navigate = useNavigate();

  const { 
    user, 
    currentRoom, 
    leaveRoom, 
    sendMessage, 
    silenceUser,
    createPoll,
    rooms,
    endRoom,
    getActivePoll
  } = useApp();

  const activePoll = useMemo(() => {
    if (!currentRoom) return null;
    return getActivePoll(currentRoom.id);
  }, [currentRoom, getActivePoll]);

  const userRole = user?.role;
  useEffect(() => {
    if (!currentRoom && rooms.length > 0) {
      navigate(userRole === 'teacher' ? '/teacher' : '/student');
    }
  }, [currentRoom, rooms, navigate, userRole]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentRoom?.messages, scrollToBottom]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const scrollHeight = inputRef.current.scrollHeight;
      const maxHeight = 144; // Approx 6 rows
      inputRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      inputRef.current.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  }, [message]);

  const handleSetReply = (message) => {
    setReplyTo(message);
    inputRef.current?.focus();
  };

  const handleCopy = () => {
    if (!currentRoom?.code) return;
    navigator.clipboard.writeText(currentRoom.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    try {
      const success = sendMessage(message, replyTo ? replyTo.id : null);
      if (success) {
        setMessage('');
        setReplyTo(null);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSilence = (userId, duration) => {
    silenceUser(userId, duration);
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

  const handleShowModeration = (userId) => {
      setSelectedUser(userId);
      setShowModerationPanel(true);
  }

  const handleLeaveRoom = () => {
    leaveRoom();
    navigate(user.role === 'teacher' ? '/teacher' : '/student');
  };

  const handleEndRoom = () => {
    if (window.confirm('Are you sure you want to end this classroom for everyone?')) {
      endRoom(currentRoom.id);
      navigate('/teacher');
    }
  };

  if (!currentRoom) {
    return <div className="flex items-center justify-center h-screen bg-background text-text">Loading room...</div>;
  }

  return (
    <div className="flex h-screen bg-background text-text font-sans">
      <div className="flex-1 flex flex-col bg-bg-main">
        <div className="bg-card/80 backdrop-blur-sm border-b border-border p-3 sm:p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">

            <button onClick={handleLeaveRoom} className="p-2 hover:bg-bg-hover rounded-full transition-colors flex items-center justify-center"><ArrowLeft className="w-5 h-5" /></button>
            <div>
              <h2 className="font-bold text-lg text-text truncate">{currentRoom?.name}</h2>
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <span>{currentRoom.participants.length} participants</span>
                <div className="w-px h-3 bg-border"></div>
                <button onClick={handleCopy} className="flex items-center gap-1 font-mono hover:text-text">
                  {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied!' : currentRoom.code}
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user?.role === 'teacher' && (
              <>
                <button onClick={() => setShowPollForm(true)} className="p-2 hover:bg-bg-hover rounded-full transition-colors flex items-center justify-center" title="Create Poll">
                  <BarChart3 className="w-5 h-5" />
                </button>
                <button onClick={handleEndRoom} className="p-2 hover:bg-bg-hover rounded-full transition-colors flex items-center justify-center" title="End Classroom">
                  <LogOut className="w-5 h-5 text-red-500" />
                </button>
              </>
            )}
            <button onClick={() => setShowParticipants(prev => !prev)} className="p-2 hover:bg-bg-hover rounded-full transition-colors flex items-center justify-center" title="View Participants">
              <Users className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <MessageCard 
              messages={currentRoom.messages}
              user={user}
              reactions={reactions}
              addReaction={addReaction}
              onModerateUser={(userId) => {
                setSelectedUser(userId);
                setShowModerationPanel(true);
              }}
              messagesEndRef={messagesEndRef}
            />
            <div className="max-w-4xl mx-auto space-y-5">
              {activePoll && <PollDisplay poll={activePoll} room={currentRoom} />}
            </div>
          </div>

          {showParticipants && (
            <div className="w-full max-w-xs bg-card/80 backdrop-blur-sm border-l border-border p-4 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Participants</h3>
                <button onClick={() => setShowParticipants(false)} className="p-2 hover:bg-bg-hover rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="overflow-y-auto space-y-3">
                {currentRoom.participants?.map(p => (
                  <div key={p.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{p.role === 'teacher' ? p.anonymousName.charAt(0).toUpperCase() : 'S'}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm truncate">{p.anonymousName}</p>
                        <p className="text-xs text-text-secondary">{p.role}</p>
                      </div>
                    </div>
                    {user?.role === 'teacher' && p.id !== user.id && (
                      <button onClick={() => handleShowModeration(p.id)} className="p-2 hover:bg-bg-hover rounded-full transition-colors"><Shield className="w-4 h-4 text-text-secondary" /></button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-card/80 backdrop-blur-sm border-t border-border p-3 sm:p-4">
          <div className="max-w-4xl mx-auto">
            {replyTo && (
              <div className="flex items-center justify-between bg-bg-input rounded-t-xl px-3 py-2 border-b-2 border-primary/20">
                <div>
                  <p className="text-sm font-bold text-primary">Replying to {replyTo.username}</p>
                  <p className="text-sm text-text-secondary truncate w-full max-w-xs sm:max-w-md md:max-w-lg">{replyTo.content}</p>
                </div>
                <button onClick={() => setReplyTo(null)} className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full">
                  <X className="w-4 h-4 text-text-secondary" />
                </button>
              </div>
            )}
            <div className="relative">
              <textarea
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className={`w-full bg-bg-input border-2 border-border p-3 pr-12 resize-none focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all ${replyTo ? 'rounded-b-xl' : 'rounded-xl'}`}
                style={{ overflowY: 'hidden' }}
              />
              <button onClick={handleSendMessage} className="absolute right-3 bottom-2.5 p-2 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors disabled:bg-border disabled:cursor-not-allowed" disabled={!message.trim()}>
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Participants Sidebar */}
        {showParticipants && currentRoom && (
          <ParticipantsSidebar 
            participant={currentRoom.participants}
            room={currentRoom}
            isUserSilenced={isUserSilenced}
          />
        )}
      </div>

      {showPollForm && (
        <PollForm
          onClose={() => setShowPollForm(false)}
          pollQuestion={pollQuestion}
          setPollQuestion={setPollQuestion}
          pollOptions={pollOptions}
          setPollOptions={setPollOptions}
          handleCreatePoll={handleCreatePoll}
        />
      )}

      {showModerationPanel && selectedUser && (
         <ModerationPanel
          selectedUser={selectedUser}
          onSilence={handleSilence}
          onClose={() => setShowModerationPanel(false)}
        />
      )}
    </div>
  );
};

export default ChatRoom;
