'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Check, Star, ArrowRight, Sparkles } from 'lucide-react';
import OnboardingLayout from './OnboardingLayout';
import { debounce } from '@/lib/utils';

interface Movie {
  movieId: number;
  title: string;
  year: number;
  genres: string[];
  posterUrl: string;
  averageRating: number;
}

interface MovieSelectionStepProps {
  onNext: (favoriteMovies: number[]) => void;
  onBack: () => void;
}

const MovieSelectionStep: React.FC<MovieSelectionStepProps> = ({ onNext, onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [selectedMovies, setSelectedMovies] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const searchMovies = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/movies/search?q=${encodeURIComponent(query)}&limit=12`);
        const data = await response.json();
        
        if (data.success) {
          setSearchResults(data.data);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    searchMovies(searchQuery);
  }, [searchQuery, searchMovies]);

  const toggleMovie = (movie: Movie) => {
    setSelectedMovies(prev => {
      const isSelected = prev.some(m => m.movieId === movie.movieId);
      if (isSelected) {
        return prev.filter(m => m.movieId !== movie.movieId);
      } else if (prev.length < 10) {
        return [...prev, movie];
      }
      return prev;
    });
  };

  const removeMovie = (movieId: number) => {
    setSelectedMovies(prev => prev.filter(m => m.movieId !== movieId));
  };

  const handleComplete = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    onNext(selectedMovies.map(m => m.movieId));
    setIsLoading(false);
  };

  return (
    <OnboardingLayout step={3} totalSteps={3}>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Pick your
            <span className="block bg-gradient-to-r from-red-400 to-purple-400 bg-clip-text text-transparent">
              favorite movies
            </span>
          </h2>
          <p className="text-gray-300 text-lg">
            Search and select movies you love to get better recommendations
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative max-w-md mx-auto"
        >
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for movies..."
            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-300 backdrop-blur-sm"
          />
          {isSearching && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </motion.div>

        {/* Selected Movies */}
        <AnimatePresence>
          {selectedMovies.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <h3 className="text-lg font-semibold text-white text-center">
                Selected Movies ({selectedMovies.length}/10)
              </h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {selectedMovies.map((movie) => (
                  <motion.div
                    key={movie.movieId}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center space-x-2 bg-white/10 rounded-full px-3 py-2 backdrop-blur-sm"
                  >
                    <span className="text-white text-sm font-medium truncate max-w-32">
                      {movie.title}
                    </span>
                    <button
                      onClick={() => removeMovie(movie.movieId)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Results */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          {searchResults.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
              {searchResults.map((movie, index) => {
                const isSelected = selectedMovies.some(m => m.movieId === movie.movieId);
                const canSelect = selectedMovies.length < 10 || isSelected;
                
                return (
                  <motion.button
                    key={movie.movieId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => canSelect && toggleMovie(movie)}
                    disabled={!canSelect}
                    className={`relative group rounded-lg overflow-hidden transition-all duration-300 ${
                      isSelected 
                        ? 'ring-2 ring-green-500 scale-95' 
                        : canSelect 
                          ? 'hover:scale-105 hover:shadow-lg' 
                          : 'opacity-50 cursor-not-allowed'
                    }`}
                    whileHover={canSelect ? { scale: 1.05 } : {}}
                    whileTap={canSelect ? { scale: 0.95 } : {}}
                  >
                    <div className="aspect-[2/3] relative">
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-hero.svg';
                        }}
                      />
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      
                      {/* Movie Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h4 className="text-white font-semibold text-sm line-clamp-2 mb-1">
                          {movie.title}
                        </h4>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-300">{movie.year}</span>
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-gray-300">{movie.averageRating?.toFixed(1) || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Selection Indicator */}
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                          >
                            <Check className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}

          {searchQuery && searchResults.length === 0 && !isSearching && (
            <div className="text-center text-gray-400 py-8">
              No movies found for "{searchQuery}"
            </div>
          )}

          {!searchQuery && (
            <div className="text-center text-gray-400 py-8">
              Start typing to search for movies...
            </div>
          )}
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
            onClick={handleComplete}
            disabled={isLoading}
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25 group relative overflow-hidden"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-teal-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            
            <div className="relative flex items-center space-x-2">
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Completing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Complete Setup</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </>
              )}
            </div>
          </motion.button>
        </motion.div>

        <div className="text-center text-gray-400 text-sm">
          You can skip this step or select up to 10 movies
        </div>
      </div>
    </OnboardingLayout>
  );
};

export default MovieSelectionStep;
