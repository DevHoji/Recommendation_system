'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, ExternalLink, AlertCircle } from 'lucide-react';

interface TrailerModalProps {
  trailer: {
    movieId: number;
    title: string;
    trailerUrl?: string;
    tmdbId?: number;
  };
  onClose: () => void;
}

export default function TrailerModal({ trailer, onClose }: TrailerModalProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    loadTrailer();
  }, [trailer]);

  const loadTrailer = async () => {
    setLoading(true);
    setError(null);

    try {
      // If we already have a trailer URL, use it
      if (trailer.trailerUrl) {
        setVideoUrl(trailer.trailerUrl);
        setLoading(false);
        return;
      }

      // Try to get trailer from TMDB if we have tmdbId
      if (trailer.tmdbId) {
        const tmdbResponse = await fetch(`/api/movies/trailer?tmdbId=${trailer.tmdbId}`);
        if (tmdbResponse.ok) {
          const tmdbData = await tmdbResponse.json();
          if (tmdbData.trailerUrl) {
            setVideoUrl(tmdbData.trailerUrl);
            setLoading(false);
            return;
          }
        }
      }

      // Fallback: Generate YouTube search URL
      const searchQuery = encodeURIComponent(`${trailer.title} official trailer`);
      const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;
      
      setError('Trailer not available directly. You can search for it on YouTube.');
      setVideoUrl(youtubeSearchUrl);
      
    } catch (err) {
      console.error('Error loading trailer:', err);
      setError('Failed to load trailer');
    } finally {
      setLoading(false);
    }
  };

  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    }
    return url;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900 rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-white">{trailer.title}</h2>
              <p className="text-gray-400 text-sm">Official Trailer</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="aspect-video bg-black relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-400">Loading trailer...</p>
                </div>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto" />
                  <div>
                    <p className="text-white font-semibold mb-2">Trailer Not Available</p>
                    <p className="text-gray-400 text-sm mb-4">{error}</p>
                    {videoUrl && videoUrl.includes('youtube.com/results') && (
                      <a
                        href={videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Search on YouTube
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : videoUrl ? (
              videoUrl.includes('youtube.com/results') ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <Play className="w-16 h-16 text-purple-500 mx-auto" />
                    <div>
                      <p className="text-white font-semibold mb-2">Search for Trailer</p>
                      <p className="text-gray-400 text-sm mb-4">Click below to search for this movie's trailer</p>
                      <a
                        href={videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Search on YouTube
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <iframe
                  src={getEmbedUrl(videoUrl)}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={`${trailer.title} Trailer`}
                />
              )
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <AlertCircle className="w-16 h-16 text-gray-500 mx-auto" />
                  <p className="text-gray-400">No trailer available</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-sm">
                Press <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">ESC</kbd> to close
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
