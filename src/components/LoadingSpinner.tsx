'use client';

import { motion } from 'framer-motion';
import { Loader2, Film } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  variant?: 'default' | 'cinema';
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  text = 'Loading...', 
  variant = 'default',
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  if (variant === 'cinema') {
    return (
      <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="relative"
          >
            <Film className={`${sizeClasses[size]} text-red-500`} />
          </motion.div>
          
          {/* Film reel dots */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="grid grid-cols-2 gap-1">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ 
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                  className="w-1 h-1 bg-red-400 rounded-full"
                />
              ))}
            </div>
          </div>
        </div>
        
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className={`text-gray-300 font-medium ${textSizeClasses[size]}`}
        >
          {text}
        </motion.p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 className={`${sizeClasses[size]} text-red-500`} />
      </motion.div>
      
      <motion.p
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className={`text-gray-300 font-medium ${textSizeClasses[size]}`}
      >
        {text}
      </motion.p>
    </div>
  );
}

// Full page loading component
export function FullPageLoader({ text = 'Loading HojiAI...' }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
      <LoadingSpinner size="lg" text={text} variant="cinema" />
    </div>
  );
}

// Inline loading component for sections
export function SectionLoader({ text = 'Loading movies...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <LoadingSpinner size="md" text={text} variant="cinema" />
    </div>
  );
}

// Button loading component
export function ButtonLoader({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    >
      <Loader2 className={`${
        size === 'sm' ? 'w-4 h-4' : 
        size === 'md' ? 'w-5 h-5' : 
        'w-6 h-6'
      } text-current`} />
    </motion.div>
  );
}
