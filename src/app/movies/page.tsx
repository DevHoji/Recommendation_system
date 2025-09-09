'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import MovieGrid from '@/components/MovieGrid';
import MovieModal from '@/components/MovieModal';
import VoiceSearch from '@/components/VoiceSearch';
import { Movie } from '@/lib/movie-service';
import { debounce } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isVoiceSearchOpen, setIsVoiceSearchOpen] = useState(false);
  const [watchlist, setWatchlist] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Load watchlist from localStorage
  useEffect(() => {
    const savedWatchlist = localStorage.getItem('cineai-watchlist');
    if (savedWatchlist) {
      setWatchlist(JSON.parse(savedWatchlist));
    }
    loadMovies();
  }, []);

  // Save watchlist to localStorage
  useEffect(() => {
    localStorage.setItem('cineai-watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const loadMovies = async (page = 1, query = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy: 'popularity',
        sortOrder: 'desc',
        ...(query && { search: query })
      });

      const response = await fetch(`/api/movies?${params}`);
      const data = await response.json();

      if (data.success) {
        if (page === 1) {
          setMovies(data.data);
        } else {
          setMovies(prev => [...prev, ...data.data]);
        }
        setHasMore(data.data.length === 20);
        setCurrentPage(page);
      } else {
        throw new Error(data.message || 'Failed to load movies');
      }
    } catch (error) {
      console.error('Error loading movies:', error);
      toast.error('Failed to load movies');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback(
    debounce(async (query: string) => {
      setIsSearching(true);
      setSearchQuery(query);
      await loadMovies(1, query);
      setIsSearching(false);
    }, 300),
    []
  );

  const handleVoiceSearch = async (transcript: string) => {
    try {
      const response = await fetch('/api/voice-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.data.movies && data.data.movies.length > 0) {
          setMovies(data.data.movies);
          setSearchQuery(transcript);
          toast.success(`Found ${data.data.movies.length} movies`);
        } else {
          toast.error('No movies found for your request');
        }
      } else {
        toast.error('Voice search failed');
      }
    } catch (error) {
      console.error('Voice search error:', error);
      toast.error('Voice search failed');
    }
  };

  const handleAddToWatchlist = (movie: Movie) => {
    if (!watchlist.includes(movie.movieId)) {
      setWatchlist(prev => [...prev, movie.movieId]);
      toast.success(`Added "${movie.title}" to watchlist`);
    }
  };

  const handleRemoveFromWatchlist = (movie: Movie) => {
    setWatchlist(prev => prev.filter(id => id !== movie.movieId));
    toast.success(`Removed "${movie.title}" from watchlist`);
  };

  const handleMovieSelect = (movie: Movie) => {
    setSelectedMovie(movie);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadMovies(currentPage + 1, searchQuery);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header
        onSearch={handleSearch}
        onVoiceSearch={() => setIsVoiceSearchOpen(true)}
        searchQuery={searchQuery}
        isSearching={isSearching}
      />

      <main className="main-content pt-20">
        <div className="glass-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-white mb-4">
              {searchQuery ? `Search Results for "${searchQuery}"` : 'All Movies'}
            </h1>
            <p className="text-gray-300">
              {searchQuery 
                ? `Showing results for your search query`
                : 'Discover thousands of movies from our collection'
              }
            </p>
          </motion.div>

          <MovieGrid
            movies={movies}
            loading={loading}
            onMovieClick={handleMovieSelect}
            onAddToWatchlist={handleAddToWatchlist}
            onRemoveFromWatchlist={handleRemoveFromWatchlist}
            watchlist={watchlist}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            showFilters={true}
          />
        </div>
      </main>

      {/* Movie Modal */}
      <AnimatePresence>
        {selectedMovie && (
          <MovieModal
            movie={selectedMovie}
            onClose={() => setSelectedMovie(null)}
            onAddToWatchlist={handleAddToWatchlist}
            onRemoveFromWatchlist={handleRemoveFromWatchlist}
            isInWatchlist={watchlist.includes(selectedMovie.movieId)}
          />
        )}
      </AnimatePresence>

      {/* Voice Search Modal */}
      <AnimatePresence>
        {isVoiceSearchOpen && (
          <VoiceSearch
            isOpen={isVoiceSearchOpen}
            onClose={() => setIsVoiceSearchOpen(false)}
            onTranscriptComplete={handleVoiceSearch}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
