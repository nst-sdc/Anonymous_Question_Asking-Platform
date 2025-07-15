import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Reply, MoreVertical } from 'lucide-react';
import { generateAvatarSvg } from '../utils/avatar';

const Message = ({ message, onReaction, onReply, isCurrentUser }) => {
  const [showActions, setShowActions] = useState(false);
  const [reactionLoading, setReactionLoading] = useState(null);

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getAvatarColor = (anonymousId) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-emerald-500 to-emerald-600',
      'from-amber-500 to-amber-600',
      'from-red-500 to-red-600',
      'from-indigo-500 to-indigo-600',
      'from-pink-500 to-pink-600',
      'from-teal-500 to-teal-600'
    ];
    const index = anonymousId.charCodeAt(anonymousId.length - 1) % colors.length;
    return `bg-gradient-to-r ${colors[index]}`;
  };

  const handleReaction = async (type) => {
    setReactionLoading(type);
    try {
      await onReaction(message.id, type);
    } finally {
      setReactionLoading(null);
    }
  };

  const isOwn = isCurrentUser;

  return (
    <div
      className={`flex w-full mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar for others */}
      {!isOwn && (
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-white dark:bg-slate-800 mr-2">
          <img
            src={`data:image/svg+xml;utf8,${encodeURIComponent(generateAvatarSvg(message.anonymous_id || 'Anon'))}`}
            alt="avatar"
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
      )}

      {/* Bubble */}
      <div className={`relative max-w-[75%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender for others */}
        {!isOwn && (
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 ml-1">
            {message.anonymous_id}
          </span>
        )}
        <div
          className={`px-4 py-2 rounded-2xl text-sm break-words shadow-none
            ${isOwn
              ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-br-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-md'}
          `}
        >
          {message.content}
          <span className={`block text-xs mt-1 ${isOwn ? 'text-indigo-200/80' : 'text-slate-400 dark:text-slate-500'} text-right`}>
            {formatTime(message.created_at)}
          </span>
        </div>
        {/* Reactions below bubble */}
        <div className="flex space-x-2 mt-1 ml-1">
          {message.reactions?.yes > 0 && (
            <span className="flex items-center text-xs text-emerald-500 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">
              <ThumbsUp className="w-3 h-3 mr-1" />{message.reactions.yes}
            </span>
          )}
          {message.reactions?.no > 0 && (
            <span className="flex items-center text-xs text-red-500 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded-full">
              <ThumbsDown className="w-3 h-3 mr-1" />{message.reactions.no}
            </span>
          )}
        </div>
        {/* Action Buttons (hover) */}
        <div className={`flex items-center space-x-1 mt-1 transition-all duration-300 ${showActions ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <button
            onClick={() => onReply(message.id)}
            className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-200 hover:scale-110"
            title="Reply"
          >
            <Reply className="w-4 h-4" />
          </button>
          <button
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 hover:scale-110"
            title="More options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
        {/* Reaction buttons on hover (WhatsApp style: long press, but here on hover) */}
        <div className={`flex space-x-1 mt-1 transition-all duration-300 ${showActions ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <button
            onClick={() => handleReaction(message.user_reaction === 'yes' ? null : 'yes')}
            disabled={reactionLoading === 'yes'}
            className={`p-1 rounded-full text-emerald-500 bg-emerald-50 dark:bg-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all duration-200 ${message.user_reaction === 'yes' ? 'ring-2 ring-emerald-400' : ''}`}
            title={message.user_reaction === 'yes' ? 'Remove thumbs up' : 'Give thumbs up'}
          >
            <ThumbsUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleReaction(message.user_reaction === 'no' ? null : 'no')}
            disabled={reactionLoading === 'no'}
            className={`p-1 rounded-full text-red-500 bg-red-50 dark:bg-red-900/40 hover:bg-red-100 dark:hover:bg-red-900/60 transition-all duration-200 ${message.user_reaction === 'no' ? 'ring-2 ring-red-400' : ''}`}
            title={message.user_reaction === 'no' ? 'Remove thumbs down' : 'Give thumbs down'}
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
        </div>
      </div>
      {/* Avatar for self (optional, can be hidden) */}
      {isOwn && <div className="w-8 h-8 ml-2" />} 
    </div>
  );
};

export default Message;