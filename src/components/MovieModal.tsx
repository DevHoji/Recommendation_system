'use client';

import { useState, useEffect } from 'react';
import { X, Play, Plus, Check, Star, Calendar, Clock } from 'lucide-react';
import { Movie } from '@/lib/movie-service';
import { motion, AnimatePresence } from 'framer-motion';

interface MovieModalProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MovieModal({ movie, isOpen, onClose }: MovieModalProps) {
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  useEffect(() => {
    if (movie) {
      const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
      setIsInWatchlist(watchlist.some((item: Movie) => item.movieId === movie.movieId));
    }
  }, [movie]);

  const toggleWatchlist = () => {
    if (!movie) return;

    const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    let newWatchlist;

    if (isInWatchlist) {
      newWatchlist = watchlist.filter((item: Movie) => item.movieId !== movie.movieId);
    } else {
      newWatchlist = [...watchlist, movie];
    }

    localStorage.setItem('watchlist', JSON.stringify(newWatchlist));
    setIsInWatchlist(!isInWatchlist);
  };

  if (!movie) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto glass-strong rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 glass rounded-full hover:glass-strong transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Hero Section */}
            <div className="relative h-96 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent">
              <img
                src={movie.posterUrl || '/placeholder-movie.jpg'}
                alt={movie.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-movie.jpg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
              
              {/* Content Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h1 className="text-4xl font-bold text-white mb-4">{movie.title}</h1>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-4 mb-6">
                  <button className="flex items-center gap-2 px-8 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors">
                    <Play className="w-5 h-5" />
                    Play Trailer
                  </button>
                  
                  <button
                    onClick={toggleWatchlist}
                    className={`flex items-center gap-2 px-6 py-3 border-2 font-semibold rounded-lg transition-colors ${
                      isInWatchlist
                        ? 'border-green-500 text-green-500 hover:bg-green-500/10'
                        : 'border-white text-white hover:bg-white/10'
                    }`}
                  >
                    {isInWatchlist ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                  </button>
                </div>

                {/* Movie Info */}
                <div className="flex items-center gap-6 text-gray-300">
                  {movie.averageRating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-yellow-500 fill-current" />
                      <span className="font-semibold">{movie.averageRating.toFixed(1)}</span>
                    </div>
                  )}
                  
                  {movie.year && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-5 h-5" />
                      <span>{movie.year}</span>
                    </div>
                  )}
                  
                  {movie.ratingCount && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-5 h-5" />
                      <span>{movie.ratingCount.toLocaleString()} ratings</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2">
                  <h2 className="text-2xl font-bold text-white mb-4">About this movie</h2>
                  
                  {/* Genres */}
                  {movie.genres && movie.genres.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-300 mb-2">Genres</h3>
                      <div className="flex flex-wrap gap-2">
                        {movie.genres.map((genre, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">Description</h3>
                    <p className="text-gray-400 leading-relaxed">
                      {movie.title} is a {movie.genres?.[0]?.toLowerCase() || 'movie'} from {movie.year}. 
                      This film has received an average rating of {movie.averageRating?.toFixed(1) || 'N/A'} 
                      from {movie.ratingCount?.toLocaleString() || 'many'} viewers, making it a 
                      {(movie.averageRating || 0) >= 4 ? ' highly acclaimed' : 
                       (movie.averageRating || 0) >= 3 ? ' well-received' : ' notable'} entry in the 
                      {movie.genres?.[0]?.toLowerCase() || 'film'} genre.
                    </p>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1">
                  <div className="glass rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Movie Details</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-gray-400 text-sm">Release Year</span>
                        <p className="text-white font-medium">{movie.year || 'Unknown'}</p>
                      </div>
                      
                      <div>
                        <span className="text-gray-400 text-sm">Rating</span>
                        <p className="text-white font-medium">
                          {movie.averageRating ? `${movie.averageRating.toFixed(1)}/5.0` : 'Not rated'}
                        </p>
                      </div>
                      
                      <div>
                        <span className="text-gray-400 text-sm">Total Ratings</span>
                        <p className="text-white font-medium">
                          {movie.ratingCount?.toLocaleString() || 'No ratings'}
                        </p>
                      </div>
                      
                      <div>
                        <span className="text-gray-400 text-sm">Movie ID</span>
                        <p className="text-white font-medium">#{movie.movieId}</p>
                      </div>
                    </div>
                  </div>

                  {/* Similar Movies */}
                  <div className="mt-6 glass rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">You might also like</h3>
                    <p className="text-gray-400 text-sm">
                      Discover more {movie.genres?.[0]?.toLowerCase() || 'movies'} and similar titles 
                      by exploring our recommendation system.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
