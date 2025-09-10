'use client';

import { motion } from 'framer-motion';
import { Github, Heart, Mic, Star } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="glass-strong mt-20 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <h3 className="text-2xl font-bold text-red-600 mb-4">HojiAI</h3>
              <p className="text-gray-300 mb-4 max-w-md">
                AI-powered movie recommendations with voice search capabilities. 
                Discover your next favorite movie with intelligent suggestions 
                tailored to your preferences.
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1 text-sm text-gray-400">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span>Powered by AI</span>
                </div>
                <div className="flex items-center space-x-1 text-sm text-gray-400">
                  <Mic className="w-4 h-4 text-blue-400" />
                  <span>Voice Search</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-gray-300 hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="/movies" className="text-gray-300 hover:text-white transition-colors">
                  Movies
                </a>
              </li>
              <li>
                <a href="/watchlist" className="text-gray-300 hover:text-white transition-colors">
                  My Watchlist
                </a>
              </li>
              <li>
                <a href="/tv-shows" className="text-gray-300 hover:text-white transition-colors">
                  TV Shows
                </a>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Features</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>AI Recommendations</li>
              <li>Voice Search</li>
              <li>Personal Watchlist</li>
              <li>Smart Filtering</li>
              <li>Movie Details</li>
              <li>Rating System</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-2 text-gray-400 mb-4 md:mb-0">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            <span>using Next.js, Neo4j & Google Gemini AI</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <a
              href="https://github.com/DevHoji/Recommendation_system"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
            <span className="text-gray-500">•</span>
            <span className="text-gray-400">© 2024 HojiAI</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
