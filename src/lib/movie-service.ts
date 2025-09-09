import { neo4jService } from './neo4j';
import { tmdbService } from './tmdb';
import { geminiService } from './gemini';

export interface Movie {
  movieId: number;
  title: string;
  genres: string[];
  year: number;
  averageRating?: number;
  ratingCount?: number;
  tmdbId?: number;
  posterUrl?: string;
  backdropUrl?: string;
  overview?: string;
  popularity?: number;
}

export interface MovieDetails extends Movie {
  cast?: any[];
  crew?: any[];
  videos?: any[];
  similarMovies?: Movie[];
  recommendations?: Movie[];
  userRating?: number;
  isInWatchlist?: boolean;
}

export interface SearchFilters {
  genre?: string;
  year?: number;
  minRating?: number;
  maxRating?: number;
  sortBy?: 'popularity' | 'rating' | 'year' | 'title';
  sortOrder?: 'asc' | 'desc';
}

class MovieService {
  async getMovies(
    page: number = 1,
    limit: number = 20,
    filters: SearchFilters = {}
  ): Promise<{ movies: Movie[]; total: number; hasMore: boolean }> {
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    let orderClause = 'ORDER BY m.title ASC';
    
    // Build where clause based on filters
    const conditions = [];
    if (filters.genre) {
      conditions.push(`ANY(genre IN m.genres WHERE genre = $genre)`);
    }
    if (filters.year) {
      conditions.push(`m.year = $year`);
    }
    if (filters.minRating || filters.maxRating) {
      conditions.push(`EXISTS((m)<-[:RATED]-())`);
    }
    
    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }
    
    // Build order clause
    if (filters.sortBy) {
      const direction = filters.sortOrder === 'desc' ? 'DESC' : 'ASC';
      switch (filters.sortBy) {
        case 'rating':
          orderClause = `ORDER BY avgRating ${direction}`;
          break;
        case 'year':
          orderClause = `ORDER BY m.year ${direction}`;
          break;
        case 'title':
          orderClause = `ORDER BY m.title ${direction}`;
          break;
        case 'popularity':
          orderClause = `ORDER BY ratingCount ${direction}`;
          break;
      }
    }

    const query = `
      MATCH (m:Movie)
      ${whereClause}
      OPTIONAL MATCH (m)<-[r:RATED]-()
      WITH m, avg(r.rating) as avgRating, count(r) as ratingCount
      ${filters.minRating ? `WHERE avgRating >= $minRating` : ''}
      ${filters.maxRating ? `WHERE avgRating <= $maxRating` : ''}
      ${orderClause}
      SKIP $offset
      LIMIT $limit
      RETURN m, avgRating, ratingCount
    `;

    const countQuery = `
      MATCH (m:Movie)
      ${whereClause}
      ${filters.minRating || filters.maxRating ? `
        OPTIONAL MATCH (m)<-[r:RATED]-()
        WITH m, avg(r.rating) as avgRating
        ${filters.minRating ? `WHERE avgRating >= $minRating` : ''}
        ${filters.maxRating ? `WHERE avgRating <= $maxRating` : ''}
      ` : ''}
      RETURN count(m) as total
    `;

    const parameters = {
      offset,
      limit,
      genre: filters.genre,
      year: filters.year,
      minRating: filters.minRating,
      maxRating: filters.maxRating
    };

    const [results, countResults] = await Promise.all([
      neo4jService.runQuery(query, parameters),
      neo4jService.runQuery(countQuery, parameters)
    ]);

    const movies = await Promise.all(
      results.map(async (record: any) => {
        const movie = record.m.properties;
        const tmdbId = await this.getTMDBId(movie.movieId);
        let posterUrl = null;

        if (tmdbId) {
          try {
            const posterPath = await this.getPosterPath(tmdbId);
            posterUrl = tmdbService.getPosterUrl(posterPath);
          } catch (error) {
            console.log(`Failed to get poster for TMDB ID ${tmdbId}, using fallback`);
            // Fallback: try direct TMDB poster URL
            posterUrl = `https://image.tmdb.org/t/p/w500/poster_${tmdbId}.jpg`;
          }
        }

        return {
          movieId: movie.movieId,
          title: movie.title,
          genres: movie.genres,
          year: movie.year,
          averageRating: record.avgRating ? parseFloat(record.avgRating.toFixed(1)) : undefined,
          ratingCount: record.ratingCount || 0,
          tmdbId: tmdbId || undefined,
          posterUrl: posterUrl || undefined
        };
      })
    );

    const total = countResults[0]?.total || 0;
    const hasMore = offset + limit < total;

    return { movies, total, hasMore };
  }

  async searchMovies(query: string, page: number = 1, limit: number = 20): Promise<{ movies: Movie[]; total: number; hasMore: boolean }> {
    const offset = (page - 1) * limit;
    
    const searchQuery = `
      MATCH (m:Movie)
      WHERE toLower(m.title) CONTAINS toLower($query)
         OR ANY(genre IN m.genres WHERE toLower(genre) CONTAINS toLower($query))
      OPTIONAL MATCH (m)<-[r:RATED]-()
      WITH m, avg(r.rating) as avgRating, count(r) as ratingCount
      ORDER BY ratingCount DESC, avgRating DESC
      SKIP $offset
      LIMIT $limit
      RETURN m, avgRating, ratingCount
    `;

    const countQuery = `
      MATCH (m:Movie)
      WHERE toLower(m.title) CONTAINS toLower($query)
         OR ANY(genre IN m.genres WHERE toLower(genre) CONTAINS toLower($query))
      RETURN count(m) as total
    `;

    const parameters = { query, offset, limit };

    const [results, countResults] = await Promise.all([
      neo4jService.runQuery(searchQuery, parameters),
      neo4jService.runQuery(countQuery, parameters)
    ]);

    const movies = await Promise.all(
      results.map(async (record: any) => {
        const movie = record.m.properties;
        const tmdbId = await this.getTMDBId(movie.movieId);
        let posterUrl = null;

        if (tmdbId) {
          try {
            const posterPath = await this.getPosterPath(tmdbId);
            posterUrl = tmdbService.getPosterUrl(posterPath);
          } catch (error) {
            console.log(`Failed to get poster for TMDB ID ${tmdbId}, using fallback`);
            // Fallback: try direct TMDB poster URL
            posterUrl = `https://image.tmdb.org/t/p/w500/poster_${tmdbId}.jpg`;
          }
        }

        return {
          movieId: movie.movieId,
          title: movie.title,
          genres: movie.genres,
          year: movie.year,
          averageRating: record.avgRating ? parseFloat(record.avgRating.toFixed(1)) : undefined,
          ratingCount: record.ratingCount || 0,
          tmdbId: tmdbId || undefined,
          posterUrl: posterUrl || undefined
        };
      })
    );

    const total = countResults[0]?.total || 0;
    const hasMore = offset + limit < total;

    return { movies, total, hasMore };
  }

  async getTMDBId(movieId: number): Promise<number | null> {
    try {
      const query = `
        MATCH (m:Movie {movieId: $movieId})
        RETURN m.tmdbId as tmdbId
      `;
      
      const results = await neo4jService.runQuery(query, { movieId });
      return results[0]?.tmdbId || null;
    } catch (error) {
      console.error(`Error getting TMDB ID for movie ${movieId}:`, error);
      return null;
    }
  }

  async getPosterPath(tmdbId: number): Promise<string | null> {
    try {
      const movie = await tmdbService.getMovieByTMDBId(tmdbId);
      return movie?.poster_path || null;
    } catch (error) {
      console.error(`Error getting poster path for TMDB ID ${tmdbId}:`, error);
      return null;
    }
  }

  async getMovieById(movieId: number, userId?: number): Promise<MovieDetails | null> {
    try {
      const query = `
        MATCH (m:Movie {movieId: $movieId})
        OPTIONAL MATCH (m)<-[r:RATED]-()
        ${userId ? `OPTIONAL MATCH (u:User {userId: $userId})-[ur:RATED]->(m)` : ''}
        ${userId ? `OPTIONAL MATCH (u:User {userId: $userId})-[:WATCHLISTED]->(m)` : ''}
        WITH m, avg(r.rating) as avgRating, count(r) as ratingCount
        ${userId ? `, ur.rating as userRating, EXISTS((u)-[:WATCHLISTED]->(m)) as isInWatchlist` : ''}
        RETURN m, avgRating, ratingCount
        ${userId ? `, userRating, isInWatchlist` : ''}
      `;

      const results = await neo4jService.runQuery(query, { movieId, userId });
      
      if (results.length === 0) {
        return null;
      }

      const record = results[0];
      const movie = record.m.properties;
      const tmdbId = await this.getTMDBId(movieId);
      
      let tmdbData = null;
      let cast = [];
      let crew = [];
      let videos = [];
      let posterUrl = null;
      let backdropUrl = null;
      let overview = '';

      if (tmdbId) {
        tmdbData = await tmdbService.getMovieByTMDBId(tmdbId);
        if (tmdbData) {
          posterUrl = tmdbService.getPosterUrl(tmdbData.poster_path);
          backdropUrl = tmdbService.getBackdropUrl(tmdbData.backdrop_path);
          overview = tmdbData.overview;
          
          const [credits, videoData] = await Promise.all([
            tmdbService.getMovieCredits(tmdbId),
            tmdbService.getMovieVideos(tmdbId)
          ]);
          
          cast = credits.cast || [];
          crew = credits.crew || [];
          videos = videoData.results || [];
        }
      }

      return {
        movieId: movie.movieId,
        title: movie.title,
        genres: movie.genres,
        year: movie.year,
        averageRating: record.avgRating ? parseFloat(record.avgRating.toFixed(1)) : undefined,
        ratingCount: record.ratingCount || 0,
        tmdbId: tmdbId || undefined,
        posterUrl: posterUrl || undefined,
        backdropUrl: backdropUrl || undefined,
        overview: overview || undefined,
        cast,
        crew,
        videos,
        userRating: record.userRating || null,
        isInWatchlist: record.isInWatchlist || false
      };
    } catch (error) {
      console.error(`Error getting movie details for ${movieId}:`, error);
      return null;
    }
  }
}

export const movieService = new MovieService();
export default movieService;
