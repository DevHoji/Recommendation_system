'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Play, Star, Calendar, Users } from 'lucide-react';
import { Movie } from '@/lib/movie-service';
import { cn, formatRating, getGenreColor } from '@/lib/utils';

interface MovieCardProps {
  movie: Movie;
  onPlay?: (movie: Movie) => void;
  onAddToWatchlist?: (movie: Movie) => void;
  onRemoveFromWatchlist?: (movie: Movie) => void;
  onMovieClick?: (movie: Movie) => void;
  isInWatchlist?: boolean;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onPlay,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  onMovieClick,
  isInWatchlist = false,
  className,
  size = 'medium'
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    small: 'w-32 h-48',
    medium: 'w-48 h-72',
    large: 'w-64 h-96'
  };

  const handleWatchlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInWatchlist && onRemoveFromWatchlist) {
      onRemoveFromWatchlist(movie);
    } else if (!isInWatchlist && onAddToWatchlist) {
      onAddToWatchlist(movie);
    }
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlay) {
      onPlay(movie);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05, zIndex: 10 }}
      transition={{ duration: 0.3 }}
      onClick={() => onMovieClick?.(movie)}
      className={cn(
        'relative group cursor-pointer movie-card',
        sizeClasses[size],
        className
      )}
    >
      {/* Movie Poster */}
      <div className="relative w-full h-full glass rounded-lg overflow-hidden bg-gray-900/50">
        {!imageError && movie.posterUrl ? (
          <>
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className={cn(
                'w-full h-full object-cover transition-opacity duration-300',
                imageLoaded ? 'opacity-100' : 'opacity-0'
              )}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-800 animate-pulse flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <div className="text-center p-4">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-3">
                <Play className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-white text-sm font-medium line-clamp-2 mb-1">
                {movie.title}
              </h3>
              <p className="text-gray-400 text-xs">{movie.year}</p>
            </div>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Hover Actions */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handlePlay}
            className="bg-white/20 backdrop-blur-sm rounded-full p-3 mr-2 hover:bg-white/30 transition-colors"
          >
            <Play className="w-6 h-6 text-white fill-white" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleWatchlistToggle}
            className={cn(
              'backdrop-blur-sm rounded-full p-3 transition-colors',
              isInWatchlist 
                ? 'bg-red-500/80 hover:bg-red-600/80' 
                : 'bg-white/20 hover:bg-white/30'
            )}
          >
            <Heart 
              className={cn(
                'w-6 h-6',
                isInWatchlist ? 'text-white fill-white' : 'text-white'
              )} 
            />
          </motion.button>
        </div>

        {/* Rating Badge */}
        {movie.averageRating && (
          <div className="absolute top-2 left-2 glass-subtle rounded-md px-2 py-1 flex items-center space-x-1">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-white text-xs font-medium">
              {formatRating(movie.averageRating)}
            </span>
          </div>
        )}

        {/* Year Badge */}
        <div className="absolute top-2 right-2 glass-subtle rounded-md px-2 py-1">
          <span className="text-white text-xs font-medium">{movie.year}</span>
        </div>
      </div>

      {/* Movie Info (appears on hover) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 0, y: 10 }}
        whileHover={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="absolute -bottom-20 left-0 right-0 glass-strong rounded-lg p-4 shadow-xl group-hover:opacity-100 opacity-0"
      >
        <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2">
          {movie.title}
        </h3>
        
        {/* Genres */}
        {movie.genres && movie.genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {movie.genres.slice(0, 3).map((genre) => (
              <span
                key={genre}
                className={cn(
                  'text-xs px-2 py-1 rounded-full text-white',
                  getGenreColor(genre)
                )}
              >
                {genre}
              </span>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center space-x-3">
            {movie.averageRating && (
              <div className="flex items-center space-x-1">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span>{formatRating(movie.averageRating)}</span>
              </div>
            )}
            
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>{movie.year}</span>
            </div>
            
            {movie.ratingCount && movie.ratingCount > 0 && (
              <div className="flex items-center space-x-1">
                <Users className="w-3 h-3" />
                <span>{movie.ratingCount}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MovieCard;
