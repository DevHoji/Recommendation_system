'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Plus, Info, Star, ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import MovieCard from './MovieCard';
import Footer from './Footer';
import LoadingShimmer, { HeroShimmer } from './LoadingShimmer';
import { Movie } from '@/lib/movie-service';
import { sanitizeMovieData } from '@/lib/utils';

interface HomePageProps {
  onMovieSelect?: (movie: Movie) => void;
  onAddToWatchlist?: (movie: Movie) => void;
  onRemoveFromWatchlist?: (movie: Movie) => void;
  watchlist?: number[];
}

interface MovieSection {
  title: string;
  movies: Movie[];
  loading: boolean;
}

interface TrailerData {
  key: string;
  name: string;
  site: string;
  type: string;
}

export default function HomePage({
  onMovieSelect,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  watchlist = []
}: HomePageProps) {
  const { user } = useUser();
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([]);
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0);
  const [sections, setSections] = useState<MovieSection[]>([
    { title: `Recommended for ${user?.username || 'You'}`, movies: [], loading: true },
    { title: 'Trending Now', movies: [], loading: true },
    { title: 'Top Rated', movies: [], loading: true },
    { title: 'Action Movies', movies: [], loading: true },
    { title: 'Comedy Movies', movies: [], loading: true },
    { title: 'Drama Movies', movies: [], loading: true },
    { title: 'Sci-Fi Movies', movies: [], loading: true }
  ]);

  // Trailer modal state
  const [selectedTrailer, setSelectedTrailer] = useState<TrailerData | null>(null);
  const [isTrailerModalOpen, setIsTrailerModalOpen] = useState(false);
  const [loadingTrailer, setLoadingTrailer] = useState(false);

  useEffect(() => {
    loadHomepageData();
  }, []);

  // Auto-rotate featured movies every 8 seconds
  useEffect(() => {
    if (featuredMovies.length > 1) {
      const interval = setInterval(() => {
        setCurrentFeaturedIndex((prevIndex) =>
          (prevIndex + 1) % featuredMovies.length
        );
      }, 8000); // Change every 8 seconds

      return () => clearInterval(interval);
    }
  }, [featuredMovies.length]);

  const loadHomepageData = async () => {
    try {
      // Load featured movies (personalized recommendations + top rated)
      const userId = user?.id || 1;
      const featuredPromises = [
        fetch(`/api/recommendations/${userId}?limit=3`), // Get personalized recommendations
        fetch('/api/movies?sortBy=rating&sortOrder=desc&limit=3'), // Get top rated as fallback
      ];

      const [recommendedResponse, topRatedResponse] = await Promise.all(featuredPromises);
      const recommendedData = await recommendedResponse.json();
      const topRatedData = await topRatedResponse.json();

      let featuredMoviesList: Movie[] = [];

      // Use personalized recommendations if available
      if (recommendedData.success && recommendedData.data && recommendedData.data.length > 0) {
        featuredMoviesList = recommendedData.data.slice(0, 3).map((movie: any) => sanitizeMovieData(movie));
      }

      // Fill with top-rated movies if we don't have enough recommendations
      if (featuredMoviesList.length < 3 && topRatedData.success && topRatedData.data) {
        const additionalMovies = topRatedData.data
          .filter((movie: any) => !featuredMoviesList.some(fm => fm.movieId === movie.movieId))
          .slice(0, 3 - featuredMoviesList.length)
          .map((movie: any) => sanitizeMovieData(movie));
        featuredMoviesList = [...featuredMoviesList, ...additionalMovies];
      }

      if (featuredMoviesList.length > 0) {
        setFeaturedMovies(featuredMoviesList);
        setCurrentFeaturedIndex(0);
      }

      // Load different sections
      const sectionPromises = [
        fetch(`/api/recommendations/${userId}`),
        fetch('/api/movies?sortBy=popularity&sortOrder=desc&limit=20'),
        fetch('/api/movies?sortBy=rating&sortOrder=desc&limit=20'),
        fetch('/api/movies?genre=Action&limit=20'),
        fetch('/api/movies?genre=Comedy&limit=20'),
        fetch('/api/movies?genre=Drama&limit=20'),
        fetch('/api/movies?genre=Sci-Fi&limit=20')
      ];

      const responses = await Promise.all(sectionPromises);
      const dataPromises = responses.map(response => response.json());
      const allData = await Promise.all(dataPromises);

      setSections(prevSections =>
        prevSections.map((section, index) => ({
          ...section,
          movies: allData[index].success ? allData[index].data.map((movie: any) => sanitizeMovieData(movie)) : [],
          loading: false
        }))
      );
    } catch (error) {
      console.error('Error loading homepage data:', error);
      setSections(prevSections => 
        prevSections.map(section => ({ ...section, loading: false }))
      );
    }
  };

  const handleWatchlistToggle = (movie: Movie) => {
    if (watchlist.includes(movie.movieId)) {
      onRemoveFromWatchlist?.(movie);
    } else {
      onAddToWatchlist?.(movie);
    }
  };

  const handleWatchTrailer = async (movie: Movie) => {
    if (!movie.tmdbId) {
      console.error('No TMDB ID available for movie:', movie.title);
      return;
    }

    setLoadingTrailer(true);
    try {
      const response = await fetch(`/api/movies/${movie.movieId}/videos`);
      const data = await response.json();

      if (data.success && data.videos && data.videos.length > 0) {
        // Find the first trailer or teaser
        const trailer = data.videos.find((video: any) =>
          video.type === 'Trailer' && video.site === 'YouTube'
        ) || data.videos.find((video: any) =>
          video.type === 'Teaser' && video.site === 'YouTube'
        ) || data.videos[0];

        if (trailer) {
          setSelectedTrailer(trailer);
          setIsTrailerModalOpen(true);
        }
      } else {
        console.error('No trailers found for movie:', movie.title);
      }
    } catch (error) {
      console.error('Error fetching trailer:', error);
    } finally {
      setLoadingTrailer(false);
    }
  };

  const closeTrailerModal = () => {
    setIsTrailerModalOpen(false);
    setSelectedTrailer(null);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      {featuredMovies.length > 0 ? (
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
          {/* Background Image with Transition */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentFeaturedIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0"
            >
              <img
                src={featuredMovies[currentFeaturedIndex]?.posterUrl || '/placeholder-hero.svg'}
                alt={featuredMovies[currentFeaturedIndex]?.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-hero.svg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            </motion.div>
          </AnimatePresence>

          {/* Hero Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`content-${currentFeaturedIndex}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.8 }}
                >
                  {/* Recommendation Badge */}
                  <div className="mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-600/20 text-purple-300 border border-purple-500/30">
                      <Sparkles className="w-4 h-4 mr-2" />
                      {currentFeaturedIndex === 0 ? 'Recommended for You' : 'Top Rated'}
                    </span>
                  </div>

                  <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                    {featuredMovies[currentFeaturedIndex]?.title}
                  </h1>

                  <div className="flex items-center space-x-4 mb-6">
                    {featuredMovies[currentFeaturedIndex]?.averageRating && (
                      <div className="flex items-center space-x-1">
                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                        <span className="text-white font-semibold">
                          {featuredMovies[currentFeaturedIndex].averageRating.toFixed(1)}
                        </span>
                      </div>
                    )}
                    <span className="text-gray-300">{featuredMovies[currentFeaturedIndex]?.year}</span>
                    {featuredMovies[currentFeaturedIndex]?.genres && (
                      <div className="flex space-x-2">
                        {featuredMovies[currentFeaturedIndex].genres.slice(0, 3).map((genre, index) => (
                          <span key={index} className="text-gray-300 text-sm">
                            {genre}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-2xl">
                    {featuredMovies[currentFeaturedIndex]?.genres && featuredMovies[currentFeaturedIndex].genres.length > 0
                      ? `An incredible ${featuredMovies[currentFeaturedIndex].genres[0].toLowerCase()} experience that has captivated audiences worldwide.`
                      : 'A remarkable cinematic experience that has captivated audiences worldwide.'
                    } Join {featuredMovies[currentFeaturedIndex]?.ratingCount?.toLocaleString() || 'thousands of'} viewers who have rated this movie {featuredMovies[currentFeaturedIndex]?.averageRating?.toFixed(1) || 'highly'}.
                  </p>

                  <div className="flex space-x-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleWatchTrailer(featuredMovies[currentFeaturedIndex])}
                      disabled={loadingTrailer}
                      className="flex items-center space-x-2 bg-white text-black px-8 py-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      <Play className="w-5 h-5" />
                      <span>{loadingTrailer ? 'Loading...' : 'Watch Trailer'}</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleWatchlistToggle(featuredMovies[currentFeaturedIndex])}
                      className="flex items-center space-x-2 glass px-8 py-4 rounded-lg font-semibold text-white hover:glass-strong transition-all"
                    >
                      <Plus className="w-5 h-5" />
                      <span>My List</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onMovieSelect?.(featuredMovies[currentFeaturedIndex])}
                      className="flex items-center space-x-2 glass px-8 py-4 rounded-lg font-semibold text-white hover:glass-strong transition-all"
                    >
                      <Info className="w-5 h-5" />
                      <span>More Info</span>
                    </motion.button>
                  </div>

                  {/* Movie Navigation Dots */}
                  {featuredMovies.length > 1 && (
                    <div className="flex space-x-2 mt-8">
                      {featuredMovies.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentFeaturedIndex(index)}
                          className={`w-3 h-3 rounded-full transition-all ${
                            index === currentFeaturedIndex
                              ? 'bg-white'
                              : 'bg-white/30 hover:bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </section>
      ) : (
        <HeroShimmer />
      )}

      {/* Movie Sections */}
      <div className="relative z-10 -mt-32 pb-20">
        <div className="space-y-12">
          {sections.map((section, sectionIndex) => (
            <InfiniteCarouselSection
              key={section.title}
              title={section.title}
              movies={section.movies}
              loading={section.loading}
              onMovieSelect={onMovieSelect}
              onAddToWatchlist={onAddToWatchlist}
              onRemoveFromWatchlist={onRemoveFromWatchlist}
              onWatchTrailer={handleWatchTrailer}
              watchlist={watchlist}
              delay={sectionIndex * 0.1}
              direction={sectionIndex % 2 === 0 ? 'left' : 'right'}
            />
          ))}
        </div>
      </div>

      {/* Trailer Modal */}
      <AnimatePresence>
        {isTrailerModalOpen && selectedTrailer && (
          <TrailerModal
            trailer={selectedTrailer}
            onClose={closeTrailerModal}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <Footer />
    </div>
  );
}

interface InfiniteCarouselSectionProps {
  title: string;
  movies: Movie[];
  loading: boolean;
  onMovieSelect?: (movie: Movie) => void;
  onAddToWatchlist?: (movie: Movie) => void;
  onRemoveFromWatchlist?: (movie: Movie) => void;
  onWatchTrailer?: (movie: Movie) => void;
  watchlist: number[];
  delay?: number;
  direction: 'left' | 'right';
}

function InfiniteCarouselSection({
  title,
  movies,
  loading,
  onMovieSelect,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  onWatchTrailer,
  watchlist,
  delay = 0,
  direction
}: InfiniteCarouselSectionProps) {
  const carouselRef = useRef<HTMLDivElement>(null);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.6 }}
        className="glass-container"
      >
        <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>
        <LoadingShimmer count={6} />
      </motion.div>
    );
  }

  if (movies.length === 0) {
    return null;
  }

  // Duplicate movies for infinite scroll effect
  const duplicatedMovies = [...movies, ...movies, ...movies];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      className="glass-container overflow-hidden"
    >
      <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>

      {/* Infinite Carousel */}
      <div className="relative overflow-hidden">
        <motion.div
          ref={carouselRef}
          className="flex space-x-4"
          animate={{
            x: direction === 'left' ? [0, -100 * movies.length] : [-100 * movies.length, 0]
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: movies.length * 3, // Adjust speed here
              ease: "linear",
            },
          }}
        >
          {duplicatedMovies.map((movie, index) => (
            <div key={`${movie.movieId}-${index}`} className="flex-shrink-0 w-72">
              <EnhancedMovieCard
                movie={movie}
                onMovieClick={onMovieSelect}
                onAddToWatchlist={onAddToWatchlist}
                onRemoveFromWatchlist={onRemoveFromWatchlist}
                onWatchTrailer={onWatchTrailer}
                isInWatchlist={watchlist.includes(movie.movieId)}
                size="medium"
              />
            </div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}

// Enhanced Movie Card with Trailer Button
interface EnhancedMovieCardProps {
  movie: Movie;
  onMovieClick?: (movie: Movie) => void;
  onAddToWatchlist?: (movie: Movie) => void;
  onRemoveFromWatchlist?: (movie: Movie) => void;
  onWatchTrailer?: (movie: Movie) => void;
  isInWatchlist?: boolean;
  size?: 'small' | 'medium' | 'large';
}

function EnhancedMovieCard({
  movie,
  onMovieClick,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  onWatchTrailer,
  isInWatchlist = false,
  size = 'medium'
}: EnhancedMovieCardProps) {
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

  const handleWatchTrailer = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onWatchTrailer) {
      onWatchTrailer(movie);
    }
  };

  // Enhanced poster URL with better fallback
  const getPosterUrl = (movie: Movie) => {
    if (movie.posterUrl) {
      return movie.posterUrl;
    }
    // Try different TMDB poster approaches
    if (movie.tmdbId) {
      // Use TMDB API to get poster path
      return `https://image.tmdb.org/t/p/w500/poster_${movie.tmdbId}.jpg`;
    }
    // Final fallback - use a placeholder
    return `https://via.placeholder.com/500x750/1a1a1a/ffffff?text=${encodeURIComponent(movie.title)}`;
  };

  const posterUrl = getPosterUrl(movie);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05, zIndex: 10 }}
      transition={{ duration: 0.3 }}
      onClick={() => onMovieClick?.(movie)}
      className={`relative group cursor-pointer movie-card ${sizeClasses[size]}`}
    >
      {/* Movie Poster */}
      <div className="relative w-full h-full glass rounded-lg overflow-hidden bg-gray-900/50">
        {!imageError && posterUrl ? (
          <>
            <img
              src={posterUrl}
              alt={movie.title}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
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
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleWatchTrailer}
              className="bg-red-600/80 backdrop-blur-sm rounded-full p-3 hover:bg-red-700/80 transition-colors"
              title="Watch Trailer"
            >
              <Play className="w-5 h-5 text-white fill-white" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleWatchlistToggle}
              className={`backdrop-blur-sm rounded-full p-3 transition-colors ${
                isInWatchlist
                  ? 'bg-green-600/80 hover:bg-green-700/80'
                  : 'bg-white/20 hover:bg-white/30'
              }`}
              title={isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
            >
              <Plus className={`w-5 h-5 ${isInWatchlist ? 'text-white rotate-45' : 'text-white'}`} />
            </motion.button>
          </div>
        </div>

        {/* Rating Badge */}
        {movie.averageRating && (
          <div className="absolute top-2 left-2 glass-subtle rounded-md px-2 py-1 flex items-center space-x-1">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-white text-xs font-medium">
              {movie.averageRating.toFixed(1)}
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
                className="text-xs px-2 py-1 rounded-full text-white bg-gray-700/50"
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
                <span>{movie.averageRating.toFixed(1)}</span>
              </div>
            )}
            <span>{movie.year}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Trailer Modal Component
interface TrailerModalProps {
  trailer: TrailerData;
  onClose: () => void;
}

function TrailerModal({ trailer, onClose }: TrailerModalProps) {
  const [isLoading, setIsLoading] = useState(true);

  const getYouTubeEmbedUrl = (key: string) => {
    return `https://www.youtube.com/embed/${key}?autoplay=1&rel=0&modestbranding=1`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="relative w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="w-12 h-12 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* YouTube Embed */}
        {trailer.site === 'YouTube' && (
          <iframe
            src={getYouTubeEmbedUrl(trailer.key)}
            title={trailer.name}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => setIsLoading(false)}
          />
        )}

        {/* Trailer Info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
          <h3 className="text-white text-xl font-semibold mb-2">{trailer.name}</h3>
          <p className="text-gray-300 text-sm">{trailer.type} • {trailer.site}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
