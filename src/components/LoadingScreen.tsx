'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  showLogo?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = "Loading HojiAI...",
  showLogo = true
}) => {
  const [isClient, setIsClient] = useState(false);
  const [floatingElements, setFloatingElements] = useState<Array<{left: number, top: number, delay: number, duration: number}>>([]);

  useEffect(() => {
    setIsClient(true);
    // Generate deterministic positions after hydration
    const elements = Array.from({ length: 20 }, (_, i) => ({
      left: (i * 37) % 100, // Deterministic positioning
      top: (i * 23) % 100,
      delay: (i * 0.1) % 2,
      duration: 3 + (i % 3)
    }));
    setFloatingElements(elements);
  }, []);

  if (!isClient) {
    // Return simple loading screen during SSR
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-8">
          {showLogo && (
            <div className="flex items-center justify-center space-x-3 mb-8">
              <Sparkles className="w-12 h-12 text-red-500" />
              <h1 className="text-5xl font-bold bg-gradient-to-r from-red-500 to-purple-500 bg-clip-text text-transparent">
                HojiAI
              </h1>
            </div>
          )}
          <div className="w-16 h-16 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto" />
          <p className="text-white text-xl font-medium">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-red-900/20 animate-pulse" />
        
        {/* Floating elements */}
        {floatingElements.map((element, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${element.left}%`,
              top: `${element.top}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: element.duration,
              repeat: Infinity,
              delay: element.delay,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 text-center space-y-8">
        {showLogo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center space-x-3 mb-8"
          >
            <Sparkles className="w-12 h-12 text-red-500" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-red-500 to-purple-500 bg-clip-text text-transparent">
              HojiAI
            </h1>
          </motion.div>
        )}

        {/* Loading spinner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="relative"
        >
          <div className="w-16 h-16 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto" />
          
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 w-16 h-16 bg-red-500/20 rounded-full blur-xl mx-auto"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>

        {/* Loading message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-2"
        >
          <p className="text-white text-xl font-medium">{message}</p>
          <div className="flex justify-center space-x-1">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-red-500 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-gray-400 text-sm max-w-md mx-auto"
        >
          Preparing your personalized movie experience...
        </motion.p>
      </div>
    </div>
  );
};

export default LoadingScreen;
