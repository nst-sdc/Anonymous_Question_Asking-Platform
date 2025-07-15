import React from 'react';
import { BarChart3, Users, Check, Crown, Clock, TrendingUp, Trash2 } from 'lucide-react';

const PollCard = ({ poll, onVote, isOrganizer, currentUserId, currentAnonymousId, onEndPoll }) => {
  // Determine if the current user (authenticated or anonymous) is the creator
  const isCreator = poll.created_by === currentUserId || poll.created_by === currentAnonymousId;
  // Determine if the current user (authenticated or anonymous) has voted
  const hasVoted = poll.user_vote !== null;
  const totalVotes = poll.total_votes || 0;



  const getPercentage = (votes) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  const handleVote = (optionIndex) => {
  // Log vote action for debugging
  console.log('[Poll Vote]', {
    pollId: poll.id,
    selectedOption: poll.options[optionIndex],
    user: currentUserId || currentAnonymousId
  });
  // Allow changing vote or voting for first time
  onVote(poll.id, optionIndex);
};

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-2xl hover:border-indigo-200 dark:hover:border-indigo-700 transition-all duration-300 overflow-hidden group">
      {/* Header */}
      <div className="p-5 border-b border-slate-100/50 dark:border-slate-700/50 bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-700/30 dark:to-slate-800/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {poll.poll_type === 'yesno' ? 'Yes/No Poll' : 'Multiple Choice'}
            </span>
            {/* End Poll button for creator */}
            {isCreator && (
  <button
    onClick={() => onEndPoll && onEndPoll(poll.id)}
    className="ml-2 p-2 bg-red-500 hover:bg-red-600 rounded-full text-white flex items-center justify-center"
    title="End Poll"
    aria-label="End Poll"
  >
    <Trash2 className="w-4 h-4" />
  </button>
)}
          </div>
          <div className="flex items-center space-x-2">
            {isCreator && (
              <Crown className="w-4 h-4 text-amber-500" title="Your poll" />
            )}
            <div className="flex items-center space-x-1 text-xs text-slate-600 dark:text-slate-400 font-medium">
              <Clock className="w-3 h-3" />
              <span>{formatTime(poll.created_at)}</span>
            </div>
          </div>
        </div>

        <h4 className="font-bold text-lg text-slate-800 dark:text-white leading-relaxed">
          {poll.question}
        </h4>
      </div>

      {/* Options */}
      <div className="p-5">
        <div className="space-y-4 mb-5">
          {poll.options.map((option, index) => {
            const votes = poll.vote_counts?.[index] || 0;
            const percentage = getPercentage(votes);
            const isSelected = poll.user_vote === index;
            const isDisabled = false; // Always allow voting for all users, including the poll creator

            return (
              <button
                key={index}
                onClick={() => handleVote(index)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 relative overflow-hidden hover:scale-[1.02] ${
                  isSelected
                    ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 shadow-lg'
                    : isDisabled
                    ? 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-400 cursor-not-allowed hover:scale-100'
                    : 'border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:shadow-lg'
                }`}
              >
                {/* Progress bar background */}
                {(totalVotes > 0 || poll.user_vote !== null) && (
  <div
    className={`absolute inset-0 transition-all duration-700 ease-out ${
      isSelected
        ? 'bg-gradient-to-r from-indigo-100/80 to-purple-100/80 dark:from-indigo-900/20 dark:to-purple-900/20'
        : 'bg-gradient-to-r from-slate-100/80 to-slate-200/50 dark:from-slate-700/30 dark:to-slate-600/20'
    }`}
    style={{ width: `${percentage}%` }}
  />
)}

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {isSelected && (
                      <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <span className={`font-semibold text-base ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                      {option}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className={`font-bold text-lg ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400'}`}>
                      {votes}
                    </span>
                    {(totalVotes > 0 || poll.user_vote !== null) && (
                      <span className="text-slate-500 dark:text-slate-400 min-w-[3rem] text-right font-semibold">
                        {percentage}%
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-4 border-t border-slate-100/50 dark:border-slate-700/50">
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
              <Users className="w-2 h-2 text-white" />
            </div>
            <span className="font-semibold">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
          </div>
          
          {hasVoted && (
            <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">
              Voted
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PollCard;