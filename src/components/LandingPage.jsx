import React from 'react';
import { Users, MessageSquare, Shield, Zap, ArrowRight, Sparkles, History } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';

const LandingPage = ({ onCreateRoom, onJoinRoom, onViewHistory, onAuthRequired }) => {
  const { user, signOut } = useAuth();

  const features = [
    {
      icon: Shield,
      title: "Anonymous by Design",
      description: "Chat freely without revealing your identity. Perfect for honest discussions.",
      gradient: "from-emerald-500 to-teal-600"
    },
    {
      icon: Zap,
      title: "Instant Connection", 
      description: "Join rooms with a simple code. No lengthy setup or profile creation required.",
      gradient: "from-amber-500 to-orange-600"
    },
    {
      icon: Users,
      title: "Real-time Collaboration",
      description: "Live polls, message reactions, and threaded conversations for better teamwork.",
      gradient: "from-blue-500 to-indigo-600"
    },
    {
      icon: MessageSquare,
      title: "Pressure-free Communication",
      description: "Express ideas openly without social anxiety or judgment from others.",
      gradient: "from-purple-500 to-pink-600"
    }
  ];

  const handleCreateRoom = () => {
    if (user) {
      onCreateRoom();
    } else {
      onAuthRequired('signup');
    }
  };

  const handleJoinRoom = () => {
    if (user) {
      onJoinRoom();
    } else {
      onAuthRequired('signin');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="relative z-10 px-6 py-6">
        <nav className="max-w-7xl mx-auto flex items-center justify-between backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 rounded-2xl px-6 py-4 border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">AnonyMeet</span>
          </div>
          
          {user ? (
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <div className="flex items-center space-x-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {user.email}
                </span>
              </div>
              <button
                onClick={onViewHistory}
                className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
              >
                <History className="w-4 h-4" />
                <span>History</span>
              </button>
              <button
                onClick={signOut}
                className="px-4 py-2 text-slate-600 hover:text-red-600 dark:text-slate-300 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 font-medium"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <button
                onClick={() => onAuthRequired('signin')}
                className="px-6 py-2 text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 font-medium"
              >
                Sign In
              </button>
            </div>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 px-6 pt-20 pb-32">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border border-indigo-200/50 dark:border-indigo-700/50 text-indigo-700 dark:text-indigo-300 px-6 py-3 rounded-full text-sm font-semibold mb-8 backdrop-blur-sm">
            <Sparkles className="w-4 h-4" />
            <span>Anonymous collaboration reimagined</span>
          </div>
          
          {/* Main Heading */}
          <h1 className="text-6xl lg:text-7xl font-bold text-slate-900 dark:text-white mb-8 leading-tight">
            Meet without the
            <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              pressure
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl lg:text-2xl text-slate-600 dark:text-slate-300 mb-16 max-w-3xl mx-auto leading-relaxed">
            Create anonymous chatrooms for honest discussions, team brainstorms, and group decisions. 
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold"> No profiles, no judgment</span> — just pure collaboration.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
            <button
              onClick={handleCreateRoom}
              className="group flex items-center space-x-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-indigo-500/25 transform hover:-translate-y-1 transition-all duration-300 min-w-[200px]"
            >
              <Users className="w-6 h-6" />
              <span>Create Room</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button
              onClick={handleJoinRoom}
              className="flex items-center space-x-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-700 dark:text-slate-200 border-2 border-slate-200 dark:border-slate-700 px-10 py-5 rounded-2xl font-bold text-lg hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 min-w-[200px]"
            >
              <MessageSquare className="w-6 h-6" />
              <span>Join with Code</span>
            </button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-3xl p-8 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 hover:border-indigo-200 dark:hover:border-indigo-700 transition-all duration-500 hover:-translate-y-2"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl"></div>
        </div>
      </main>
      {/* Footer */}
      <footer className="w-full bg-white/80 dark:bg-slate-900/80 border-t border-slate-200/50 dark:border-slate-700/50 shadow-inner mt-auto backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2 justify-center">
            <MessageSquare className="w-5 h-5 text-indigo-500" />
            <span className="font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">AnonyMeet</span>
            <span className="mx-2">|</span>
            <span className="text-xs">© {new Date().getFullYear()} All rights reserved to NST-SDC</span>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 justify-center">
            <div className="flex items-center gap-3 mb-1 md:mb-0">
              <a href="https://github.com/nst-sdc" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.867 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.621.069-.609.069-.609 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.089 2.91.833.091-.647.35-1.09.636-1.341-2.22-.253-4.555-1.112-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.202 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.849-2.338 4.695-4.566 4.944.36.31.68.922.68 1.86 0 1.343-.012 2.428-.012 2.758 0 .267.18.577.688.479C19.135 20.2 22 16.448 22 12.021 22 6.484 17.523 2 12 2z"/></svg></a>
              <a href="https://www.linkedin.com/company/nst-sdc" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11.75 20h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.785-1.75-1.75s.784-1.75 1.75-1.75 1.75.785 1.75 1.75-.784 1.75-1.75 1.75zm15.25 11.268h-3v-5.604c0-1.337-.025-3.062-1.865-3.062-1.867 0-2.154 1.459-2.154 2.967v5.699h-3v-10h2.881v1.367h.041c.401-.758 1.381-1.557 2.845-1.557 3.043 0 3.604 2.004 3.604 4.609v5.581z"/></svg></a>
              <a href="https://www.youtube.com/@nstsdc-2028" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a2.99 2.99 0 0 0-2.104-2.116C19.088 3.5 12 3.5 12 3.5s-7.088 0-9.394.57A2.99 2.99 0 0 0 .502 6.186C0 8.488 0 12 0 12s0 3.512.502 5.814a2.99 2.99 0 0 0 2.104 2.116C4.912 20.5 12 20.5 12 20.5s7.088 0 9.394-.57a2.99 2.99 0 0 0 2.104-2.116C24 15.512 24 12 24 12s0-3.512-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></a>
              <a href="https://discord.gg/Rg7Qb5xWf3" target="_blank" rel="noopener noreferrer" aria-label="Discord" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.369A19.791 19.791 0 0 0 16.885 3.1a.112.112 0 0 0-.119.056 13.731 13.731 0 0 0-.601 1.234 18.27 18.27 0 0 0-5.514 0 12.276 12.276 0 0 0-.614-1.234.115.115 0 0 0-.119-.056A19.736 19.736 0 0 0 3.683 4.369a.105.105 0 0 0-.051.043C.533 9.043-.319 13.579.099 18.057a.116.116 0 0 0 .045.082 19.9 19.9 0 0 0 5.993 3.04.112.112 0 0 0 .123-.04c.463-.634.874-1.3 1.226-1.994a.112.112 0 0 0-.061-.153 13.138 13.138 0 0 1-1.888-.9.112.112 0 0 1-.011-.186c.127-.096.254-.192.374-.291a.112.112 0 0 1 .114-.013c3.927 1.793 8.18 1.793 12.061 0a.112.112 0 0 1 .115.012c.12.099.247.195.374.291a.112.112 0 0 1-.01.186 12.64 12.64 0 0 1-1.889.899.112.112 0 0 0-.06.154c.36.693.772 1.36 1.225 1.993a.112.112 0 0 0 .123.04 19.876 19.876 0 0 0 6.002-3.04.112.112 0 0 0 .045-.081c.5-5.177-.838-9.673-3.633-13.645a.104.104 0 0 0-.05-.044zM8.02 15.331c-1.183 0-2.156-1.085-2.156-2.419 0-1.333.955-2.418 2.156-2.418 1.21 0 2.175 1.094 2.156 2.418 0 1.334-.955 2.419-2.156 2.419zm7.974 0c-1.183 0-2.156-1.085-2.156-2.419 0-1.333.955-2.418 2.156-2.418 1.21 0 2.175 1.094 2.156 2.418 0 1.334-.946 2.419-2.156 2.419z"/></svg></a>
              <a href="https://x.com/NSTSDC_" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.53 2.477h3.934l-8.61 9.86 10.16 13.186h-7.97l-6.23-8.017-7.16 8.017H0l9.21-10.55L-.64 2.477h8.09l5.43 7.01zm-1.14 17.04h2.18L7.5 4.6H5.2z"/></svg></a>
            </div>
            <div className="flex items-center gap-3">
              <a href="/privacy" className="text-xs text-slate-500 dark:text-slate-400 hover:underline">Privacy</a>
              <span className="mx-1">·</span>
              <a href="/policy" className="text-xs text-slate-500 dark:text-slate-400 hover:underline">Policy</a>
            </div>
          
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
