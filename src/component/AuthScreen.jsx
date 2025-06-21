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
  const handleLogin = () => {
    if (!selectedRole) {
      toast.error("Please select a role to continue");
      return;
    }

    if (selectedRole === 'teacher' && !teacherName.trim()) {
      toast.error("Please enter your name to continue as a teacher");
      return;
    }

    // Navigate based on role
    if (selectedRole === 'teacher') {
      navigate('/teacher');
      toast.success("Successfully logged in as Teacher");
    } else {
      navigate('/student');
      toast.success("Successfully logged in as Student");
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-[#1A73E8] rounded-full flex items-center justify-center mb-4 shadow-lg">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#1A73E8]">
            Anonymous Q&A
          </h1>
          <p className="text-gray-600 mt-2">
            Safe space for questions and discussions
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            Choose your role
          </h2>

          <div className="space-y-4 mb-6">
            <button
              onClick={() => setSelectedRole('student')}
              className={`w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-center space-x-3 ${
                selectedRole === 'student'
                  ? 'bg-[#E3F2FD] border-[#1A73E8] shadow-md'
                  : 'bg-white border-gray-200 hover:border-[#1A73E8] hover:bg-[#E3F2FD]/50'
              }`}
            >
              <Users className="w-6 h-6 text-[#1A73E8]" />
              <div className="text-left flex-1">
                <div className="font-semibold text-gray-800">Student</div>
                <div className="text-sm text-gray-600">Ask questions anonymously</div>
              </div>
            </button>

            <button
              onClick={() => setSelectedRole('teacher')}
              className={`w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-center space-x-3 ${
                selectedRole === 'teacher'
                  ? 'bg-[#E8F5E9] border-[#00C853] shadow-md'
                  : 'bg-white border-gray-200 hover:border-[#00C853] hover:bg-[#E8F5E9]/50'
              }`}
            >
              <GraduationCap className="w-6 h-6 text-[#00C853]" />
              <div className="text-left flex-1">
                <div className="font-semibold text-gray-800">Teacher</div>
                <div className="text-sm text-gray-600">Moderate and create rooms</div>
              </div>
            </button>
          </div>

          {selectedRole === 'teacher' && (
            <div className="mb-6">
              <input
                type="text"
                placeholder="Enter your name"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#00C853] focus:border-transparent outline-none transition-all"
              />
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={!selectedRole || (selectedRole === 'teacher' && !teacherName.trim())}
            className="w-full bg-gradient-to-r from-[#1A73E8] to-[#00C853] text-white py-3 px-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-[#1769D0] hover:to-[#00B74A] transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
