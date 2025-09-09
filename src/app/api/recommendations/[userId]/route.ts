import { NextRequest, NextResponse } from 'next/server';
import { neo4jService } from '@/lib/neo4j';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    
    // Test Neo4j connection first
    const isConnected = await neo4jService.testConnection();
    
    if (!isConnected) {
      console.log('Neo4j not available, using mock recommendations');
      return getMockRecommendations(userId);
    }

    // Get user's rating history using Cypher
    const userRatingsQuery = `
      MATCH (u:User {userId: $userId})-[r:RATED]->(m:Movie)
      RETURN m.movieId as movieId, m.title as title, r.rating as rating, m.genres as genres
      ORDER BY r.rating DESC
      LIMIT 10
    `;

    const userRatings = await neo4jService.runQuery(userRatingsQuery, { userId: parseInt(userId) });

    if (userRatings.length === 0) {
      // New user - return popular movies
      const popularMoviesQuery = `
        MATCH (m:Movie)
        WHERE m.averageRating IS NOT NULL AND m.ratingCount > 50
        RETURN m.movieId as movieId, m.title as title, m.averageRating as score, 
               m.genres as genres, m.year as year, m.posterUrl as posterUrl
        ORDER BY m.averageRating DESC, m.ratingCount DESC
        LIMIT 20
      `;

      const popularMovies = await neo4jService.runQuery(popularMoviesQuery);
      
      return NextResponse.json({
        success: true,
        data: popularMovies.map(movie => ({
          movieId: movie.movieId,
          title: movie.title,
          score: movie.score || 0,
          genres: movie.genres || [],
          year: movie.year,
          posterUrl: movie.posterUrl,
          reason: "Popular movies"
        }))
      });
    }

    // Get user's favorite genres
    const favoriteGenres = getUserFavoriteGenres(userRatings);

    // Collaborative filtering - find similar users
    const similarUsersQuery = `
      MATCH (u1:User {userId: $userId})-[r1:RATED]->(m:Movie)<-[r2:RATED]-(u2:User)
      WHERE u1 <> u2 AND abs(r1.rating - r2.rating) <= 1
      WITH u2, count(m) as commonMovies, 
           sum(abs(r1.rating - r2.rating)) as ratingDiff
      WHERE commonMovies >= 3
      RETURN u2.userId as userId, commonMovies, ratingDiff
      ORDER BY commonMovies DESC, ratingDiff ASC
      LIMIT 10
    `;

    const similarUsers = await neo4jService.runQuery(similarUsersQuery, { userId: parseInt(userId) });

    // Get recommendations from similar users
    let recommendations = [];
    
    if (similarUsers.length > 0) {
      const similarUserIds = similarUsers.map(u => u.userId);
      
      const collaborativeQuery = `
        MATCH (u:User)-[r:RATED]->(m:Movie)
        WHERE u.userId IN $similarUserIds 
          AND r.rating >= 4
          AND NOT EXISTS {
            MATCH (target:User {userId: $userId})-[:RATED]->(m)
          }
        WITH m, avg(r.rating) as avgRating, count(r) as ratingCount
        WHERE ratingCount >= 2
        RETURN m.movieId as movieId, m.title as title, avgRating as score,
               m.genres as genres, m.year as year, m.posterUrl as posterUrl
        ORDER BY avgRating DESC, ratingCount DESC
        LIMIT 10
      `;

      recommendations = await neo4jService.runQuery(collaborativeQuery, {
        similarUserIds,
        userId: parseInt(userId)
      });
    }

    // Content-based filtering - recommend by favorite genres
    if (recommendations.length < 10 && favoriteGenres.length > 0) {
      const contentBasedQuery = `
        MATCH (m:Movie)
        WHERE any(genre IN m.genres WHERE genre IN $favoriteGenres)
          AND m.averageRating >= 3.5
          AND NOT EXISTS {
            MATCH (u:User {userId: $userId})-[:RATED]->(m)
          }
        RETURN m.movieId as movieId, m.title as title, m.averageRating as score,
               m.genres as genres, m.year as year, m.posterUrl as posterUrl
        ORDER BY m.averageRating DESC, m.ratingCount DESC
        LIMIT ${10 - recommendations.length}
      `;

      const contentRecommendations = await neo4jService.runQuery(contentBasedQuery, {
        favoriteGenres,
        userId: parseInt(userId)
      });

      recommendations = [...recommendations, ...contentRecommendations];
    }

    // Add recommendation reasons
    const finalRecommendations = recommendations.map(movie => ({
      ...movie,
      reason: getRecommendationReason(movie, favoriteGenres, userRatings)
    }));

    return NextResponse.json({
      success: true,
      data: finalRecommendations,
      userId: parseInt(userId),
      totalRecommendations: finalRecommendations.length
    });

  } catch (error) {
    console.error('Recommendations API error:', error);
    return getMockRecommendations(params.userId);
  }
}

function getUserFavoriteGenres(userRatings: any[]): string[] {
  const genreRatings: { [key: string]: { total: number; count: number } } = {};
  
  userRatings.forEach(rating => {
    if (rating.rating >= 4 && rating.genres) {
      rating.genres.forEach((genre: string) => {
        if (!genreRatings[genre]) {
          genreRatings[genre] = { total: 0, count: 0 };
        }
        genreRatings[genre].total += rating.rating;
        genreRatings[genre].count += 1;
      });
    }
  });

  return Object.entries(genreRatings)
    .map(([genre, data]) => ({ genre, avgRating: data.total / data.count }))
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 5)
    .map(item => item.genre);
}

function getRecommendationReason(movie: any, favoriteGenres: string[], userRatings: any[]): string {
  const movieGenres = movie.genres || [];
  const matchingGenres = movieGenres.filter((genre: string) => favoriteGenres.includes(genre));
  
  if (matchingGenres.length > 0) {
    return `Because you like ${matchingGenres[0]} movies`;
  }
  
  if (movie.score >= 4.5) {
    return "Highly rated movie";
  }
  
  return "Recommended for you";
}

function getMockRecommendations(userId: string) {
  const mockRecommendations = [
    {
      movieId: 1,
      title: "The Shawshank Redemption",
      score: 4.8,
      genres: ["Drama"],
      year: 1994,
      posterUrl: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
      reason: "Highly rated drama"
    },
    {
      movieId: 2,
      title: "The Godfather",
      score: 4.7,
      genres: ["Crime", "Drama"],
      year: 1972,
      posterUrl: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
      reason: "Classic crime drama"
    },
    {
      movieId: 3,
      title: "Pulp Fiction",
      score: 4.6,
      genres: ["Crime", "Drama"],
      year: 1994,
      posterUrl: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
      reason: "Popular choice"
    }
  ];

  return NextResponse.json({
    success: true,
    data: mockRecommendations,
    userId: parseInt(userId),
    totalRecommendations: mockRecommendations.length,
    note: "Using mock data - Neo4j not available"
  });
}
