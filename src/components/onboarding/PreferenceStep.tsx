'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import OnboardingLayout from './OnboardingLayout';

interface PreferenceStepProps {
  onNext: (preferences: { genres: string[]; moods: string[] }) => void;
  onBack: () => void;
}

const PreferenceStep: React.FC<PreferenceStepProps> = ({ onNext, onBack }) => {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const genres = [
    { name: 'Action', icon: '💥', color: 'from-red-500 to-orange-500' },
    { name: 'Comedy', icon: '😂', color: 'from-yellow-500 to-orange-500' },
    { name: 'Drama', icon: '🎭', color: 'from-purple-500 to-pink-500' },
    { name: 'Horror', icon: '👻', color: 'from-gray-700 to-gray-900' },
    { name: 'Romance', icon: '💖', color: 'from-pink-500 to-red-500' },
    { name: 'Sci-Fi', icon: '🚀', color: 'from-blue-500 to-purple-500' },
    { name: 'Thriller', icon: '🔥', color: 'from-red-600 to-purple-600' },
    { name: 'Animation', icon: '🎨', color: 'from-green-500 to-blue-500' },
    { name: 'Documentary', icon: '📽️', color: 'from-teal-500 to-green-500' },
    { name: 'Fantasy', icon: '🧙', color: 'from-purple-600 to-indigo-600' },
    { name: 'Crime', icon: '🕵️', color: 'from-gray-600 to-red-600' },
    { name: 'Adventure', icon: '🗺️', color: 'from-green-600 to-teal-600' }
  ];

  const moods = [
    { name: 'Funny', icon: '😄', color: 'from-yellow-400 to-orange-400' },
    { name: 'Thrilling', icon: '⚡', color: 'from-red-500 to-purple-500' },
    { name: 'Emotional', icon: '💭', color: 'from-blue-500 to-indigo-500' },
    { name: 'Inspiring', icon: '✨', color: 'from-green-500 to-teal-500' },
    { name: 'Relaxing', icon: '🌙', color: 'from-indigo-500 to-purple-500' },
    { name: 'Intense', icon: '🔥', color: 'from-red-600 to-orange-600' }
  ];

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const toggleMood = (mood: string) => {
    setSelectedMoods(prev => 
      prev.includes(mood) 
        ? prev.filter(m => m !== mood)
        : [...prev, mood]
    );
  };

  const handleSubmit = async () => {
    if (selectedGenres.length === 0) return;

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    
    onNext({
      genres: selectedGenres,
      moods: selectedMoods
    });
    
    setIsLoading(false);
  };

  return (
    <OnboardingLayout step={2} totalSteps={3}>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            What do you love
            <span className="block bg-gradient-to-r from-red-400 to-purple-400 bg-clip-text text-transparent">
              watching?
            </span>
          </h2>
          <p className="text-gray-300 text-lg">
            Select your favorite genres and moods to get personalized recommendations
          </p>
        </motion.div>

        {/* Genre Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h3 className="text-xl font-semibold text-white text-center">Genres</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {genres.map((genre, index) => (
              <motion.button
                key={genre.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                onClick={() => toggleGenre(genre.name)}
                className={`relative p-4 rounded-xl border-2 transition-all duration-300 group ${
                  selectedGenres.includes(genre.name)
                    ? 'border-white/50 bg-white/10'
                    : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${genre.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                
                <div className="relative flex flex-col items-center space-y-2">
                  <span className="text-2xl">{genre.icon}</span>
                  <span className="text-white font-medium text-sm">{genre.name}</span>
                </div>

                <AnimatePresence>
                  {selectedGenres.includes(genre.name) && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                    >
                      <Check className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Mood Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <h3 className="text-xl font-semibold text-white text-center">Moods</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {moods.map((mood, index) => (
              <motion.button
                key={mood.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                onClick={() => toggleMood(mood.name)}
                className={`relative p-4 rounded-xl border-2 transition-all duration-300 group ${
                  selectedMoods.includes(mood.name)
                    ? 'border-white/50 bg-white/10'
                    : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${mood.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                
                <div className="relative flex flex-col items-center space-y-2">
                  <span className="text-2xl">{mood.icon}</span>
                  <span className="text-white font-medium text-sm">{mood.name}</span>
                </div>

                <AnimatePresence>
                  {selectedMoods.includes(mood.name) && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                    >
                      <Check className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex justify-between items-center pt-6"
        >
          <button
            onClick={onBack}
            className="px-6 py-3 text-gray-400 hover:text-white transition-colors duration-300"
          >
            Back
          </button>

          <motion.button
            onClick={handleSubmit}
            disabled={selectedGenres.length === 0 || isLoading}
            className="px-8 py-4 bg-gradient-to-r from-red-500 to-purple-500 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25 group relative overflow-hidden"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            
            <div className="relative flex items-center space-x-2">
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </>
              )}
            </div>
          </motion.button>
        </motion.div>

        {selectedGenres.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-gray-400 text-sm"
          >
            Please select at least one genre to continue
          </motion.p>
        )}
      </div>
    </OnboardingLayout>
  );
};

export default PreferenceStep;
