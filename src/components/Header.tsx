'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Mic, MicOff, User, Heart, Menu, X, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/contexts/UserContext';
import VoiceSearch from './VoiceSearch';

interface HeaderProps {
  onSearch: (query: string) => void;
  onVoiceSearch: (transcript: string) => void;
  searchQuery: string;
  isSearching: boolean;
}

const Header: React.FC<HeaderProps> = ({
  onSearch,
  onVoiceSearch,
  searchQuery,
  isSearching
}) => {
  const { user, logout } = useUser();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVoiceSearchOpen, setIsVoiceSearchOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const query = formData.get('search') as string;
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleVoiceSearchComplete = (transcript: string) => {
    onVoiceSearch(transcript);
    setIsVoiceSearchOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-2xl font-bold text-red-600"
              >
                <Link href="/" className="hover:text-red-400 transition-colors">
                  CineAI
                </Link>
              </motion.div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                href="/"
                className={`transition-colors ${
                  pathname === '/' ? 'text-red-400' : 'text-gray-300 hover:text-white'
                }`}
              >
                Home
              </Link>
              <Link
                href="/movies"
                className={`transition-colors ${
                  pathname === '/movies' ? 'text-red-400' : 'text-gray-300 hover:text-white'
                }`}
              >
                Movies
              </Link>
              <Link
                href="/tv-shows"
                className={`transition-colors ${
                  pathname === '/tv-shows' ? 'text-red-400' : 'text-gray-300 hover:text-white'
                }`}
              >
                TV Shows
              </Link>
              <Link
                href="/watchlist"
                className={`transition-colors ${
                  pathname === '/watchlist' ? 'text-red-400' : 'text-gray-300 hover:text-white'
                }`}
              >
                My List
              </Link>
            </nav>

            {/* Search and Actions */}
            <div className="flex items-center space-x-4">
              {/* Desktop Search */}
              <div className="hidden md:flex items-center space-x-2">
                <AnimatePresence>
                  {isSearchOpen ? (
                    <motion.form
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 280, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      onSubmit={handleSearchSubmit}
                      className="flex items-center bg-black/50 border border-gray-600 rounded-md overflow-hidden"
                    >
                      <input
                        ref={searchInputRef}
                        name="search"
                        type="text"
                        placeholder="Search movies..."
                        defaultValue={searchQuery}
                        className="flex-1 px-3 py-2 bg-transparent text-white placeholder-gray-400 focus:outline-none"
                        onBlur={() => {
                          if (!searchQuery) {
                            setIsSearchOpen(false);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setIsSearchOpen(false)}
                        className="p-2 text-gray-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.form>
                  ) : (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => setIsSearchOpen(true)}
                      className="p-2 text-gray-300 hover:text-white transition-colors"
                    >
                      <Search className="w-5 h-5" />
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Voice Search Button */}
                <button
                  onClick={() => setIsVoiceSearchOpen(true)}
                  className="p-2 text-gray-300 hover:text-red-400 transition-colors relative"
                  title="Voice Search"
                >
                  <Mic className="w-5 h-5" />
                  {isSearching && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  )}
                </button>
              </div>

              {/* Mobile Search */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Watchlist */}
              <Link
                href="/watchlist"
                className="p-2 text-gray-300 hover:text-red-400 transition-colors"
                title="My Watchlist"
              >
                <Heart className="w-5 h-5" />
              </Link>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 text-gray-300 hover:text-white transition-colors"
                  title={`Welcome, ${user?.username || 'User'}`}
                >
                  <User className="w-5 h-5" />
                  <span className="hidden md:block text-sm font-medium">
                    {user?.username || 'User'}
                  </span>
                </button>

                {/* User Dropdown Menu */}
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-black/90 backdrop-blur-md border border-white/10 rounded-lg shadow-lg z-50"
                    >
                      <div className="p-2">
                        <Link
                          href="/profile"
                          className="flex items-center space-x-2 w-full px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <User className="w-4 h-4" />
                          <span>Profile</span>
                        </Link>
                        <button
                          onClick={() => {
                            logout();
                            setShowUserMenu(false);
                          }}
                          className="flex items-center space-x-2 w-full px-3 py-2 text-gray-300 hover:text-red-400 hover:bg-white/10 rounded-md transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search Overlay */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-md border-b border-gray-800 p-4"
            >
              <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <input
                    name="search"
                    type="text"
                    placeholder="Search movies..."
                    defaultValue={searchQuery}
                    className="w-full px-4 py-3 bg-gray-900 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsVoiceSearchOpen(true)}
                  className="p-3 text-gray-300 hover:text-red-400 transition-colors"
                >
                  <Mic className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="p-3 text-gray-300 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 md:hidden"
          >
            <div className="absolute inset-0 bg-black/80" onClick={() => setIsMobileMenuOpen(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="absolute right-0 top-0 h-full w-64 bg-gray-900 shadow-xl"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-white">Menu</h2>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <nav className="space-y-4">
                  <Link
                    href="/"
                    className={`block transition-colors py-2 ${
                      pathname === '/' ? 'text-red-400' : 'text-gray-300 hover:text-white'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Home
                  </Link>
                  <Link
                    href="/movies"
                    className={`block transition-colors py-2 ${
                      pathname === '/movies' ? 'text-red-400' : 'text-gray-300 hover:text-white'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Movies
                  </Link>
                  <Link
                    href="/tv-shows"
                    className={`block transition-colors py-2 ${
                      pathname === '/tv-shows' ? 'text-red-400' : 'text-gray-300 hover:text-white'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    TV Shows
                  </Link>
                  <Link
                    href="/watchlist"
                    className={`block transition-colors py-2 ${
                      pathname === '/watchlist' ? 'text-red-400' : 'text-gray-300 hover:text-white'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My List
                  </Link>
                </nav>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Search Modal */}
      <VoiceSearch
        isOpen={isVoiceSearchOpen}
        onClose={() => setIsVoiceSearchOpen(false)}
        onResult={handleVoiceSearchComplete}
      />
    </>
  );
};

export default Header;
