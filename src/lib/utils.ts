import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatYear(year: number): string {
  return year.toString();
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

// Utility function to safely convert Neo4j Integer objects to JavaScript numbers
export function toNumber(value: any): number {
  if (value === null || value === undefined) {
    return 0;
  }

  // Check if it's a Neo4j Integer object
  if (value && typeof value === 'object' && 'toNumber' in value) {
    return value.toNumber();
  }

  // Check if it's already a number
  if (typeof value === 'number') {
    return value;
  }

  // Try to parse as number
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

// Utility function to safely convert Neo4j values in movie objects
export function sanitizeMovieData(movie: any): any {
  if (!movie) return movie;

  return {
    ...movie,
    movieId: toNumber(movie.movieId),
    year: toNumber(movie.year),
    averageRating: movie.averageRating ? parseFloat(movie.averageRating) : undefined,
    ratingCount: toNumber(movie.ratingCount),
    tmdbId: movie.tmdbId ? toNumber(movie.tmdbId) : undefined,
    popularity: movie.popularity ? parseFloat(movie.popularity) : undefined
  };
}

export function formatGenres(genres: string[]): string {
  return genres.join(', ');
}

export function getYearFromTitle(title: string): number | null {
  const match = title.match(/\((\d{4})\)$/);
  return match ? parseInt(match[1]) : null;
}

export function cleanTitle(title: string): string {
  return title.replace(/\s*\(\d{4}\)$/, '');
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString();
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export function getGenreColor(genre: string): string {
  const colors: Record<string, string> = {
    'Action': 'bg-red-500',
    'Adventure': 'bg-orange-500',
    'Animation': 'bg-pink-500',
    'Children': 'bg-yellow-500',
    'Comedy': 'bg-green-500',
    'Crime': 'bg-gray-700',
    'Documentary': 'bg-blue-500',
    'Drama': 'bg-purple-500',
    'Fantasy': 'bg-indigo-500',
    'Film-Noir': 'bg-gray-900',
    'Horror': 'bg-red-800',
    'Musical': 'bg-pink-400',
    'Mystery': 'bg-gray-600',
    'Romance': 'bg-rose-500',
    'Sci-Fi': 'bg-cyan-500',
    'Thriller': 'bg-red-600',
    'War': 'bg-amber-700',
    'Western': 'bg-yellow-700'
  };
  
  return colors[genre] || 'bg-gray-500';
}

export function getStarRating(rating: number): string {
  const stars = Math.round(rating / 2); // Convert 10-point scale to 5-star
  return '★'.repeat(stars) + '☆'.repeat(5 - stars);
}

export function generateMovieSlug(title: string, year: number): string {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${year}`;
}

export function parseMovieSlug(slug: string): { title: string; year: number } | null {
  const match = slug.match(/^(.+)-(\d{4})$/);
  if (!match) return null;
  
  const title = match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const year = parseInt(match[2]);
  
  return { title, year };
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export function groupBy<T, K extends keyof any>(
  array: T[],
  key: (item: T) => K
): Record<K, T[]> {
  return array.reduce((groups, item) => {
    const group = key(item);
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {} as Record<K, T[]>);
}

export function sortBy<T>(
  array: T[],
  key: keyof T,
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

export function createQueryString(params: Record<string, string | number | boolean | null | undefined>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.set(key, value.toString());
    }
  });
  
  return searchParams.toString();
}
