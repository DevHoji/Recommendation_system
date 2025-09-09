'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, ArrowRight, Sparkles } from 'lucide-react';
import OnboardingLayout from './OnboardingLayout';

interface SignInStepProps {
  onNext: (userData: { username: string; email?: string }) => void;
}

const SignInStep: React.FC<SignInStepProps> = ({ onNext }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) return;

    setIsLoading(true);
    
    // Simulate API call delay for better UX
    await new Promise(resolve => setTimeout(resolve, 800));
    
    onNext({
      username: username.trim(),
      email: email.trim() || undefined
    });
    
    setIsLoading(false);
  };

  return (
    <OnboardingLayout step={1} totalSteps={3}>
      <div className="text-center space-y-8">
        {/* Logo and Welcome */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Sparkles className="w-8 h-8 text-red-500" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 to-purple-500 bg-clip-text text-transparent">
              CineAI
            </h1>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Welcome to Your
            <span className="block bg-gradient-to-r from-red-400 to-purple-400 bg-clip-text text-transparent">
              Cinematic Journey
            </span>
          </h2>
          
          <p className="text-gray-300 text-lg max-w-md mx-auto">
            Discover movies tailored just for you with AI-powered recommendations
          </p>
        </motion.div>

        {/* Sign In Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onSubmit={handleSubmit}
          className="space-y-6 max-w-md mx-auto"
        >
          {/* Username Field */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose your username"
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-300 backdrop-blur-sm"
              required
            />
          </div>

          {/* Email Field */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email (optional)"
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-300 backdrop-blur-sm"
            />
          </div>

          {/* Continue Button */}
          <motion.button
            type="submit"
            disabled={!username.trim() || isLoading}
            className="w-full py-4 px-6 bg-gradient-to-r from-red-500 to-purple-500 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25 group relative overflow-hidden"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Button glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            
            <div className="relative flex items-center justify-center space-x-2">
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Getting Ready...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </>
              )}
            </div>
          </motion.button>
        </motion.form>

        {/* Features Preview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mt-12"
        >
          {[
            { icon: '🎬', title: 'AI Recommendations', desc: 'Personalized just for you' },
            { icon: '🎤', title: 'Voice Search', desc: 'Find movies by speaking' },
            { icon: '❤️', title: 'Smart Watchlist', desc: 'Never forget a movie' }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              className="p-4 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10"
            >
              <div className="text-2xl mb-2">{feature.icon}</div>
              <h3 className="text-white font-semibold text-sm">{feature.title}</h3>
              <p className="text-gray-400 text-xs">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </OnboardingLayout>
  );
};

export default SignInStep;
