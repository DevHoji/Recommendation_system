import axios from 'axios';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
  original_title: string;
  popularity: number;
  video: boolean;
}

export interface TMDBMovieDetails extends TMDBMovie {
  genres: Array<{ id: number; name: string }>;
  runtime: number;
  budget: number;
  revenue: number;
  production_companies: Array<{ id: number; name: string; logo_path: string | null }>;
  production_countries: Array<{ iso_3166_1: string; name: string }>;
  spoken_languages: Array<{ iso_639_1: string; name: string }>;
  status: string;
  tagline: string;
}

class TMDBService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.TMDB_API_KEY!;
  }

  private async makeRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}${endpoint}`, {
        params: {
          api_key: this.apiKey,
          ...params
        }
      });
      return response.data;
    } catch (error) {
      console.error(`TMDB API error for ${endpoint}:`, error);
      throw error;
    }
  }

  async getMovieByTMDBId(tmdbId: number): Promise<TMDBMovieDetails | null> {
    try {
      const movie = await this.makeRequest(`/movie/${tmdbId}`);
      return movie;
    } catch (error) {
      console.error(`Failed to fetch movie with TMDB ID ${tmdbId}:`, error);
      return null;
    }
  }

  async searchMovies(query: string, page: number = 1): Promise<{ results: TMDBMovie[]; total_pages: number; total_results: number }> {
    try {
      const response = await this.makeRequest('/search/movie', {
        query,
        page,
        include_adult: false
      });
      return response;
    } catch (error) {
      console.error(`Failed to search movies with query "${query}":`, error);
      return { results: [], total_pages: 0, total_results: 0 };
    }
  }

  async getPopularMovies(page: number = 1): Promise<{ results: TMDBMovie[]; total_pages: number; total_results: number }> {
    try {
      const response = await this.makeRequest('/movie/popular', { page });
      return response;
    } catch (error) {
      console.error('Failed to fetch popular movies:', error);
      return { results: [], total_pages: 0, total_results: 0 };
    }
  }

  async getTrendingMovies(timeWindow: 'day' | 'week' = 'week'): Promise<{ results: TMDBMovie[] }> {
    try {
      const response = await this.makeRequest(`/trending/movie/${timeWindow}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch trending movies:', error);
      return { results: [] };
    }
  }

  async getMoviesByGenre(genreId: number, page: number = 1): Promise<{ results: TMDBMovie[]; total_pages: number; total_results: number }> {
    try {
      const response = await this.makeRequest('/discover/movie', {
        with_genres: genreId,
        page,
        sort_by: 'popularity.desc'
      });
      return response;
    } catch (error) {
      console.error(`Failed to fetch movies for genre ${genreId}:`, error);
      return { results: [], total_pages: 0, total_results: 0 };
    }
  }

  async getGenres(): Promise<Array<{ id: number; name: string }>> {
    try {
      const response = await this.makeRequest('/genre/movie/list');
      return response.genres || [];
    } catch (error) {
      console.error('Failed to fetch genres:', error);
      return [];
    }
  }

  getImageUrl(path: string | null, size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'): string | null {
    if (!path) return null;
    return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
  }

  getPosterUrl(posterPath: string | null, size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'): string | null {
    return this.getImageUrl(posterPath, size);
  }

  getBackdropUrl(backdropPath: string | null, size: 'w300' | 'w780' | 'w1280' | 'original' = 'w1280'): string | null {
    return this.getImageUrl(backdropPath, size as any);
  }

  async getMovieCredits(tmdbId: number): Promise<any> {
    try {
      const response = await this.makeRequest(`/movie/${tmdbId}/credits`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch credits for movie ${tmdbId}:`, error);
      return { cast: [], crew: [] };
    }
  }

  async getMovieVideos(tmdbId: number): Promise<any> {
    try {
      const response = await this.makeRequest(`/movie/${tmdbId}/videos`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch videos for movie ${tmdbId}:`, error);
      return { results: [] };
    }
  }

  async getSimilarMovies(tmdbId: number, page: number = 1): Promise<{ results: TMDBMovie[]; total_pages: number; total_results: number }> {
    try {
      const response = await this.makeRequest(`/movie/${tmdbId}/similar`, { page });
      return response;
    } catch (error) {
      console.error(`Failed to fetch similar movies for ${tmdbId}:`, error);
      return { results: [], total_pages: 0, total_results: 0 };
    }
  }

  async getRecommendedMovies(tmdbId: number, page: number = 1): Promise<{ results: TMDBMovie[]; total_pages: number; total_results: number }> {
    try {
      const response = await this.makeRequest(`/movie/${tmdbId}/recommendations`, { page });
      return response;
    } catch (error) {
      console.error(`Failed to fetch recommended movies for ${tmdbId}:`, error);
      return { results: [], total_pages: 0, total_results: 0 };
    }
  }
}

export const tmdbService = new TMDBService();
export default tmdbService;
