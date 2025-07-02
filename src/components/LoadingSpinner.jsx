import React from 'react';

export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    xs: 'h-4 w-4',
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full ${sizeClasses[size]} border-t-2 border-b-2 border-blue-500`}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export const LoadingOverlay = ({ message = 'Loading...', show = true, className = '' }) => {
  if (!show) return null;
  
  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}
      role="status"
      aria-live="polite"
      aria-busy={show}
    >
      <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
        <LoadingSpinner size="lg" className="mb-4" />
        <p className="text-gray-700">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
