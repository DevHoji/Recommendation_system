'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Plus, Info, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';
import Footer from './Footer';
import LoadingShimmer, { HeroShimmer } from './LoadingShimmer';
import { Movie } from '@/lib/movie-service';

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

export default function HomePage({
  onMovieSelect,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  watchlist = []
}: HomePageProps) {
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  const [sections, setSections] = useState<MovieSection[]>([
    { title: 'Recommended for You', movies: [], loading: true },
    { title: 'Trending Now', movies: [], loading: true },
    { title: 'Top Rated', movies: [], loading: true },
    { title: 'Action Movies', movies: [], loading: true },
    { title: 'Comedy Movies', movies: [], loading: true },
    { title: 'Drama Movies', movies: [], loading: true },
    { title: 'Sci-Fi Movies', movies: [], loading: true }
  ]);

  useEffect(() => {
    loadHomepageData();
  }, []);

  const loadHomepageData = async () => {
    try {
      // Load featured movie (top rated)
      const featuredResponse = await fetch('/api/movies?sortBy=rating&sortOrder=desc&limit=1');
      const featuredData = await featuredResponse.json();
      if (featuredData.success && featuredData.data.length > 0) {
        setFeaturedMovie(featuredData.data[0]);
      }

      // Load different sections
      const sectionPromises = [
        fetch('/api/recommendations/1'), // Default user ID for demo
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
          movies: allData[index].success ? allData[index].data : [],
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

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      {featuredMovie ? (
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src={featuredMovie.posterUrl || '/placeholder-hero.svg'}
              alt={featuredMovie.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-hero.svg';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                  {featuredMovie.title}
                </h1>
                
                <div className="flex items-center space-x-4 mb-6">
                  {featuredMovie.averageRating && (
                    <div className="flex items-center space-x-1">
                      <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      <span className="text-white font-semibold">
                        {featuredMovie.averageRating.toFixed(1)}
                      </span>
                    </div>
                  )}
                  <span className="text-gray-300">{featuredMovie.year}</span>
                  {featuredMovie.genres && (
                    <div className="flex space-x-2">
                      {featuredMovie.genres.slice(0, 3).map((genre, index) => (
                        <span key={index} className="text-gray-300 text-sm">
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-2xl">
                  {featuredMovie.genres && featuredMovie.genres.length > 0
                    ? `An incredible ${featuredMovie.genres[0].toLowerCase()} experience that has captivated audiences worldwide.`
                    : 'A remarkable cinematic experience that has captivated audiences worldwide.'
                  } Join {featuredMovie.ratingCount?.toLocaleString() || 'thousands of'} viewers who have rated this movie {featuredMovie.averageRating?.toFixed(1) || 'highly'}.
                </p>

                <div className="flex space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onMovieSelect?.(featuredMovie)}
                    className="flex items-center space-x-2 bg-white text-black px-8 py-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                  >
                    <Play className="w-5 h-5" />
                    <span>Play</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleWatchlistToggle(featuredMovie)}
                    className="flex items-center space-x-2 glass px-8 py-4 rounded-lg font-semibold text-white hover:glass-strong transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    <span>My List</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onMovieSelect?.(featuredMovie)}
                    className="flex items-center space-x-2 glass px-8 py-4 rounded-lg font-semibold text-white hover:glass-strong transition-all"
                  >
                    <Info className="w-5 h-5" />
                    <span>More Info</span>
                  </motion.button>
                </div>
              </motion.div>
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
            <MovieSection
              key={section.title}
              title={section.title}
              movies={section.movies}
              loading={section.loading}
              onMovieSelect={onMovieSelect}
              onAddToWatchlist={onAddToWatchlist}
              onRemoveFromWatchlist={onRemoveFromWatchlist}
              watchlist={watchlist}
              delay={sectionIndex * 0.1}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

interface MovieSectionProps {
  title: string;
  movies: Movie[];
  loading: boolean;
  onMovieSelect?: (movie: Movie) => void;
  onAddToWatchlist?: (movie: Movie) => void;
  onRemoveFromWatchlist?: (movie: Movie) => void;
  watchlist: number[];
  delay?: number;
}

function MovieSection({
  title,
  movies,
  loading,
  onMovieSelect,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  watchlist,
  delay = 0
}: MovieSectionProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById(`scroll-${title.replace(/\s+/g, '-')}`);
    if (container) {
      const scrollAmount = 320 * 4; // Width of 4 cards
      const newPosition = direction === 'left' 
        ? Math.max(0, scrollPosition - scrollAmount)
        : scrollPosition + scrollAmount;
      
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
      
      // Update scroll button states
      setCanScrollLeft(newPosition > 0);
      setCanScrollRight(newPosition < container.scrollWidth - container.clientWidth);
    }
  };

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      className="glass-container relative group"
    >
      <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>
      
      {/* Scroll Buttons */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 glass-strong rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
      )}
      
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 glass-strong rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Movie Cards Carousel */}
      <div
        id={`scroll-${title.replace(/\s+/g, '-')}`}
        className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {movies.map((movie) => (
          <div key={movie.movieId} className="flex-shrink-0 w-72">
            <MovieCard
              movie={movie}
              onMovieClick={onMovieSelect}
              onAddToWatchlist={onAddToWatchlist}
              onRemoveFromWatchlist={onRemoveFromWatchlist}
              isInWatchlist={watchlist.includes(movie.movieId)}
              size="medium"
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
}
