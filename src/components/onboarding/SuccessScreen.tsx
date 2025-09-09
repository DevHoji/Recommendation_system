'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Sparkles, ArrowRight, Star } from 'lucide-react';
import OnboardingLayout from './OnboardingLayout';

interface SuccessScreenProps {
  username: string;
  onComplete: () => void;
}

const SuccessScreen: React.FC<SuccessScreenProps> = ({ username, onComplete }) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Trigger confetti animation
    const timer = setTimeout(() => {
      setShowConfetti(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <OnboardingLayout showProgress={false}>
      <div className="text-center space-y-8 relative">
        {/* Confetti Effect */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'][i % 5],
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                initial={{ scale: 0, y: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  y: [0, -100, -200],
                  x: [0, Math.random() * 100 - 50],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 2,
                  delay: Math.random() * 0.5,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>
        )}

        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 10,
            delay: 0.2 
          }}
          className="flex justify-center"
        >
          <div className="relative">
            <CheckCircle className="w-24 h-24 text-green-500" />
            
            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 w-24 h-24 bg-green-500/20 rounded-full blur-xl"
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
          </div>
        </motion.div>

        {/* Success Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Awesome, {username}!
          </h2>
          
          <div className="space-y-2">
            <p className="text-xl text-gray-300">
              We've personalized your movie recommendations
            </p>
            <div className="flex items-center justify-center space-x-2 text-lg">
              <Sparkles className="w-6 h-6 text-yellow-400" />
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent font-semibold">
                Your cinematic journey begins now!
              </span>
              <Sparkles className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
        </motion.div>

        {/* Features Highlight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto"
        >
          {[
            {
              icon: <Star className="w-8 h-8 text-yellow-400" />,
              title: "Personalized Picks",
              description: "Movies tailored to your taste"
            },
            {
              icon: <Sparkles className="w-8 h-8 text-purple-400" />,
              title: "AI Recommendations",
              description: "Smart suggestions that learn"
            },
            {
              icon: <CheckCircle className="w-8 h-8 text-green-400" />,
              title: "Ready to Explore",
              description: "Your watchlist awaits"
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              className="p-6 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300"
            >
              <div className="flex flex-col items-center space-y-3 text-center">
                <div className="p-3 bg-white/10 rounded-full">
                  {feature.icon}
                </div>
                <h3 className="text-white font-semibold">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="space-y-4"
        >
          <motion.button
            onClick={onComplete}
            className="px-12 py-4 bg-gradient-to-r from-red-500 to-purple-500 text-white font-bold text-lg rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25 group relative overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Button glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            
            <div className="relative flex items-center space-x-3">
              <span>Start Watching</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </motion.button>

          <p className="text-gray-400 text-sm">
            Get ready to discover your next favorite movie!
          </p>
        </motion.div>

        {/* Floating Elements */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${10 + (i * 10)}%`,
                top: `${20 + (i % 3) * 20}%`,
              }}
              animate={{
                y: [0, -20, 0],
                rotate: [0, 360],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeInOut"
              }}
            >
              <div className="w-1 h-1 bg-white/30 rounded-full" />
            </motion.div>
          ))}
        </div>
      </div>
    </OnboardingLayout>
  );
};

export default SuccessScreen;
