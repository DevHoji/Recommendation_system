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
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
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
    try {
      setLoading(true);
      
      // Load user recommendations
      const recommendationsResponse = await fetch(`/api/recommendations/${profileData.id}`);
      if (recommendationsResponse.ok) {
        const recommendationsData = await recommendationsResponse.json();
        if (recommendationsData.success) {
          setRecommendations(recommendationsData.data.slice(0, 6));
        }
      }

      // Load recently rated movies (mock data for now)
      const mockRecentlyRated = [
        {
          movieId: 1,
          title: "Inception",
          genres: ["Action", "Sci-Fi"],
          year: 2010,
          averageRating: 4.8,
          ratingCount: 1500,
          posterUrl: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg"
        },
        {
          movieId: 2,
          title: "The Dark Knight",
          genres: ["Action", "Crime"],
          year: 2008,
          averageRating: 4.9,
          ratingCount: 2000,
          posterUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg"
        }
      ];
      
      setRecentlyRated(mockRecentlyRated);
      
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
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
        <Header onSearch={() => {}} onVoiceSearch={() => {}} searchQuery="" />
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
      <Header onSearch={() => {}} onVoiceSearch={() => {}} searchQuery="" />
      
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

        {/* Personalized Recommendations */}
        {recommendations.length > 0 && (
          <div className="glass-container">
            <h2 className="text-2xl font-bold text-white mb-6">Recommended for You</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recommendations.map((movie) => (
                <MovieCard
                  key={movie.movieId}
                  movie={movie}
                  size="small"
                  onMovieClick={() => {}}
                  onAddToWatchlist={() => {}}
                  onRemoveFromWatchlist={() => {}}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recently Rated */}
        {recentlyRated.length > 0 && (
          <div className="glass-container">
            <h2 className="text-2xl font-bold text-white mb-6">Recently Rated</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recentlyRated.map((movie) => (
                <MovieCard
                  key={movie.movieId}
                  movie={movie}
                  size="small"
                  onMovieClick={() => {}}
                  onAddToWatchlist={() => {}}
                  onRemoveFromWatchlist={() => {}}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
