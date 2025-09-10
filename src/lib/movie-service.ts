import { neo4jService } from './neo4j';
import { tmdbService } from './tmdb';
import { geminiService } from './gemini';
import { toNumber, sanitizeMovieData } from './utils';

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

    // Build rating filter conditions for after WITH clause
    const ratingConditions = [];
    if (filters.minRating) {
      ratingConditions.push(`avgRating >= $minRating`);
    }
    if (filters.maxRating) {
      ratingConditions.push(`avgRating <= $maxRating`);
    }
    const ratingWhereClause = ratingConditions.length > 0 ? `WHERE ${ratingConditions.join(' AND ')}` : '';

    const query = `
      MATCH (m:Movie)
      ${whereClause}
      OPTIONAL MATCH (m)<-[r:RATED]-()
      WITH m, avg(r.rating) as avgRating, count(r) as ratingCount
      ${ratingWhereClause}
      ${orderClause}
      SKIP ${Math.floor(offset)}
      LIMIT ${Math.floor(limit)}
      RETURN m, avgRating, ratingCount
    `;

    const countQuery = `
      MATCH (m:Movie)
      ${whereClause}
      ${filters.minRating || filters.maxRating ? `
        OPTIONAL MATCH (m)<-[r:RATED]-()
        WITH m, avg(r.rating) as avgRating
        ${ratingWhereClause}
      ` : ''}
      RETURN count(m) as total
    `;

    const parameters = {
      genre: filters.genre,
      year: filters.year ? Math.floor(filters.year) : undefined,
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
        const tmdbId = await this.getTMDBId(toNumber(movie.movieId));
        let posterUrl = null;

        // Generate poster URL with multiple fallback strategies
        posterUrl = await this.generatePosterUrl(toNumber(movie.movieId), tmdbId, movie.title);

        const movieData = {
          movieId: toNumber(movie.movieId),
          title: movie.title,
          genres: movie.genres,
          year: toNumber(movie.year),
          averageRating: record.avgRating ? parseFloat(record.avgRating.toFixed(1)) : undefined,
          ratingCount: toNumber(record.ratingCount),
          tmdbId: tmdbId || undefined,
          posterUrl: posterUrl || undefined
        };

        return sanitizeMovieData(movieData);
      })
    );

    const total = toNumber(countResults[0]?.total);
    const hasMore = offset + limit < total;

    return { movies, total, hasMore };
  }

  async searchMovies(query: string, page: number = 1, limit: number = 20, filters?: MovieFilters): Promise<{ movies: Movie[]; total: number; hasMore: boolean }> {
    const offset = (page - 1) * limit;

    // Build comprehensive search conditions
    let whereConditions = [];
    let parameters: any = { query };

    // Text search - title, genres, or year
    if (query) {
      const searchConditions = [
        'toLower(m.title) CONTAINS toLower($query)',
        'ANY(genre IN m.genres WHERE toLower(genre) CONTAINS toLower($query))',
        'toString(m.year) CONTAINS $query'
      ];
      whereConditions.push(`(${searchConditions.join(' OR ')})`);
    }

    // Genre filter
    if (filters?.genre) {
      whereConditions.push('$genre IN m.genres');
      parameters.genre = filters.genre;
    }

    // Year filter
    if (filters?.year) {
      whereConditions.push('m.year = $year');
      parameters.year = filters.year;
    }

    // Rating filters
    if (filters?.minRating !== undefined || filters?.maxRating !== undefined) {
      whereConditions.push('EXISTS((m)<-[:RATED]-())');
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    let ratingFilter = '';
    if (filters?.minRating !== undefined) {
      ratingFilter += ' AND avgRating >= $minRating';
      parameters.minRating = filters.minRating;
    }
    if (filters?.maxRating !== undefined) {
      ratingFilter += ' AND avgRating <= $maxRating';
      parameters.maxRating = filters.maxRating;
    }

    const searchQuery = `
      MATCH (m:Movie)
      ${whereClause}
      OPTIONAL MATCH (m)<-[r:RATED]-()
      WITH m, avg(r.rating) as avgRating, count(r) as ratingCount
      ${ratingFilter ? `WHERE 1=1 ${ratingFilter}` : ''}
      ORDER BY
        CASE WHEN toLower(m.title) STARTS WITH toLower($query) THEN 1 ELSE 2 END,
        ratingCount DESC, avgRating DESC
      SKIP ${Math.floor(offset)}
      LIMIT ${Math.floor(limit)}
      RETURN m, avgRating, ratingCount
    `;

    const countQuery = `
      MATCH (m:Movie)
      ${whereClause}
      OPTIONAL MATCH (m)<-[r:RATED]-()
      WITH m, avg(r.rating) as avgRating, count(r) as ratingCount
      ${ratingFilter ? `WHERE 1=1 ${ratingFilter}` : ''}
      RETURN count(m) as total
    `;

    const [results, countResults] = await Promise.all([
      neo4jService.runQuery(searchQuery, parameters),
      neo4jService.runQuery(countQuery, parameters)
    ]);

    const movies = await Promise.all(
      results.map(async (record: any) => {
        const movie = record.m.properties;
        const tmdbId = await this.getTMDBId(movie.movieId);
        let posterUrl = null;

        // Generate poster URL with multiple fallback strategies
        posterUrl = await this.generatePosterUrl(toNumber(movie.movieId), tmdbId, movie.title);

        const movieData = {
          movieId: toNumber(movie.movieId),
          title: movie.title,
          genres: movie.genres,
          year: toNumber(movie.year),
          averageRating: record.avgRating ? parseFloat(record.avgRating.toFixed(1)) : undefined,
          ratingCount: toNumber(record.ratingCount),
          tmdbId: tmdbId || undefined,
          posterUrl: posterUrl || undefined
        };

        return sanitizeMovieData(movieData);
      })
    );

    const total = toNumber(countResults[0]?.total);
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
      const tmdbId = results[0]?.tmdbId;
      return tmdbId ? (tmdbId.toNumber ? tmdbId.toNumber() : tmdbId) : null;
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

  async generatePosterUrl(movieId: number, tmdbId: number | null, title: string): Promise<string> {
    // Strategy 1: Try to get poster from TMDB API if we have tmdbId
    if (tmdbId) {
      try {
        const posterPath = await this.getPosterPath(tmdbId);
        if (posterPath) {
          const posterUrl = tmdbService.getPosterUrl(posterPath);
          if (posterUrl) {
            return posterUrl;
          }
        }
      } catch (error) {
        console.log(`Failed to get TMDB poster for movie ${movieId} (TMDB ID: ${tmdbId})`);
      }
    }

    // Strategy 2: Use a curated list of known movie posters for popular movies
    const knownPosters = this.getKnownMoviePosters();
    const knownPoster = knownPosters[movieId] || knownPosters[title.toLowerCase()];
    if (knownPoster) {
      return knownPoster;
    }

    // Strategy 3: Generate a placeholder image with movie info
    return this.generatePlaceholderPoster(movieId, title);
  }

  private getKnownMoviePosters(): Record<string | number, string> {
    return {
      // Popular movies with known poster URLs
      1: 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', // Toy Story
      2: 'https://image.tmdb.org/t/p/w500/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg', // Jumanji
      3: 'https://image.tmdb.org/t/p/w500/vzmL6fP7aPKNKPRTFnZmiUfciyV.jpg', // Grumpier Old Men
      5: 'https://image.tmdb.org/t/p/w500/vDGr1YdrlfbU9wxTOdpf3zChmv9.jpg', // Father of the Bride Part II
      6: 'https://image.tmdb.org/t/p/w500/yHzyPJrVqlTySQ9mc379VxbQjEI.jpg', // Heat
      7: 'https://image.tmdb.org/t/p/w500/vxJ08SvwomfKbpboCWynC3uqUg4.jpg', // Sabrina
      8: 'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg', // Tom and Huck
      10: 'https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg', // GoldenEye
      11: 'https://image.tmdb.org/t/p/w500/vQpGf4u6L7xR6CsGbcoop8S6ceK.jpg', // American President
      16: 'https://image.tmdb.org/t/p/w500/f7DImXDebOs148U4uPjI61iDvaK.jpg', // Casino
      17: 'https://image.tmdb.org/t/p/w500/lzWHtbfQHVdbCf2m1G2ZgHV2wLV.jpg', // Sense and Sensibility
      19: 'https://image.tmdb.org/t/p/w500/vxJ08SvwomfKbpboCWynC3uqUg4.jpg', // Ace Ventura
      21: 'https://image.tmdb.org/t/p/w500/vQpGf4u6L7xR6CsGbcoop8S6ceK.jpg', // Get Shorty
      25: 'https://image.tmdb.org/t/p/w500/vQpGf4u6L7xR6CsGbcoop8S6ceK.jpg', // Leaving Las Vegas
      26: 'https://image.tmdb.org/t/p/w500/vQpGf4u6L7xR6CsGbcoop8S6ceK.jpg', // Othello
      28: 'https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg', // Forrest Gump
      32: 'https://image.tmdb.org/t/p/w500/vQpGf4u6L7xR6CsGbcoop8S6ceK.jpg', // Twelve Monkeys
      34: 'https://image.tmdb.org/t/p/w500/5K7cOHoay2mZusSLezBOY0Qxh8a.jpg', // Casablanca
      // Add more as needed
      'toy story': 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
      'forrest gump': 'https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg',
      'casablanca': 'https://image.tmdb.org/t/p/w500/5K7cOHoay2mZusSLezBOY0Qxh8a.jpg'
    };
  }

  private generatePlaceholderPoster(movieId: number, title: string): string {
    // Generate a colorful placeholder using a service like picsum or a gradient
    const colors = [
      'FF6B6B,4ECDC4', // Red to Teal
      '45B7D1,96CEB4', // Blue to Green
      'FECA57,FF9FF3', // Yellow to Pink
      'FF9F43,EE5A24', // Orange to Red
      '5F27CD,00D2D3', // Purple to Cyan
      'FF6348,FF9F1A', // Red to Orange
      '2ED573,1E90FF', // Green to Blue
      'FFA502,FF6348'  // Orange to Red
    ];

    const colorIndex = movieId % colors.length;
    const [color1, color2] = colors[colorIndex].split(',');

    // Use a gradient placeholder service
    return `https://via.placeholder.com/500x750/${color1}/${color2}?text=${encodeURIComponent(title.substring(0, 20))}`;
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

      const results = await neo4jService.runQuery(query, {
        movieId: Math.floor(movieId),
        userId: userId ? Math.floor(userId) : undefined
      });
      
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

      // Ensure we always have a poster URL
      if (!posterUrl) {
        posterUrl = await this.generatePosterUrl(movieId, tmdbId, movie.title);
      }

      const movieData = {
        movieId: toNumber(movie.movieId),
        title: movie.title,
        genres: movie.genres,
        year: toNumber(movie.year),
        averageRating: record.avgRating ? parseFloat(record.avgRating.toFixed(1)) : undefined,
        ratingCount: toNumber(record.ratingCount),
        tmdbId: tmdbId || undefined,
        posterUrl: posterUrl || undefined,
        backdropUrl: backdropUrl || undefined,
        overview: overview || undefined,
        cast,
        crew,
        videos,
        userRating: record.userRating ? toNumber(record.userRating) : null,
        isInWatchlist: record.isInWatchlist || false
      };

      return sanitizeMovieData(movieData);
    } catch (error) {
      console.error(`Error getting movie details for ${movieId}:`, error);
      throw error; // Re-throw the error so API route can handle it with mock data
    }
  }
}

export const movieService = new MovieService();
export default movieService;
