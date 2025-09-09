'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Filter, SortAsc } from 'lucide-react';
import MovieCard from './MovieCard';
import MovieModal from './MovieModal';
import { Movie } from '@/lib/movie-service';
import { cn } from '@/lib/utils';

interface MovieGridProps {
  movies: Movie[];
  loading?: boolean;
  title?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  onMovieSelect?: (movie: Movie) => void;
  onAddToWatchlist?: (movie: Movie) => void;
  onRemoveFromWatchlist?: (movie: Movie) => void;
  watchlist?: number[];
  className?: string;
  layout?: 'grid' | 'carousel';
  showFilters?: boolean;
  onFilterChange?: (filters: any) => void;
}

const MovieGrid: React.FC<MovieGridProps> = ({
  movies,
  loading = false,
  title,
  onLoadMore,
  hasMore = false,
  onMovieSelect,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  watchlist = [],
  className,
  layout = 'grid',
  showFilters = false,
  onFilterChange
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [sortBy, setSortBy] = useState<'title' | 'year' | 'rating'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const itemsPerPage = layout === 'carousel' ? 6 : 20;
  const totalPages = Math.ceil(movies.length / itemsPerPage);

  // Get unique genres from movies
  const genres = Array.from(
    new Set(movies.flatMap(movie => movie.genres || []))
  ).sort();

  const handleFilterChange = (newFilters: any) => {
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const handleSortChange = (newSortBy: 'title' | 'year' | 'rating') => {
    const newOrder = sortBy === newSortBy && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(newSortBy);
    setSortOrder(newOrder);
    
    handleFilterChange({
      sortBy: newSortBy,
      sortOrder: newOrder,
      genre: selectedGenre
    });
  };

  const handleGenreChange = (genre: string) => {
    setSelectedGenre(genre);
    handleFilterChange({
      sortBy,
      sortOrder,
      genre: genre || undefined
    });
  };

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const currentMovies = layout === 'carousel'
    ? movies.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)
    : movies;

  const handleMovieClick = (movie: Movie) => {
    setSelectedMovie(movie);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMovie(null);
  };

  if (loading && movies.length === 0) {
    return (
      <div className={cn('space-y-6', className)}>
        {title && (
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">{title}</h2>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, index) => (
            <div
              key={index}
              className="w-full h-72 bg-gray-800 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        {title && (
          <h2 className="text-2xl font-bold text-white">{title}</h2>
        )}
        
        {layout === 'carousel' && totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={prevPage}
              disabled={currentPage === 0}
              className="p-2 rounded-full bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-400">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages - 1}
              className="p-2 rounded-full bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-900/50 rounded-lg">
          {/* Genre Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedGenre}
              onChange={(e) => handleGenreChange(e.target.value)}
              className="bg-gray-800 text-white rounded-md px-3 py-1 text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">All Genres</option>
              {genres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Options */}
          <div className="flex items-center space-x-2">
            <SortAsc className="w-4 h-4 text-gray-400" />
            <button
              onClick={() => handleSortChange('title')}
              className={cn(
                'px-3 py-1 text-sm rounded-md transition-colors',
                sortBy === 'title' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              )}
            >
              Title {sortBy === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSortChange('year')}
              className={cn(
                'px-3 py-1 text-sm rounded-md transition-colors',
                sortBy === 'year' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              )}
            >
              Year {sortBy === 'year' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSortChange('rating')}
              className={cn(
                'px-3 py-1 text-sm rounded-md transition-colors',
                sortBy === 'rating' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              )}
            >
              Rating {sortBy === 'rating' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>
      )}

      {/* Movies Grid/Carousel */}
      <AnimatePresence mode="wait">
        {currentMovies.length > 0 ? (
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: layout === 'carousel' ? 50 : 0 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: layout === 'carousel' ? -50 : 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              layout === 'grid' 
                ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
                : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4'
            )}
          >
            {currentMovies.map((movie, index) => (
              <MovieCard
                key={`${movie.movieId}-${currentPage}`}
                movie={movie}
                onPlay={onMovieSelect}
                onAddToWatchlist={onAddToWatchlist}
                onRemoveFromWatchlist={onRemoveFromWatchlist}
                onMovieClick={handleMovieClick}
                isInWatchlist={watchlist.includes(movie.movieId)}
                size={layout === 'carousel' ? 'medium' : 'medium'}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-gray-400 text-lg mb-2">No movies found</div>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Load More Button (for grid layout) */}
      {layout === 'grid' && hasMore && onLoadMore && (
        <div className="flex justify-center pt-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onLoadMore}
            disabled={loading}
            className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Loading...</span>
              </div>
            ) : (
              'Load More Movies'
            )}
          </motion.button>
        </div>
      )}

      {/* Loading indicator for additional movies */}
      {loading && movies.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`loading-${index}`}
              className="w-full h-72 bg-gray-800 rounded-lg animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Movie Details Modal */}
      <MovieModal
        movie={selectedMovie}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default MovieGrid;
