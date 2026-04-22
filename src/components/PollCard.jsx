import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Check, Crown, Clock, TrendingUp, Trash2, Timer } from 'lucide-react';

const PollCard = ({ poll, onVote, isOrganizer, currentUserId, currentAnonymousId, onEndPoll }) => {
  // Determine if the current user (authenticated or anonymous) is the creator
  const isCreator = poll.created_by === currentUserId || poll.created_by === currentAnonymousId;
  // Determine if the current user (authenticated or anonymous) has voted
  const hasVoted = poll.user_vote !== null;
  const totalVotes = poll.total_votes || 0;

  // Timer state
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!poll.ends_at) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const now = Date.now();
      const endsAt = new Date(poll.ends_at).getTime();
      const diff = Math.max(0, Math.floor((endsAt - now) / 1000));
      return diff;
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [poll.ends_at]);

  const formatCountdown = (seconds) => {
    if (seconds === null) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}s`;
  };

  const getTimerColor = () => {
    if (timeLeft === null) return '';
    if (timeLeft <= 10) return 'text-red-500 dark:text-red-400';
    if (timeLeft <= 30) return 'text-amber-500 dark:text-amber-400';
    return 'text-emerald-500 dark:text-emerald-400';
  };

  const getTimerBgColor = () => {
    if (timeLeft === null) return '';
    if (timeLeft <= 10) return 'bg-red-50 dark:bg-red-900/20';
    if (timeLeft <= 30) return 'bg-amber-50 dark:bg-amber-900/20';
    return 'bg-emerald-50 dark:bg-emerald-900/20';
  };

  // Calculate progress percentage for timer bar
  const getTimerProgress = () => {
    if (!poll.ends_at || !poll.duration || timeLeft === null) return 100;
    return Math.max(0, (timeLeft / poll.duration) * 100);
  };

  const isExpired = timeLeft !== null && timeLeft <= 0;

  const getPercentage = (votes) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  const handleVote = (optionIndex) => {
    if (isExpired) return;
    console.log('[Poll Vote]', {
      pollId: poll.id,
      selectedOption: poll.options[optionIndex],
      user: currentUserId || currentAnonymousId
    });
    onVote(poll.id, optionIndex);
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-2xl hover:border-indigo-200 dark:hover:border-indigo-700 transition-all duration-300 overflow-hidden group ${isExpired ? 'opacity-70' : ''}`}>
      {/* Timer Progress Bar */}
      {poll.ends_at && timeLeft !== null && !isExpired && (
        <div className="h-1 bg-slate-100 dark:bg-slate-700 w-full">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              timeLeft <= 10 ? 'bg-red-500' : timeLeft <= 30 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${getTimerProgress()}%` }}
          />
        </div>
      )}

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
            {isCreator && !isExpired && (
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
            {/* Countdown Timer Badge */}
            {poll.ends_at && timeLeft !== null && (
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-bold ${getTimerBgColor()} ${getTimerColor()} ${timeLeft <= 10 && timeLeft > 0 ? 'animate-pulse' : ''}`}>
                <Timer className="w-3 h-3" />
                <span>{isExpired ? 'Ended' : formatCountdown(timeLeft)}</span>
              </div>
            )}
            {!poll.ends_at && (
              <div className="flex items-center space-x-1 text-xs text-slate-600 dark:text-slate-400 font-medium">
                <Clock className="w-3 h-3" />
                <span>{formatTime(poll.created_at)}</span>
              </div>
            )}
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
            const isDisabled = isExpired;

            return (
              <button
                key={index}
                onClick={() => handleVote(index)}
                disabled={isDisabled}
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
          
          <div className="flex items-center space-x-2">
            {isExpired && (
              <span className="text-red-500 dark:text-red-400 font-bold bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full">
                Time's up
              </span>
            )}
            {hasVoted && !isExpired && (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">
                Voted
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PollCard;