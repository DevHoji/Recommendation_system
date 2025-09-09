'use client';

import { motion } from 'framer-motion';

interface LoadingShimmerProps {
  count?: number;
  className?: string;
}

export default function LoadingShimmer({ count = 6, className = "" }: LoadingShimmerProps) {
  return (
    <div className={`flex space-x-4 overflow-hidden ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.1 }}
          className="flex-shrink-0 w-72 h-96 glass rounded-lg relative overflow-hidden"
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
          
          {/* Poster placeholder */}
          <div className="w-full h-64 bg-gray-800/50 rounded-t-lg" />
          
          {/* Content placeholder */}
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-700/50 rounded animate-pulse" />
            <div className="h-3 bg-gray-700/30 rounded w-3/4 animate-pulse" />
            <div className="flex space-x-2">
              <div className="h-6 w-16 bg-gray-700/30 rounded animate-pulse" />
              <div className="h-6 w-12 bg-gray-700/30 rounded animate-pulse" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function HeroShimmer() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background shimmer */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 animate-pulse" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

      {/* Content shimmer */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl space-y-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Title shimmer */}
            <div className="h-16 bg-gray-700/50 rounded animate-pulse" />
            
            {/* Metadata shimmer */}
            <div className="flex space-x-4">
              <div className="h-6 w-20 bg-gray-700/30 rounded animate-pulse" />
              <div className="h-6 w-16 bg-gray-700/30 rounded animate-pulse" />
              <div className="h-6 w-24 bg-gray-700/30 rounded animate-pulse" />
            </div>
            
            {/* Description shimmer */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-700/30 rounded animate-pulse" />
              <div className="h-4 bg-gray-700/30 rounded w-4/5 animate-pulse" />
              <div className="h-4 bg-gray-700/30 rounded w-3/5 animate-pulse" />
            </div>
            
            {/* Buttons shimmer */}
            <div className="flex space-x-4 pt-4">
              <div className="h-14 w-32 bg-gray-700/50 rounded-lg animate-pulse" />
              <div className="h-14 w-32 bg-gray-700/30 rounded-lg animate-pulse" />
              <div className="h-14 w-36 bg-gray-700/30 rounded-lg animate-pulse" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
