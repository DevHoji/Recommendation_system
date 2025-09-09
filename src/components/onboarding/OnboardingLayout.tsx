'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  step?: number;
  totalSteps?: number;
  showProgress?: boolean;
}

const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  children,
  step = 1,
  totalSteps = 3,
  showProgress = true
}) => {
  const progressPercentage = (step / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Cinematic Background */}
      <div className="absolute inset-0">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-red-900/20 animate-pulse" />
        
        {/* Floating movie poster elements */}
        <div className="absolute top-10 left-10 w-32 h-48 bg-gradient-to-br from-red-500/10 to-purple-500/10 rounded-lg blur-sm animate-float" />
        <div className="absolute top-32 right-20 w-24 h-36 bg-gradient-to-br from-blue-500/10 to-green-500/10 rounded-lg blur-sm animate-float-delayed" />
        <div className="absolute bottom-20 left-1/4 w-28 h-42 bg-gradient-to-br from-yellow-500/10 to-red-500/10 rounded-lg blur-sm animate-float" />
        <div className="absolute bottom-32 right-1/3 w-20 h-30 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg blur-sm animate-float-delayed" />
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/60" />
      </div>

      {/* Progress Bar */}
      {showProgress && (
        <div className="absolute top-0 left-0 right-0 z-10">
          <div className="h-1 bg-gray-800">
            <motion.div
              className="h-full bg-gradient-to-r from-red-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-2xl mx-auto animate-fade-in"
        >
          {children}
        </motion.div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-2deg); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
};

export default OnboardingLayout;
