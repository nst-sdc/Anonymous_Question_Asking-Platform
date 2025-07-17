import React, { useState } from 'react';
import { generateAvatarSvg } from '../utils/avatar';
import { Smile, Reply } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import dayjs from 'dayjs';

const userColors = [
  '#ff8c00', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
  '#2196f3', '#00bcd4', '#009688', '#4caf50', '#8bc34a',
  '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'
];

const getUserColor = (userId) => {
  const index = (userId || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % userColors.length;
  return userColors[index];
};

const Message = ({ message, onReaction, onReply, isCurrentUser }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleEmojiSelect = (emojiObject) => {
    onReaction(message.id, emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  // Fallback for message object
  if (!message) {
    return null;
  }

  const reactions = message.reactions || {};
  const currentUserReaction = message.user_reaction;

  return (
    <div id={`message-${message.id}`} className={`group flex items-start gap-3 my-6 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <img
        src={`data:image/svg+xml;utf8,${encodeURIComponent(generateAvatarSvg(message.anonymous_id || 'default'))}`}
        alt={message.anonymous_id}
        className="w-10 h-10 rounded-full shadow-md flex-shrink-0 mt-1"
      />

      <div className={`flex flex-col w-full ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        {/* Message Bubble */}
        <div className={`relative px-4 py-3 rounded-2xl shadow-md max-w-md md:max-w-lg lg:max-w-xl ${isCurrentUser ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-none'}`}>
          
          {/* Quoted Reply */}
          {message.reply_to && (() => {
            const replyColor = getUserColor(message.reply_to.anonymous_id);
            return (
              <a 
                href={`#message-${message.reply_to.id}`} 
                className="block mb-2 p-2 rounded-lg cursor-pointer transition-colors bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20"
                style={{ borderLeft: `4px solid ${replyColor}` }}
              >
                <p className="text-sm font-bold" style={{ color: replyColor }}>
                  {message.reply_to.anonymous_id}
                </p>
                <p className="text-sm opacity-90 truncate mt-1">
                  {message.reply_to.content}
                </p>
              </a>
            );
          })()}

          {/* Message Content */}
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

          {/* Timestamp */}
          <div className={`absolute -bottom-5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap ${isCurrentUser ? 'right-1' : 'left-1'}`}>
            {dayjs(message.timestamp).format('DD MMM, h:mm A')}
          </div>

          {/* Actions Toolbar (appears on hover) */}
          <div className={`absolute top-0 flex items-center gap-1 p-1 rounded-full bg-white/20 dark:bg-slate-900/30 backdrop-blur-md shadow-lg transition-opacity duration-300 opacity-0 group-hover:opacity-100 ${isCurrentUser ? '-left-4 -translate-x-full' : '-right-4 translate-x-full'}`}>
            {/* Emoji Picker Button */}
            <div className="relative">
              <button 
                onClick={() => setShowEmojiPicker(prev => !prev)} 
                className="p-1.5 rounded-full text-white dark:text-slate-300 bg-slate-500/50 hover:bg-indigo-500 transition-colors"
              >
                <Smile size={16} />
              </button>
              {showEmojiPicker && (
                <div className={`absolute z-10 mt-2 ${isCurrentUser ? 'right-0' : 'left-0'}`}>
                  <EmojiPicker 
                    onEmojiClick={handleEmojiSelect} 
                    disableSearchBar 
                    pickerStyle={{ 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
                      border: '1px solid #e2e8f0', // slate-200
                      borderRadius: '0.75rem',
                    }}
                    searchDisabled
                    height={300}
                    width={250}
                  />
                </div>
              )}
            </div>

            {/* Reply Button */}
            <button 
              onClick={() => onReply(message)} 
              className="p-1.5 rounded-full text-white dark:text-slate-300 bg-slate-500/50 hover:bg-indigo-500 transition-colors"
            >
              <Reply size={16} />
            </button>
          </div>
        </div>

        {/* Reactions Display */}
        <div className="mt-2 flex items-center gap-1 flex-wrap">
          {Object.entries(reactions).map(([type, count]) => (
            (count > 0) && (
              <button
                key={type}
                onClick={() => onReaction(message.id, type)}
                className={`flex items-center text-xs px-2 py-1 rounded-full cursor-pointer transition-all duration-200 ${currentUserReaction === type ? 'bg-indigo-500 text-white' : 'bg-slate-200/70 dark:bg-slate-700/70'}`}>
                <span>{type}</span>
                <span className="ml-1.5 font-medium text-indigo-800 dark:text-indigo-200 bg-indigo-100 dark:bg-indigo-500/20 px-1.5 py-0.5 rounded-full">{count}</span>
              </button>
            )
          ))}
        </div>
      </div>
    </div>
  );
};

export default Message;
