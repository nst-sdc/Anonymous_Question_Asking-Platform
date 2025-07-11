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
const PollDisplay = ({ poll, room }) => {
  const { user, votePoll, closePoll, getPollResults, isRoomOwner, getUserVote } = useApp();

  if (!poll || !poll.active) return null;

  const results = getPollResults(poll);
  const userVote = getUserVote(poll, user.id);
  const canVote = !userVote;
  const isOwner = isRoomOwner(room);

  return (
    <div className="bg-card border border-border rounded-xl p-4 my-4 shadow-md animate-fade-in">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg text-text flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          {poll.question}
        </h3>
        {isOwner && (
          <button
            onClick={() => closePoll(poll.id)}
            className="text-sm font-semibold text-red-500 hover:text-red-700 transition-colors"
          >
            Close Poll
          </button>
        )}
      </div>
      <div className="space-y-2">
        {poll.options.map((option) => {
          const result = results.find(r => r.option === option) || { votes: 0, percentage: 0 };
          const isVotedOption = userVote === option;

          return (
            <div key={option}>
              {canVote ? (
                <button
                  onClick={() => votePoll(poll.id, option)}
                  className="w-full text-left p-3 rounded-lg bg-bg-hover hover:bg-border hover:shadow-md transition-all font-medium"
                >
                  {option}
                </button>
              ) : (
                <div className={`relative w-full p-3 rounded-lg bg-bg-hover overflow-hidden border-2 ${isVotedOption ? 'border-primary' : 'border-transparent'}`}>
                  <div
                    className="absolute top-0 left-0 h-full bg-primary/20 transition-all duration-500"
                    style={{ width: `${result.percentage}%` }}
                  ></div>
                  <div className="relative flex justify-between font-semibold">
                    <span className="flex items-center">{option} {isVotedOption && <Check className="w-4 h-4 ml-2 text-primary" />}</span>
                    <span>{result.percentage}% ({result.votes})</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-text-secondary mt-3 text-right">{poll.totalVotes || 0} total votes</p>
    </div>
  );
};

// Component to render a single message
const Message = ({ msg, onSetReply, onShowModeration }) => {
    const { user, currentRoom, addReaction } = useApp();
    const isAuthor = msg.userId === user?.id;
    const repliedToMessage = msg.replyTo ? currentRoom.messages.find(m => m.id === msg.replyTo) : null;
    const reactions = useMemo(() => ['👍', '❤️', '😂', '😮', '😢', '🤔'], []);

    return (
        <div key={msg.id} className={`flex items-start gap-2 sm:gap-3 ${isAuthor ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0`}>
                <span className="text-white text-xs sm:text-sm font-bold">
                    {msg.userRole === 'teacher' ? msg.username.charAt(0).toUpperCase() : 'S'}
                </span>
            </div>
            <div className={`bg-card rounded-xl p-3 shadow-sm border border-border w-fit max-w-md ${isAuthor ? 'rounded-br-none bg-primary/10 dark:bg-primary/20 border-primary/20' : 'rounded-bl-none'}`}>
                {repliedToMessage && (
                    <div className="mb-2 p-2 rounded-lg bg-black/5 dark:bg-white/10 border-l-2 border-primary">
                        <p className="font-bold text-xs text-primary">{repliedToMessage.username}</p>
                        <p className="text-sm text-text-secondary truncate">{repliedToMessage.content}</p>
                    </div>
                )}
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-text">{msg.username}</span>
                        {user?.role === 'teacher' && !isAuthor && (
                            <button
                                onClick={() => onShowModeration(msg.userId)}
                                className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"
                            >
                                <Shield className="w-4 h-4 text-text-secondary" />
                            </button>
                        )}
                    </div>
                    <span className="text-xs text-text-secondary ml-2">{formatTime(msg.timestamp)}</span>
                </div>
                <p className="text-text-secondary dark:text-text-secondary mb-2 whitespace-pre-wrap">{msg.content}</p>
                <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center space-x-1">
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
                    <button 
                        onClick={() => onSetReply(msg)}
                        className="text-text-secondary hover:text-primary p-1 rounded-full hover:bg-primary/10 transition-colors"
                        title="Reply"
                    >
                        <MessageSquare className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

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
            <div className="max-w-4xl mx-auto space-y-5">
              {activePoll && <PollDisplay poll={activePoll} room={currentRoom} />}
              {currentRoom.messages?.map((msg) => (
                <Message key={msg.id} msg={msg} onSetReply={handleSetReply} onShowModeration={handleShowModeration} />
              ))}
              <div ref={messagesEndRef} />
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
      </div>

      {showPollForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-text">Create a Poll</h3>
              <button onClick={() => setShowPollForm(false)} className="p-2 hover:bg-bg-hover rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <input type="text" value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} placeholder="Poll Question" className="w-full px-4 py-3 rounded-xl bg-bg-input border-2 border-border focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-base" maxLength={150} />
            <div className="space-y-2">
              {pollOptions.map((option, index) => (
                <div key={index} className="flex items-center">
                  <input type="text" value={option} onChange={(e) => { const newOptions = [...pollOptions]; newOptions[index] = e.target.value; setPollOptions(newOptions); }} className="flex-1 px-4 py-3 rounded-xl bg-bg-input border-2 border-border focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-base mr-2" placeholder={`Option ${index + 1}`} maxLength={50} />
                  {pollOptions.length > 2 && <button onClick={() => { const newOptions = [...pollOptions]; newOptions.splice(index, 1); setPollOptions(newOptions); }} className="text-text-secondary hover:text-red-500 p-2 rounded-full hover:bg-red-500/10 transition-colors" title="Remove option"><Trash2 className="w-5 h-5" /></button>}
                </div>
              ))}
              {pollOptions.length < 4 && <button onClick={() => setPollOptions([...pollOptions, ''])} className="w-full mt-2 py-2 rounded-xl bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors">+ Add Option</button>}
            </div>
            <button onClick={handleCreatePoll} disabled={!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2} className="w-full py-3 rounded-xl text-lg font-bold shadow-md transition-all bg-primary text-white hover:bg-primary/90 disabled:bg-border disabled:text-text-secondary disabled:cursor-not-allowed">Create Poll</button>
          </div>
        </div>
      )}

      {showModerationPanel && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-text mb-4">Moderate User</h3>
            <div className="space-y-3 mb-6">
              <button onClick={() => handleSilence(selectedUser, 10)} className="w-full flex items-center justify-between p-3 bg-yellow-500/10 border-2 border-transparent rounded-lg hover:border-yellow-500/50 transition-colors"><span className="text-yellow-500">Silence for 10 minutes</span><Clock className="w-4 h-4 text-yellow-500" /></button>
              <button onClick={() => handleSilence(selectedUser, 60)} className="w-full flex items-center justify-between p-3 bg-orange-500/10 border-2 border-transparent rounded-lg hover:border-orange-500/50 transition-colors"><span className="text-orange-500">Silence for 1 hour</span><Clock className="w-4 h-4 text-orange-500" /></button>
              <button onClick={() => handleSilence(selectedUser, 1440)} className="w-full flex items-center justify-between p-3 bg-red-500/10 border-2 border-transparent rounded-lg hover:border-red-500/50 transition-colors"><span className="text-red-500">Silence for 24 hours</span><Clock className="w-4 h-4 text-red-500" /></button>
            </div>
            <button onClick={() => setShowModerationPanel(false)} className="w-full py-2 bg-bg-hover rounded-lg text-text font-semibold">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
