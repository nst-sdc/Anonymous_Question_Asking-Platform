import React from 'react'
import { formatTime } from '../utils/helpers';

// Accept messages, user details, reactions, addreaction, onModerateUSer and messagesend reference
const MessageCard = ({messages, user, reactions, addReaction, onModerateUser, messagesEndRef}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-5">
        {messages?.map((msg) => {
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
                    onClick={() => { onModerateUser && onModerateUser(msg.userId)}}
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
  )
}

export default MessageCard