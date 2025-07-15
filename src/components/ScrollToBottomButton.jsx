import React from 'react';
import { ArrowDown } from 'lucide-react';

export default function ScrollToBottomButton({ onClick, visible }) {
  if (!visible) return null;
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-8 z-50 bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-3 rounded-full shadow-xl hover:scale-110 transition-all duration-200"
      aria-label="Scroll to latest message"
    >
      <ArrowDown className="w-6 h-6" />
    </button>
  );
}
