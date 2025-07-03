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
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mb-5 shadow-lg transform transition-transform hover:scale-105">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-text">
            Anonymous Q&A
          </h1>
          <p className="text-text-secondary mt-3 text-lg">
            A safe space for questions and discussions.
          </p>
        </div>

        <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-border">
          <h2 className="text-2xl font-bold text-text mb-8 text-center">
            Choose your role
          </h2>

          <div className="space-y-5 mb-8">
            <button
              onClick={() => setSelectedRole('student')}
              className={`w-full p-5 rounded-xl border-2 transition-all duration-300 flex items-center space-x-4 text-left ${ 
                selectedRole === 'student'
                  ? 'bg-primary/10 border-primary shadow-md transform scale-[1.02]'
                  : 'bg-card border-border hover:border-primary/50 hover:bg-primary/5'
              }`}
            >
              <div className="p-2.5 rounded-lg bg-primary/20">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-text text-lg">Student</div>
                <div className="text-sm text-text-secondary">Ask questions anonymously</div>
              </div>
              <ArrowRight className={`w-5 h-5 text-text-secondary transition-colors ${selectedRole === 'student' ? 'text-primary' : ''}`} />
            </button>

            <button
              onClick={() => setSelectedRole('teacher')}
              className={`w-full p-5 rounded-xl border-2 transition-all duration-300 flex items-center space-x-4 text-left ${ 
                selectedRole === 'teacher'
                  ? 'bg-primary/10 border-primary shadow-md transform scale-[1.02]'
                  : 'bg-card border-border hover:border-primary/50 hover:bg-primary/5'
              }`}
            >
              <div className="p-2.5 rounded-lg bg-primary/20">
                <GraduationCap className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-text text-lg">Teacher</div>
                <div className="text-sm text-text-secondary">Moderate and create rooms</div>
              </div>
              <ArrowRight className={`w-5 h-5 text-text-secondary transition-colors ${selectedRole === 'teacher' ? 'text-primary' : ''}`} />
            </button>
          </div>

          {selectedRole === 'teacher' && (
            <div className="mb-6 animate-fadeIn">
              <label htmlFor="teacherName" className="block text-sm font-medium text-text-secondary mb-2">
                Your Name
              </label>
              <input
                id="teacherName"
                type="text"
                placeholder="Enter your full name"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full px-5 py-3.5 rounded-xl border-2 border-border bg-card text-text placeholder-text-secondary/70 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all hover:border-primary/50"
              />
            </div>
          )}

          <button
            onClick={handleLogin}
            className="w-full py-4 px-6 rounded-xl font-semibold text-lg text-white shadow-lg transform transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card bg-primary hover:bg-primary/90 disabled:bg-border disabled:text-text-secondary disabled:cursor-not-allowed hover:shadow-xl hover:-translate-y-0.5 focus:ring-primary"
            disabled={selectedRole === 'teacher' && !teacherName.trim()}
          >
            Continue
            <ArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
