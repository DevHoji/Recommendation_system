'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Heart, Star, Calendar, Settings, LogOut } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import MovieCard from '@/components/MovieCard';
import LoadingScreen from '@/components/LoadingScreen';
import { Movie } from '@/lib/movie-service';
import toast from 'react-hot-toast';

interface RecommendationSection {
  title: string;
  movies: Movie[];
  loading: boolean;
  description: string;
}

export default function ProfilePage() {
  const { user: currentUser, isAuthenticated, isLoading, logout } = useUser();
  const router = useRouter();
  const [profileData, setProfileData] = useState({
    id: currentUser?.id || 1,
    name: currentUser?.username || 'Movie Enthusiast',
    email: currentUser?.email || 'user@cineai.com',
    joinDate: '2024-01-15',
    totalRatings: 127,
    averageRating: 4.2,
    favoriteGenres: currentUser?.preferences?.genres || ['Action', 'Sci-Fi', 'Drama']
  });
  
  const [recentlyRated, setRecentlyRated] = useState<Movie[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationSection[]>([]);
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (currentUser && !currentUser.isOnboarded))) {
      router.push('/onboarding');
      return;
    }

    if (isAuthenticated && currentUser) {
      loadUserData();
    }
  }, [isAuthenticated, currentUser, isLoading, router]);

  const loadUserData = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      // Load user's watchlist
      const watchlistResponse = await fetch(`/api/users/watchlist?userId=${currentUser.id}`);
      let watchlistMovies = [];
      if (watchlistResponse.ok) {
        const watchlistData = await watchlistResponse.json();
        watchlistMovies = watchlistData.watchlist || [];
      }

      // Load different types of recommendations
      const recommendationSections = [
        {
          title: 'Personalized for You',
          description: 'Based on your preferences and viewing history',
          endpoint: `/api/recommendations/${currentUser.id}?limit=12`
        },
        {
          title: 'Because You Like ' + (currentUser.preferences.genres[0] || 'Movies'),
          description: 'Movies matching your favorite genres',
          endpoint: `/api/movies?genre=${currentUser.preferences.genres[0] || 'Action'}&limit=12`
        },
        {
          title: 'Trending in Your Genres',
          description: 'Popular movies in genres you love',
          endpoint: `/api/movies?sortBy=popularity&sortOrder=desc&limit=12`
        },
        {
          title: 'Highly Rated Picks',
          description: 'Top-rated movies you might enjoy',
          endpoint: `/api/movies?sortBy=rating&sortOrder=desc&limit=12`
        }
      ];

      const sectionPromises = recommendationSections.map(async (section) => {
        try {
          const response = await fetch(section.endpoint);
          const data = await response.json();
          return {
            title: section.title,
            description: section.description,
            movies: data.data || data.movies || [],
            loading: false
          };
        } catch (error) {
          console.error(`Error loading ${section.title}:`, error);
          return {
            title: section.title,
            description: section.description,
            movies: [],
            loading: false
          };
        }
      });

      const loadedSections = await Promise.all(sectionPromises);
      setRecommendations(loadedSections);

      // Set watchlist movies for display
      setWatchlist(watchlistMovies);
      setRecentlyRated(watchlistMovies.slice(0, 6));

    } catch (error) {
      console.error('Error loading profile data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWatchlist = async (movie: Movie) => {
    if (!currentUser) return;

    try {
      const response = await fetch('/api/users/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, movieId: movie.movieId })
      });

      if (response.ok) {
        setWatchlist(prev => [...prev, movie]);
        toast.success(`Added "${movie.title}" to watchlist`);
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      toast.error('Failed to add to watchlist');
    }
  };

  const handleRemoveFromWatchlist = async (movie: Movie) => {
    if (!currentUser) return;

    try {
      const response = await fetch(`/api/users/watchlist?userId=${currentUser.id}&movieId=${movie.movieId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setWatchlist(prev => prev.filter(m => m.movieId !== movie.movieId));
        toast.success(`Removed "${movie.title}" from watchlist`);
      }
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      toast.error('Failed to remove from watchlist');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/onboarding');
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    router.push('/onboarding');
  };

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen message="Loading Profile..." />;
  }

  // Don't render main content if user is not authenticated or onboarded
  if (!isAuthenticated || (currentUser && !currentUser.isOnboarded)) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header onSearch={() => {}} onVoiceSearch={() => {}} searchQuery="" isSearching={false} />
        <main className="main-content">
          <div className="glass-container">
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header onSearch={() => {}} onVoiceSearch={() => {}} searchQuery="" isSearching={false} />
      
      <main className="main-content">
        {/* User Profile Header */}
        <div className="glass-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-start md:items-center gap-6"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center">
              <User className="w-12 h-12 text-white" />
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{profileData.name}</h1>
              <p className="text-gray-300 mb-4">{profileData.email}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">{profileData.totalRatings}</div>
                  <div className="text-sm text-gray-400">Movies Rated</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{profileData.averageRating}</div>
                  <div className="text-sm text-gray-400">Avg Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{recommendations.length}</div>
                  <div className="text-sm text-gray-400">Recommendations</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {new Date(profileData.joinDate).getFullYear()}
                  </div>
                  <div className="text-sm text-gray-400">Member Since</div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button className="p-2 glass rounded-lg hover:bg-white/10 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <button 
                onClick={handleLogout}
                className="p-2 glass rounded-lg hover:bg-red-500/20 transition-colors text-red-400"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Favorite Genres */}
        <div className="glass-container">
          <h2 className="text-2xl font-bold text-white mb-6">Favorite Genres</h2>
          <div className="flex flex-wrap gap-3">
            {profileData.favoriteGenres.map((genre) => (
              <span
                key={genre}
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-full text-sm font-medium"
              >
                {genre}
              </span>
            ))}
          </div>
        </div>

        {/* Recommendation Sections */}
        {recommendations.map((section, index) => (
          <div key={section.title} className="glass-container">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">{section.title}</h2>
                <p className="text-gray-400 text-sm mt-1">{section.description}</p>
              </div>
            </div>

            {section.loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : section.movies.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {section.movies.slice(0, 12).map((movie) => (
                  <MovieCard
                    key={movie.movieId}
                    movie={movie}
                    size="small"
                    onMovieClick={() => {}}
                    onAddToWatchlist={() => handleAddToWatchlist(movie)}
                    onRemoveFromWatchlist={() => handleRemoveFromWatchlist(movie)}
                    isInWatchlist={watchlist.some(w => w.movieId === movie.movieId)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400">No recommendations available</p>
              </div>
            )}
          </div>
        ))}

        {/* My Watchlist */}
        {watchlist.length > 0 && (
          <div className="glass-container">
            <h2 className="text-2xl font-bold text-white mb-6">My Watchlist</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {watchlist.map((movie) => (
                <MovieCard
                  key={movie.movieId}
                  movie={movie}
                  size="small"
                  onMovieClick={() => {}}
                  onAddToWatchlist={() => handleAddToWatchlist(movie)}
                  onRemoveFromWatchlist={() => handleRemoveFromWatchlist(movie)}
                  isInWatchlist={true}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
