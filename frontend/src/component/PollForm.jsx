import React from 'react';
import { X, Trash2 } from 'lucide-react';

const PollForm = ({
  pollQuestion,
  setPollQuestion,
  pollOptions,
  setPollOptions,
  onCreate,
  onClose,
}) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div className="bg-card rounded-2xl p-6 w-full max-w-md space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-text">Create a Poll</h3>
        <button onClick={onClose} className="p-2 hover:bg-bg-hover rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      <input
        type="text"
        value={pollQuestion}
        onChange={e => setPollQuestion(e.target.value)}
        placeholder="Poll Question"
        className="w-full px-4 py-3 rounded-xl bg-bg-input border-2 border-border focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-base"
        maxLength={150}
      />
      <div className="space-y-2">
        {pollOptions.map((option, index) => (
          <div key={index} className="flex items-center">
            <input
              type="text"
              value={option}
              onChange={e => {
                const newOptions = [...pollOptions];
                newOptions[index] = e.target.value;
                setPollOptions(newOptions);
              }}
              className="flex-1 px-4 py-3 rounded-xl bg-bg-input border-2 border-border focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-base mr-2"
              placeholder={`Option ${index + 1}`}
              maxLength={50}
            />
            {pollOptions.length > 2 && (
              <button
                onClick={() => {
                  const newOptions = [...pollOptions];
                  newOptions.splice(index, 1);
                  setPollOptions(newOptions);
                }}
                className="text-text-secondary hover:text-red-500 p-2 rounded-full hover:bg-red-500/10 transition-colors"
                title="Remove option"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
        {pollOptions.length < 4 && (
          <button
            onClick={() => setPollOptions([...pollOptions, ''])}
            className="w-full mt-2 py-2 rounded-xl bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors"
          >
            + Add Option
          </button>
        )}
      </div>
      <button
        onClick={onCreate}
        disabled={!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2}
        className="w-full py-3 rounded-xl text-lg font-bold shadow-md transition-all bg-primary text-white hover:bg-primary/90 disabled:bg-border disabled:text-text-secondary disabled:cursor-not-allowed"
      >
        Create Poll
      </button>
    </div>
  </div>
);

export default PollForm;