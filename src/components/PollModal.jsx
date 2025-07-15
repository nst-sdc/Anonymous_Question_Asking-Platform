import React, { useState } from 'react';
import { X, Plus, Minus, BarChart3 } from 'lucide-react';
import { useRoom } from '../contexts/RoomContext';

const PollModal = ({ isOpen, onClose, onCreatePoll }) => {
  const { loading } = useRoom();
  const [pollType, setPollType] = useState('yesno');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [error, setError] = useState('');

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const poll = {
        type: pollType,
        question: question.trim(),
        options: pollType === 'yesno' ? ['Yes', 'No'] : options.filter(opt => opt.trim()),
      };

      onCreatePoll(poll);
    } catch (err) {
      setError(err.message || 'Failed to create poll');
    }
  };

  const isValid = question.trim() && (pollType === 'yesno' || options.filter(opt => opt.trim()).length >= 2);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700 max-h-[80vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white text-center mb-2">
            Create a Poll
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-center">
            Get instant feedback from your team
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Poll Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Poll Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPollType('yesno')}
                className={`p-3 rounded-xl border-2 transition-all ${
                  pollType === 'yesno'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                }`}
              >
                <div className="text-sm font-medium">Yes/No</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Simple binary choice</div>
              </button>
              
              <button
                type="button"
                onClick={() => setPollType('multiple')}
                className={`p-3 rounded-xl border-2 transition-all ${
                  pollType === 'multiple'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                }`}
              >
                <div className="text-sm font-medium">Multiple Choice</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Custom options</div>
              </button>
            </div>
          </div>

          {/* Question */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Question
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              placeholder="What would you like to ask?"
              rows={3}
              required
            />
          </div>

          {/* Options (for multiple choice) */}
          {pollType === 'multiple' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Options
              </label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder={`Option ${index + 1}`}
                      required
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(index)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                
                {options.length < 6 && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 py-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">Add option</span>
                  </button>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!isValid || loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? 'Creating...' : 'Create Poll'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PollModal;