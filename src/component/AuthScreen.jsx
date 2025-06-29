import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Users, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { toast } from 'react-toastify';

const AuthScreen = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [teacherName, setTeacherName] = useState('');
  const { login } = useApp();
  const navigate = useNavigate();

  // Now you can use toast messages 
  const handleLogin = async () => {
    if (!selectedRole) {
      toast.error("Please select a role to continue");
      return;
    }

    if (selectedRole === 'teacher' && !teacherName.trim()) {
      toast.error("Please enter your name to continue as a teacher");
      return;
    }

    try {
      const username = selectedRole === 'teacher' ? teacherName : undefined;
      const success = await login(selectedRole, username);
      
      if (success) {
        // Navigate based on role
        const path = selectedRole === 'teacher' ? '/teacher' : '/student';
        navigate(path);
        toast.success(`Successfully logged in as ${selectedRole === 'teacher' ? 'Teacher' : 'Student'}`);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to login. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg transform transition-transform hover:scale-105">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
            Anonymous Q&A
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-3 text-lg">
            Safe space for questions and discussions
          </p>
        </div>

        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-8 text-center">
            Choose your role
          </h2>

          <div className="space-y-5 mb-8">
            <button
              onClick={() => setSelectedRole('student')}
              className={`w-full p-5 rounded-xl border-2 transition-all duration-300 flex items-center space-x-4 ${
                selectedRole === 'student'
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-500 shadow-md transform scale-[1.02]'
                  : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
              }`}
            >
              <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold text-gray-800 dark:text-gray-100 text-lg">Student</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Ask questions anonymously</div>
              </div>
              <ArrowRight className={`w-5 h-5 text-gray-400 ${selectedRole === 'student' ? 'text-blue-600 dark:text-blue-400' : ''}`} />
            </button>

            <button
              onClick={() => setSelectedRole('teacher')}
              className={`w-full p-5 rounded-xl border-2 transition-all duration-300 flex items-center space-x-4 ${
                selectedRole === 'teacher'
                  ? 'bg-green-50 dark:bg-green-900/30 border-green-400 dark:border-green-500 shadow-md transform scale-[1.02]'
                  : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500 hover:bg-green-50/50 dark:hover:bg-green-900/10'
              }`}
            >
              <div className="p-2.5 rounded-lg bg-green-100 dark:bg-green-900/50">
                <GraduationCap className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold text-gray-800 dark:text-gray-100 text-lg">Teacher</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Moderate and create rooms</div>
              </div>
              <ArrowRight className={`w-5 h-5 text-gray-400 ${selectedRole === 'teacher' ? 'text-green-600 dark:text-green-400' : ''}`} />
            </button>
          </div>

          {selectedRole === 'teacher' && (
            <div className="mb-6">
              <label htmlFor="teacherName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Name
              </label>
              <input
                id="teacherName"
                type="text"
                placeholder="Enter your full name"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all hover:border-green-300 dark:hover:border-green-600"
              />
            </div>
          )}

          <button
            onClick={handleLogin}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg shadow-lg transform transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 ${
              selectedRole === 'teacher' && !teacherName.trim()
                ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-500 cursor-not-allowed'
                : selectedRole === 'teacher'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white hover:shadow-xl hover:-translate-y-0.5 focus:ring-green-500'
                : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white hover:shadow-xl hover:-translate-y-0.5 focus:ring-blue-500'
            }`}
            disabled={selectedRole === 'teacher' && !teacherName.trim()}
          >
            {selectedRole === 'teacher' ? 'Continue as Teacher' : 'Continue as Student'}
            <ArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
