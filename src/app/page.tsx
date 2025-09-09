'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, TrendingUp, Star, Clock, Database } from 'lucide-react';
import Header from '@/components/Header';
import MovieGrid from '@/components/MovieGrid';
import { Movie } from '@/lib/movie-service';
import { debounce } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [watchlist, setWatchlist] = useState<number[]>([]);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [dbStats, setDbStats] = useState<any>(null);

  // Check database status on mount
  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const checkDatabaseStatus = async () => {
    try {
      const response = await fetch('/api/init-database');
      const data = await response.json();

      if (data.success && data.stats) {
        setDbStats(data.stats);
        setDbInitialized(data.stats.movies > 0);

        if (data.stats.movies > 0) {
          loadMovies();
        }
      }
    } catch (error) {
      console.error('Error checking database status:', error);
    }
  };

  const initializeDatabase = async () => {
    setLoading(true);
    toast.loading('Initializing database with MovieLens data...', { duration: 10000 });

    try {
      const response = await fetch('/api/init-database', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setDbStats(data.stats);
        setDbInitialized(true);
        toast.success('Database initialized successfully!');
        loadMovies();
      } else {
        throw new Error(data.message || 'Database initialization failed');
      }
    } catch (error) {
      console.error('Database initialization error:', error);
      toast.error('Failed to initialize database');
    } finally {
      setLoading(false);
    }
  };

  const loadMovies = async (page = 1, query = '', filters = {}) => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(query && { q: query }),
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            acc[key] = value.toString();
          }
          return acc;
        }, {} as Record<string, string>)
      });

      const response = await fetch(`/api/movies?${params}`);
      const data = await response.json();

      if (data.success) {
        if (page === 1) {
          setMovies(data.data);
        } else {
          setMovies(prev => [...prev, ...data.data]);
        }

        setHasMore(data.pagination.hasMore);
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

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
      setCurrentPage(1);
      loadMovies(1, query);
    }, 500),
    []
  );

  const handleSearch = (query: string) => {
    setIsSearching(true);
    debouncedSearch(query);
    setTimeout(() => setIsSearching(false), 1000);
  };

  const handleVoiceSearch = async (transcript: string) => {
    setIsSearching(true);
    toast.success(`Voice search: "${transcript}"`);

    try {
      // The voice search API already processes the transcript
      // and returns relevant movies, so we just need to search
      handleSearch(transcript);
    } catch (error) {
      console.error('Voice search error:', error);
      toast.error('Voice search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadMovies(currentPage + 1, searchQuery);
    }
  };

  const handleFilterChange = (filters: any) => {
    setCurrentPage(1);
    loadMovies(1, searchQuery, filters);
  };

  const handleAddToWatchlist = (movie: Movie) => {
    setWatchlist(prev => [...prev, movie.movieId]);
    toast.success(`Added "${movie.title}" to watchlist`);
  };

  const handleRemoveFromWatchlist = (movie: Movie) => {
    setWatchlist(prev => prev.filter(id => id !== movie.movieId));
    toast.success(`Removed "${movie.title}" from watchlist`);
  };

  const handleMovieSelect = (movie: Movie) => {
    toast.success(`Playing "${movie.title}"`);
    // Here you would typically navigate to a movie detail page or open a player
  };

  if (!dbInitialized) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header
          onSearch={handleSearch}
          onVoiceSearch={handleVoiceSearch}
          searchQuery={searchQuery}
          isSearching={isSearching}
        />

        <main className="pt-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-8">
                <Database className="w-12 h-12 text-white" />
              </div>

              <h1 className="text-4xl font-bold mb-4">
                Welcome to CineAI
              </h1>

              <p className="text-xl text-gray-300 mb-8">
                AI-Powered Movie Recommendations with Voice Search
              </p>

              <div className="bg-gray-900 rounded-lg p-6 mb-8">
                <h2 className="text-lg font-semibold mb-4">Database Setup Required</h2>
                <p className="text-gray-400 mb-6">
                  To get started, we need to initialize the database with the MovieLens dataset.
                  This will import movies, ratings, and user data to power our recommendation engine.
                </p>

                {dbStats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-800 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-red-400">{dbStats.movies || 0}</div>
                      <div className="text-sm text-gray-400">Movies</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-400">{dbStats.users || 0}</div>
                      <div className="text-sm text-gray-400">Users</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-400">{dbStats.ratings || 0}</div>
                      <div className="text-sm text-gray-400">Ratings</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-400">{dbStats.genres || 0}</div>
                      <div className="text-sm text-gray-400">Genres</div>
                    </div>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={initializeDatabase}
                  disabled={loading}
                  className="btn-primary px-8 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Initializing Database...</span>
                    </div>
                  ) : (
                    'Initialize Database'
                  )}
                </motion.button>
              </div>

              <div className="text-left bg-gray-900/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Features:</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <TrendingUp className="w-5 h-5 text-red-400 mt-1" />
                    <div>
                      <h4 className="font-medium">AI Recommendations</h4>
                      <p className="text-sm text-gray-400">Personalized movie suggestions powered by Google Gemini</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Play className="w-5 h-5 text-red-400 mt-1" />
                    <div>
                      <h4 className="font-medium">Voice Search</h4>
                      <p className="text-sm text-gray-400">Search for movies using natural language voice commands</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Star className="w-5 h-5 text-red-400 mt-1" />
                    <div>
                      <h4 className="font-medium">Smart Filtering</h4>
                      <p className="text-sm text-gray-400">Advanced filters by genre, year, rating, and more</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-red-400 mt-1" />
                    <div>
                      <h4 className="font-medium">Watchlist</h4>
                      <p className="text-sm text-gray-400">Save movies to watch later with personalized lists</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header
        onSearch={handleSearch}
        onVoiceSearch={handleVoiceSearch}
        searchQuery={searchQuery}
        isSearching={isSearching}
      />

      <main className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          {!searchQuery && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-12 text-center"
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Discover Your Next
                <span className="text-red-600"> Favorite Movie</span>
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                AI-powered recommendations, voice search, and personalized suggestions
                to help you find the perfect movie for any mood.
              </p>

              {dbStats && (
                <div className="flex justify-center space-x-8 text-sm text-gray-400 mb-8">
                  <div>
                    <span className="text-2xl font-bold text-white block">{dbStats.movies?.toLocaleString()}</span>
                    Movies
                  </div>
                  <div>
                    <span className="text-2xl font-bold text-white block">{dbStats.ratings?.toLocaleString()}</span>
                    Ratings
                  </div>
                  <div>
                    <span className="text-2xl font-bold text-white block">{dbStats.genres}</span>
                    Genres
                  </div>
                </div>
              )}
            </motion.section>
          )}

          {/* Movies Section */}
          <section className="py-8">
            <MovieGrid
              movies={movies}
              loading={loading}
              title={searchQuery ? `Search Results for "${searchQuery}"` : 'Popular Movies'}
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              onMovieSelect={handleMovieSelect}
              onAddToWatchlist={handleAddToWatchlist}
              onRemoveFromWatchlist={handleRemoveFromWatchlist}
              watchlist={watchlist}
              showFilters={true}
              onFilterChange={handleFilterChange}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
