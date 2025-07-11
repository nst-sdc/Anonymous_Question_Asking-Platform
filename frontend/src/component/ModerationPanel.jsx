import React from 'react';
import { Clock } from 'lucide-react';

const ModerationPanel = ({ onSilence, onClose, selectedUser }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div className="bg-card rounded-2xl p-6 w-full max-w-md">
      <h3 className="text-xl font-bold text-text mb-4">Moderate User</h3>
      <div className="space-y-3 mb-6">
        <button onClick={() => onSilence(selectedUser, 10)} className="w-full flex items-center justify-between p-3 bg-yellow-500/10 border-2 border-transparent rounded-lg hover:border-yellow-500/50 transition-colors">
          <span className="text-yellow-500">Silence for 10 minutes</span>
          <Clock className="w-4 h-4 text-yellow-500" />
        </button>
        <button onClick={() => onSilence(selectedUser, 60)} className="w-full flex items-center justify-between p-3 bg-orange-500/10 border-2 border-transparent rounded-lg hover:border-orange-500/50 transition-colors">
          <span className="text-orange-500">Silence for 1 hour</span>
          <Clock className="w-4 h-4 text-orange-500" />
        </button>
        <button onClick={() => onSilence(selectedUser, 1440)} className="w-full flex items-center justify-between p-3 bg-red-500/10 border-2 border-transparent rounded-lg hover:border-red-500/50 transition-colors">
          <span className="text-red-500">Silence for 24 hours</span>
          <Clock className="w-4 h-4 text-red-500" />
        </button>
      </div>
      <button onClick={onClose} className="w-full py-2 bg-bg-hover rounded-lg text-text font-semibold">
        Cancel
      </button>
    </div>
  </div>
);

export default ModerationPanel;