import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex items-center justify-center w-12 h-6 bg-slate-200 dark:bg-slate-700 rounded-full transition-all duration-300 hover:bg-slate-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Toggle Track */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600"></div>
      
      {/* Toggle Thumb */}
      <div className={`relative z-10 flex items-center justify-center w-5 h-5 bg-white dark:bg-slate-800 rounded-full shadow-lg transform transition-all duration-300 ${
        isDark ? 'translate-x-3' : '-translate-x-3'
      }`}>
        {isDark ? (
          <Moon className="w-3 h-3 text-indigo-600" />
        ) : (
          <Sun className="w-3 h-3 text-amber-500" />
        )}
      </div>
      
      {/* Background Icons */}
      <div className="absolute inset-0 flex items-center justify-between px-1">
        <Sun className={`w-3 h-3 transition-opacity duration-300 ${
          isDark ? 'opacity-30 text-slate-400' : 'opacity-60 text-amber-400'
        }`} />
        <Moon className={`w-3 h-3 transition-opacity duration-300 ${
          isDark ? 'opacity-60 text-indigo-400' : 'opacity-30 text-slate-400'
        }`} />
      </div>
    </button>
  );
};

export default ThemeToggle;