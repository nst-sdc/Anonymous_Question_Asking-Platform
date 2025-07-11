import React from 'react';
import { BarChart3, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

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

export default PollDisplay;