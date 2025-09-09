'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, TrendingUp, Star, Clock, Database } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import Header from '@/components/Header';
import HomePage from '@/components/HomePage';
import MovieGrid from '@/components/MovieGrid';
import MovieModal from '@/components/MovieModal';
import VoiceSearch from '@/components/VoiceSearch';
import { Movie } from '@/lib/movie-service';
import { debounce } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, isAuthenticated, isLoading } = useUser();
  const router = useRouter();
  const [currentView, setCurrentView] = useState<'home' | 'search'>('home');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isVoiceSearchOpen, setIsVoiceSearchOpen] = useState(false);
  const [watchlist, setWatchlist] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Redirect to onboarding if user is not authenticated or not onboarded
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user && !user.isOnboarded))) {
      router.push('/onboarding');
    }
  }, [isAuthenticated, user, isLoading, router]);

  // Load watchlist from localStorage
  useEffect(() => {
    const savedWatchlist = localStorage.getItem('cineai-watchlist');
    if (savedWatchlist) {
      setWatchlist(JSON.parse(savedWatchlist));
    }
  }, []);

  // Save watchlist to localStorage
  useEffect(() => {
    localStorage.setItem('cineai-watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const handleSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setCurrentView('home');
        setMovies([]);
        return;
      }

      setCurrentView('search');
      setIsSearching(true);
      setSearchQuery(query);

      try {
        const response = await fetch(`/api/movies?search=${encodeURIComponent(query)}&limit=20`);
        const data = await response.json();

        if (data.success) {
          setMovies(data.data);
          setCurrentPage(1);
          setHasMore(data.data.length === 20);
        } else {
          setMovies([]);
          toast.error('Search failed');
        }
      } catch (error) {
        console.error('Search error:', error);
        setMovies([]);
        toast.error('Search failed');
      } finally {
        setIsSearching(false);
      }
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
          setCurrentView('search');
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

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto" />
          <p className="text-white text-lg">Loading CineAI...</p>
        </div>
      </div>
    );
  }

  // Don't render main content if user is not authenticated or onboarded
  if (!isAuthenticated || (user && !user.isOnboarded)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header
        onSearch={handleSearch}
        onVoiceSearch={() => setIsVoiceSearchOpen(true)}
        searchQuery={searchQuery}
        isSearching={isSearching}
      />

      {currentView === 'home' ? (
        <HomePage
          onMovieSelect={handleMovieSelect}
          onAddToWatchlist={handleAddToWatchlist}
          onRemoveFromWatchlist={handleRemoveFromWatchlist}
          watchlist={watchlist}
        />
      ) : (
        <main className="main-content">
          <div className="glass-container">
            <h1 className="text-3xl font-bold text-white mb-8">
              Search Results for "{searchQuery}"
            </h1>
            <MovieGrid
              movies={movies}
              loading={loading}
              onMovieClick={handleMovieSelect}
              onAddToWatchlist={handleAddToWatchlist}
              onRemoveFromWatchlist={handleRemoveFromWatchlist}
              watchlist={watchlist}
              hasMore={hasMore}
              onLoadMore={() => {
                if (hasMore && !loading) {
                  setCurrentPage(prev => prev + 1);
                }
              }}
            />
          </div>
        </main>
      )}

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
