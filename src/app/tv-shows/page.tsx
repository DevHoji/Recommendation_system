'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tv, Construction } from 'lucide-react';
import Header from '@/components/Header';

export default function TVShowsPage() {
  const [isVoiceSearchOpen, setIsVoiceSearchOpen] = useState(false);

  const handleVoiceSearch = () => {
    setIsVoiceSearchOpen(true);
  };

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
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8">
              <Tv className="w-12 h-12 text-white" />
            </div>

            <h1 className="text-4xl font-bold text-white mb-4">TV Shows</h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              TV Shows functionality is coming soon! We're working on integrating 
              TV series data and recommendations.
            </p>

            <div className="glass rounded-lg p-8 max-w-2xl mx-auto">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <Construction className="w-6 h-6 text-yellow-400" />
                <h2 className="text-xl font-semibold text-white">Under Development</h2>
              </div>
              
              <div className="text-left space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Planned Features:</h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Browse popular TV series and shows</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Season and episode tracking</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>TV show recommendations based on viewing history</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Voice search for TV shows and episodes</span>
                  </li>
                </ul>
              </div>
            </div>

            <motion.a
              href="/"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center space-x-2 bg-red-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-red-700 transition-colors mt-8"
            >
              <span>Back to Home</span>
            </motion.a>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
