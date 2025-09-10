'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Play, Trash2 } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import MovieCard from '@/components/MovieCard';
import MovieModal from '@/components/MovieModal';
import VoiceSearch from '@/components/VoiceSearch';
import LoadingScreen from '@/components/LoadingScreen';
import { Movie } from '@/lib/movie-service';
import toast from 'react-hot-toast';

export default function WatchlistPage() {
  const { user, isAuthenticated, isLoading } = useUser();
  const router = useRouter();
  const [watchlistMovies, setWatchlistMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isVoiceSearchOpen, setIsVoiceSearchOpen] = useState(false);
  const [watchlist, setWatchlist] = useState<number[]>([]);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user && !user.isOnboarded))) {
      router.push('/onboarding');
      return;
    }

    if (isAuthenticated && user) {
      loadWatchlist();
    }
  }, [isAuthenticated, user, isLoading, router]);

  const loadWatchlist = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load watchlist from Neo4j API
      const response = await fetch(`/api/users/watchlist?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.watchlist) {
          setWatchlistMovies(data.watchlist);
          setWatchlist(data.watchlist.map((movie: Movie) => movie.movieId));
        } else {
          setWatchlistMovies([]);
          setWatchlist([]);
        }
      } else {
        // Fallback to localStorage if API fails
        console.log('Neo4j API failed, falling back to localStorage');
        const savedWatchlist = localStorage.getItem('hojiai-watchlist');
        const watchlistIds = savedWatchlist ? JSON.parse(savedWatchlist) : [];
        setWatchlist(watchlistIds);

        if (watchlistIds.length === 0) {
          setWatchlistMovies([]);
        } else {
          // Fetch movies from individual movie API
          const moviePromises = watchlistIds.map(async (id: number) => {
            try {
              const response = await fetch(`/api/movies/${id}`);
              const data = await response.json();
              return data.success ? data.data : null;
            } catch (error) {
              console.error(`Error fetching movie ${id}:`, error);
              return null;
            }
          });

          const movies = await Promise.all(moviePromises);
          const validMovies = movies.filter(movie => movie !== null);
          setWatchlistMovies(validMovies);
        }
      }
    } catch (error) {
      console.error('Error loading watchlist:', error);
      toast.error('Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWatchlist = async (movie: Movie) => {
    if (!user) return;

    try {
      // Remove from Neo4j database
      const response = await fetch(`/api/users/watchlist?userId=${user.id}&movieId=${movie.movieId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const updatedWatchlist = watchlist.filter(id => id !== movie.movieId);
        setWatchlist(updatedWatchlist);
        setWatchlistMovies(prev => prev.filter(m => m.movieId !== movie.movieId));

        // Also update localStorage as fallback
        localStorage.setItem('hojiai-watchlist', JSON.stringify(updatedWatchlist));
        toast.success(`Removed "${movie.title}" from watchlist`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to remove from watchlist');
      }
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      toast.error('Failed to remove from watchlist');
    }
  };

  const handleMovieSelect = (movie: Movie) => {
    setSelectedMovie(movie);
  };

  const handleClearWatchlist = async () => {
    if (!user) return;

    try {
      // Clear all movies from watchlist in Neo4j
      const deletePromises = watchlistMovies.map(movie =>
        fetch(`/api/users/watchlist?userId=${user.id}&movieId=${movie.movieId}`, {
          method: 'DELETE'
        })
      );

      await Promise.all(deletePromises);

      setWatchlist([]);
      setWatchlistMovies([]);
      localStorage.setItem('hojiai-watchlist', JSON.stringify([]));
      toast.success('Watchlist cleared');
    } catch (error) {
      console.error('Error clearing watchlist:', error);
      toast.error('Failed to clear watchlist');
    }
  };

  const handleVoiceSearch = () => {
    setIsVoiceSearchOpen(true);
  };

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen message="Loading Watchlist..." />;
  }

  // Don't render main content if user is not authenticated or onboarded
  if (!isAuthenticated || (user && !user.isOnboarded)) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header
          onSearch={() => {}}
          onVoiceSearch={handleVoiceSearch}
          searchQuery=""
          isSearching={false}
        />
        <main className="main-content">
          <div className="glass-container">
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header
        onSearch={() => {}}
        onVoiceSearch={handleVoiceSearch}
        searchQuery=""
        isSearching={false}
      />

      <main className="main-content">
        <div className="glass-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Heart className="w-8 h-8 text-red-500 fill-red-500" />
                <h1 className="text-4xl font-bold text-white">My Watchlist</h1>
              </div>
              {watchlistMovies.length > 0 && (
                <button
                  onClick={handleClearWatchlist}
                  className="flex items-center space-x-2 glass px-4 py-2 rounded-lg text-red-400 hover:glass-strong transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear All</span>
                </button>
              )}
            </div>
            <p className="text-gray-300">
              {watchlistMovies.length === 0 
                ? 'Your watchlist is empty. Start adding movies you want to watch!'
                : `You have ${watchlistMovies.length} movie${watchlistMovies.length === 1 ? '' : 's'} in your watchlist`
              }
            </p>
          </motion.div>

          {watchlistMovies.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-8">
                <Heart className="w-12 h-12 text-gray-600" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">No Movies in Watchlist</h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Browse movies and add them to your watchlist to keep track of what you want to watch.
              </p>
              <motion.a
                href="/movies"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center space-x-2 bg-red-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                <Play className="w-5 h-5" />
                <span>Browse Movies</span>
              </motion.a>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {watchlistMovies.map((movie, index) => (
                <motion.div
                  key={movie.movieId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <MovieCard
                    movie={movie}
                    onMovieClick={handleMovieSelect}
                    onRemoveFromWatchlist={handleRemoveFromWatchlist}
                    isInWatchlist={true}
                    size="medium"
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Movie Modal */}
      <AnimatePresence>
        {selectedMovie && (
          <MovieModal
            movie={selectedMovie}
            isOpen={!!selectedMovie}
            onClose={() => setSelectedMovie(null)}
          />
        )}
      </AnimatePresence>

      {/* Voice Search Modal */}
      <AnimatePresence>
        {isVoiceSearchOpen && (
          <VoiceSearch
            isOpen={isVoiceSearchOpen}
            onClose={() => setIsVoiceSearchOpen(false)}
            onResult={() => {}}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
