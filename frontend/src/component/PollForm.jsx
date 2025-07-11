import React from 'react'
import { X, Trash2 } from 'lucide-react';

const PollForm = ({onClose, pollQuestion, setPollQuestion, pollOptions,setPollOptions, handleCreatePoll}) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
        <div className="bg-card rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <button onClick={onClose} className="absolute top-3 right-3 p-2 text-text-secondary hover:bg-bg-hover rounded-full"><X/></button>
            <h2 className="text-2xl font-bold text-text text-center mb-2">Create a Poll</h2>
            <p className="mb-6 text-text-secondary text-center">Engage your students with a quick poll.</p>
            <div className="w-full mb-4">
                <label className="block text-text-secondary font-semibold mb-1">Question</label>
                <input
                type="text"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-bg-input border-2 border-border focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-base"
                placeholder="What would you like to ask?"
                maxLength={100}
                />
            </div>
            <div className="w-full mb-6">
                {pollOptions.map((option, index) => (
                <div key={index} className="flex items-center mb-3">
                    <input
                    type="text"
                    value={option}
                    onChange={(e) => {
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
                onClick={handleCreatePoll}
                disabled={!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2}
                className="w-full py-3 rounded-xl text-lg font-bold shadow-md transition-all bg-primary text-white hover:bg-primary/90 disabled:bg-border disabled:text-text-secondary disabled:cursor-not-allowed"
            >
                Create Poll
            </button>
        </div>
    </div>
  )
}

export default PollForm